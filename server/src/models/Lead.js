import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  notes: { type: String, required: true },
  nextFollowUpDate: { type: Date },
  responseStatus: { type: String, enum: ['INTERESTED', 'NO_RESPONSE', 'NOT_INTERESTED', 'REQUESTED_QUOTE'], default: 'INTERESTED' },
  contactedBy: { type: String }
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  leadNumber: { type: String, required: true, unique: true },
  leadDate: { type: Date, default: Date.now },
  leadSource: { type: String, default: 'Direct Inquiry' },
  leadType: { type: String, enum: ['New Customer', 'Existing Customer'], default: 'New Customer' },
  customerName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  requirement: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  expectedValue: { type: Number, default: 0 },
  expectedDate: { type: Date },
  assignedTo: { type: String, default: 'Sales Executive' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'High' },
  status: { 
    type: String, 
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'NOT_QUALIFIED', 'LOST', 'QUOTATION_CREATED'], 
    default: 'NEW' 
  },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  gstin: { type: String, default: '' },
  segment: { 
    type: String, 
    enum: ['Research & Labs', 'Hospital & Healthcare', 'Pharma & Biotech', 'Industrial & Manufacturing', 'Blood Bank', 'Educational'],
    default: 'Research & Labs' 
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  convertedCustomerCode: { type: String, default: '' },
  followUps: [followUpSchema],
  remarks: { type: String }
}, { timestamps: true });

export const Lead = mongoose.model('Lead', leadSchema);
