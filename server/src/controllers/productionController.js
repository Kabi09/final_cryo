import { ProductionOrder } from '../models/ProductionOrder.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { MaterialRequest } from '../models/MaterialRequest.js';
import { PurchaseRequest, VendorPO, GRN } from '../models/Procurement.js';
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

// Assign or Switch BOM for a Production Order
export const assignBOM = async (req, res) => {
  try {
    const { bomId } = req.body;
    const order = await ProductionOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Production order not found' });

    const bom = await BOM.findById(bomId);
    if (!bom) return res.status(404).json({ message: 'BOM not found' });

    order.bom = bom._id;
    order.bomVersion = bom.version;
    await order.save();

    await logAudit({
      action: 'BOM_ASSIGNED',
      entityType: 'ProductionOrder',
      entityId: order._id,
      entityNumber: order.productionNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Assigned BOM ${bom.bomNumber} (${bom.version}) to order ${order.productionNumber}`
    });

    res.json({ message: `BOM ${bom.bomNumber} (${bom.version}) assigned successfully!`, order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Material Planning and Check against Inventory: Production Order -> BOM -> Material Requirement -> Stock Check
export const planMaterials = async (req, res) => {
  try {
    const order = await ProductionOrder.findById(req.params.id).populate('bom');
    if (!order) return res.status(404).json({ message: 'Production order not found' });

    let product = null;
    // 1. Try resolving Product by order.model or order.productCode
    if (order.model) {
      product = await Product.findOne({
        $or: [
          { model: order.model },
          { productCode: order.model }
        ]
      }).populate('requiredMaterials.material');
    }
    // 2. Try resolving Product by order.product reference
    if (!product && order.product) {
      product = await Product.findById(order.product).populate('requiredMaterials.material');
    }
    // 3. Fallback: match by product name
    if (!product && order.productName) {
      product = await Product.findOne({
        $or: [
          { name: new RegExp(order.productName, 'i') },
          { model: new RegExp(order.productName, 'i') }
        ]
      }).populate('requiredMaterials.material');
    }

    // Sync order's product reference if resolved
    if (product) {
      if (!order.product || String(order.product) !== String(product._id)) {
        order.product = product._id;
        order.productName = product.name;
        order.model = product.model;
        await order.save();
      }
    }

    // 4. Resolve BOM: Check order.bom, or find approved BOM for product
    let bom = order.bom ? await BOM.findById(order.bom) : null;
    if (!bom && product) {
      bom = await BOM.findOne({ product: product._id, status: 'APPROVED' }) || await BOM.findOne({ product: product._id });
      if (bom) {
        order.bom = bom._id;
        order.bomVersion = bom.version;
        await order.save();
      }
    }

    // Determine material requirement source: Prioritize BOM items, fallback to Product requiredMaterials
    let materialSources = [];
    if (bom && bom.items && bom.items.length > 0) {
      materialSources = bom.items.map(bi => ({
        materialCode: bi.materialCode,
        materialName: bi.materialName,
        quantity: bi.quantity || 1,
        unit: bi.unit || 'Nos',
        scrapPercentage: bi.scrapPercentage || 0,
        isRequired: true
      }));
    } else if (product && product.requiredMaterials && product.requiredMaterials.length > 0) {
      materialSources = product.requiredMaterials.map(rm => ({
        materialCode: rm.materialCode,
        materialName: rm.materialName,
        quantity: rm.quantity || 1,
        unit: rm.unit || 'Nos',
        scrapPercentage: 0,
        isRequired: rm.isRequired,
        alternativeMaterial: rm.alternativeMaterial
      }));
    }

    if (materialSources.length === 0) {
      return res.status(400).json({ 
        message: 'No material requirements configured. Please assign a Bill of Materials (BOM) or map inventory materials in the Product Master.' 
      });
    }

    // Available BOMs for this product/model
    const availableBOMs = product ? await BOM.find({ product: product._id }) : await BOM.find();

    const itemsPlanning = [];
    let shortageFound = false;

    for (const mat of materialSources) {
      const inv = await Inventory.findOne({ itemCode: mat.materialCode });
      const currentStock = inv ? (inv.currentStock || 0) : 0;
      const reservedStock = inv ? (inv.reservedStock || 0) : 0;
      const available = inv ? Math.max(0, currentStock - reservedStock) : 0;
      const required = (mat.quantity || 1) * (order.quantity || 1);
      const shortage = Math.max(0, required - available);

      if (shortage > 0) shortageFound = true;

      const coverageStatus = shortage === 0 ? 'FULL' : (available > 0 ? 'PARTIAL' : 'NONE');

      itemsPlanning.push({
        itemCode: mat.materialCode,
        itemName: mat.materialName,
        unitQty: mat.quantity || 1,
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

    // Reuse or create MaterialRequest
    let materialRequest = await MaterialRequest.findOne({ productionOrder: order._id });
    if (materialRequest) {
      materialRequest.items = itemsPlanning;
      materialRequest.shortagePresent = shortageFound;
      materialRequest.stockAvailable = !shortageFound;
      materialRequest.departmentApproved = true; // Auto-approved in real-time workflow
      if (!shortageFound) {
        materialRequest.materialAvailable = true;
        materialRequest.workflowStage = 'MATERIAL_AVAILABLE';
        materialRequest.status = 'MATERIAL_READY';
      } else {
        materialRequest.materialAvailable = false;
        materialRequest.workflowStage = 'PURCHASE_REQUEST';
        materialRequest.status = 'SHORTAGE_PR_RAISED';
      }
      await materialRequest.save();
    } else {
      const mrNumber = await getNextSequence('MR', 4);
      materialRequest = await MaterialRequest.create({
        requestNumber: mrNumber,
        productionOrder: order._id,
        productionNumber: order.productionNumber,
        department: 'Production Assembly',
        items: itemsPlanning,
        departmentApproved: true,
        stockAvailable: !shortageFound,
        shortagePresent: shortageFound,
        materialAvailable: !shortageFound,
        workflowStage: !shortageFound ? 'MATERIAL_AVAILABLE' : 'PURCHASE_REQUEST',
        status: !shortageFound ? 'MATERIAL_READY' : 'SHORTAGE_PR_RAISED'
      });
    }

    // Ensure PR is ready for shortage items
    if (shortageFound) {
      let pr = await PurchaseRequest.findOne({ materialRequest: materialRequest._id });
      if (!pr) {
        const prNumber = await getNextSequence('PR', 4);
        const shortageItems = itemsPlanning.filter(i => i.shortageQty > 0);
        pr = await PurchaseRequest.create({
          prNumber,
          materialRequest: materialRequest._id,
          materialRequestNumber: materialRequest.requestNumber,
          requestedBy: req.user.name,
          department: 'Production Assembly',
          items: shortageItems.map(si => ({
            itemCode: si.itemCode,
            itemName: si.itemName,
            quantity: si.shortageQty,
            unit: si.unit,
            estimatedCost: 0,
            urgency: 'High'
          })),
          status: 'PENDING_APPROVAL'
        });
      }
      materialRequest.purchaseRequest = pr._id;
      materialRequest.purchaseRequestNumber = pr.prNumber;
      await materialRequest.save();
    }

    order.materialShortage = shortageFound;
    await order.save();

    await logAudit({
      action: 'MATERIAL_PLANNING_COMPLETED',
      entityType: 'ProductionOrder',
      entityId: order._id,
      entityNumber: order.productionNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Material planning evaluated for ${order.productionNumber}. Shortage: ${shortageFound}`
    });

    // Populate procurement docs if linked
    const populatedMR = await MaterialRequest.findById(materialRequest._id)
      .populate('purchaseRequest')
      .populate('vendorPO')
      .populate('grn');

    res.json({
      order,
      bom: bom ? {
        _id: bom._id,
        bomNumber: bom.bomNumber,
        version: bom.version,
        title: bom.title,
        itemsCount: bom.items?.length || 0,
        items: bom.items
      } : null,
      availableBOMs: availableBOMs.map(b => ({
        _id: b._id,
        bomNumber: b.bomNumber,
        version: b.version,
        title: b.title,
        itemsCount: b.items?.length || 0
      })),
      materialRequest: populatedMR,
      purchaseRequest: populatedMR.purchaseRequest,
      vendorPO: populatedMR.vendorPO,
      grn: populatedMR.grn,
      shortagePresent: shortageFound,
      stockAvailable: !shortageFound,
      itemsPlanning,
      overallCoverage: shortageFound ? (itemsPlanning.some(i => i.availableQty > 0) ? 'PARTIAL' : 'NONE') : 'FULL'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Step 2: Department Approval (Production Manager / Dept Head Approves MR)
export const approveMaterialRequestDept = async (req, res) => {
  try {
    const mr = await MaterialRequest.findById(req.params.id);
    if (!mr) return res.status(404).json({ message: 'Material request not found' });

    mr.departmentApproved = true;
    mr.departmentApprovedBy = req.user.name;
    mr.departmentApprovedAt = new Date();

    // Check Stock Availability Branch
    if (mr.stockAvailable) {
      // Branch YES: Material is available in stores -> Direct to Material Issue
      mr.workflowStage = 'MATERIAL_AVAILABLE';
      mr.status = 'MATERIAL_READY';
      mr.materialAvailable = true;
    } else {
      // Branch NO: Stock not available -> Purchase Request (PR)
      mr.workflowStage = 'PURCHASE_REQUEST';
      mr.status = 'SHORTAGE_PR_RAISED';

      // Auto-create Purchase Request if not present
      let pr = await PurchaseRequest.findOne({ materialRequest: mr._id });
      if (!pr) {
        const prNumber = await getNextSequence('PR', 4);
        const shortageItems = mr.items.filter(i => i.shortageQty > 0);
        pr = await PurchaseRequest.create({
          prNumber,
          materialRequest: mr._id,
          materialRequestNumber: mr.requestNumber,
          requestedBy: req.user.name,
          department: mr.department || 'Production',
          items: shortageItems.map(si => ({
            itemCode: si.itemCode,
            itemName: si.itemName,
            quantity: si.shortageQty,
            unit: si.unit,
            estimatedCost: 0,
            urgency: 'High'
          })),
          status: 'PENDING_APPROVAL'
        });
      }
      mr.purchaseRequest = pr._id;
      mr.purchaseRequestNumber = pr.prNumber;
    }

    await mr.save();

    await logAudit({
      action: 'MATERIAL_REQUEST_DEPT_APPROVED',
      entityType: 'MaterialRequest',
      entityId: mr._id,
      entityNumber: mr.requestNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Department approved Material Request ${mr.requestNumber}. Stock Available: ${mr.stockAvailable ? 'YES' : 'NO'}`
    });

    const populatedMR = await MaterialRequest.findById(mr._id).populate('purchaseRequest').populate('vendorPO').populate('grn');
    res.json({ message: 'Material Request approved by department head', materialRequest: populatedMR });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Steps 4-9: Advance Procurement Steps (Purchase Approval -> Vendor PO -> Supplier -> GRN / MRN -> Stores In)
export const advanceProcurementStep = async (req, res) => {
  try {
    const { action } = req.body; // 'APPROVE_PR', 'ISSUE_PO', 'PROCESS_GRN', 'AUTO_COMPLETE_CHAIN'
    const mr = await MaterialRequest.findById(req.params.id);
    if (!mr) return res.status(404).json({ message: 'Material request not found' });

    let pr = mr.purchaseRequest ? await PurchaseRequest.findById(mr.purchaseRequest) : await PurchaseRequest.findOne({ materialRequest: mr._id });
    const shortageItems = mr.items.filter(i => i.shortageQty > 0);

    // Ensure PR exists
    if (!pr) {
      const prNumber = await getNextSequence('PR', 4);
      pr = await PurchaseRequest.create({
        prNumber,
        materialRequest: mr._id,
        materialRequestNumber: mr.requestNumber,
        requestedBy: req.user.name,
        department: mr.department || 'Production',
        items: shortageItems.map(si => ({
          itemCode: si.itemCode,
          itemName: si.itemName,
          quantity: si.shortageQty,
          unit: si.unit,
          estimatedCost: 0,
          urgency: 'High'
        })),
        status: 'PENDING_APPROVAL'
      });
      mr.purchaseRequest = pr._id;
      mr.purchaseRequestNumber = pr.prNumber;
    }

    // 1. APPROVE PR
    if (action === 'APPROVE_PR' || action === 'AUTO_COMPLETE_CHAIN') {
      pr.status = 'APPROVED';
      pr.approvedBy = req.user.name;
      pr.approvedAt = new Date();
      await pr.save();
      mr.workflowStage = 'PURCHASE_APPROVED';
    }

    // 2. ISSUE VENDOR PO
    let vpo = mr.vendorPO ? await VendorPO.findById(mr.vendorPO) : null;
    if (action === 'ISSUE_PO' || action === 'AUTO_COMPLETE_CHAIN') {
      if (!vpo) {
        const poNumber = await getNextSequence('VPO', 4);
        vpo = await VendorPO.create({
          poNumber,
          purchaseRequest: pr._id,
          vendorName: 'Cryo Approved Technical Supplies Ltd',
          vendorEmail: 'procurement@cryovendors.com',
          orderDate: new Date(),
          items: shortageItems.map(si => ({
            itemCode: si.itemCode,
            itemName: si.itemName,
            quantity: si.shortageQty,
            unit: si.unit,
            unitPrice: 1000,
            taxRate: 18,
            totalAmount: si.shortageQty * 1180
          })),
          grandTotal: shortageItems.reduce((acc, si) => acc + (si.shortageQty * 1180), 0),
          status: 'ORDERED'
        });
      }
      pr.status = 'PO_CREATED';
      await pr.save();
      mr.vendorPO = vpo._id;
      mr.vendorPoNumber = vpo.poNumber;
      mr.workflowStage = 'PO_ISSUED';
      mr.status = 'PO_PLACED';
    }

    // 3. PROCESS GRN & STORES IN (Stock credited to inventory)
    if (action === 'PROCESS_GRN' || action === 'AUTO_COMPLETE_CHAIN') {
      if (!vpo) {
        const poNumber = await getNextSequence('VPO', 4);
        vpo = await VendorPO.create({
          poNumber,
          purchaseRequest: pr._id,
          vendorName: 'Cryo Approved Technical Supplies Ltd',
          orderDate: new Date(),
          items: shortageItems.map(si => ({
            itemCode: si.itemCode,
            itemName: si.itemName,
            quantity: si.shortageQty,
            unit: si.unit,
            unitPrice: 1000,
            taxRate: 18,
            totalAmount: si.shortageQty * 1180
          })),
          grandTotal: shortageItems.reduce((acc, si) => acc + (si.shortageQty * 1180), 0),
          status: 'ORDERED'
        });
        mr.vendorPO = vpo._id;
        mr.vendorPoNumber = vpo.poNumber;
      }

      let grn = mr.grn ? await GRN.findById(mr.grn) : null;
      if (!grn) {
        const grnNumber = await getNextSequence('GRN', 4);
        grn = await GRN.create({
          grnNumber,
          vendorPO: vpo._id,
          vendorPoNumber: vpo.poNumber,
          vendorName: vpo.vendorName,
          receivedDate: new Date(),
          deliveryChallanNumber: `DC-INW-${Date.now().toString().slice(-4)}`,
          warehouse: 'Main Store - Chennai',
          items: shortageItems.map(si => ({
            itemCode: si.itemCode,
            itemName: si.itemName,
            orderedQty: si.shortageQty,
            receivedQty: si.shortageQty,
            acceptedQty: si.shortageQty,
            rejectedQty: 0,
            damagedQty: 0,
            unit: si.unit
          })),
          remarks: `Supplier delivered and Stores inwarded for ${mr.productionNumber}`,
          inspectedBy: req.user.name
        });
      }

      // STORES IN: Credit accepted stock to Inventory Master & Ledger
      for (const item of shortageItems) {
        const inv = await Inventory.findOne({ itemCode: item.itemCode });
        if (inv) {
          const prev = inv.currentStock;
          inv.currentStock += item.shortageQty;
          await inv.save();

          await StockLedger.create({
            itemCode: inv.itemCode,
            itemName: inv.itemName,
            transactionType: 'GRN_RECEIPT',
            quantity: item.shortageQty,
            previousStock: prev,
            newStock: inv.currentStock,
            referenceType: 'GRN',
            referenceNumber: grn.grnNumber,
            remarks: `Received via GRN ${grn.grnNumber} into Stores for ${mr.productionNumber}`,
            performedBy: req.user.name
          });

          // Update item in MR
          item.availableQty += item.shortageQty;
          item.shortageQty = 0;
          item.coverageStatus = 'FULL';
        }
      }

      vpo.status = 'DELIVERED';
      await vpo.save();

      mr.grn = grn._id;
      mr.grnNumber = grn.grnNumber;
      mr.storesInwarded = true;
      mr.storesInwardedAt = new Date();
      mr.materialAvailable = true;
      mr.shortagePresent = false;
      mr.stockAvailable = true;
      mr.workflowStage = 'MATERIAL_AVAILABLE';
      mr.status = 'MATERIAL_READY';

      const order = await ProductionOrder.findById(mr.productionOrder);
      if (order) {
        order.materialShortage = false;
        await order.save();
      }
    }

    await mr.save();

    await logAudit({
      action: 'PROCUREMENT_WORKFLOW_STEP_COMPLETED',
      entityType: 'MaterialRequest',
      entityId: mr._id,
      entityNumber: mr.requestNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Advanced procurement step: ${action}. New stage: ${mr.workflowStage}`
    });

    const populatedMR = await MaterialRequest.findById(mr._id).populate('purchaseRequest').populate('vendorPO').populate('grn');
    res.json({
      message: `Procurement workflow advanced: ${mr.workflowStage}`,
      materialRequest: populatedMR,
      purchaseRequest: populatedMR.purchaseRequest,
      vendorPO: populatedMR.vendorPO,
      grn: populatedMR.grn
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Store fulfills shortage: Approves PR, receives stock into stores inventory, records StockLedger
export const fulfillShortageStock = async (req, res) => {
  try {
    const { orderId, requestId } = req.body;
    let mr = null;
    if (requestId) {
      mr = await MaterialRequest.findById(requestId);
    } else if (orderId) {
      mr = await MaterialRequest.findOne({ productionOrder: orderId });
    }
    if (!mr) return res.status(404).json({ message: 'Material request not found' });

    // Use advanceProcurementStep with AUTO_COMPLETE_CHAIN
    req.params = { id: mr._id };
    req.body = { action: 'AUTO_COMPLETE_CHAIN' };
    return advanceProcurementStep(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Material Issue by Store to Assembly Line (Material Issue -> Department Use)
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
        inv.currentStock = Math.max(0, inv.currentStock - issueQty);
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
          remarks: `Issued from Store to Production Line for ${mr.productionNumber}`,
          performedBy: req.user.name
        });
      }
    }

    mr.status = 'FULLY_ISSUED';
    mr.workflowStage = 'MATERIAL_ISSUED';
    mr.issuedBy = req.user.name;
    mr.issuedAt = new Date();
    await mr.save();

    const order = await ProductionOrder.findById(mr.productionOrder);
    if (order) {
      order.status = 'IN_PROGRESS';
      order.materialShortage = false;
      if (order.stages && order.stages.length > 0 && order.stages[0].status === 'PENDING') {
        order.stages[0].status = 'IN_PROGRESS';
        order.stages[0].startedAt = new Date();
      }
      await order.save();
    }

    await logAudit({
      action: 'MATERIAL_ISSUED',
      entityType: 'MaterialRequest',
      entityId: mr._id,
      entityNumber: mr.requestNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Store issued materials to assembly floor for ${mr.productionNumber}`
    });

    res.json({ message: 'Materials issued successfully from store to production line! Department use authorized.', materialRequest: mr });
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
