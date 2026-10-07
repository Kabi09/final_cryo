import mongoose from 'mongoose';
import crypto from 'crypto';

const customerSchema = new mongoose.Schema({
  customerCode: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  gstin: { type: String, trim: true },
  pan: { type: String, trim: true },
  segment: { 
    type: String, 
    enum: ['Research & Labs', 'Hospital & Healthcare', 'Pharma & Biotech', 'Industrial & Manufacturing', 'Blood Bank', 'Educational'],
    default: 'Research & Labs'
  },
  publicToken: { 
    type: String, 
    unique: true, 
    default: () => crypto.randomBytes(8).toString('hex').toUpperCase() 
  },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
