import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';

import * as authCtrl from '../controllers/authController.js';
import * as customerCtrl from '../controllers/customerController.js';
import * as productCtrl from '../controllers/productController.js';
import * as inventoryCtrl from '../controllers/inventoryController.js';
import * as bomCtrl from '../controllers/bomController.js';
import * as leadCtrl from '../controllers/leadController.js';
import * as quotationCtrl from '../controllers/quotationController.js';
import * as piCtrl from '../controllers/piController.js';
import * as customerPoCtrl from '../controllers/customerPoController.js';
import * as salesOrderCtrl from '../controllers/salesOrderController.js';
import * as paymentCtrl from '../controllers/paymentController.js';
import * as prodCtrl from '../controllers/productionController.js';
import * as procCtrl from '../controllers/procurementController.js';
import * as qaCtrl from '../controllers/qaController.js';
import * as dispatchCtrl from '../controllers/dispatchController.js';
import * as instCtrl from '../controllers/installationController.js';
import * as serviceCtrl from '../controllers/serviceController.js';
import * as publicCtrl from '../controllers/publicController.js';
import * as dashboardCtrl from '../controllers/dashboardController.js';
import * as auditCtrl from '../controllers/auditController.js';

const router = express.Router();

// ---------------- Public Endpoints (No Auth Needed) ----------------
router.get('/public/quotation/:token', publicCtrl.getPublicQuotation);
router.post('/public/quotation/:token/accept', publicCtrl.customerAcceptQuotation);
router.post('/public/quotation/:token/reject', publicCtrl.customerRejectQuotation);
router.post('/public/quotation/:token/revision-request', publicCtrl.customerRequestRevision);
router.get('/public/quotation/:token/pdf', publicCtrl.downloadPublicQuotationPDF);
router.get('/public/tracking/:token', publicCtrl.getPublicOrderTracking);

// ---------------- Authentication ----------------
router.post('/auth/login', authCtrl.login);
router.get('/auth/profile', protect, authCtrl.getProfile);
router.get('/users', protect, authCtrl.listUsers);

// ---------------- Dashboard & Analytics ----------------
router.get('/dashboard/stats', protect, dashboardCtrl.getDashboardStats);
router.get('/audit/logs', protect, auditCtrl.listAuditLogs);
router.get('/audit/notifications', protect, auditCtrl.listNotifications);
router.patch('/audit/notifications/:id/read', protect, auditCtrl.markNotificationRead);

// ---------------- Customers ----------------
router.get('/customers', protect, customerCtrl.listCustomers);
router.get('/customers/:id', protect, customerCtrl.getCustomerById);
router.post('/customers', protect, customerCtrl.createCustomer);
router.put('/customers/:id', protect, customerCtrl.updateCustomer);

// ---------------- Products & Dynamic Pricing (Protected RBAC) ----------------
router.get('/products', protect, productCtrl.listProducts);
router.get('/products/:id', protect, productCtrl.getProductById);
router.post('/products', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'MANAGEMENT'), productCtrl.createProduct);
router.put('/products/:id', protect, productCtrl.updateProduct);
// Dedicated Price Update Route with RBAC enforcement
router.put('/products/:id/price', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SALES_MANAGER'), productCtrl.updateProductPrice);

// ---------------- Inventory & Stock Operations ----------------
router.get('/inventory', protect, inventoryCtrl.listInventory);
router.get('/inventory/ledger', protect, inventoryCtrl.listStockLedger);
router.get('/inventory/:id', protect, inventoryCtrl.getItemById);
router.post('/inventory', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'STORE'), inventoryCtrl.createItem);
// Dedicated Stock Add / In Route
router.post('/inventory/:id/add-stock', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'STORE'), inventoryCtrl.addStock);
// Dedicated Stock Adjustment Route
router.post('/inventory/:id/adjust', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'STORE'), inventoryCtrl.adjustStock);

// ---------------- BOM (Bill of Materials) ----------------
router.get('/boms', protect, bomCtrl.listBOMs);
router.get('/boms/:id', protect, bomCtrl.getBOMById);
router.post('/boms', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER'), bomCtrl.createBOM);
router.post('/boms/:id/revision', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'PRODUCTION_MANAGER'), bomCtrl.createBOMRevision);

// ---------------- Leads & Qualification ----------------
router.get('/leads', protect, leadCtrl.listLeads);
router.get('/leads/:id', protect, leadCtrl.getLeadById);
router.post('/leads', protect, leadCtrl.createLead);
router.put('/leads/:id/qualify', protect, leadCtrl.qualifyLead);
router.post('/leads/:id/follow-up', protect, leadCtrl.addFollowUp);

// ---------------- Quotations & Negotiation ----------------
router.get('/quotations', protect, quotationCtrl.listQuotations);
router.get('/quotations/:id', protect, quotationCtrl.getQuotationById);
router.post('/quotations', protect, quotationCtrl.createQuotation);
router.put('/quotations/:id/approve', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'MANAGEMENT'), quotationCtrl.approveQuotation);
router.post('/quotations/:id/send', protect, quotationCtrl.sendQuotation);
router.post('/quotations/:id/revision', protect, quotationCtrl.createRevision);
router.get('/quotations/:id/pdf', protect, quotationCtrl.downloadQuotationPDF);

// ---------------- Proforma Invoices ----------------
router.get('/proforma-invoices', protect, piCtrl.listProformas);
router.get('/proforma-invoices/:id', protect, piCtrl.getProformaById);
router.post('/proforma-invoices', protect, piCtrl.createProforma);
router.get('/proforma-invoices/:id/pdf', protect, piCtrl.downloadPiPDF);

// ---------------- Customer Purchase Orders ----------------
router.get('/customer-pos', protect, customerPoCtrl.listCustomerPOs);
router.get('/customer-pos/:id', protect, customerPoCtrl.getCustomerPOById);
router.post('/customer-pos', protect, customerPoCtrl.createCustomerPO);
router.put('/customer-pos/:id/verify', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE'), customerPoCtrl.verifyCustomerPO);
router.get('/customer-pos/:id/pdf', protect, customerPoCtrl.downloadCustomerPoPDF);

// ---------------- Sales Orders ----------------
router.get('/sales-orders', protect, salesOrderCtrl.listSalesOrders);
router.get('/sales-orders/:id', protect, salesOrderCtrl.getSalesOrderById);
router.post('/sales-orders/from-po', protect, salesOrderCtrl.createSalesOrderFromPO);
router.put('/sales-orders/:id/release-production', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'PRODUCTION_MANAGER', 'SALES_MANAGER', 'MANAGEMENT'), salesOrderCtrl.releaseForProduction);
router.get('/sales-orders/:id/pdf', protect, salesOrderCtrl.downloadSalesOrderPDF);

// ---------------- Payments ----------------
router.get('/payments', protect, paymentCtrl.listPayments);
router.post('/payments', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SALES'), paymentCtrl.recordPayment);

// ---------------- Production ----------------
router.get('/production-orders', protect, prodCtrl.listProductionOrders);
router.get('/production-orders/:id', protect, prodCtrl.getProductionOrderById);
router.put('/production-orders/:id/stage', protect, prodCtrl.updateStageStatus);
router.post('/production-orders/:id/plan-materials', protect, prodCtrl.planMaterials);
router.post('/production-orders/issue-materials', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'STORE', 'PRODUCTION_MANAGER'), prodCtrl.issueMaterials);
router.put('/production-orders/:id/complete', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'PRODUCTION_MANAGER'), prodCtrl.completeProduction);

// ---------------- Procurement & Stores ----------------
router.get('/procurement/purchase-requests', protect, procCtrl.listPurchaseRequests);
router.post('/procurement/purchase-requests', protect, procCtrl.createPurchaseRequest);
router.put('/procurement/purchase-requests/:id/approve', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'PURCHASE_MANAGER', 'MANAGEMENT'), procCtrl.approvePurchaseRequest);
router.get('/procurement/vendor-pos', protect, procCtrl.listVendorPOs);
router.post('/procurement/vendor-pos', protect, procCtrl.createVendorPO);
router.get('/procurement/grn', protect, procCtrl.listGRNs);
router.post('/procurement/grn', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'STORE'), procCtrl.createGRN);

// ---------------- Quality Assurance & Serialization ----------------
router.get('/qa', protect, qaCtrl.listQA);
router.get('/qa/:id', protect, qaCtrl.getQAById);
router.put('/qa/:id/submit', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'QA'), qaCtrl.submitQAResult);
router.get('/qa/:id/certificate-pdf', protect, qaCtrl.downloadQACertificate);

// ---------------- Dispatch, Invoicing & Logistics ----------------
router.get('/shipments', protect, dispatchCtrl.listShipments);
router.post('/dispatch/invoice', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE'), dispatchCtrl.generateTaxInvoice);
router.post('/dispatch/shipment', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'DISPATCH'), dispatchCtrl.createShipment);
router.put('/dispatch/shipments/:id', protect, requireRole('SUPER_ADMIN', 'ADMIN', 'DISPATCH'), dispatchCtrl.updateShipmentStatus);
router.get('/dispatch/invoices/:id/pdf', protect, dispatchCtrl.downloadInvoicePDF);

// ---------------- Installation & Warranty ----------------
router.get('/installations', protect, instCtrl.listInstallations);
router.post('/installations', protect, instCtrl.scheduleInstallation);
router.put('/installations/:id/commissioning', protect, instCtrl.completeCommissioning);
router.get('/warranties', protect, instCtrl.listWarranties);
router.get('/warranties/:id/pdf', protect, instCtrl.downloadWarrantyPDF);

// ---------------- Service Module ----------------
router.get('/service/tickets', protect, serviceCtrl.listServiceTickets);
router.get('/service/tickets/:id', protect, serviceCtrl.getServiceTicketById);
router.post('/service/tickets', protect, serviceCtrl.createServiceTicket);
router.put('/service/tickets/:id/assign', protect, serviceCtrl.assignAndSchedule);
router.put('/service/tickets/:id/checkin', protect, serviceCtrl.engineerCheckIn);
router.put('/service/tickets/:id/diagnosis', protect, serviceCtrl.recordDiagnosis);
router.put('/service/tickets/:id/reschedule', protect, serviceCtrl.markSpareReceivedAndReschedule);
router.put('/service/tickets/:id/signoff', protect, serviceCtrl.completeServiceAndSignoff);
router.get('/service/tickets/:id/report-pdf', protect, serviceCtrl.downloadServiceReportPDF);

export default router;
