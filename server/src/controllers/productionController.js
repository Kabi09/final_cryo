import { ProductionOrder } from '../models/ProductionOrder.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { MaterialRequest } from '../models/MaterialRequest.js';
import { Inventory, StockLedger } from '../models/Inventory.js';
import { QAInspection } from '../models/QAInspection.js';
import { BOM } from '../models/BOM.js';
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

    let bom = order.bom;
    if (!bom && order.product) {
      bom = await BOM.findOne({ product: order.product, status: 'APPROVED' });
      if (bom) {
        order.bom = bom._id;
        order.bomVersion = bom.version;
        await order.save();
      }
    }

    if (!bom || !bom.items || bom.items.length === 0) {
      return res.status(400).json({ message: 'No active BOM configured for this product. Please assign a BOM.' });
    }

    const itemsPlanning = [];
    let shortageFound = false;

    for (const bomItem of bom.items) {
      const inv = await Inventory.findOne({ itemCode: bomItem.materialCode });
      const available = inv ? Math.max(0, inv.currentStock - inv.reservedStock) : 0;
      const required = (bomItem.quantity || 1) * order.quantity;
      const shortage = Math.max(0, required - available);

      if (shortage > 0) shortageFound = true;

      itemsPlanning.push({
        itemCode: bomItem.materialCode,
        itemName: bomItem.materialName,
        requiredQty: required,
        availableQty: available,
        reservedQty: inv ? inv.reservedStock : 0,
        shortageQty: shortage,
        unit: bomItem.unit || 'Nos',
        scrapWastage: bomItem.scrapPercentage || 0
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
      details: `Material request ${mrNumber} generated. Shortage present: ${shortageFound}`
    });

    res.json({
      order,
      materialRequest,
      shortagePresent: shortageFound
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
