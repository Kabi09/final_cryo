import { Payment } from '../models/Payment.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { getNextSequence } from '../services/numberingService.js';
import { logAudit } from '../middleware/audit.js';

export const listPayments = async (req, res) => {
  try {
    const { salesOrderId } = req.query;
    const query = salesOrderId ? { salesOrder: salesOrderId } : {};
    const payments = await Payment.find(query).populate('customer').populate('salesOrder').sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { salesOrderId, paymentType = 'ADVANCE', amount, paymentMode = 'NEFT', referenceNumber, notes } = req.body;
    const order = await SalesOrder.findById(salesOrderId);
    if (!order) return res.status(404).json({ message: 'Sales Order not found' });

    const paymentNumber = await getNextSequence('PAY', 4);
    const payment = await Payment.create({
      paymentNumber,
      salesOrder: order._id,
      soNumber: order.soNumber,
      customer: order.customer,
      paymentType,
      amount: Number(amount),
      paymentMode,
      referenceNumber,
      notes,
      status: 'VERIFIED',
      verifiedBy: req.user.name,
      verifiedAt: new Date()
    });

    // Update Sales Order amounts
    order.advancePaid = (order.advancePaid || 0) + Number(amount);
    order.balanceDue = Math.max(0, order.grandTotal - order.advancePaid);

    if (order.advancePaid >= order.grandTotal) {
      order.paymentStatus = 'FULLY_PAID';
    } else if (order.advancePaid >= order.advanceRequired) {
      order.paymentStatus = 'ADVANCE_VERIFIED';
      if (order.currentStage === 'ORDER_CONFIRMED') {
        order.currentStage = 'PAYMENT_VERIFIED';
      }
    }

    await order.save();

    await logAudit({
      action: 'PAYMENT_VERIFIED',
      entityType: 'Payment',
      entityId: payment._id,
      entityNumber: payment.paymentNumber,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: `Verified ${paymentType} payment of ₹${payment.amount} (Ref: ${payment.referenceNumber}) for order ${order.soNumber}. Payment status: ${order.paymentStatus}`
    });

    res.status(201).json({ payment, order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
