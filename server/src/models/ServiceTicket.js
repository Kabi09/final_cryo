import mongoose from 'mongoose';

const serviceVisitSchema = new mongoose.Schema({
  visitNumber: { type: Number, required: true },
  engineerName: { type: String, required: true },
  engineerPhone: { type: String },
  scheduledDate: { type: Date, required: true },
  
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  
  inspectionFindings: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  machineConditionOnArrival: { type: String, default: '' },
  
  spareRequired: { type: Boolean, default: false },
  spareDetails: [{
    itemCode: String,
    itemName: String,
    qty: Number,
    unit: String,
    isAvailable: Boolean,
    issued: Boolean
  }],
  
  workDone: { type: String, default: '' },
  
  testReadings: {
    requiredTemp: { type: String, default: '-80°C' },
    actualTemp: { type: String, default: '' },
    voltage: { type: String, default: '230V' },
    suctionPressure: { type: String, default: '' },
    dischargePressure: { type: String, default: '' },
    result: { type: String, enum: ['PENDING', 'PASS', 'FAIL'], default: 'PENDING' }
  },
  
  customerSignoffName: { type: String },
  customerSignoffRemarks: { type: String },
  signoffDate: { type: Date },
  
  visitStatus: { 
    type: String, 
    enum: ['SCHEDULED', 'IN_PROGRESS', 'WAITING_FOR_SPARE', 'COMPLETED_PASS', 'COMPLETED_FAIL'], 
    default: 'SCHEDULED' 
  }
});

const serviceTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true }, // SRV-2026-001
  requestDate: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String },
  
  serialNumber: { type: String, required: true },
  productName: { type: String, required: true },
  model: { type: String, required: true },
  
  complaintDescription: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'High' },
  
  warrantyStatus: { 
    type: String, 
    enum: ['VALID_FREE', 'EXPIRED_CHARGEABLE', 'UNDER_CHECK'], 
    default: 'UNDER_CHECK' 
  },
  
  chargeableQuotation: {
    amount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    paymentVerified: { type: Boolean, default: false }
  },
  
  assignedEngineer: { type: String },
  assignedEngineerPhone: { type: String },
  
  status: { 
    type: String, 
    enum: [
      'OPEN', 
      'ASSIGNED', 
      'SCHEDULED', 
      'IN_PROGRESS', 
      'DIAGNOSIS', 
      'WAITING_FOR_SPARE', 
      'SPARE_RECEIVED', 
      'RE_SCHEDULED', 
      'REPAIR', 
      'TESTING', 
      'CUSTOMER_SIGN_OFF', 
      'CLOSED'
    ], 
    default: 'OPEN' 
  },
  
  currentMachineCondition: { type: String, default: 'Chamber temperature fluctuating' },
  visits: [serviceVisitSchema],
  
  closureReport: {
    finalResolution: String,
    closedAt: Date,
    closedBy: String,
    serviceReportNumber: String
  }
}, { timestamps: true });

export const ServiceTicket = mongoose.model('ServiceTicket', serviceTicketSchema);
