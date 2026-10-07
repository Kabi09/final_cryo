import mongoose from 'mongoose';

const bomItemSchema = new mongoose.Schema({
  materialCode: { type: String, required: true },
  materialName: { type: String, required: true },
  category: { type: String, default: 'Raw Material' },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Nos' },
  unitCost: { type: Number, default: 0 },
  scrapPercentage: { type: Number, default: 0 },
  alternativeMaterial: { type: String, default: '' },
  workCenter: { type: String, enum: ['Fabrication', 'Refrigeration', 'Electrical', 'Assembly', 'General'], default: 'Assembly' },
  notes: { type: String, default: '' }
});

const bomSchema = new mongoose.Schema({
  bomNumber: { type: String, required: true, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  version: { type: String, required: true, default: 'V1' },
  title: { type: String, required: true },
  effectiveDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['DRAFT', 'APPROVED', 'OBSOLETE'], default: 'APPROVED' },
  items: [bomItemSchema],
  totalEstimatedCost: { type: Number, default: 0 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

export const BOM = mongoose.model('BOM', bomSchema);
