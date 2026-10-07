import { Customer } from '../models/Customer.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { Quotation } from '../models/Quotation.js';
import { ServiceTicket } from '../models/ServiceTicket.js';
import { getNextSequence } from '../services/numberingService.js';
import { logAudit } from '../middleware/audit.js';

export const listCustomers = async (req, res) => {
  try {
    const { search, segment, status } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (segment) query.segment = segment;
    if (status) query.status = status;

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Fetch related lifecycle data
    const orders = await SalesOrder.find({ customer: customer._id }).sort({ createdAt: -1 });
    const quotations = await Quotation.find({ customer: customer._id }).sort({ createdAt: -1 });
    const serviceTickets = await ServiceTicket.find({ customer: customer._id }).sort({ createdAt: -1 });

    res.json({
      customer,
      orders,
      quotations,
      serviceTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customerCode = await getNextSequence('CUST', 4);
    const customer = await Customer.create({
      ...req.body,
      customerCode
    });

    await logAudit({
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer._id,
      entityNumber: customer.customerCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Created customer: ${customer.name}`
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    await logAudit({
      action: 'CUSTOMER_UPDATED',
      entityType: 'Customer',
      entityId: customer._id,
      entityNumber: customer.customerCode,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Updated customer: ${customer.name}`
    });

    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
