import { Product } from '../models/Product.js';
import { BOM } from '../models/BOM.js';
import { logAudit } from '../middleware/audit.js';

export const listProducts = async (req, res) => {
  try {
    const { search, category, active } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (active !== undefined) query.active = active === 'true';

    const products = await Product.find(query).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const boms = await BOM.find({ product: product._id }).sort({ version: -1 });

    res.json({ product, boms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    await logAudit({
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product._id,
      entityNumber: product.productCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created product: ${product.name} (${product.model}) with price ₹${product.sellingPrice}`
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    // If not authorized to edit price, protect price fields from regular edits
    const updates = { ...req.body };
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if price is changing
    const isPriceChanging = (
      (updates.sellingPrice !== undefined && updates.sellingPrice !== product.sellingPrice) ||
      (updates.baseCost !== undefined && updates.baseCost !== product.baseCost) ||
      (updates.minSellingPrice !== undefined && updates.minSellingPrice !== product.minSellingPrice)
    );

    if (isPriceChanging) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SALES_MANAGER'];
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Access denied: You do not have permission to alter commercial pricing parameters.' 
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });

    await logAudit({
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: updatedProduct._id,
      entityNumber: updatedProduct.productCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Updated product ${updatedProduct.productCode}`
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProductPrice = async (req, res) => {
  try {
    const { sellingPrice, minSellingPrice, baseCost, taxRate, reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const previousPrices = {
      sellingPrice: product.sellingPrice,
      minSellingPrice: product.minSellingPrice,
      baseCost: product.baseCost,
      taxRate: product.taxRate
    };

    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (minSellingPrice !== undefined) product.minSellingPrice = Number(minSellingPrice);
    if (baseCost !== undefined) product.baseCost = Number(baseCost);
    if (taxRate !== undefined) product.taxRate = Number(taxRate);

    await product.save();

    await logAudit({
      action: 'PRODUCT_PRICE_UPDATED',
      entityType: 'Product',
      entityId: product._id,
      entityNumber: product.productCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Price updated for ${product.name} (Code: ${product.productCode}). Reason: ${reason || 'Commercial Revision'}`,
      previousState: previousPrices,
      newState: {
        sellingPrice: product.sellingPrice,
        minSellingPrice: product.minSellingPrice,
        baseCost: product.baseCost,
        taxRate: product.taxRate
      }
    });

    res.json({
      message: 'Product price updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
