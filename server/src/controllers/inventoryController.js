import { Inventory, StockLedger } from '../models/Inventory.js';
import { logAudit } from '../middleware/audit.js';

export const listInventory = async (req, res) => {
  try {
    const { search, category, lowStock, warehouse } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (warehouse) query.warehouse = warehouse;

    let items = await Inventory.find(query).sort({ itemName: 1 });

    if (lowStock === 'true') {
      items = items.filter(i => (i.currentStock - i.reservedStock) <= i.reorderPoint);
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    const ledger = await StockLedger.find({ itemCode: item.itemCode }).sort({ createdAt: -1 }).limit(50);

    res.json({ item, ledger });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);

    if (item.currentStock > 0) {
      await StockLedger.create({
        itemCode: item.itemCode,
        itemName: item.itemName,
        transactionType: 'STOCK_IN',
        quantity: item.currentStock,
        previousStock: 0,
        newStock: item.currentStock,
        referenceType: 'MANUAL',
        remarks: 'Initial opening stock',
        performedBy: req.user.name
      });
    }

    await logAudit({
      action: 'INVENTORY_ITEM_CREATED',
      entityType: 'Inventory',
      entityId: item._id,
      entityNumber: item.itemCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created inventory item: ${item.itemName} (${item.itemCode})`
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    await logAudit({
      action: 'INVENTORY_ITEM_UPDATED',
      entityType: 'Inventory',
      entityId: item._id,
      entityNumber: item.itemCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Updated inventory item: ${item.itemName} (${item.itemCode})`
    });

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add stock (Stock In / Receipt)
export const addStock = async (req, res) => {
  try {
    const { quantity, referenceType, referenceNumber, remarks } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: 'Quantity to add must be greater than zero' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    const previousStock = item.currentStock;
    item.currentStock += qty;
    await item.save();

    await StockLedger.create({
      itemCode: item.itemCode,
      itemName: item.itemName,
      transactionType: 'STOCK_IN',
      quantity: qty,
      previousStock,
      newStock: item.currentStock,
      referenceType: referenceType || 'MANUAL',
      referenceNumber: referenceNumber || '',
      remarks: remarks || 'Stock In / Receipt added',
      performedBy: req.user.name
    });

    await logAudit({
      action: 'STOCK_ADDED',
      entityType: 'Inventory',
      entityId: item._id,
      entityNumber: item.itemCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Added ${qty} ${item.unit} to ${item.itemName}. New stock: ${item.currentStock}`
    });

    res.json({
      message: 'Stock successfully added',
      item
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Adjust stock (Correction, scrap, audit reconciliation)
export const adjustStock = async (req, res) => {
  try {
    const { newStock, reason } = req.body;
    const targetStock = Number(newStock);
    if (isNaN(targetStock) || targetStock < 0) {
      return res.status(400).json({ message: 'New stock must be a non-negative number' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    const previousStock = item.currentStock;
    const diff = targetStock - previousStock;
    item.currentStock = targetStock;
    await item.save();

    await StockLedger.create({
      itemCode: item.itemCode,
      itemName: item.itemName,
      transactionType: 'ADJUSTMENT',
      quantity: Math.abs(diff),
      previousStock,
      newStock: item.currentStock,
      referenceType: 'MANUAL',
      remarks: reason || `Manual stock adjustment (${diff >= 0 ? '+' : ''}${diff})`,
      performedBy: req.user.name
    });

    await logAudit({
      action: 'STOCK_ADJUSTED',
      entityType: 'Inventory',
      entityId: item._id,
      entityNumber: item.itemCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Adjusted ${item.itemName} stock from ${previousStock} to ${targetStock}. Reason: ${reason}`
    });

    res.json({
      message: 'Stock adjusted successfully',
      item
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listStockLedger = async (req, res) => {
  try {
    const { itemCode } = req.query;
    const query = itemCode ? { itemCode } : {};
    const ledger = await StockLedger.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
