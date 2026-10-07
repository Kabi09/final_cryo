import mongoose from 'mongoose';

const productionStageSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: ['Fabrication', 'Refrigeration', 'Electrical', 'Assembly', 'Testing & QA Pre-check']
  },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
  assignedEngineer: { type: String, default: '' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  remarks: { type: String, default: '' }
});

const productionOrderSchema = new mongoose.Schema({
  productionNumber: { type: String, required: true, unique: true }, // PROD-2026-001
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  soNumber: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  model: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  
  targetDeliveryDate: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'High' },
  workCenter: { type: String, default: 'Cryo Assembly Line 1' },
  assignedTeam: { type: String, default: 'Production Alpha' },
  
  bom: { type: mongoose.Schema.Types.ObjectId, ref: 'BOM' },
  bomVersion: { type: String, default: 'V1' },
  
  status: { 
    type: String, 
    enum: [
      'PLANNED', 
      'RELEASED', 
      'MATERIAL_PLANNING', 
      'MATERIAL_REQUESTED', 
      'MATERIAL_ISSUED', 
      'IN_PROGRESS', 
      'COMPLETED'
    ], 
    default: 'RELEASED' 
  },
  
  stages: [productionStageSchema],
  materialShortage: { type: Boolean, default: false },
  
  startDate: { type: Date, default: Date.now },
  plannedEndDate: { type: Date },
  actualEndDate: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

export const ProductionOrder = mongoose.model('ProductionOrder', productionOrderSchema);
