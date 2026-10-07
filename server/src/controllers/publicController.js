import { Quotation } from '../models/Quotation.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { ProformaInvoice } from '../models/ProformaInvoice.js';
import { CustomerPO } from '../models/CustomerPO.js';
import { ProductionOrder } from '../models/ProductionOrder.js';
import { QAInspection, SerialNumber } from '../models/QAInspection.js';
import { Shipment, TaxInvoice } from '../models/Dispatch.js';
import { Installation, Warranty } from '../models/Installation.js';
import { ServiceTicket } from '../models/ServiceTicket.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

// 1. Customer Quotation View
export const getPublicQuotation = async (req, res) => {
  try {
    const { token } = req.params;
    const quotation = await Quotation.findOne({ publicToken: token }).populate('customer');
    if (!quotation) return res.status(404).json({ message: 'Quotation link invalid or expired.' });

    // Sanitize response: do NOT expose internal costs, margin, or internal notes
    const sanitized = {
      quotationNumber: quotation.quotationNumber,
      baseQuotationNumber: quotation.baseQuotationNumber,
      revisionNumber: quotation.revisionNumber,
      quotationDate: quotation.quotationDate,
      validityDate: quotation.validityDate,
      customerSnapshot: quotation.customerSnapshot,
      items: quotation.items.map(i => ({
        productCode: i.productCode,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate,
        taxableAmount: i.taxableAmount,
        taxAmount: i.taxAmount,
        totalAmount: i.totalAmount
      })),
      totalDiscount: quotation.totalDiscount,
      taxableAmount: quotation.taxableAmount,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,
      paymentTerms: quotation.paymentTerms,
      deliveryPeriod: quotation.deliveryPeriod,
      warrantyTerms: quotation.warrantyTerms,
      notes: quotation.notes,
      status: quotation.status,
      customerResponse: quotation.customerResponse,
      publicToken: quotation.publicToken
    };

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Customer Accept Quotation
export const customerAcceptQuotation = async (req, res) => {
  try {
    const { token } = req.params;
    const { comments, customerName } = req.body;
    const quotation = await Quotation.findOne({ publicToken: token });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    if (quotation.status === 'ACCEPTED') {
      return res.status(400).json({ message: 'This quotation has already been accepted.' });
    }

    quotation.status = 'ACCEPTED';
    quotation.customerResponse = {
      status: 'ACCEPTED',
      respondedAt: new Date(),
      comments: comments || 'Formally accepted by authorized representative',
      ipAddress: req.ip || ''
    };
    await quotation.save();

    await logAudit({
      action: 'CUSTOMER_QUOTATION_ACCEPTED',
      entityType: 'Quotation',
      entityId: quotation._id,
      entityNumber: quotation.quotationNumber,
      performedBy: customerName || quotation.customerSnapshot?.contactPerson || 'Customer Portal',
      userRole: 'CUSTOMER',
      details: `Customer formally accepted quotation ${quotation.quotationNumber}. Total value: ₹${quotation.grandTotal}`
    });

    res.json({
      message: 'Quotation accepted successfully. Our sales desk will issue your Proforma Invoice shortly.',
      quotation
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Customer Reject Quotation
export const customerRejectQuotation = async (req, res) => {
  try {
    const { token } = req.params;
    const { reason, customerName } = req.body;
    const quotation = await Quotation.findOne({ publicToken: token });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    quotation.status = 'REJECTED';
    quotation.customerResponse = {
      status: 'REJECTED',
      respondedAt: new Date(),
      comments: reason || 'Declined by customer',
      ipAddress: req.ip || ''
    };
    await quotation.save();

    await logAudit({
      action: 'CUSTOMER_QUOTATION_REJECTED',
      entityType: 'Quotation',
      entityId: quotation._id,
      entityNumber: quotation.quotationNumber,
      performedBy: customerName || 'Customer Portal',
      userRole: 'CUSTOMER',
      details: `Customer rejected quotation ${quotation.quotationNumber}. Reason: ${reason}`
    });

    res.json({ message: 'Feedback recorded.', quotation });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. Customer Request Revision
export const customerRequestRevision = async (req, res) => {
  try {
    const { token } = req.params;
    const { comments, customerName } = req.body;
    const quotation = await Quotation.findOne({ publicToken: token });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    quotation.status = 'NEGOTIATION';
    quotation.customerResponse = {
      status: 'REVISION_REQUESTED',
      respondedAt: new Date(),
      comments: comments || 'Revision requested on commercial terms',
      ipAddress: req.ip || ''
    };
    await quotation.save();

    await logAudit({
      action: 'CUSTOMER_REQUESTED_REVISION',
      entityType: 'Quotation',
      entityId: quotation._id,
      entityNumber: quotation.quotationNumber,
      performedBy: customerName || 'Customer Portal',
      userRole: 'CUSTOMER',
      details: `Customer requested revision for ${quotation.quotationNumber}. Request: ${comments}`
    });

    res.json({ message: 'Revision request received. Our team will review and update.', quotation });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 5. Download Public Quotation PDF
export const downloadPublicQuotationPDF = async (req, res) => {
  try {
    const { token } = req.params;
    const quotation = await Quotation.findOne({ publicToken: token });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber}.pdf"`);

    const docType = quotation.revisionNumber === 'R00' ? 'Quotation' : `Quotation Revision (${quotation.revisionNumber})`;
    await generateDocumentPDF(docType, quotation, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

// 6. Complete Customer Order Journey Tracking Portal
export const getPublicOrderTracking = async (req, res) => {
  try {
    const { token } = req.params;
    const order = await SalesOrder.findOne({ publicTrackingToken: token }).populate('customer');
    if (!order) return res.status(404).json({ message: 'Tracking code invalid or expired.' });

    const pi = await ProformaInvoice.findOne({ quotation: order.quotation });
    const po = await CustomerPO.findOne({ quotation: order.quotation });
    const prod = await ProductionOrder.findOne({ salesOrder: order._id });
    const qa = await QAInspection.findOne({ salesOrder: order._id });
    const serials = await SerialNumber.find({ salesOrder: order._id });
    const shipment = await Shipment.findOne({ salesOrder: order._id });
    const installation = await Installation.findOne({ salesOrder: order._id });
    const warranty = await Warranty.findOne({ salesOrder: order._id });
    const services = await ServiceTicket.find({ serialNumber: { $in: serials.map(s => s.serialNumber) } });

    // Milestones tracking map
    const milestones = [
      { id: 'enquiry', label: 'Enquiry Received', status: 'COMPLETED', date: order.createdAt },
      { id: 'quotation', label: 'Quotation Sent & Accepted', status: 'COMPLETED', date: order.createdAt },
      { id: 'pi', label: 'Proforma Invoice Issued', status: pi ? 'COMPLETED' : 'PENDING', date: pi?.createdAt },
      { id: 'po', label: 'Customer Purchase Order Verified', status: po?.verificationStatus === 'MATCHED' ? 'COMPLETED' : (po ? 'IN_PROGRESS' : 'PENDING'), date: po?.verifiedAt },
      { id: 'order', label: 'Sales Order Confirmed', status: 'COMPLETED', date: order.orderDate },
      { id: 'payment', label: 'Advance Payment Verified', status: order.advancePaid >= order.advanceRequired ? 'COMPLETED' : 'PENDING' },
      { id: 'production', label: 'Manufacturing & Assembly', status: prod?.status === 'COMPLETED' ? 'COMPLETED' : (prod ? 'IN_PROGRESS' : 'PENDING'), details: prod ? `Status: ${prod.status}` : '' },
      { id: 'qa', label: 'Quality Assurance Testing & Certification', status: qa?.overallResult === 'PASS' ? 'COMPLETED' : (qa ? 'IN_PROGRESS' : 'PENDING'), details: qa?.certificateNumber ? `Cert #${qa.certificateNumber}` : '' },
      { id: 'packing', label: 'Factory Packing & Invoicing', status: order.dispatchStatus !== 'PENDING' ? 'COMPLETED' : 'PENDING' },
      { id: 'shipment', label: 'Dispatched & In Transit', status: shipment ? (shipment.status === 'DELIVERED' ? 'COMPLETED' : 'IN_PROGRESS') : 'PENDING', details: shipment ? `Carrier: ${shipment.carrierName} | Tracking #${shipment.trackingNumber}` : '', trackingUrl: shipment?.trackingUrl },
      { id: 'delivery', label: 'Delivered (Proof of Delivery)', status: shipment?.podReceived ? 'COMPLETED' : 'PENDING', date: shipment?.podDate },
      { id: 'installation', label: 'Installation & Commissioning', status: installation?.status === 'COMMISSIONED_SUCCESS' ? 'COMPLETED' : (installation ? 'IN_PROGRESS' : 'PENDING'), details: installation?.commissioningDetails?.chamberAchievedTemp ? `Temp achieved: ${installation.commissioningDetails.chamberAchievedTemp}` : '' },
      { id: 'warranty', label: 'Manufacturer Warranty Activated', status: warranty?.status === 'ACTIVE' ? 'COMPLETED' : 'PENDING', details: warranty ? `Valid until ${new Date(warranty.endDate).toLocaleDateString()}` : '' }
    ];

    res.json({
      orderNumber: order.soNumber,
      orderDate: order.orderDate,
      customerName: order.customer?.name,
      items: order.items.map(i => ({
        productCode: i.productCode,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit
      })),
      currentStage: order.currentStage,
      milestones,
      shipment: shipment ? {
        carrierName: shipment.carrierName,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        status: shipment.status,
        expectedDeliveryDate: shipment.expectedDeliveryDate,
        actualDeliveryDate: shipment.actualDeliveryDate,
        podReceived: shipment.podReceived
      } : null,
      serials: serials.map(s => ({ serialNumber: s.serialNumber, model: s.model, status: s.status })),
      warranty: warranty ? {
        warrantyNumber: warranty.warrantyNumber,
        startDate: warranty.startDate,
        endDate: warranty.endDate,
        status: warranty.status
      } : null,
      serviceHistory: services.map(s => ({
        ticketNumber: s.ticketNumber,
        requestDate: s.requestDate,
        complaint: s.complaintDescription,
        status: s.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
