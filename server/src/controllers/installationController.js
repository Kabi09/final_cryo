import { Installation, Warranty } from '../models/Installation.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { SerialNumber } from '../models/QAInspection.js';
import { getNextSequence } from '../services/numberingService.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

export const listInstallations = async (req, res) => {
  try {
    const insts = await Installation.find().populate('customer').populate('salesOrder').sort({ createdAt: -1 });
    res.json(insts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find().populate('customer').populate('product').sort({ createdAt: -1 });
    res.json(warranties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const scheduleInstallation = async (req, res) => {
  try {
    const { salesOrderId, serialNumber, engineerName, engineerPhone, scheduledDate } = req.body;
    const order = await SalesOrder.findById(salesOrderId).populate('customer');
    if (!order) return res.status(404).json({ message: 'Sales Order not found' });

    const installationNumber = await getNextSequence('INST', 4);
    const installation = await Installation.create({
      installationNumber,
      salesOrder: order._id,
      soNumber: order.soNumber,
      customer: order.customer._id,
      serialNumber,
      productName: order.items[0]?.description || 'Cryo Ultra Low Freezer',
      assignedEngineer: engineerName,
      engineerPhone,
      scheduledDate: new Date(scheduledDate),
      status: 'SCHEDULED'
    });

    order.installationStatus = 'SCHEDULED';
    await order.save();

    await logAudit({
      action: 'INSTALLATION_SCHEDULED',
      entityType: 'Installation',
      entityId: installation._id,
      entityNumber: installation.installationNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Installation ${installation.installationNumber} scheduled with engineer ${engineerName} for ${scheduledDate}`
    });

    res.status(201).json(installation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const completeCommissioning = async (req, res) => {
  try {
    const { commissioningDetails, customerSignoffName, customerSignoffDesignation, remarks } = req.body;
    const inst = await Installation.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: 'Installation record not found' });

    inst.commissioningDetails = commissioningDetails || inst.commissioningDetails;
    inst.customerSignoffName = customerSignoffName;
    inst.customerSignoffDesignation = customerSignoffDesignation;
    inst.completedDate = new Date();
    inst.status = 'COMMISSIONED_SUCCESS';
    inst.remarks = remarks;
    await inst.save();

    const order = await SalesOrder.findById(inst.salesOrder);
    if (order) {
      order.installationStatus = 'COMPLETED';
      order.warrantyStatus = 'ACTIVE';
      order.currentStage = 'WARRANTY_ACTIVE';
      await order.save();
    }

    // Activate 12-month Warranty
    const warrantyStartDate = new Date();
    const warrantyEndDate = new Date();
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);

    const warrantyNumber = await getNextSequence('WAR', 4);
    const warranty = await Warranty.create({
      warrantyNumber,
      serialNumber: inst.serialNumber,
      product: order?.items[0]?.product,
      productName: inst.productName,
      customer: inst.customer,
      salesOrder: inst.salesOrder,
      soNumber: inst.soNumber,
      startDate: warrantyStartDate,
      endDate: warrantyEndDate,
      durationMonths: 12,
      status: 'ACTIVE'
    });

    // Update SerialNumber status
    await SerialNumber.findOneAndUpdate(
      { serialNumber: inst.serialNumber },
      { 
        status: 'INSTALLED_ACTIVE',
        warrantyStart: warrantyStartDate,
        warrantyEnd: warrantyEndDate,
        location: `Customer Site - Installed & Commissioned`
      }
    );

    await logAudit({
      action: 'WARRANTY_ACTIVATED',
      entityType: 'Warranty',
      entityId: warranty._id,
      entityNumber: warranty.warrantyNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Commissioning completed & Warranty ${warranty.warrantyNumber} activated for ${inst.serialNumber}. Achieved Temp: ${commissioningDetails?.chamberAchievedTemp || '-81.4°C'}`
    });

    res.json({
      message: 'Commissioning completed and Warranty activated successfully',
      installation: inst,
      warranty
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadWarrantyPDF = async (req, res) => {
  try {
    const warranty = await Warranty.findById(req.params.id).populate('customer');
    if (!warranty) return res.status(404).json({ message: 'Warranty record not found' });

    const data = {
      docNumber: warranty.warrantyNumber,
      date: warranty.startDate,
      customer: warranty.customer,
      items: [
        {
          productCode: 'WAR-CERT',
          description: `Manufacturer Warranty Certificate for ${warranty.productName} (S/N: ${warranty.serialNumber})`,
          quantity: 1,
          unit: 'Period',
          unitPrice: 0,
          discount: 0,
          taxRate: 0,
          taxableAmount: 0,
          taxAmount: 0,
          totalAmount: 0
        }
      ],
      paymentTerms: `Comprehensive Manufacturer Warranty Coverage from ${new Date(warranty.startDate).toLocaleDateString()} to ${new Date(warranty.endDate).toLocaleDateString()}`,
      deliveryPeriod: '12 Months Free On-site Service & Parts Coverage',
      warrantyTerms: warranty.terms,
      status: 'OFFICIALLY ACTIVE'
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${warranty.warrantyNumber}.pdf"`);

    await generateDocumentPDF('Warranty Certificate', data, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate Warranty PDF', error: error.message });
  }
};
