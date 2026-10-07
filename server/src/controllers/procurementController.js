import { PurchaseRequest, VendorPO, GRN } from '../models/Procurement.js';
import { Inventory, StockLedger } from '../models/Inventory.js';
import { MaterialRequest } from '../models/MaterialRequest.js';
import { getNextSequence } from '../services/numberingService.js';
import { logAudit } from '../middleware/audit.js';

export const listPurchaseRequests = async (req, res) => {
  try {
    const prs = await PurchaseRequest.find().sort({ createdAt: -1 });
    res.json(prs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseRequest = async (req, res) => {
  try {
    const prNumber = await getNextSequence('PR', 4);
    const pr = await PurchaseRequest.create({
      ...req.body,
      prNumber,
      requestedBy: req.user.name
    });

    if (req.body.materialRequestId) {
      await MaterialRequest.findByIdAndUpdate(req.body.materialRequestId, { procurementInitiated: true });
    }

    await logAudit({
      action: 'PURCHASE_REQUEST_CREATED',
      entityType: 'PurchaseRequest',
      entityId: pr._id,
      entityNumber: pr.prNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created Purchase Request ${pr.prNumber}`
    });

    res.status(201).json(pr);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const approvePurchaseRequest = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ message: 'Purchase Request not found' });

    pr.status = 'APPROVED';
    pr.approvedBy = req.user.name;
    pr.approvedAt = new Date();
    await pr.save();

    await logAudit({
      action: 'PURCHASE_REQUEST_APPROVED',
      entityType: 'PurchaseRequest',
      entityId: pr._id,
      entityNumber: pr.prNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Approved Purchase Request ${pr.prNumber}`
    });

    res.json(pr);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listVendorPOs = async (req, res) => {
  try {
    const pos = await VendorPO.find().sort({ createdAt: -1 });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVendorPO = async (req, res) => {
  try {
    const poNumber = await getNextSequence('VPO', 4);
    const po = await VendorPO.create({
      ...req.body,
      poNumber
    });

    if (req.body.purchaseRequestId) {
      await PurchaseRequest.findByIdAndUpdate(req.body.purchaseRequestId, { status: 'PO_CREATED' });
    }

    await logAudit({
      action: 'VENDOR_PO_CREATED',
      entityType: 'VendorPO',
      entityId: po._id,
      entityNumber: po.poNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Issued Vendor Purchase Order ${po.poNumber} to ${po.vendorName} for ₹${po.grandTotal}`
    });

    res.status(201).json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listGRNs = async (req, res) => {
  try {
    const grns = await GRN.find().sort({ createdAt: -1 });
    res.json(grns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Goods Received Note (GRN) & automatically credit store inventory
export const createGRN = async (req, res) => {
  try {
    const { vendorPoId, items, deliveryChallanNumber, remarks } = req.body;
    const vpo = await VendorPO.findById(vendorPoId);
    if (!vpo) return res.status(404).json({ message: 'Vendor Purchase Order not found' });

    const grnNumber = await getNextSequence('GRN', 4);
    const grn = await GRN.create({
      grnNumber,
      vendorPO: vpo._id,
      vendorPoNumber: vpo.poNumber,
      vendorName: vpo.vendorName,
      receivedDate: new Date(),
      deliveryChallanNumber,
      warehouse: 'Main Store - Chennai',
      items,
      remarks,
      inspectedBy: req.user.name
    });

    // Update inventory for accepted stock
    for (const item of items) {
      const acceptedQty = Number(item.acceptedQty) || 0;
      if (acceptedQty > 0) {
        let inv = await Inventory.findOne({ itemCode: item.itemCode });
        if (inv) {
          const prev = inv.currentStock;
          inv.currentStock += acceptedQty;
          await inv.save();

          await StockLedger.create({
            itemCode: inv.itemCode,
            itemName: inv.itemName,
            transactionType: 'GRN_RECEIPT',
            quantity: acceptedQty,
            previousStock: prev,
            newStock: inv.currentStock,
            referenceType: 'GRN',
            referenceNumber: grn.grnNumber,
            remarks: `Received via GRN ${grn.grnNumber} from ${vpo.vendorName}`,
            performedBy: req.user.name
          });
        }
      }
    }

    vpo.status = 'DELIVERED';
    await vpo.save();

    await logAudit({
      action: 'GRN_PROCESSED',
      entityType: 'GRN',
      entityId: grn._id,
      entityNumber: grn.grnNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Goods Received Note ${grn.grnNumber} processed. Inventory updated for ${items.length} materials.`
    });

    res.status(201).json(grn);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
