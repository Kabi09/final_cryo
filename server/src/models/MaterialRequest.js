import mongoose from 'mongoose';

const materialItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  requiredQty: { type: Number, required: true },
  availableQty: { type: Number, default: 0 },
  reservedQty: { type: Number, default: 0 },
  shortageQty: { type: Number, default: 0 },
  issuedQty: { type: Number, default: 0 },
  unit: { type: String, default: 'Nos' },
  scrapWastage: { type: Number, default: 0 }
});

const materialRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, required: true, unique: true }, // MR-2026-0001
  productionOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
  productionNumber: { type: String, required: true },
  department: { type: String, default: 'Production Assembly' },
  items: [materialItemSchema],
  
  // 1. Department Approval
  departmentApproved: { type: Boolean, default: false },
  departmentApprovedBy: { type: String },
  departmentApprovedAt: { type: Date },

  // 2. Stock Available Assessment (YES / NO)
  stockAvailable: { type: Boolean, default: false },
  shortagePresent: { type: Boolean, default: false },

  // 3. Procurement Pipeline (Branch NO)
  purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseRequest' },
  purchaseRequestNumber: { type: String },
  vendorPO: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorPO' },
  vendorPoNumber: { type: String },
  grn: { type: mongoose.Schema.Types.ObjectId, ref: 'GRN' },
  grnNumber: { type: String },

  // 4. Stores Inward & Material Available
  storesInwarded: { type: Boolean, default: false },
  storesInwardedAt: { type: Date },
  materialAvailable: { type: Boolean, default: false },

  // 5. Material Issue & Department Use
  issuedBy: { type: String },
  issuedAt: { type: Date },

  // Classical Workflow Stage tracking (Matches user's diagram)
  workflowStage: { 
    type: String, 
    enum: [
      'MATERIAL_REQUEST',
      'DEPARTMENT_APPROVED',
      'PURCHASE_REQUEST',
      'PURCHASE_APPROVED',
      'PO_ISSUED',
      'GRN_RECEIVED',
      'STORES_IN',
      'MATERIAL_AVAILABLE',
      'MATERIAL_ISSUED'
    ], 
    default: 'MATERIAL_REQUEST' 
  },

  status: { 
    type: String, 
    enum: [
      'PENDING_DEPT_APPROVAL',
      'PENDING_APPROVAL',
      'DEPT_APPROVED',
      'APPROVED',
      'STOCK_CHECKED',
      'SHORTAGE_PR_RAISED',
      'PO_PLACED',
      'GRN_INWARDED',
      'MATERIAL_READY',
      'PARTIALLY_ISSUED',
      'FULLY_ISSUED',
      'CANCELLED'
    ], 
    default: 'PENDING_DEPT_APPROVAL' 
  }
}, { timestamps: true });

export const MaterialRequest = mongoose.model('MaterialRequest', materialRequestSchema);
