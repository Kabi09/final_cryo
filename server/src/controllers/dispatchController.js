import { Shipment, TaxInvoice } from '../models/Dispatch.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { SerialNumber } from '../models/QAInspection.js';
import { getNextSequence } from '../services/numberingService.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

export const listShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().populate('customer').populate('salesOrder').sort({ createdAt: -1 });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateTaxInvoice = async (req, res) => {
  try {
    const { salesOrderId } = req.body;
    const order = await SalesOrder.findById(salesOrderId).populate('customer');
    if (!order) return res.status(404).json({ message: 'Sales Order not found' });

    if (order.qaStatus !== 'PASSED') {
      return res.status(400).json({ message: 'Cannot invoice: QA has not passed for this order.' });
    }

    const invoiceNumber = await getNextSequence('INV', 4);
    const invoice = await TaxInvoice.create({
      invoiceNumber,
      salesOrder: order._id,
      soNumber: order.soNumber,
      customer: order.customer._id,
      invoiceDate: new Date(),
      items: order.items,
      taxableAmount: order.totalTaxable,
      taxAmount: order.totalTax,
      grandTotal: order.grandTotal,
      status: 'PAID'
    });

    order.dispatchStatus = 'INVOICED';
    await order.save();

    await logAudit({
      action: 'TAX_INVOICE_GENERATED',
      entityType: 'TaxInvoice',
      entityId: invoice._id,
      entityNumber: invoice.invoiceNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Generated Tax Invoice ${invoice.invoiceNumber} for order ${order.soNumber}. Amount: ₹${order.grandTotal}`
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createShipment = async (req, res) => {
  try {
    const { salesOrderId, carrierName, bookingNumber, trackingNumber, trackingUrl, expectedDeliveryDate, serialNumbers } = req.body;
    const order = await SalesOrder.findById(salesOrderId).populate('customer');
    if (!order) return res.status(404).json({ message: 'Sales Order not found' });

    const shipmentNumber = await getNextSequence('SHIP', 4);
    const shipment = await Shipment.create({
      shipmentNumber,
      salesOrder: order._id,
      soNumber: order.soNumber,
      customer: order.customer._id,
      serialNumbers: serialNumbers || [],
      carrierName,
      bookingNumber,
      trackingNumber,
      trackingUrl: trackingUrl || `https://track.logistics.com/${trackingNumber}`,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'IN_TRANSIT'
    });

    order.dispatchStatus = 'DISPATCHED';
    order.currentStage = 'DISPATCHED';
    await order.save();

    // Update SerialNumber status
    if (serialNumbers && serialNumbers.length > 0) {
      await SerialNumber.updateMany(
        { serialNumber: { $in: serialNumbers } },
        { status: 'DISPATCHED', location: `In Transit via ${carrierName}` }
      );
    }

    await logAudit({
      action: 'ORDER_DISPATCHED',
      entityType: 'Shipment',
      entityId: shipment._id,
      entityNumber: shipment.shipmentNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Dispatched order ${order.soNumber} via ${carrierName} (LR/Tracking: ${trackingNumber})`
    });

    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateShipmentStatus = async (req, res) => {
  try {
    const { status, podReceiverName, remarks } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    shipment.status = status;
    if (status === 'DELIVERED') {
      shipment.actualDeliveryDate = new Date();
      shipment.podReceived = true;
      shipment.podReceiverName = podReceiverName || 'Customer Central Store';
      shipment.podDate = new Date();

      const order = await SalesOrder.findById(shipment.salesOrder);
      if (order) {
        order.dispatchStatus = 'DELIVERED';
        order.currentStage = 'DELIVERED';
        order.installationStatus = 'SCHEDULED';
        await order.save();
      }

      await SerialNumber.updateMany(
        { serialNumber: { $in: shipment.serialNumbers } },
        { status: 'DELIVERED', location: 'Customer Site Premises' }
      );
    }
    if (remarks) shipment.remarks = remarks;

    await shipment.save();

    await logAudit({
      action: 'SHIPMENT_STATUS_UPDATED',
      entityType: 'Shipment',
      entityId: shipment._id,
      entityNumber: shipment.shipmentNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Shipment ${shipment.shipmentNumber} status updated to ${status}. Delivery verified: ${shipment.podReceived}`
    });

    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await TaxInvoice.findById(req.params.id).populate('customer');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    await generateDocumentPDF('Tax Invoice', invoice, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate Invoice PDF', error: error.message });
  }
};
