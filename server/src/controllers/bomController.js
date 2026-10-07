import { BOM } from '../models/BOM.js';
import { Product } from '../models/Product.js';
import { getNextSequence } from '../services/numberingService.js';
import { logAudit } from '../middleware/audit.js';

export const listBOMs = async (req, res) => {
  try {
    const { productId } = req.query;
    const query = productId ? { product: productId } : {};
    const boms = await BOM.find(query).populate('product', 'name productCode model').sort({ createdAt: -1 });
    res.json(boms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBOMById = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id).populate('product');
    if (!bom) return res.status(404).json({ message: 'BOM not found' });
    res.json(bom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBOM = async (req, res) => {
  try {
    const { product: productId, title, items, version = 'V1' } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const bomNumber = await getNextSequence('BOM', 4);
    const totalEstimatedCost = (items || []).reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitCost || 0)), 0);

    const bom = await BOM.create({
      bomNumber,
      product: product._id,
      version,
      title: title || `${product.name} - Bill of Materials`,
      items,
      totalEstimatedCost,
      status: 'APPROVED',
      approvedBy: req.user._id,
      approvedAt: new Date()
    });

    await logAudit({
      action: 'BOM_CREATED',
      entityType: 'BOM',
      entityId: bom._id,
      entityNumber: bom.bomNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created BOM ${bom.bomNumber} (Version ${bom.version}) for ${product.name}`
    });

    res.status(201).json(bom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createBOMRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, title, versionNotes } = req.body;
    
    const existingBOM = await BOM.findById(id);
    if (!existingBOM) return res.status(404).json({ message: 'Base BOM not found' });

    // Calculate new version string
    const currentVersionNum = parseInt(existingBOM.version.replace('V', ''), 10) || 1;
    const nextVersion = `V${currentVersionNum + 1}`;

    const bomNumber = `${existingBOM.bomNumber.split('-R')[0]}-${nextVersion}`;
    const totalEstimatedCost = (items || []).reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitCost || 0)), 0);

    const newBOM = await BOM.create({
      bomNumber,
      product: existingBOM.product,
      version: nextVersion,
      title: title || `${existingBOM.title} (${nextVersion})`,
      items: items || existingBOM.items,
      totalEstimatedCost,
      status: 'APPROVED',
      approvedBy: req.user._id,
      approvedAt: new Date()
    });

    await logAudit({
      action: 'BOM_REVISED',
      entityType: 'BOM',
      entityId: newBOM._id,
      entityNumber: newBOM.bomNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created BOM revision ${nextVersion} from ${existingBOM.version}. Notes: ${versionNotes || 'Engineering change'}`
    });

    res.status(201).json(newBOM);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
