import mongoose from 'mongoose';

const customerPoSchema = new mongoose.Schema({
  poNumber: { type: String, required: true }, // Customer's PO number e.g. PO-2026-0098
  poDate: { type: Date, required: true, default: Date.now },
  proformaInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'ProformaInvoice', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderValue: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  notes: { type: String },
  attachmentUrl: { type: String },
  verificationStatus: { 
    type: String, 
    enum: ['PENDING', 'MATCHED', 'MISMATCH_HOLD', 'CORRECTED'], 
    default: 'PENDING' 
  },
  verificationChecklist: {
    quantityMatch: { type: Boolean, default: false },
    priceMatch: { type: Boolean, default: false },
    specMatch: { type: Boolean, default: false },
    termsMatch: { type: Boolean, default: false },
    taxMatch: { type: Boolean, default: false }
  },
  mismatchRemarks: { type: String },
  verifiedBy: { type: String },
  verifiedAt: { type: Date },
  salesOrderGenerated: { type: Boolean, default: false }
}, { timestamps: true });

export const CustomerPO = mongoose.model('CustomerPO', customerPoSchema);
