import mongoose from 'mongoose';
import crypto from 'crypto';

const piSchema = new mongoose.Schema({
  piNumber: { type: String, required: true, unique: true }, // PI-2026-001
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  quotationNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  piDate: { type: Date, default: Date.now },
  items: [{
    productCode: String,
    description: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    discount: Number,
    taxableAmount: Number,
    taxAmount: Number,
    totalAmount: Number
  }],
  totalDiscount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  advancePercent: { type: Number, default: 30 },
  advanceAmount: { type: Number, required: true },
  balanceAmount: { type: Number, required: true },
  paymentTerms: { type: String, default: '30% advance on order confirmation, balance before dispatch.' },
  status: { type: String, enum: ['ISSUED', 'PO_RECEIVED', 'CANCELLED'], default: 'ISSUED' },
  publicToken: { 
    type: String, 
    unique: true, 
    default: () => crypto.randomBytes(8).toString('hex').toUpperCase() 
  }
}, { timestamps: true });

export const ProformaInvoice = mongoose.model('ProformaInvoice', piSchema);
