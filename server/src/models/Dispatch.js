import mongoose from 'mongoose';

// Final Tax Invoice
const taxInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true }, // INV-2026-001
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  soNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoiceDate: { type: Date, default: Date.now },
  items: [{
    productCode: String,
    description: String,
    serialNumber: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    taxableAmount: Number,
    taxAmount: Number,
    totalAmount: Number
  }],
  taxableAmount: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  paymentTerms: { type: String, default: 'Net 30' },
  status: { type: String, enum: ['PAID', 'PENDING', 'CANCELLED'], default: 'PAID' }
}, { timestamps: true });

export const TaxInvoice = mongoose.model('TaxInvoice', taxInvoiceSchema);

// Shipment / Logistics Tracking
const shipmentSchema = new mongoose.Schema({
  shipmentNumber: { type: String, required: true, unique: true }, // SHIP-2026-001
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  soNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  serialNumbers: [{ type: String }],
  
  carrierType: { type: String, enum: ['COURIER', 'DEDICATED_TRANSPORT', 'LOGISTICS_PARTNER'], default: 'LOGISTICS_PARTNER' },
  carrierName: { type: String, required: true }, // e.g. VRL Logistics / BlueDart / SafeExpress
  bookingNumber: { type: String, required: true },
  trackingNumber: { type: String, required: true },
  trackingUrl: { type: String, required: true }, // Actual carrier URL e.g. https://www.vrllogistics.com/track?lr=...
  
  dispatchDate: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  
  status: { 
    type: String, 
    enum: [
      'BOOKED', 
      'PICKED_UP', 
      'IN_TRANSIT', 
      'OUT_FOR_DELIVERY', 
      'DELIVERED', 
      'FAILED_DELIVERY', 
      'RETURNED'
    ], 
    default: 'IN_TRANSIT' 
  },
  
  podReceived: { type: Boolean, default: false },
  podReceiverName: { type: String },
  podDate: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

export const Shipment = mongoose.model('Shipment', shipmentSchema);
