import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true }, // PAY-2026-001
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  soNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  paymentType: { type: String, enum: ['ADVANCE', 'MILESTONE', 'FINAL_BALANCE'], default: 'ADVANCE' },
  amount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['NEFT', 'RTGS', 'CHEQUE', 'UPI', 'BANK_TRANSFER'], default: 'NEFT' },
  referenceNumber: { type: String, required: true }, // Bank UTR or Cheque No
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'], default: 'VERIFIED' },
  verifiedBy: { type: String, default: 'Finance Team' },
  verifiedAt: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);
