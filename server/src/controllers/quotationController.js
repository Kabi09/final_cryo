import { Quotation } from '../models/Quotation.js';
import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { getNextSequence } from '../services/numberingService.js';
import { generateDocumentPDF, generateDocumentPDFBuffer } from '../services/pdfService.js';
import { sendQuotationEmail } from '../services/emailService.js';
import { logAudit } from '../middleware/audit.js';

export const listQuotations = async (req, res) => {
  try {
    const { status, customerId, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (customerId) query.customer = customerId;
    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } }
      ];
    }
    const quotations = await Quotation.find(query).populate('customer').sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer').populate('lead');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    // Also find any revisions linked to this base quotation
    const revisions = await Quotation.find({ baseQuotationNumber: quotation.baseQuotationNumber }).sort({ createdAt: 1 });

    res.json({ quotation, revisions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createQuotation = async (req, res) => {
  try {
    const { customer: customerId, lead: leadId, items, validityDays = 14, deliveryPeriod, paymentTerms, warrantyTerms, notes, internalNotes } = req.body;
    
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const baseQuotationNumber = await getNextSequence('QT', 4);
    const quotationNumber = `${baseQuotationNumber}`; // R00 default

    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + Number(validityDays));

    let taxableAmount = 0;
    let taxAmount = 0;
    let totalDiscount = 0;

    const formattedItems = (items || []).map(item => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      const taxRate = Number(item.taxRate) || 18;

      const lineTaxable = (qty * unitPrice) - disc;
      const lineTax = lineTaxable * (taxRate / 100);
      const lineTotal = lineTaxable + lineTax;

      taxableAmount += lineTaxable;
      taxAmount += lineTax;
      totalDiscount += disc;

      return {
        product: item.product,
        productCode: item.productCode,
        description: item.description,
        quantity: qty,
        unit: item.unit || 'Units',
        unitPrice,
        discount: disc,
        taxRate,
        taxableAmount: lineTaxable,
        taxAmount: lineTax,
        totalAmount: lineTotal
      };
    });

    const grandTotal = taxableAmount + taxAmount;

    const quotation = await Quotation.create({
      quotationNumber,
      baseQuotationNumber,
      revisionNumber: 'R00',
      customer: customer._id,
      lead: leadId || undefined,
      customerSnapshot: {
        name: customer.name,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        address: `${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}`,
        gstin: customer.gstin
      },
      validityDate,
      items: formattedItems,
      totalDiscount,
      taxableAmount,
      taxAmount,
      grandTotal,
      paymentTerms,
      deliveryPeriod,
      warrantyTerms,
      notes,
      internalNotes,
      status: 'PENDING_APPROVAL',
      createdBy: req.user.name
    });

    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, { status: 'QUOTATION_CREATED' });
    }

    await logAudit({
      action: 'QUOTATION_CREATED',
      entityType: 'Quotation',
      entityId: quotation._id,
      entityNumber: quotation.quotationNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created quotation ${quotation.quotationNumber} for ${customer.name}. Grand Total: ₹${grandTotal}`
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const approveQuotation = async (req, res) => {
  try {
    const { remarks } = req.body;
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    quotation.status = 'APPROVED';
    quotation.approval = {
      status: 'APPROVED',
      approvedBy: req.user.name,
      approvedAt: new Date(),
      remarks: remarks || 'Approved by commercial management'
    };
    await quotation.save();

    await logAudit({
      action: 'QUOTATION_APPROVED',
      entityType: 'Quotation',
      entityId: quotation._id,
      entityNumber: quotation.quotationNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Approved quotation ${quotation.quotationNumber}`
    });

    res.json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const sendQuotation = async (req, res) => {
  try {
    const { sendVia = 'LINK', recipientEmail, recipientPhone } = req.body;
    const quotation = await Quotation.findById(req.params.id).populate('customer');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    const targetSentVia = sendVia || 'LINK';
    const emailTo = recipientEmail || quotation.customerSnapshot?.email || quotation.customer?.email;
    const phoneTo = recipientPhone || quotation.customerSnapshot?.phone || quotation.customer?.phone;

    quotation.status = 'SENT';
    quotation.sendDetails = {
      sentAt: new Date(),
      sentVia: targetSentVia,
      recipientEmail: emailTo,
      recipientPhone: phoneTo
    };
    await quotation.save();

    const publicUrl = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/quotation/view/${quotation.publicToken}`;

    let emailResult = null;
    if (targetSentVia === 'EMAIL' && emailTo) {
      try {
        const docType = quotation.revisionNumber === 'R00' ? 'Quotation' : `Quotation Revision (${quotation.revisionNumber})`;
        const pdfBuf = await generateDocumentPDFBuffer(docType, quotation);
        emailResult = await sendQuotationEmail({
          to: emailTo,
          quotation,
          pdfBuffer: pdfBuf,
          publicUrl
        });
      } catch (mailErr) {
        console.error('Email dispatch error:', mailErr);
        emailResult = { success: false, error: mailErr.message };
      }
    }

    await logAudit({
      action: 'QUOTATION_SENT',
      entityType: 'Quotation',
      entityId: quotation._id,
      entityNumber: quotation.quotationNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Sent quotation ${quotation.quotationNumber} via ${targetSentVia}. Recipient: ${emailTo || phoneTo || 'Link'}. Public Link: ${publicUrl}`
    });

    res.json({
      message: emailResult?.success ? 'Quotation dispatched successfully via email!' : 'Quotation sent successfully',
      quotation,
      publicUrl,
      emailResult
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createRevision = async (req, res) => {
  try {
    const { reason, items, validityDays = 14, deliveryPeriod, paymentTerms, notes } = req.body;
    const baseQuotation = await Quotation.findById(req.params.id);
    if (!baseQuotation) return res.status(404).json({ message: 'Base quotation not found' });

    // Mark previous as REVISED
    baseQuotation.status = 'REVISED';
    await baseQuotation.save();

    // Determine next revision number
    const currentRevNum = parseInt(baseQuotation.revisionNumber.replace('R', ''), 10) || 0;
    const nextRevNum = currentRevNum + 1;
    const revisionNumber = `R${String(nextRevNum).padStart(2, '0')}`;
    const quotationNumber = `${baseQuotation.baseQuotationNumber}-${revisionNumber}`;

    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + Number(validityDays));

    let taxableAmount = 0;
    let taxAmount = 0;
    let totalDiscount = 0;

    const sourceItems = items || baseQuotation.items;
    const formattedItems = sourceItems.map(item => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      const taxRate = Number(item.taxRate) || 18;

      const lineTaxable = (qty * unitPrice) - disc;
      const lineTax = lineTaxable * (taxRate / 100);
      const lineTotal = lineTaxable + lineTax;

      taxableAmount += lineTaxable;
      taxAmount += lineTax;
      totalDiscount += disc;

      return {
        product: item.product,
        productCode: item.productCode,
        description: item.description,
        quantity: qty,
        unit: item.unit || 'Units',
        unitPrice,
        discount: disc,
        taxRate,
        taxableAmount: lineTaxable,
        taxAmount: lineTax,
        totalAmount: lineTotal
      };
    });

    const grandTotal = taxableAmount + taxAmount;

    const revisedQuotation = await Quotation.create({
      quotationNumber,
      baseQuotationNumber: baseQuotation.baseQuotationNumber,
      revisionNumber,
      customer: baseQuotation.customer,
      lead: baseQuotation.lead,
      customerSnapshot: baseQuotation.customerSnapshot,
      validityDate,
      items: formattedItems,
      totalDiscount,
      taxableAmount,
      taxAmount,
      grandTotal,
      paymentTerms: paymentTerms || baseQuotation.paymentTerms,
      deliveryPeriod: deliveryPeriod || baseQuotation.deliveryPeriod,
      warrantyTerms: baseQuotation.warrantyTerms,
      notes: notes || baseQuotation.notes,
      internalNotes: baseQuotation.internalNotes,
      revisionReason: reason || 'Customer commercial request',
      previousRevisionId: baseQuotation._id,
      status: 'PENDING_APPROVAL',
      createdBy: req.user.name
    });

    await logAudit({
      action: 'QUOTATION_REVISED',
      entityType: 'Quotation',
      entityId: revisedQuotation._id,
      entityNumber: revisedQuotation.quotationNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created revision ${revisionNumber} for base quotation ${baseQuotation.baseQuotationNumber}. Reason: ${reason}`
    });

    res.status(201).json(revisedQuotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadQuotationPDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber}.pdf"`);

    const docType = quotation.revisionNumber === 'R00' ? 'Quotation' : `Quotation Revision (${quotation.revisionNumber})`;
    await generateDocumentPDF(docType, quotation, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};
