import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  itemCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  itemName: { type: String, required: true, trim: true },
  materialType: { 
    type: String, 
    required: true, 
    enum: [
      'RAW_MATERIAL', 
      'SPARE_PART', 
      'CONSUMABLE', 
      'ELECTRICAL', 
      'MECHANICAL', 
      'REFRIGERATION', 
      'CHEMICAL', 
      'SUB_ASSEMBLY', 
      'FINISHED_GOODS'
    ],
    default: 'RAW_MATERIAL'
  },
  category: { type: String, default: 'RAW_MATERIAL' }, // backward compatibility
  unit: { type: String, default: 'Nos' },
  purchasePrice: { type: Number, default: 0 },
  unitCost: { type: Number, default: 0 }, // mapped to purchasePrice
  sellingPrice: { type: Number, default: 0 }, // Selling / Issue Price where applicable
  
  currentStock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 5 },
  reorderPoint: { type: Number, default: 10 },
  
  warehouse: { type: String, default: 'Main Plant - Chennai' },
  binLocation: { type: String, default: 'A-01' },
  supplier: { type: String, default: 'Cryo Approved Vendor' },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-sync category with materialType and unitCost with purchasePrice
inventorySchema.pre('save', function (next) {
  if (this.materialType) {
    this.category = this.materialType;
  }
  if (this.purchasePrice && !this.unitCost) {
    this.unitCost = this.purchasePrice;
  } else if (this.unitCost && !this.purchasePrice) {
    this.purchasePrice = this.unitCost;
  }
  next();
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
    enum: [
      'STOCK_IN', 
      'STOCK_OUT', 
      'MATERIAL_ISSUE', 
      'MATERIAL_RETURN', 
      'RESERVE', 
      'UNRESERVE', 
      'ADJUSTMENT', 
      'GRN_RECEIPT'
    ]
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  referenceType: { 
    type: String, 
    enum: ['PRODUCTION', 'PO', 'GRN', 'SERVICE', 'SALES_ORDER', 'MANUAL'], 
    default: 'MANUAL' 
  },
  referenceNumber: { type: String, default: '' },
  remarks: { type: String, default: '' },
  performedBy: { type: String, default: 'System' }
}, { timestamps: true });

export const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);
