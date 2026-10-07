import mongoose from 'mongoose';
import crypto from 'crypto';

const quotationItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productCode: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'Units' },
  unitPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  taxableAmount: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 }
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true }, // e.g. QT-2026-014 or QT-2026-014-R01
  baseQuotationNumber: { type: String, required: true }, // e.g. QT-2026-014
  revisionNumber: { type: String, default: 'R00' }, // R00, R01, etc.
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  customerSnapshot: {
    name: String,
    contactPerson: String,
    email: String,
    phone: String,
    address: String,
    gstin: String
  },

  quotationDate: { type: Date, default: Date.now },
  validityDate: { type: Date, required: true },
  
  items: [quotationItemSchema],
  
  totalDiscount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },

  paymentTerms: { 
    type: String, 
    default: '30% advance on order confirmation. Balance as per agreed delivery/payment milestone.' 
  },
  deliveryPeriod: { type: String, default: '6–8 weeks from order and advance receipt.' },
  warrantyTerms: { type: String, default: '12 Months comprehensive manufacturer warranty.' },
  notes: { type: String, default: 'Quotation validity and pricing are subject to the terms stated above.' },
  internalNotes: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: [
      'DRAFT', 
      'PENDING_APPROVAL', 
      'APPROVED', 
      'SENT', 
      'NEGOTIATION', 
      'ACCEPTED', 
      'REJECTED', 
      'REVISED', 
      'LOST'
    ], 
    default: 'DRAFT' 
  },

  approval: {
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    remarks: { type: String }
  },

  sendDetails: {
    sentAt: { type: Date },
    sentVia: { type: String, enum: ['EMAIL', 'WHATSAPP', 'LINK', 'MANUAL'] },
    recipientEmail: { type: String },
    recipientPhone: { type: String }
  },

  publicToken: { 
    type: String, 
    unique: true, 
    default: () => crypto.randomBytes(10).toString('hex').toUpperCase() 
  },

  customerResponse: {
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'REVISION_REQUESTED'], default: 'PENDING' },
    respondedAt: { type: Date },
    comments: { type: String },
    ipAddress: { type: String }
  },

  revisionReason: { type: String },
  previousRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },

  createdBy: { type: String, default: 'Sales' }
}, { timestamps: true });

export const Quotation = mongoose.model('Quotation', quotationSchema);
