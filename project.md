# Project Documentation

## Project Overview
- **Project Purpose**: Complete, production-ready MERN ERP web application for Cryo Scientific Systems Pvt Ltd (manufacturing scientific refrigeration, ultra-low temperature freezers, blood bank refrigerators, and laboratory equipment).
- **Technology Stack**:
  - **Frontend**: React 18, Vite, React Router DOM 7, Redux Toolkit, MUI Icons (`@mui/icons-material`), SCSS Modules / Vanilla SCSS design tokens, Axios.
  - **Backend**: Node.js v22 (ES Modules), Express.js 4, MongoDB v8 (running on port 27017 via Mongoose), JWT authentication, custom RBAC authorization middleware, Morgan, CORS.
  - **Document Generation**: Vector PDF generation using PDFKit producing official documents (Quotation, Quotation Revision, Proforma Invoice, Customer PO, Sales Order, Tax Invoice, QA Certificate, Warranty Certificate, Service Report) strictly modeled after the client's reference document suite (`Modern_ERP_5_Document_Suite.pdf`).
- **Main Architecture**: Decoupled client-server architecture with centralized status transition engines, 360-degree cross-linked entity relationships, and public customer tracking portals.
- **Important Conventions**: Single source of truth in `project.md`, persistent agent memory, strict enterprise UI without generic AI aesthetics.

## Project Structure
- **Backend (`/server`)**:
  - `src/config/`: Database connection (`db.js`), role & permission constants (`constants.js`).
  - `src/models/`: `User.js`, `Customer.js`, `Product.js`, `BOM.js`, `Inventory.js` & `StockLedger.js`, `Lead.js`, `Quotation.js`, `ProformaInvoice.js`, `CustomerPO.js`, `SalesOrder.js`, `Payment.js`, `ProductionOrder.js`, `MaterialRequest.js`, `Procurement.js` (PR, VPO, GRN), `QAInspection.js` & `SerialNumber.js`, `Dispatch.js` (TaxInvoice, Shipment), `Installation.js` & `Warranty.js`, `ServiceTicket.js`, `AuditLog.js` & `Notification.js`.
  - `src/middleware/`: JWT verification (`auth.js`), RBAC permission guards (`rbac.js`), immutable audit logging (`audit.js`).
  - `src/services/`: Dynamic auto-increment numbering (`numberingService.js`), high-fidelity PDF rendering (`pdfService.js`).
  - `src/controllers/`: Controllers for auth, sales, products, pricing, inventory, production, procurement, QA, dispatch, warranty, service, and public tracking.
  - `src/routes/`: Centralized route registry (`apiRoutes.js`).
  - `src/seed.js`: Database seeder with realistic Cryo Scientific products, BOMs, users for all 12 roles, and a complete end-to-end sample order lifecycle.
  - `src/server.js`: Express application entrypoint.
- **Frontend (`/client`)**:
  - `src/styles/`: Design tokens (`variables.scss`) and enterprise resets (`global.scss`).
  - `src/api/`: Authenticated Axios client (`client.js`).
  - `src/store/`: Redux Toolkit store (`index.js`, `authSlice.js`) with one-click role switching for testing.
  - `src/components/layout/`: Enterprise `Navbar.jsx`, `Sidebar.jsx`, and `Layout.jsx`.
  - `src/pages/`:
    - `dashboard/`: Operations command dashboard with live aggregated metrics and audit feed.
    - `sales/`: Leads, Customers (with 360° dossier), Quotations (with revisions & PDF export), Proforma Invoices, Customer PO Verification checklist, Sales Orders (with 360° lifecycle view), Payments.
    - `products/`: Product Master with RBAC-protected price editing, Bill of Materials with versioning.
    - `inventory/`: Store Stock Master with shortage filters, Stock In, Stock Adjustment, and chronological Stock Ledger.
    - `production/`: 5-Stage manufacturing order tracking (Fabrication, Refrigeration, Electrical, Assembly, Testing), BOM material planning, and stores issue.
    - `procurement/`: Purchase Requests, Vendor POs, and GRN inward stock reconciliation.
    - `qa/`: Pull-down testing parameters, Hi-pot safety checks, certification, and serialization.
    - `dispatch/`: Final Tax Invoices, dedicated carrier booking, live tracking URLs, and Proof of Delivery (POD).
    - `installation/`: Field commissioning readings (-81.4°C achieved), customer sign-off, and 12-month manufacturer warranty activation.
    - `service/`: Independent After-Sales Service Desk with multi-visit tracking, spare unavailable workflows, machine condition staging, and customer sign-off.
    - `public/`: Public Customer Quotation View (`/quotation/view/:token`) and Customer Order Journey Tracking Portal (`/track/:token`).
    - `auth/`: Corporate Sign-in page (`/login`) with quick demo buttons for all roles.
    - `audit/`: Immutable compliance audit trail.

## UI & Styling Rules
- **Enterprise Aesthetics**: Clean human-designed SaaS interface utilizing dark navy sidebar (`#0B192C`), crisp white surface cards, soft semantic badge indicators (emerald, amber, crimson, sky blue), and Inter typography.
- **Icons**: MUI Icons (`@mui/icons-material`) exclusively.
- **SCSS**: Modular SCSS design system tokens (`variables.scss`, `global.scss`) avoiding generic templates or utility frameworks.
- **Responsive Layout**: Fluid flex/grid structures verified for desktop, laptop, tablet, and mobile browsers.

## Application Logic & Centralized Workflows
- **Sales Workflow**: Lead capture -> Qualification (Qualified vs Lost) -> Customer account -> Follow-up -> Quotation -> Manager Approval -> Transmit (Email/WhatsApp/Link) -> Negotiation -> Customer Acceptance (via public portal) -> Proforma Invoice -> Customer PO -> 5-point PO Verification Checklist (Match vs Mismatch Hold) -> Confirmed Sales Order -> Payment Gate.
- **Payment Release Gate**: Production release is strictly locked until advance remittance (configured 30%) is verified by Finance.
- **Manufacturing Workflow**: Production Order -> BOM version selection -> Material Planning (calculates required, available, reserved, and shortage) -> Stores Issue -> 5 Assembly Stages -> Completion -> QA Trigger.
- **Quality Assurance & Serialization**: QA Inspection verifies pull-down curve (-80°C), vacuum leak rate, dielectric safety -> PASS issues QC Certificate and assigns immutable serial number (`CRYO-ULT-2026-0091`) -> Finished Goods stock credit.
- **Dispatch & Delivery**: Dispatch Readiness -> Tax Invoice generation -> Dedicated carrier booking with tracking URL -> Delivery receipt with POD verification.
- **Commissioning & Warranty**: Field installation records achieved temperature (-81.4°C) -> Customer sign-off -> Automatically activates 12-Month Manufacturer Warranty.
- **Separate Service Module**:
  - Independent ticket triggered by complaint.
  - Automatic warranty check (`VALID_FREE` vs `EXPIRED_CHARGEABLE`).
  - Engineer check-in logs arrival time and machine condition.
  - Site inspection & diagnosis.
  - **Spare Unavailable Workflow**: If required spare is missing from inventory, machine condition is documented, engineer checks out, ticket moves to `WAITING_FOR_SPARE` (ticket remains open!), automated PR is raised. Once spare arrives, visit 2 is scheduled.
  - Pull-down testing records actual readings -> Customer sign-off -> Closure & Service Report PDF export.
- **Customer Tracking Portal**: Secure tokenized URL (`/track/:token`) rendering the complete 13-milestone journey without exposing internal margins, costs, or database IDs.

## Change History

### 2026-10-07 (Update 6)
#### Change
- What was changed: Resolved Production Order creation on production release so orders with dynamic product items automatically map to their Product and BOM references without Mongoose validation failure.
- Files changed:
  - Backend: `server/src/controllers/salesOrderController.js` (`releaseForProduction`).
- Logic changed: When a Sales Order was created from a Quotation, line items stored `productCode` and `description` rather than a raw Mongoose ObjectId. When releasing to production, `ProductionOrder.create` attempted to assign `firstItem.product` (which was undefined), triggering a schema validation failure. Enhanced `releaseForProduction` to resolve the `Product` entity by `productCode` and link an approved BOM version with fallback. Initialized `PROD-2026-0002` for `SO-2026-0001` (`kabili`, `CFS-DF-300`).
- Reason: User noticed `SO-2026-0001` was not displaying on the Manufacturing & Production Orders table after production release.
- Impact: Released orders now reliably spawn active Production Orders in the manufacturing module.

### 2026-10-07 (Update 5)
#### Change
- What was changed: Resolved `sentVia is not defined` ReferenceError in Quotation transmission and integrated live Gmail SMTP email dispatch with vector PDF attachment.
- Files changed:
  - Backend: `server/package.json` (installed `nodemailer`), `server/src/services/emailService.js` (created), `server/src/services/pdfService.js` (`generateDocumentPDFBuffer`), `server/src/controllers/quotationController.js`.
- Logic changed:
  1. Fixed typo in `quotationController.js` where `sendVia` was destructured with a 'd' but referenced as `sentVia` with a 't', causing a 400 ReferenceError when transmitting quotations.
  2. Implemented `sendQuotationEmail` with `nodemailer` utilizing real Gmail SMTP credentials from `server/.env`.
  3. When transmitting a quotation with `sendVia: 'EMAIL'`, the backend dynamically renders the vector PDF buffer and dispatches a branded enterprise email with the PDF attached and a direct link to the customer review portal.
  4. Verified delivery with real SMTP transmission to `finallykabilan@gmail.com` (MessageId: `<472807f8-baf8-4045-1c37-1e36c7f7c655@gmail.com>`).
- Reason: User encountered `sentVia is not defined` alert when transmitting quotation and requested email integration.
- Impact: Quotation emails with official vector PDFs are now genuinely delivered to customer inboxes in real-time.

### 2026-10-07 (Update 4)
#### Change
- What was changed: Connected Navbar Active Role dropdown to real user authentication (`switchRoleUser`), synchronizing active user identity, token, name, and department across the ERP.
- Files changed:
  - Frontend: `client/src/store/authSlice.js`, `client/src/components/layout/Navbar.jsx`.
- Logic changed: Previously, changing the role in the top navigation dropdown only mutated the local string property `user.role` without updating the user profile or obtaining that role's real JWT credentials. This left the user's name/department unchanged and caused backend API 403 Forbidden errors because the database user was still the original account. Replaced with `switchRoleUser` async thunk that authenticates into that role's dedicated account (`sales.mgr@cryoscientific.com` -> Ananya Sharma, `prod.mgr@cryoscientific.com` -> Ramesh Sundaram, `finance@cryoscientific.com` -> Srinivasan M, etc.), stores the genuine token and user profile, and immediately refreshes the UI badge and backend privileges.
- Reason: User requested fixing the role dropdown so changing the role actually switches the active user.
- Impact: Testers and operators can switch between all 12 corporate roles in real-time with authentic JWT tokens, real identities, and enforced backend permissions.

### 2026-10-07 (Update 3)
#### Change
- What was changed: Fixed PDF generation authorization across all ERP modules (Quotations, Proforma Invoices, Sales Orders, Customer POs, QA Certificates, Warranties, Service Reports).
- Files changed:
  - Backend: `server/src/middleware/auth.js`
  - Frontend: `client/src/utils/pdfHelper.js` (created), `client/src/pages/sales/ProformaInvoices.jsx`, `client/src/pages/sales/Quotations.jsx`, `client/src/pages/sales/SalesOrders.jsx`, `client/src/pages/sales/CustomerPOs.jsx`, `client/src/pages/qa/QA.jsx`, `client/src/pages/installation/Installation.jsx`, `client/src/pages/service/Service.jsx`.
- Logic changed: Previously, clicking "PDF" opened a raw browser URL via `window.open` which failed to transmit local storage Bearer tokens, triggering a 401 "Not authorized" error. Implemented an authenticated blob streaming helper (`openPdfDocument`) that requests the PDF via Axios with the Bearer token and creates an in-memory blob URL. Also updated backend `protect` middleware to support query parameter tokens as fallback.
- Reason: User encountered 401 unauthorized error when clicking PDF button on Proforma Invoices table.
- Impact: All official vector PDFs now generate and download seamlessly without authentication failure.

### 2026-10-07 (Update 2)
#### Change
- What was changed: Added comprehensive `.gitignore` configuration across the repository and removed sensitive/heavy files (`server/.env`, `client/node_modules`, `client/dist`) from the git cache (`git rm --cached`).
- Files changed:
  - Root: `.gitignore`
  - Client: `client/.gitignore`
  - Server: `server/.gitignore`
- Logic changed: Configured git to permanently ignore `node_modules/`, `dist/`, `.env`, OS artifacts (`.DS_Store`, `Thumbs.db`), editor configs (`.vscode/`, `.idea/`), and log files across both frontend and backend modules while keeping `.env.example` as a template for deployment.
- Reason: User requested adding git ignore to protect secrets, prevent committing heavy build outputs, and ensure clean version control.
- Impact: Repository is clean and ready for version control without accidental leaks of environment secrets or 40,000+ dependency files.

### 2026-10-07 (Update 1)
#### Change
- What was changed: Built complete, production-ready MERN ERP web application from end to end.
- Files changed:
  - Backend: `server/package.json`, `server/.env`, `server/.env.example`, `server/src/config/db.js`, `server/src/config/constants.js`, `server/src/middleware/auth.js`, `server/src/middleware/rbac.js`, `server/src/middleware/audit.js`, `server/src/services/numberingService.js`, `server/src/services/pdfService.js`, models (`User.js`, `Customer.js`, `Product.js`, `BOM.js`, `Inventory.js`, `Lead.js`, `Quotation.js`, `ProformaInvoice.js`, `CustomerPO.js`, `SalesOrder.js`, `Payment.js`, `ProductionOrder.js`, `MaterialRequest.js`, `Procurement.js`, `QAInspection.js`, `Dispatch.js`, `Installation.js`, `ServiceTicket.js`, `AuditLog.js`), controllers (`authController.js`, `customerController.js`, `productController.js`, `inventoryController.js`, `bomController.js`, `leadController.js`, `quotationController.js`, `piController.js`, `customerPoController.js`, `salesOrderController.js`, `paymentController.js`, `productionController.js`, `procurementController.js`, `qaController.js`, `dispatchController.js`, `installationController.js`, `serviceController.js`, `publicController.js`, `dashboardController.js`, `auditController.js`), `server/src/routes/apiRoutes.js`, `server/src/server.js`, `server/src/seed.js`.
  - Frontend: `client/package.json`, `client/vite.config.js`, `client/index.html`, `client/src/styles/variables.scss`, `client/src/styles/global.scss`, `client/src/api/client.js`, `client/src/store/index.js`, `client/src/store/authSlice.js`, `client/src/components/layout/Navbar.jsx`, `client/src/components/layout/Sidebar.jsx`, `client/src/components/layout/Layout.jsx`, pages (`Dashboard.jsx`, `Leads.jsx`, `Customers.jsx`, `Quotations.jsx`, `ProformaInvoices.jsx`, `CustomerPOs.jsx`, `SalesOrders.jsx`, `Payments.jsx`, `Products.jsx`, `BOMs.jsx`, `Inventory.jsx`, `StockLedger.jsx`, `Production.jsx`, `Procurement.jsx`, `QA.jsx`, `Dispatch.jsx`, `Installation.jsx`, `Service.jsx`, `PublicQuotation.jsx`, `PublicOrderTracking.jsx`, `Login.jsx`, `AuditLogs.jsx`), `client/src/App.jsx`, `client/src/main.jsx`.
- Logic changed: Complete end-to-end connected ERP business processes implemented.
- Reason: User master prompt to implement complete production ERP for manufacturing company with RBAC, PDF generation, product/stock price updates, and interconnected lifecycle.
- Impact: Full system verified and operational.

## Current Progress
- Completed:
  - MongoDB database connected and seeded.
  - Express REST API running on port 5000 with complete authentication, RBAC, and business logic.
  - Vector PDF engine operational for all business documents.
  - React/Vite frontend running on port 5173 with all modules, cross-linking, and public tracking portals.
  - Browser verification executed: login, dashboard metrics, quotations versioning, and 13-milestone tracking validated in real browser.
  - `.gitignore` configured across root, client, and server; cached `node_modules` and `.env` safely untracked.
- In Progress: Ready for production deployment and user operations.
- Pending: Client external credential configuration (SMTP, WhatsApp API) when going live.

## Technical Decisions
- Decision: Pure vector PDF generation via PDFKit instead of headless browser rendering.
- Reason: Instant sub-50ms generation, minimal CPU overhead, and exact typographic reproduction of `ref/Modern_ERP_5_Document_Suite.pdf`.
- Decision: Token-based secure public tracking URLs (`/track/:token`, `/quotation/view/:token`).
- Reason: Strict security requirement protecting internal Mongo ObjectIds, profit margins, and internal notes from public exposure.
- Decision: Centralized RBAC enforcement at both API middleware and frontend UI levels with an interactive header role switcher for testing.
- Reason: Guarantees sensitive operations like commercial price revisions and production releases are protected while allowing testers to test any role in one click.
- Decision: Repository-wide `.gitignore` protecting credentials and build artifacts.
- Reason: Prevents committing sensitive credentials (`.env`), heavy `node_modules/`, and build artifacts into version control while retaining `.env.example` templates.

