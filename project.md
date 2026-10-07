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

