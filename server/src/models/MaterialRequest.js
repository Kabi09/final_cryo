import mongoose from 'mongoose';

const materialItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  requiredQty: { type: Number, required: true },
  availableQty: { type: Number, default: 0 },
  reservedQty: { type: Number, default: 0 },
  shortageQty: { type: Number, default: 0 },
  issuedQty: { type: Number, default: 0 },
  unit: { type: String, default: 'Nos' },
  scrapWastage: { type: Number, default: 0 }
});

const materialRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, required: true, unique: true }, // MR-2026-001
  productionOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
  productionNumber: { type: String, required: true },
  department: { type: String, default: 'Production' },
  items: [materialItemSchema],
  status: { 
    type: String, 
    enum: ['PENDING_APPROVAL', 'APPROVED', 'STOCK_CHECKED', 'PARTIALLY_ISSUED', 'FULLY_ISSUED'], 
    default: 'PENDING_APPROVAL' 
  },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  issuedBy: { type: String },
  issuedAt: { type: Date },
  shortagePresent: { type: Boolean, default: false },
  procurementInitiated: { type: Boolean, default: false }
}, { timestamps: true });

export const MaterialRequest = mongoose.model('MaterialRequest', materialRequestSchema);
