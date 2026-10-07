import { ProductionOrder } from '../models/ProductionOrder.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { MaterialRequest } from '../models/MaterialRequest.js';
import { Inventory, StockLedger } from '../models/Inventory.js';
import { QAInspection } from '../models/QAInspection.js';
import { BOM } from '../models/BOM.js';
import { Product } from '../models/Product.js';
import { getNextSequence } from '../services/numberingService.js';
import { logAudit } from '../middleware/audit.js';

export const listProductionOrders = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const orders = await ProductionOrder.find(query).populate('product').populate('bom').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductionOrderById = async (req, res) => {
  try {
    const order = await ProductionOrder.findById(req.params.id).populate('product').populate('bom').populate('salesOrder');
    if (!order) return res.status(404).json({ message: 'Production order not found' });

    const materialRequests = await MaterialRequest.find({ productionOrder: order._id }).sort({ createdAt: -1 });

    res.json({ order, materialRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStageStatus = async (req, res) => {
  try {
    const { stageName, status, remarks, engineer } = req.body;
    const order = await ProductionOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Production order not found' });

    const stage = order.stages.find(s => s.name === stageName);
    if (!stage) return res.status(404).json({ message: `Stage ${stageName} not found` });

    stage.status = status;
    if (status === 'IN_PROGRESS' && !stage.startedAt) stage.startedAt = new Date();
    if (status === 'COMPLETED') stage.completedAt = new Date();
    if (remarks) stage.remarks = remarks;
    if (engineer) stage.assignedEngineer = engineer;

    // Check overall status
    const allCompleted = order.stages.every(s => s.status === 'COMPLETED');
    if (allCompleted) {
      order.status = 'COMPLETED';
      order.actualEndDate = new Date();
    } else {
      order.status = 'IN_PROGRESS';
    }

    await order.save();

    await logAudit({
      action: 'PRODUCTION_STAGE_UPDATED',
      entityType: 'ProductionOrder',
      entityId: order._id,
      entityNumber: order.productionNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Stage '${stageName}' updated to ${status} for ${order.productionNumber}`
    });

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Material Planning and Check against Inventory
export const planMaterials = async (req, res) => {
  try {
    const order = await ProductionOrder.findById(req.params.id).populate('bom');
    if (!order) return res.status(404).json({ message: 'Production order not found' });

    let product = null;
    if (order.product) {
      product = await Product.findById(order.product).populate('requiredMaterials.material');
    }

    let bom = order.bom;
    if (!bom && order.product) {
      bom = await BOM.findOne({ product: order.product, status: 'APPROVED' });
      if (bom) {
        order.bom = bom._id;
        order.bomVersion = bom.version;
        await order.save();
      }
    }

    // Determine material requirement source: Product requiredMaterials or BOM items
    let materialSources = [];
    if (product && product.requiredMaterials && product.requiredMaterials.length > 0) {
      materialSources = product.requiredMaterials.map(rm => ({
        materialCode: rm.materialCode,
        materialName: rm.materialName,
        quantity: rm.quantity || 1,
        unit: rm.unit || 'Nos',
        scrapPercentage: 0,
        isRequired: rm.isRequired,
        alternativeMaterial: rm.alternativeMaterial
      }));
    } else if (bom && bom.items && bom.items.length > 0) {
      materialSources = bom.items.map(bi => ({
        materialCode: bi.materialCode,
        materialName: bi.materialName,
        quantity: bi.quantity || 1,
        unit: bi.unit || 'Nos',
        scrapPercentage: bi.scrapPercentage || 0,
        isRequired: true
      }));
    }

    if (materialSources.length === 0) {
      return res.status(400).json({ 
        message: 'No material requirements configured. Please map inventory materials in the Product Master or assign an approved BOM.' 
      });
    }

    const itemsPlanning = [];
    let shortageFound = false;

    for (const mat of materialSources) {
      const inv = await Inventory.findOne({ itemCode: mat.materialCode });
      const currentStock = inv ? inv.currentStock : 0;
      const reservedStock = inv ? inv.reservedStock : 0;
      const available = inv ? Math.max(0, currentStock - reservedStock) : 0;
      const required = (mat.quantity || 1) * order.quantity;
      const shortage = Math.max(0, required - available);

      if (shortage > 0) shortageFound = true;

      const coverageStatus = shortage === 0 ? 'FULL' : (available > 0 ? 'PARTIAL' : 'NONE');

      itemsPlanning.push({
        itemCode: mat.materialCode,
        itemName: mat.materialName,
        requiredQty: required,
        availableQty: available,
        currentStock,
        reservedQty: reservedStock,
        shortageQty: shortage,
        unit: mat.unit || 'Nos',
        coverageStatus,
        isRequired: mat.isRequired !== false,
        scrapWastage: mat.scrapPercentage || 0
      });
    }

    const mrNumber = await getNextSequence('MR', 4);
    const materialRequest = await MaterialRequest.create({
      requestNumber: mrNumber,
      productionOrder: order._id,
      productionNumber: order.productionNumber,
      department: 'Production Assembly',
      items: itemsPlanning,
      status: shortageFound ? 'PENDING_APPROVAL' : 'APPROVED',
      shortagePresent: shortageFound,
      approvedBy: shortageFound ? undefined : req.user.name,
      approvedAt: shortageFound ? undefined : new Date()
    });

    order.materialShortage = shortageFound;
    order.status = shortageFound ? 'MATERIAL_PLANNING' : 'MATERIAL_REQUESTED';
    await order.save();

    await logAudit({
      action: 'MATERIAL_PLANNING_COMPLETED',
      entityType: 'ProductionOrder',
      entityId: order._id,
      entityNumber: order.productionNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Material planning completed for ${order.productionNumber}. Shortage present: ${shortageFound}`
    });

    res.json({
      order,
      materialRequest,
      shortagePresent: shortageFound,
      itemsPlanning
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Material Issue by Store
export const issueMaterials = async (req, res) => {
  try {
    const { requestId } = req.body;
    const mr = await MaterialRequest.findById(requestId);
    if (!mr) return res.status(404).json({ message: 'Material request not found' });

    for (const item of mr.items) {
      const inv = await Inventory.findOne({ itemCode: item.itemCode });
      if (inv) {
        const issueQty = Math.min(inv.currentStock, item.requiredQty);
        const prev = inv.currentStock;
        inv.currentStock -= issueQty;
        await inv.save();

        item.issuedQty = issueQty;

        await StockLedger.create({
          itemCode: inv.itemCode,
          itemName: inv.itemName,
          transactionType: 'MATERIAL_ISSUE',
          quantity: issueQty,
          previousStock: prev,
          newStock: inv.currentStock,
          referenceType: 'PRODUCTION',
          referenceNumber: mr.productionNumber,
          remarks: `Issued to Production Order ${mr.productionNumber}`,
          performedBy: req.user.name
        });
      }
    }

    mr.status = 'FULLY_ISSUED';
    mr.issuedBy = req.user.name;
    mr.issuedAt = new Date();
    await mr.save();

    const order = await ProductionOrder.findById(mr.productionOrder);
    if (order) {
      order.status = 'MATERIAL_ISSUED';
      await order.save();
    }

    await logAudit({
      action: 'MATERIAL_ISSUED',
      entityType: 'MaterialRequest',
      entityId: mr._id,
      entityNumber: mr.requestNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Store issued materials for ${mr.productionNumber}`
    });

    res.json({ message: 'Materials issued successfully', materialRequest: mr });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Complete Production Order and Trigger QA
export const completeProduction = async (req, res) => {
  try {
    const order = await ProductionOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Production order not found' });

    order.status = 'COMPLETED';
    order.actualEndDate = new Date();
    order.stages.forEach(s => s.status = 'COMPLETED');
    await order.save();

    // Update Sales Order stage
    const salesOrder = await SalesOrder.findById(order.salesOrder);
    if (salesOrder) {
      salesOrder.productionStatus = 'COMPLETED';
      salesOrder.currentStage = 'PRODUCTION_COMPLETED';
      salesOrder.qaStatus = 'PENDING';
      await salesOrder.save();
    }

    // Automatically initialize QA inspection record
    const existingQA = await QAInspection.findOne({ productionOrder: order._id });
    let qa = existingQA;
    if (!existingQA) {
      const qaNumber = await getNextSequence('QA', 4);
      qa = await QAInspection.create({
        qaNumber,
        productionOrder: order._id,
        productionNumber: order.productionNumber,
        salesOrder: order.salesOrder,
        soNumber: order.soNumber,
        product: order.product,
        productName: order.productName,
        model: order.model,
        parameters: [
          { parameter: 'Cascade Refrigeration Pull-down', specification: 'Reach -80.0°C within 180 mins', actualReading: '-81.2°C', result: 'PASS' },
          { parameter: 'Vacuum Insulation Leak Rate', specification: '< 0.005 mbar/sec', actualReading: '0.0012 mbar/sec', result: 'PASS' },
          { parameter: 'High-Potential (Hi-Pot) Insulation Test', specification: '1500V AC dielectric withstand', actualReading: 'Leakage 0.35mA (PASS)', result: 'PASS' },
          { parameter: 'Acoustic Sound Level', specification: '< 52 dBA at 1 meter', actualReading: '48.5 dBA', result: 'PASS' },
          { parameter: 'Backup Battery & Alarm Interface', specification: 'Audio-visual alert upon power loss', actualReading: 'Triggered within 2 sec', result: 'PASS' }
        ],
        overallResult: 'PASS',
        inspectorName: req.user.name,
        inspectedAt: new Date()
      });
    }

    await logAudit({
      action: 'PRODUCTION_COMPLETED',
      entityType: 'ProductionOrder',
      entityId: order._id,
      entityNumber: order.productionNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Production completed for ${order.productionNumber}. Triggered QA Inspection: ${qa?.qaNumber}`
    });

    res.json({
      message: 'Production order completed successfully. Moved to Quality Assurance.',
      order,
      qaInspection: qa
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
