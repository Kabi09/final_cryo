import { QAInspection, SerialNumber } from '../models/QAInspection.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { Inventory, StockLedger } from '../models/Inventory.js';
import { getNextSequence } from '../services/numberingService.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

export const listQA = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { overallResult: status } : {};
    const inspections = await QAInspection.find(query).sort({ createdAt: -1 });
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQAById = async (req, res) => {
  try {
    const qa = await QAInspection.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: 'QA Inspection record not found' });
    res.json(qa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitQAResult = async (req, res) => {
  try {
    const { overallResult, parameters, rectificationNotes } = req.body;
    const qa = await QAInspection.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: 'QA record not found' });

    if (parameters) qa.parameters = parameters;
    qa.overallResult = overallResult;
    qa.inspectorName = req.user.name;
    qa.inspectedAt = new Date();

    const order = await SalesOrder.findById(qa.salesOrder);

    if (overallResult === 'PASS') {
      qa.certificateNumber = await getNextSequence('QC-CERT', 4);
      qa.certificateIssuedAt = new Date();

      // Assign Serial Number
      const serialNumberStr = await getNextSequence('CRYO-ULT', 4);
      qa.assignedSerialNumber = serialNumberStr;

      const serialRecord = await SerialNumber.create({
        serialNumber: serialNumberStr,
        product: qa.product,
        productName: qa.productName,
        model: qa.model,
        salesOrder: qa.salesOrder,
        soNumber: qa.soNumber,
        customer: order?.customer,
        qaInspection: qa._id,
        manufactureDate: new Date(),
        status: 'IN_STOCK',
        location: 'Finished Goods Bay - Unit 1'
      });

      // Update Finished Goods stock
      let finishedGoodsInv = await Inventory.findOne({ itemCode: qa.model });
      if (finishedGoodsInv) {
        const prev = finishedGoodsInv.currentStock;
        finishedGoodsInv.currentStock += 1;
        await finishedGoodsInv.save();

        await StockLedger.create({
          itemCode: finishedGoodsInv.itemCode,
          itemName: finishedGoodsInv.itemName,
          transactionType: 'STOCK_IN',
          quantity: 1,
          previousStock: prev,
          newStock: finishedGoodsInv.currentStock,
          referenceType: 'PRODUCTION',
          referenceNumber: qa.productionNumber,
          remarks: `Finished unit serialized: ${serialNumberStr}`,
          performedBy: req.user.name
        });
      }

      if (order) {
        order.qaStatus = 'PASSED';
        order.currentStage = 'QA_PASSED';
        order.dispatchStatus = 'READY_FOR_DISPATCH';
        await order.save();
      }

      await logAudit({
        action: 'QA_PASSED',
        entityType: 'QAInspection',
        entityId: qa._id,
        entityNumber: qa.qaNumber,
        performedBy: req.user.name,
        userRole: req.user.role,
        details: `QA Passed for ${qa.productionNumber}. Assigned Serial: ${serialNumberStr}. Cert: ${qa.certificateNumber}`
      });

    } else {
      qa.rectificationNotes = rectificationNotes || 'Quality check non-conformance recorded.';
      qa.retestRequired = true;
      if (order) {
        order.qaStatus = 'FAILED';
        await order.save();
      }

      await logAudit({
        action: 'QA_FAILED',
        entityType: 'QAInspection',
        entityId: qa._id,
        entityNumber: qa.qaNumber,
        performedBy: req.user.name,
        userRole: req.user.role,
        details: `QA Failed for ${qa.productionNumber}. Notes: ${qa.rectificationNotes}`
      });
    }

    await qa.save();
    res.json(qa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadQACertificate = async (req, res) => {
  try {
    const qa = await QAInspection.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: 'QA record not found' });

    const data = {
      docNumber: qa.certificateNumber || qa.qaNumber,
      date: qa.certificateIssuedAt || qa.inspectedAt,
      items: [
        {
          productCode: qa.model,
          description: `${qa.productName} (S/N: ${qa.assignedSerialNumber || 'PENDING'})`,
          quantity: 1,
          unit: 'Nos',
          unitPrice: 0,
          discount: 0,
          taxRate: 0,
          taxableAmount: 0,
          taxAmount: 0,
          totalAmount: 0
        }
      ],
      paymentTerms: 'Comprehensive Factory Quality Inspection Test passed with complete conformity.',
      deliveryPeriod: 'Ready for Dispatch Release',
      warrantyTerms: 'Calibrated to International Cryogenic Refrigeration Standards',
      status: 'QA PASSED & CERTIFIED'
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${data.docNumber}.pdf"`);

    await generateDocumentPDF('Quality Inspection Certificate', data, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate QA certificate', error: error.message });
  }
};
