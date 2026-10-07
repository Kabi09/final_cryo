import { Lead } from '../models/Lead.js';
import { Quotation } from '../models/Quotation.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { ProductionOrder } from '../models/ProductionOrder.js';
import { Inventory } from '../models/Inventory.js';
import { QAInspection } from '../models/QAInspection.js';
import { Shipment } from '../models/Dispatch.js';
import { ServiceTicket } from '../models/ServiceTicket.js';
import { AuditLog } from '../models/AuditLog.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [
      openLeads,
      openQuotations,
      allQuotations,
      salesOrders,
      productionOrders,
      inventoryItems,
      qaInspections,
      shipments,
      serviceTickets,
      recentAudit
    ] = await Promise.all([
      Lead.countDocuments({ status: { $in: ['NEW', 'CONTACTED', 'QUALIFIED'] } }),
      Quotation.countDocuments({ status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'NEGOTIATION'] } }),
      Quotation.find(),
      SalesOrder.find(),
      ProductionOrder.find(),
      Inventory.find(),
      QAInspection.find(),
      Shipment.find(),
      ServiceTicket.find(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10)
    ]);

    // Financial & Sales metrics
    const totalQuotationValue = allQuotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
    const totalSalesOrderValue = salesOrders.reduce((sum, so) => sum + (so.grandTotal || 0), 0);
    const totalPaymentsReceived = salesOrders.reduce((sum, so) => sum + (so.advancePaid || 0), 0);
    const pendingPayments = salesOrders.reduce((sum, so) => sum + (so.balanceDue || 0), 0);

    // Production metrics
    const activeProduction = productionOrders.filter(p => ['RELEASED', 'MATERIAL_REQUESTED', 'MATERIAL_ISSUED', 'IN_PROGRESS'].includes(p.status)).length;
    const materialShortages = productionOrders.filter(p => p.materialShortage).length;
    const completedProduction = productionOrders.filter(p => p.status === 'COMPLETED').length;

    // Inventory metrics
    const lowStockCount = inventoryItems.filter(i => (i.currentStock - i.reservedStock) <= i.reorderPoint).length;
    const totalStockValue = inventoryItems.reduce((sum, i) => sum + ((i.currentStock || 0) * (i.unitCost || 0)), 0);

    // QA & Dispatch metrics
    const qaPending = qaInspections.filter(q => q.overallResult === 'FAIL' || !q.certificateNumber).length;
    const readyForDispatch = salesOrders.filter(s => s.dispatchStatus === 'READY_FOR_DISPATCH').length;
    const inTransitShipments = shipments.filter(s => s.status === 'IN_TRANSIT').length;

    // Service metrics
    const openServiceTickets = serviceTickets.filter(s => s.status !== 'CLOSED').length;
    const waitingForSpareTickets = serviceTickets.filter(s => s.status === 'WAITING_FOR_SPARE').length;

    res.json({
      sales: {
        openLeads,
        openQuotations,
        totalQuotationValue,
        wonOrders: salesOrders.length,
        totalSalesOrderValue,
        totalPaymentsReceived,
        pendingPayments
      },
      production: {
        totalProduction: productionOrders.length,
        activeProduction,
        materialShortages,
        completedProduction
      },
      inventory: {
        totalItems: inventoryItems.length,
        lowStockCount,
        totalStockValue
      },
      quality: {
        qaPending,
        qaPassed: qaInspections.filter(q => q.overallResult === 'PASS').length
      },
      dispatch: {
        readyForDispatch,
        inTransitShipments
      },
      service: {
        openServiceTickets,
        waitingForSpareTickets,
        closedTickets: serviceTickets.filter(s => s.status === 'CLOSED').length
      },
      recentActivity: recentAudit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
