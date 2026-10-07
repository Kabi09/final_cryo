import { CustomerPO } from '../models/CustomerPO.js';
import { ProformaInvoice } from '../models/ProformaInvoice.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

export const listCustomerPOs = async (req, res) => {
  try {
    const pos = await CustomerPO.find().populate('customer').populate('proformaInvoice').sort({ createdAt: -1 });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerPOById = async (req, res) => {
  try {
    const po = await CustomerPO.findById(req.params.id).populate('customer').populate('proformaInvoice').populate('quotation');
    if (!po) return res.status(404).json({ message: 'Customer PO not found' });
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomerPO = async (req, res) => {
  try {
    const { poNumber, poDate, proformaInvoiceId, orderValue, deliveryAddress, notes } = req.body;
    const pi = await ProformaInvoice.findById(proformaInvoiceId);
    if (!pi) return res.status(404).json({ message: 'Proforma Invoice not found' });

    const po = await CustomerPO.create({
      poNumber,
      poDate: poDate || new Date(),
      proformaInvoice: pi._id,
      quotation: pi.quotation,
      customer: pi.customer,
      orderValue: Number(orderValue) || pi.grandTotal,
      deliveryAddress,
      notes,
      verificationStatus: 'PENDING'
    });

    pi.status = 'PO_RECEIVED';
    await pi.save();

    await logAudit({
      action: 'CUSTOMER_PO_RECEIVED',
      entityType: 'CustomerPO',
      entityId: po._id,
      entityNumber: po.poNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Received Customer PO ${po.poNumber} against PI ${pi.piNumber} for ₹${po.orderValue}`
    });

    res.status(201).json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyCustomerPO = async (req, res) => {
  try {
    const { checklist, mismatchRemarks, statusOverride } = req.body;
    const po = await CustomerPO.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'Customer PO not found' });

    po.verificationChecklist = checklist || po.verificationChecklist;
    const { quantityMatch, priceMatch, specMatch, termsMatch, taxMatch } = po.verificationChecklist;

    const allMatch = quantityMatch && priceMatch && specMatch && termsMatch && taxMatch;

    if (statusOverride) {
      po.verificationStatus = statusOverride;
    } else if (allMatch) {
      po.verificationStatus = 'MATCHED';
    } else {
      po.verificationStatus = 'MISMATCH_HOLD';
      po.mismatchRemarks = mismatchRemarks || 'Verification check failed on critical order parameters.';
    }

    po.verifiedBy = req.user.name;
    po.verifiedAt = new Date();
    await po.save();

    await logAudit({
      action: 'PO_VERIFICATION',
      entityType: 'CustomerPO',
      entityId: po._id,
      entityNumber: po.poNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Customer PO ${po.poNumber} verification result: ${po.verificationStatus}`
    });

    res.json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadCustomerPoPDF = async (req, res) => {
  try {
    const po = await CustomerPO.findById(req.params.id).populate('customer').populate('proformaInvoice');
    if (!po) return res.status(404).json({ message: 'Customer PO not found' });

    const data = {
      docNumber: po.poNumber,
      date: po.poDate,
      customer: po.customer,
      items: po.proformaInvoice?.items || [],
      grandTotal: po.orderValue,
      taxableAmount: po.proformaInvoice?.taxableAmount,
      taxAmount: po.proformaInvoice?.taxAmount,
      totalDiscount: po.proformaInvoice?.totalDiscount,
      status: po.verificationStatus
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${po.poNumber}.pdf"`);

    await generateDocumentPDF('Customer Purchase Order', data, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};
