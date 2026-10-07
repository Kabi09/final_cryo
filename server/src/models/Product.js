import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Ultra Low Temperature Freezer', 
      'Deep Freezer', 
      'Blood Bank Refrigerator', 
      'Cryo Storage Container', 
      'Plasma Freezer',
      'Mortuary Chamber',
      'Laboratory Refrigerator',
      'Accessories & Spares'
    ]
  },
  subcategory: { type: String },
  model: { type: String, required: true },
  brand: { type: String, default: 'Cryo Scientific' },
  description: { type: String },
  unit: { type: String, default: 'Units' },
  baseCost: { type: Number, required: true, default: 0 },
  minSellingPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, default: 18 },
  warrantyMonths: { type: Number, default: 12 },
  serialised: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  specifications: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }],
  currentStock: { type: Number, default: 0 },
  images: [{ type: String }],
  documents: [{ type: String }]
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
