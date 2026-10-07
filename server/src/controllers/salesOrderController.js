import { SalesOrder } from '../models/SalesOrder.js';
import { CustomerPO } from '../models/CustomerPO.js';
import { ProductionOrder } from '../models/ProductionOrder.js';
import { Payment } from '../models/Payment.js';
import { QAInspection, SerialNumber } from '../models/QAInspection.js';
import { Shipment, TaxInvoice } from '../models/Dispatch.js';
import { Installation, Warranty } from '../models/Installation.js';
import { ServiceTicket } from '../models/ServiceTicket.js';
import { AuditLog } from '../models/AuditLog.js';
import { BOM } from '../models/BOM.js';
import { getNextSequence } from '../services/numberingService.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

export const listSalesOrders = async (req, res) => {
  try {
    const { status, customerId, search } = req.query;
    const query = {};
    if (status) query.currentStage = status;
    if (customerId) query.customer = customerId;
    if (search) {
      query.$or = [
        { soNumber: { $regex: search, $options: 'i' } },
        { customerPONumber: { $regex: search, $options: 'i' } }
      ];
    }
    const orders = await SalesOrder.find(query).populate('customer').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalesOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customer')
      .populate('quotation')
      .populate('proformaInvoice')
      .populate('customerPO');

    if (!order) return res.status(404).json({ message: 'Sales Order not found' });

    // 360-degree traceability: query all associated documents & lifecycle records
    const payments = await Payment.find({ salesOrder: order._id }).sort({ createdAt: 1 });
    const productionOrder = await ProductionOrder.findOne({ salesOrder: order._id }).populate('bom');
    const qaInspection = await QAInspection.findOne({ salesOrder: order._id });
    const serialNumbers = await SerialNumber.find({ salesOrder: order._id });
    const taxInvoice = await TaxInvoice.findOne({ salesOrder: order._id });
    const shipment = await Shipment.findOne({ salesOrder: order._id });
    const installation = await Installation.findOne({ salesOrder: order._id });
    const warranty = await Warranty.findOne({ salesOrder: order._id });
    const serviceTickets = await ServiceTicket.find({ serialNumber: { $in: serialNumbers.map(s => s.serialNumber) } });
    const auditTimeline = await AuditLog.find({ 
      $or: [
        { entityId: String(order._id) },
        { entityNumber: order.soNumber },
        { entityNumber: order.quotationNumber },
        { entityNumber: order.customerPONumber }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      order,
      payments,
      productionOrder,
      qaInspection,
      serialNumbers,
      taxInvoice,
      shipment,
      installation,
      warranty,
      serviceTickets,
      auditTimeline
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSalesOrderFromPO = async (req, res) => {
  try {
    const { customerPoId } = req.body;
    const po = await CustomerPO.findById(customerPoId).populate('proformaInvoice').populate('quotation').populate('customer');
    if (!po) return res.status(404).json({ message: 'Customer PO not found' });

    if (po.verificationStatus !== 'MATCHED' && po.verificationStatus !== 'CORRECTED') {
      return res.status(400).json({ 
        message: `Cannot generate Sales Order. PO verification status is ${po.verificationStatus}. Must be MATCHED.` 
      });
    }

    if (po.salesOrderGenerated) {
      return res.status(400).json({ message: 'Sales Order already created for this PO' });
    }

    const soNumber = await getNextSequence('SO', 4);
    const advanceRequired = po.proformaInvoice?.advanceAmount || Math.round(po.orderValue * 0.3);

    const order = await SalesOrder.create({
      soNumber,
      orderDate: new Date(),
      customer: po.customer._id,
      quotation: po.quotation._id,
      quotationNumber: po.quotation.quotationNumber,
      proformaInvoice: po.proformaInvoice?._id,
      customerPO: po._id,
      customerPONumber: po.poNumber,
      items: po.proformaInvoice?.items || po.quotation.items,
      totalTaxable: po.proformaInvoice?.taxableAmount || po.quotation.taxableAmount,
      totalTax: po.proformaInvoice?.taxAmount || po.quotation.taxAmount,
      grandTotal: po.orderValue,
      advanceRequired,
      advancePaid: 0,
      balanceDue: po.orderValue,
      paymentStatus: 'PENDING',
      productionStatus: 'PENDING_RELEASE',
      currentStage: 'ORDER_CONFIRMED',
      deliveryAddress: po.deliveryAddress
    });

    po.salesOrderGenerated = true;
    await po.save();

    await logAudit({
      action: 'SALES_ORDER_CONFIRMED',
      entityType: 'SalesOrder',
      entityId: order._id,
      entityNumber: order.soNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Sales Order ${order.soNumber} confirmed against Customer PO ${po.poNumber}. Value: ₹${order.grandTotal}`
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const releaseForProduction = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Sales Order not found' });

    if (order.paymentStatus === 'PENDING' && order.advancePaid < order.advanceRequired) {
      return res.status(400).json({ 
        message: `Payment Gate Block: Advance payment of ₹${order.advanceRequired.toLocaleString('en-IN')} has not been verified.` 
      });
    }

    order.productionStatus = 'RELEASED';
    order.currentStage = 'PRODUCTION_STARTED';
    await order.save();

    // Automatically initialize Production Order if not already present
    const existingProd = await ProductionOrder.findOne({ salesOrder: order._id });
    let prodOrder = existingProd;
    if (!existingProd) {
      const prodNumber = await getNextSequence('PROD', 4);
      const firstItem = order.items[0] || {};
      
      // Find active BOM for the product
      const activeBom = firstItem.product ? await BOM.findOne({ product: firstItem.product, status: 'APPROVED' }) : null;

      prodOrder = await ProductionOrder.create({
        productionNumber: prodNumber,
        salesOrder: order._id,
        soNumber: order.soNumber,
        product: firstItem.product,
        productName: firstItem.description || 'Scientific Refrigeration Unit',
        model: firstItem.productCode || 'CFS-ULT-500',
        quantity: firstItem.quantity || 1,
        targetDeliveryDate: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)), // 6-8 weeks
        bom: activeBom?._id,
        bomVersion: activeBom?.version || 'V1',
        status: 'RELEASED',
        stages: [
          { name: 'Fabrication', status: 'IN_PROGRESS', startedAt: new Date(), remarks: 'Sheet metal and chassis fabrication' },
          { name: 'Refrigeration', status: 'PENDING', remarks: 'Cascade compressor loop & refrigerant charging' },
          { name: 'Electrical', status: 'PENDING', remarks: 'Microprocessor PID control board & sensors wiring' },
          { name: 'Assembly', status: 'PENDING', remarks: 'Insulation foaming, gaskets, door assembly' },
          { name: 'Testing & QA Pre-check', status: 'PENDING', remarks: 'Preliminary pull-down test' }
        ]
      });
    }

    await logAudit({
      action: 'PRODUCTION_RELEASED',
      entityType: 'SalesOrder',
      entityId: order._id,
      entityNumber: order.soNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Order ${order.soNumber} released to manufacturing line. Production Order: ${prodOrder.productionNumber}`
    });

    res.json({
      message: 'Order released for production successfully',
      order,
      productionOrder: prodOrder
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadSalesOrderPDF = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id).populate('customer');
    if (!order) return res.status(404).json({ message: 'Sales Order not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${order.soNumber}.pdf"`);

    await generateDocumentPDF('Sales Order', order, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};
