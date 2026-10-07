import mongoose from 'mongoose';
import crypto from 'crypto';

const salesOrderSchema = new mongoose.Schema({
  soNumber: { type: String, required: true, unique: true }, // SO-2026-0042
  orderDate: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  quotationNumber: { type: String, required: true },
  proformaInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'ProformaInvoice' },
  customerPO: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerPO' },
  customerPONumber: { type: String },

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productCode: String,
    description: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    discount: Number,
    taxableAmount: Number,
    taxAmount: Number,
    totalAmount: Number
  }],

  totalTaxable: { type: Number, required: true },
  totalTax: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  advanceRequired: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },

  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'ADVANCE_VERIFIED', 'FULLY_PAID'], 
    default: 'PENDING' 
  },
  
  productionStatus: { 
    type: String, 
    enum: ['PENDING_RELEASE', 'RELEASED', 'IN_PROGRESS', 'COMPLETED'], 
    default: 'PENDING_RELEASE' 
  },

  qaStatus: { 
    type: String, 
    enum: ['PENDING', 'PASSED', 'FAILED'], 
    default: 'PENDING' 
  },

  dispatchStatus: { 
    type: String, 
    enum: ['PENDING', 'READY_FOR_DISPATCH', 'PACKED', 'INVOICED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'], 
    default: 'PENDING' 
  },

  installationStatus: { 
    type: String, 
    enum: ['PENDING', 'SCHEDULED', 'COMPLETED', 'NOT_REQUIRED'], 
    default: 'PENDING' 
  },

  warrantyStatus: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'EXPIRED'], 
    default: 'PENDING' 
  },

  currentStage: { 
    type: String, 
    enum: [
      'ORDER_CONFIRMED', 
      'PAYMENT_VERIFIED', 
      'PRODUCTION_STARTED', 
      'PRODUCTION_COMPLETED', 
      'QA_PASSED', 
      'PACKED_INVOICED', 
      'DISPATCHED', 
      'DELIVERED', 
      'INSTALLED', 
      'WARRANTY_ACTIVE'
    ], 
    default: 'ORDER_CONFIRMED' 
  },

  publicTrackingToken: { 
    type: String, 
    unique: true, 
    default: () => crypto.randomBytes(8).toString('hex').toUpperCase() 
  },

  deliveryAddress: { type: String },
  deliveryDateTarget: { type: Date }
}, { timestamps: true });

export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
