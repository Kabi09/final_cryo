import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { getNextSequence } from '../services/numberingService.js';
import { logAudit } from '../middleware/audit.js';

export const listLeads = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { leadNumber: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { requirement: { $regex: search, $options: 'i' } }
      ];
    }
    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const leadNumber = await getNextSequence('LEAD', 4);
    const lead = await Lead.create({
      ...req.body,
      leadNumber,
      status: 'NEW'
    });

    await logAudit({
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead._id,
      entityNumber: lead.leadNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created new lead ${lead.leadNumber} for ${lead.customerName}`
    });

    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const qualifyLead = async (req, res) => {
  try {
    const { isQualified, qualificationNotes, customerId } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (isQualified) {
      lead.status = 'QUALIFIED';
      if (customerId) lead.customerId = customerId;
    } else {
      lead.status = 'NOT_QUALIFIED';
    }

    if (qualificationNotes) lead.remarks = qualificationNotes;
    await lead.save();

    await logAudit({
      action: isQualified ? 'LEAD_QUALIFIED' : 'LEAD_DISQUALIFIED',
      entityType: 'Lead',
      entityId: lead._id,
      entityNumber: lead.leadNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Lead ${lead.leadNumber} marked ${lead.status}. Notes: ${qualificationNotes || 'N/A'}`
    });

    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addFollowUp = async (req, res) => {
  try {
    const { notes, nextFollowUpDate, responseStatus } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.followUps.push({
      date: new Date(),
      notes,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      responseStatus,
      contactedBy: req.user.name
    });

    if (responseStatus === 'NOT_INTERESTED') {
      lead.status = 'LOST';
    } else if (responseStatus === 'REQUESTED_QUOTE') {
      lead.status = 'QUALIFIED';
    } else if (lead.status === 'NEW') {
      lead.status = 'CONTACTED';
    }

    await lead.save();

    await logAudit({
      action: 'LEAD_FOLLOW_UP_ADDED',
      entityType: 'Lead',
      entityId: lead._id,
      entityNumber: lead.leadNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Follow up added for ${lead.leadNumber}: ${responseStatus}. Notes: ${notes}`
    });

    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
