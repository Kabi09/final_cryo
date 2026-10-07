import { ProformaInvoice } from '../models/ProformaInvoice.js';
import { Quotation } from '../models/Quotation.js';
import { getNextSequence } from '../services/numberingService.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

export const listProformas = async (req, res) => {
  try {
    const pis = await ProformaInvoice.find().populate('customer').sort({ createdAt: -1 });
    res.json(pis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProformaById = async (req, res) => {
  try {
    const pi = await ProformaInvoice.findById(req.params.id).populate('customer').populate('quotation');
    if (!pi) return res.status(404).json({ message: 'Proforma Invoice not found' });
    res.json(pi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProforma = async (req, res) => {
  try {
    const { quotationId, advancePercent = 30 } = req.body;
    const quotation = await Quotation.findById(quotationId).populate('customer');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    const piNumber = await getNextSequence('PI', 4);
    const advanceAmount = Math.round(quotation.grandTotal * (Number(advancePercent) / 100));
    const balanceAmount = quotation.grandTotal - advanceAmount;

    const pi = await ProformaInvoice.create({
      piNumber,
      quotation: quotation._id,
      quotationNumber: quotation.quotationNumber,
      customer: quotation.customer._id,
      items: quotation.items,
      totalDiscount: quotation.totalDiscount,
      taxableAmount: quotation.taxableAmount,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,
      advancePercent,
      advanceAmount,
      balanceAmount,
      paymentTerms: `${advancePercent}% advance on order confirmation, balance before dispatch.`
    });

    await logAudit({
      action: 'PROFORMA_INVOICE_CREATED',
      entityType: 'ProformaInvoice',
      entityId: pi._id,
      entityNumber: pi.piNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Generated Proforma Invoice ${pi.piNumber} from ${quotation.quotationNumber}`
    });

    res.status(201).json(pi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadPiPDF = async (req, res) => {
  try {
    const pi = await ProformaInvoice.findById(req.params.id).populate('customer');
    if (!pi) return res.status(404).json({ message: 'Proforma Invoice not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pi.piNumber}.pdf"`);

    await generateDocumentPDF('Proforma Invoice', pi, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};
