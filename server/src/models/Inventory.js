import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  itemCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  itemName: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['RAW_MATERIAL', 'SUB_ASSEMBLY', 'FINISHED_GOODS', 'SPARE_PART', 'CONSUMABLE'],
    default: 'RAW_MATERIAL'
  },
  unit: { type: String, default: 'Nos' },
  warehouse: { type: String, default: 'Main Plant - Chennai' },
  binLocation: { type: String, default: 'A-01' },
  currentStock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 5 },
  reorderPoint: { type: Number, default: 10 },
  unitCost: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

inventorySchema.virtual('availableStock').get(function () {
  return Math.max(0, (this.currentStock || 0) - (this.reservedStock || 0));
});

export const Inventory = mongoose.model('Inventory', inventorySchema);

const stockLedgerSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  transactionType: { 
    type: String, 
    required: true,
    enum: ['STOCK_IN', 'STOCK_OUT', 'MATERIAL_ISSUE', 'MATERIAL_RETURN', 'RESERVE', 'UNRESERVE', 'ADJUSTMENT', 'GRN_RECEIPT']
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  referenceType: { type: String, enum: ['PRODUCTION', 'PO', 'GRN', 'SERVICE', 'SALES_ORDER', 'MANUAL'], default: 'MANUAL' },
  referenceNumber: { type: String, default: '' },
  remarks: { type: String, default: '' },
  performedBy: { type: String, default: 'System' }
}, { timestamps: true });

export const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);
