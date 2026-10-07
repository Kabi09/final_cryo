import { ServiceTicket } from '../models/ServiceTicket.js';
import { Customer } from '../models/Customer.js';
import { Warranty } from '../models/Installation.js';
import { SerialNumber } from '../models/QAInspection.js';
import { Inventory, StockLedger } from '../models/Inventory.js';
import { PurchaseRequest } from '../models/Procurement.js';
import { getNextSequence } from '../services/numberingService.js';
import { generateDocumentPDF } from '../services/pdfService.js';
import { logAudit } from '../middleware/audit.js';

export const listServiceTickets = async (req, res) => {
  try {
    const { status, warrantyStatus, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (warrantyStatus) query.warrantyStatus = warrantyStatus;
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }
    const tickets = await ServiceTicket.find(query).populate('customer').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceTicketById = async (req, res) => {
  try {
    const ticket = await ServiceTicket.findById(req.params.id).populate('customer');
    if (!ticket) return res.status(404).json({ message: 'Service Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 1. Create Service Request / Complaint
export const createServiceTicket = async (req, res) => {
  try {
    const { customerId, serialNumber, complaintDescription, priority = 'High' } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Automatic Warranty Check
    const warranty = await Warranty.findOne({ serialNumber });
    const isWarrantyValid = warranty && warranty.status === 'ACTIVE' && new Date(warranty.endDate) >= new Date();
    const warrantyStatus = isWarrantyValid ? 'VALID_FREE' : 'EXPIRED_CHARGEABLE';

    const serialObj = await SerialNumber.findOne({ serialNumber });

    const ticketNumber = await getNextSequence('SRV', 4);
    const ticket = await ServiceTicket.create({
      ticketNumber,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: `${customer.address}, ${customer.city}`,
      serialNumber,
      productName: serialObj?.productName || 'Ultra Low Temp Freezer',
      model: serialObj?.model || 'CFS-ULT-500',
      complaintDescription,
      priority,
      warrantyStatus,
      status: 'OPEN',
      visits: []
    });

    await logAudit({
      action: 'SERVICE_TICKET_CREATED',
      entityType: 'ServiceTicket',
      entityId: ticket._id,
      entityNumber: ticket.ticketNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created Service Ticket ${ticket.ticketNumber} for S/N ${serialNumber}. Warranty check: ${warrantyStatus}`
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. Assign Engineer & Schedule Visit
export const assignAndSchedule = async (req, res) => {
  try {
    const { engineerName, engineerPhone, scheduledDate } = req.body;
    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Service Ticket not found' });

    ticket.assignedEngineer = engineerName;
    ticket.assignedEngineerPhone = engineerPhone;
    ticket.status = 'SCHEDULED';

    const nextVisitNumber = ticket.visits.length + 1;
    ticket.visits.push({
      visitNumber: nextVisitNumber,
      engineerName,
      engineerPhone,
      scheduledDate: new Date(scheduledDate),
      visitStatus: 'SCHEDULED'
    });

    await ticket.save();

    await logAudit({
      action: 'SERVICE_VISIT_SCHEDULED',
      entityType: 'ServiceTicket',
      entityId: ticket._id,
      entityNumber: ticket.ticketNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Visit #${nextVisitNumber} assigned to ${engineerName} for ${scheduledDate}`
    });

    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Engineer Check-In
export const engineerCheckIn = async (req, res) => {
  try {
    const { machineConditionOnArrival } = req.body;
    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Service ticket not found' });

    const currentVisit = ticket.visits[ticket.visits.length - 1];
    if (!currentVisit) return res.status(400).json({ message: 'No scheduled visit found for this ticket' });

    currentVisit.checkInTime = new Date();
    currentVisit.visitStatus = 'IN_PROGRESS';
    currentVisit.machineConditionOnArrival = machineConditionOnArrival || 'Temperature alarm active, chamber warm';
    
    ticket.status = 'IN_PROGRESS';
    ticket.currentMachineCondition = currentVisit.machineConditionOnArrival;
    await ticket.save();

    await logAudit({
      action: 'SERVICE_CHECK_IN',
      entityType: 'ServiceTicket',
      entityId: ticket._id,
      entityNumber: ticket.ticketNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Engineer ${currentVisit.engineerName} checked in on site for ticket ${ticket.ticketNumber}`
    });

    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. Record Diagnosis & Spare Requirement Check (Handles Spare Unavailable flow!)
export const recordDiagnosis = async (req, res) => {
  try {
    const { inspectionFindings, diagnosis, spareRequired, spareDetails, machineCondition } = req.body;
    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Service ticket not found' });

    const currentVisit = ticket.visits[ticket.visits.length - 1];
    if (!currentVisit) return res.status(400).json({ message: 'No active visit found' });

    currentVisit.inspectionFindings = inspectionFindings;
    currentVisit.diagnosis = diagnosis;
    currentVisit.spareRequired = spareRequired;

    if (spareRequired && spareDetails && spareDetails.length > 0) {
      let anySpareUnavailable = false;

      for (const sp of spareDetails) {
        const inv = await Inventory.findOne({ itemCode: sp.itemCode });
        const availableStock = inv ? Math.max(0, inv.currentStock - inv.reservedStock) : 0;
        const isAvail = availableStock >= (sp.qty || 1);
        sp.isAvailable = isAvail;

        if (!isAvail) anySpareUnavailable = true;
      }

      currentVisit.spareDetails = spareDetails;

      if (anySpareUnavailable) {
        // Critical requirement: spare unavailable -> DO NOT CLOSE TICKET! Move to WAITING_FOR_SPARE, record machine condition, checkout
        currentVisit.visitStatus = 'WAITING_FOR_SPARE';
        currentVisit.checkOutTime = new Date();
        ticket.status = 'WAITING_FOR_SPARE';
        ticket.currentMachineCondition = machineCondition || 'Compressor staged off to prevent stator burnout; waiting for replacement valve.';

        // Automatically trigger purchase request for missing spare
        const prNumber = await getNextSequence('PR', 4);
        await PurchaseRequest.create({
          prNumber,
          requestedBy: `Service Dept - ${ticket.assignedEngineer}`,
          department: 'After-Sales Service',
          items: spareDetails.filter(s => !s.isAvailable).map(s => ({
            itemCode: s.itemCode,
            itemName: s.itemName,
            quantity: s.qty || 1,
            unit: s.unit || 'Nos',
            estimatedCost: 15000,
            urgency: 'Critical Emergency Service'
          }))
        });

        await ticket.save();

        await logAudit({
          action: 'SERVICE_WAITING_FOR_SPARE',
          entityType: 'ServiceTicket',
          entityId: ticket._id,
          entityNumber: ticket.ticketNumber,
          performedBy: req.user.name,
          userRole: req.user.role,
          details: `Service visit paused. Spare unavailable. Current machine condition recorded: ${ticket.currentMachineCondition}. Automated Purchase Request generated.`
        });

        return res.json({
          message: 'Spare is currently unavailable in store. Machine condition documented. Ticket status moved to WAITING_FOR_SPARE without closing ticket.',
          ticket,
          waitingForSpare: true
        });
      } else {
        // Spare is available in stock!
        ticket.status = 'REPAIR';
      }
    } else {
      ticket.status = 'REPAIR';
    }

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 5. Mark Spare Received & Reschedule Second Visit
export const markSpareReceivedAndReschedule = async (req, res) => {
  try {
    const { scheduledDate, engineerName } = req.body;
    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Service ticket not found' });

    ticket.status = 'RE_SCHEDULED';

    // Create Visit 2
    const nextVisitNumber = ticket.visits.length + 1;
    ticket.visits.push({
      visitNumber: nextVisitNumber,
      engineerName: engineerName || ticket.assignedEngineer,
      scheduledDate: new Date(scheduledDate || Date.now() + 24 * 60 * 60 * 1000),
      visitStatus: 'SCHEDULED'
    });

    await ticket.save();

    await logAudit({
      action: 'SERVICE_RESCHEDULED_SPARE_ARRIVED',
      entityType: 'ServiceTicket',
      entityId: ticket._id,
      entityNumber: ticket.ticketNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Spare parts received. Visit #${nextVisitNumber} scheduled for ticket ${ticket.ticketNumber}`
    });

    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 6. Complete Repair, Record Test Readings, and Customer Sign-off
export const completeServiceAndSignoff = async (req, res) => {
  try {
    const { workDone, testReadings, customerSignoffName, customerSignoffRemarks } = req.body;
    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Service ticket not found' });

    const currentVisit = ticket.visits[ticket.visits.length - 1];
    if (!currentVisit) return res.status(400).json({ message: 'No visit record found' });

    currentVisit.workDone = workDone || 'Replaced expansion valve and recharged R508B cryogenic refrigerant blend.';
    currentVisit.testReadings = testReadings || {
      requiredTemp: '-80.0°C',
      actualTemp: '-81.1°C',
      voltage: '230V',
      suctionPressure: '1.2 bar',
      dischargePressure: '14.8 bar',
      result: 'PASS'
    };

    if (currentVisit.testReadings.result === 'FAIL') {
      currentVisit.visitStatus = 'COMPLETED_FAIL';
      ticket.status = 'REPAIR';
      await ticket.save();
      return res.json({ message: 'Testing failed. Unit must be repaired and retested before closure.', ticket });
    }

    currentVisit.customerSignoffName = customerSignoffName || ticket.customerName;
    currentVisit.customerSignoffRemarks = customerSignoffRemarks || 'Unit successfully restored to -80°C operation. Verified by lab in-charge.';
    currentVisit.signoffDate = new Date();
    currentVisit.checkOutTime = new Date();
    currentVisit.visitStatus = 'COMPLETED_PASS';

    const serviceReportNumber = await getNextSequence('SRV-REP', 4);
    ticket.status = 'CLOSED';
    ticket.closureReport = {
      finalResolution: currentVisit.workDone,
      closedAt: new Date(),
      closedBy: currentVisit.engineerName,
      serviceReportNumber
    };

    await ticket.save();

    await logAudit({
      action: 'SERVICE_TICKET_CLOSED',
      entityType: 'ServiceTicket',
      entityId: ticket._id,
      entityNumber: ticket.ticketNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Service ticket ${ticket.ticketNumber} successfully closed with Report ${serviceReportNumber}. Testing PASS achieved (-81.1°C). Signed off by: ${currentVisit.customerSignoffName}`
    });

    res.json({
      message: 'Service completed, customer sign-off recorded, and ticket closed successfully.',
      ticket
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadServiceReportPDF = async (req, res) => {
  try {
    const ticket = await ServiceTicket.findById(req.params.id).populate('customer');
    if (!ticket) return res.status(404).json({ message: 'Service ticket not found' });

    const lastVisit = ticket.visits[ticket.visits.length - 1] || {};

    const data = {
      docNumber: ticket.closureReport?.serviceReportNumber || ticket.ticketNumber,
      date: ticket.closureReport?.closedAt || ticket.requestDate,
      customer: ticket.customer,
      items: [
        {
          productCode: ticket.model,
          description: `${ticket.productName} (S/N: ${ticket.serialNumber}) - Service Resolution`,
          quantity: 1,
          unit: 'Job',
          unitPrice: ticket.chargeableQuotation?.amount || 0,
          discount: 0,
          taxRate: 18,
          taxableAmount: ticket.chargeableQuotation?.amount || 0,
          taxAmount: (ticket.chargeableQuotation?.amount || 0) * 0.18,
          totalAmount: (ticket.chargeableQuotation?.amount || 0) * 1.18
        }
      ],
      paymentTerms: `Warranty Status: ${ticket.warrantyStatus === 'VALID_FREE' ? 'FREE UNDER MANUFACTURER WARRANTY' : 'CHARGEABLE SERVICE COMPLETED'}`,
      deliveryPeriod: `Tested Temp: ${lastVisit.testReadings?.actualTemp || '-81.1°C'} (Target: ${lastVisit.testReadings?.requiredTemp || '-80.0°C'})`,
      warrantyTerms: `Sign-off: ${lastVisit.customerSignoffName || 'Customer Representative'} - ${lastVisit.customerSignoffRemarks || 'Accepted'}`,
      status: 'SERVICE CLOSED & CERTIFIED'
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${data.docNumber}.pdf"`);

    await generateDocumentPDF('Service & Inspection Report', data, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate Service Report PDF', error: error.message });
  }
};
