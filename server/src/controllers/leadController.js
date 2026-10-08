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
    const leads = await Lead.find(query).populate('customerId').sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('customerId');
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

export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    Object.assign(lead, req.body);
    await lead.save();

    await logAudit({
      action: 'LEAD_UPDATED',
      entityType: 'Lead',
      entityId: lead._id,
      entityNumber: lead.leadNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Lead ${lead.leadNumber} updated for ${lead.customerName}`
    });

    const populatedLead = await Lead.findById(lead._id).populate('customerId');
    res.json(populatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const qualifyLead = async (req, res) => {
  try {
    const { isQualified, qualificationNotes, customerId, customerData } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    let customer = null;

    if (isQualified) {
      lead.status = 'QUALIFIED';

      // Update lead address/tax info if provided
      if (customerData) {
        if (customerData.address) lead.address = customerData.address;
        if (customerData.city) lead.city = customerData.city;
        if (customerData.state) lead.state = customerData.state;
        if (customerData.pincode) lead.pincode = customerData.pincode;
        if (customerData.gstin) lead.gstin = customerData.gstin;
        if (customerData.segment) lead.segment = customerData.segment;
      }

      // If customerId was manually specified, link it
      if (customerId) {
        customer = await Customer.findById(customerId);
        if (customer) {
          lead.customerId = customer._id;
          lead.convertedCustomerCode = customer.customerCode;
        }
      } else if (lead.customerId) {
        customer = await Customer.findById(lead.customerId);
      } else {
        // Check if customer already exists by email or name
        customer = await Customer.findOne({
          $or: [
            { email: lead.email },
            { name: new RegExp(`^${lead.customerName.trim()}$`, 'i') }
          ]
        });

        // If not found, directly create Customer record in Customer Master
        if (!customer) {
          const customerCode = await getNextSequence('CUST', 4);
          customer = await Customer.create({
            customerCode,
            name: lead.customerName.trim(),
            contactPerson: lead.contactPerson.trim(),
            email: lead.email.trim(),
            phone: lead.phone.trim(),
            address: lead.address || customerData?.address || 'Site Address TBD',
            city: lead.city || customerData?.city || 'Chennai',
            state: lead.state || customerData?.state || 'Tamil Nadu',
            pincode: lead.pincode || customerData?.pincode || '600001',
            gstin: lead.gstin || customerData?.gstin || '',
            segment: lead.segment || customerData?.segment || 'Research & Labs',
            status: 'ACTIVE'
          });

          await logAudit({
            action: 'CUSTOMER_CREATED_FROM_LEAD',
            entityType: 'Customer',
            entityId: customer._id,
            entityNumber: customer.customerCode,
            performedBy: req.user.name,
            userRole: req.user.role,
            details: `Directly created Customer ${customer.customerCode} (${customer.name}) from qualified Lead ${lead.leadNumber}`
          });
        }

        lead.customerId = customer._id;
        lead.convertedCustomerCode = customer.customerCode;
      }
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
      details: `Lead ${lead.leadNumber} marked ${lead.status}. Customer: ${customer?.customerCode || 'None'}. Notes: ${qualificationNotes || 'N/A'}`
    });

    const populatedLead = await Lead.findById(lead._id).populate('customerId');
    res.json({
      lead: populatedLead,
      customer,
      message: isQualified
        ? `Lead qualified successfully! Customer record ${customer?.customerCode} stored in Customer Master.`
        : 'Lead marked as not qualified.'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addFollowUp = async (req, res) => {
  try {
    const { notes, nextFollowUpDate, responseStatus, date } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.followUps.push({
      date: date ? new Date(date) : new Date(),
      notes,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      responseStatus,
      contactedBy: req.user.name
    });

    let customer = null;

    if (responseStatus === 'NOT_INTERESTED') {
      lead.status = 'LOST';
    } else if (responseStatus === 'REQUESTED_QUOTE') {
      lead.status = 'QUALIFIED';

      // Auto-create and store Customer in Customer Master if not already linked
      if (lead.customerId) {
        customer = await Customer.findById(lead.customerId);
      } else {
        // Search if customer already exists by email or name
        customer = await Customer.findOne({
          $or: [
            { email: lead.email },
            { name: new RegExp(`^${lead.customerName.trim()}$`, 'i') }
          ]
        });

        if (!customer) {
          const customerCode = await getNextSequence('CUST', 4);
          customer = await Customer.create({
            customerCode,
            name: lead.customerName.trim(),
            contactPerson: lead.contactPerson.trim(),
            email: lead.email.trim(),
            phone: lead.phone.trim(),
            address: lead.address || 'Site Address TBD',
            city: lead.city || 'Chennai',
            state: lead.state || 'Tamil Nadu',
            pincode: lead.pincode || '600001',
            gstin: lead.gstin || '',
            segment: lead.segment || 'Research & Labs',
            status: 'ACTIVE'
          });

          await logAudit({
            action: 'CUSTOMER_CREATED_FROM_LEAD',
            entityType: 'Customer',
            entityId: customer._id,
            entityNumber: customer.customerCode,
            performedBy: req.user.name,
            userRole: req.user.role,
            details: `Auto-created Customer ${customer.customerCode} (${customer.name}) from Lead ${lead.leadNumber} on follow-up quote request`
          });
        }

        lead.customerId = customer._id;
        lead.convertedCustomerCode = customer.customerCode;
      }
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

    const populatedLead = await Lead.findById(lead._id).populate('customerId');
    res.json({
      lead: populatedLead,
      customer,
      message: responseStatus === 'REQUESTED_QUOTE'
        ? `Follow-up saved! Lead marked as QUALIFIED and Customer record ${customer?.customerCode} stored in Customer Master.`
        : `Follow-up recorded successfully for ${lead.leadNumber}.`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateFollowUp = async (req, res) => {
  try {
    const { leadId, followUpId } = req.params;
    const { notes, date, nextFollowUpDate, responseStatus, contactedBy } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const followUp = lead.followUps.id(followUpId);
    if (!followUp) return res.status(404).json({ message: 'Follow-up entry not found' });

    if (notes !== undefined) followUp.notes = notes;
    if (date) followUp.date = new Date(date);
    if (nextFollowUpDate !== undefined) {
      followUp.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : undefined;
    }
    if (responseStatus) followUp.responseStatus = responseStatus;
    if (contactedBy) followUp.contactedBy = contactedBy;

    let customer = null;
    if (responseStatus === 'NOT_INTERESTED') {
      lead.status = 'LOST';
    } else if (responseStatus === 'REQUESTED_QUOTE') {
      lead.status = 'QUALIFIED';

      // Auto-create and store Customer in Customer Master if not already linked
      if (lead.customerId) {
        customer = await Customer.findById(lead.customerId);
      } else {
        customer = await Customer.findOne({
          $or: [
            { email: lead.email },
            { name: new RegExp(`^${lead.customerName.trim()}$`, 'i') }
          ]
        });

        if (!customer) {
          const customerCode = await getNextSequence('CUST', 4);
          customer = await Customer.create({
            customerCode,
            name: lead.customerName.trim(),
            contactPerson: lead.contactPerson.trim(),
            email: lead.email.trim(),
            phone: lead.phone.trim(),
            address: lead.address || 'Site Address TBD',
            city: lead.city || 'Chennai',
            state: lead.state || 'Tamil Nadu',
            pincode: lead.pincode || '600001',
            gstin: lead.gstin || '',
            segment: lead.segment || 'Research & Labs',
            status: 'ACTIVE'
          });

          await logAudit({
            action: 'CUSTOMER_CREATED_FROM_LEAD',
            entityType: 'Customer',
            entityId: customer._id,
            entityNumber: customer.customerCode,
            performedBy: req.user.name,
            userRole: req.user.role,
            details: `Auto-created Customer ${customer.customerCode} (${customer.name}) from Lead ${lead.leadNumber} on modified follow-up quote request`
          });
        }

        lead.customerId = customer._id;
        lead.convertedCustomerCode = customer.customerCode;
      }
    }

    await lead.save();

    await logAudit({
      action: 'LEAD_FOLLOW_UP_UPDATED',
      entityType: 'Lead',
      entityId: lead._id,
      entityNumber: lead.leadNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Follow-up ${followUpId} updated for Lead ${lead.leadNumber}: status=${responseStatus}. Notes=${notes}`
    });

    const populatedLead = await Lead.findById(lead._id).populate('customerId');
    res.json({
      lead: populatedLead,
      customer,
      message: responseStatus === 'REQUESTED_QUOTE'
        ? `Follow-up updated! Lead marked as QUALIFIED and Customer record ${customer?.customerCode} stored in Customer Master.`
        : `Follow-up updated successfully for ${lead.leadNumber}.`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteFollowUp = async (req, res) => {
  try {
    const { leadId, followUpId } = req.params;
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.followUps.pull(followUpId);
    await lead.save();

    await logAudit({
      action: 'LEAD_FOLLOW_UP_DELETED',
      entityType: 'Lead',
      entityId: lead._id,
      entityNumber: lead.leadNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Follow-up ${followUpId} deleted from Lead ${lead.leadNumber}`
    });

    const populatedLead = await Lead.findById(lead._id).populate('customerId');
    res.json({ lead: populatedLead, message: 'Follow-up removed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
