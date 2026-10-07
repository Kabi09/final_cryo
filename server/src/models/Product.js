import mongoose from 'mongoose';

const productMaterialMappingSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  materialCode: { type: String, required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 0.01 },
  unit: { type: String, default: 'Nos' },
  isRequired: { type: Boolean, default: true },
  alternativeMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  remarks: { type: String, default: '' }
}, { _id: true });

const productSchema = new mongoose.Schema({
  model: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  productCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
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
  subcategory: { type: String, default: '' },
  brand: { type: String, default: 'Cryo Scientific' },
  description: { type: String, default: '' },
  unit: { type: String, default: 'Units' },
  baseCost: { type: Number, required: true, default: 0 },
  minSellingPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, default: 18 },
  warranty: { type: String, default: '12 Months' },
  warrantyMonths: { type: Number, default: 12 },
  serialised: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  
  // Dynamic Product Specifications
  specifications: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }],
  
  // Product ↔ Inventory / Materials Mapping
  requiredMaterials: [productMaterialMappingSchema],
  
  images: [{ type: String }],
  documents: [{ type: String }]
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
