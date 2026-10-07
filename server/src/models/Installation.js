import mongoose from 'mongoose';

const installationSchema = new mongoose.Schema({
  installationNumber: { type: String, required: true, unique: true }, // INST-2026-001
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  soNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  serialNumber: { type: String, required: true },
  productName: { type: String, required: true },
  
  assignedEngineer: { type: String, required: true },
  engineerPhone: { type: String },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  
  status: { 
    type: String, 
    enum: ['SCHEDULED', 'ENGINEER_VISITED', 'COMMISSIONED_SUCCESS', 'RESCHEDULED'], 
    default: 'SCHEDULED' 
  },
  
  commissioningDetails: {
    ambientTemperature: String,
    chamberTargetTemp: String,
    chamberAchievedTemp: String, // e.g. -81.4 C
    powerVoltage: String,
    stabilizerInstalled: Boolean,
    alarmCheckDone: Boolean,
    userTrainingCompleted: Boolean
  },
  
  customerSignoffName: { type: String },
  customerSignoffDesignation: { type: String },
  remarks: { type: String }
}, { timestamps: true });

export const Installation = mongoose.model('Installation', installationSchema);

const warrantySchema = new mongoose.Schema({
  warrantyNumber: { type: String, required: true, unique: true }, // WAR-2026-001
  serialNumber: { type: String, required: true, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  soNumber: { type: String },
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  warrantyPeriodMonths: { type: Number, default: 12 },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'EXTENDED', 'VOID'], default: 'ACTIVE' },
  terms: { type: String, default: 'Standard 12 Months comprehensive manufacturer warranty against refrigeration and electrical defects.' }
}, { timestamps: true });

export const Warranty = mongoose.model('Warranty', warrantySchema);
