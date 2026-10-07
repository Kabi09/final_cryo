import mongoose from 'mongoose';

const qaParameterSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  specification: { type: String, required: true },
  actualReading: { type: String, required: true },
  result: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' },
  remarks: { type: String, default: 'Conforms to standard' }
});

const qaSchema = new mongoose.Schema({
  qaNumber: { type: String, required: true, unique: true }, // QA-2026-001
  productionOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
  productionNumber: { type: String, required: true },
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  soNumber: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  model: { type: String, required: true },
  
  assignedSerialNumber: { type: String }, // Populated once passed
  parameters: [qaParameterSchema],
  
  overallResult: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' },
  rectificationNotes: { type: String },
  retestRequired: { type: Boolean, default: false },
  retestCount: { type: Number, default: 0 },
  
  certificateNumber: { type: String }, // e.g. QC-CERT-2026-001
  certificateIssuedAt: { type: Date },
  
  inspectorName: { type: String, default: 'Quality Assurance Lead' },
  inspectedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const QAInspection = mongoose.model('QAInspection', qaSchema);

const serialNumberSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true, unique: true }, // CRYO-ULT-2026-0091
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  model: { type: String, required: true },
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  soNumber: { type: String },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  qaInspection: { type: mongoose.Schema.Types.ObjectId, ref: 'QAInspection' },
  manufactureDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['IN_STOCK', 'ALLOCATED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'INSTALLED_ACTIVE', 'IN_SERVICE'], 
    default: 'IN_STOCK' 
  },
  location: { type: String, default: 'Finished Goods Bay - Chennai' },
  warrantyPeriodMonths: { type: Number, default: 12 },
  warrantyStart: { type: Date },
  warrantyEnd: { type: Date }
}, { timestamps: true });

export const SerialNumber = mongoose.model('SerialNumber', serialNumberSchema);
