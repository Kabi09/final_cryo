import mongoose from 'mongoose';

// Purchase Request
const prSchema = new mongoose.Schema({
  prNumber: { type: String, required: true, unique: true }, // PR-2026-001
  materialRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialRequest' },
  materialRequestNumber: { type: String },
  requestedBy: { type: String, default: 'Production Store' },
  department: { type: String, default: 'Production' },
  items: [{
    itemCode: String,
    itemName: String,
    quantity: Number,
    unit: String,
    estimatedCost: Number,
    urgency: { type: String, default: 'High' }
  }],
  status: { type: String, enum: ['PENDING_APPROVAL', 'APPROVED', 'PO_CREATED', 'REJECTED'], default: 'PENDING_APPROVAL' },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

export const PurchaseRequest = mongoose.model('PurchaseRequest', prSchema);

// Vendor Purchase Order
const poSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true }, // VPO-2026-001
  purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseRequest' },
  vendorName: { type: String, required: true },
  vendorEmail: { type: String },
  vendorPhone: { type: String },
  vendorGstin: { type: String },
  orderDate: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  items: [{
    itemCode: String,
    itemName: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    taxRate: Number,
    totalAmount: Number
  }],
  grandTotal: { type: Number, required: true },
  paymentTerms: { type: String, default: '30 days net from GRN date' },
  status: { type: String, enum: ['ORDERED', 'DELIVERED', 'PARTIALLY_RECEIVED', 'CANCELLED'], default: 'ORDERED' }
}, { timestamps: true });

export const VendorPO = mongoose.model('VendorPO', poSchema);

// GRN (Goods Received Note)
const grnSchema = new mongoose.Schema({
  grnNumber: { type: String, required: true, unique: true }, // GRN-2026-001
  vendorPO: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorPO' },
  vendorPoNumber: { type: String, required: true },
  vendorName: { type: String, required: true },
  receivedDate: { type: Date, default: Date.now },
  deliveryChallanNumber: { type: String },
  warehouse: { type: String, default: 'Main Store - Chennai' },
  items: [{
    itemCode: String,
    itemName: String,
    orderedQty: Number,
    receivedQty: Number,
    acceptedQty: Number,
    rejectedQty: Number,
    damagedQty: Number,
    unit: String
  }],
  remarks: { type: String },
  inspectedBy: { type: String, default: 'Store Inspector' }
}, { timestamps: true });

export const GRN = mongoose.model('GRN', grnSchema);
