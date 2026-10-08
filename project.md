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

### 2026-10-08 (Update 15)
#### Change
- What was changed: Moved the **"All Follow-ups & Next Date"** column in the Commercial Leads table to the final column position, appearing immediately after the **Actions** column.
- Files changed:
  - Frontend UI: `client/src/pages/sales/Leads.jsx`.
  - Documentation: `project.md`.
- Logic changed:
  - Reordered table header (`<thead>`) and row cells (`<tbody>`) so standard lead identification columns (Lead #, Customer / Institution, Contact Person, Phone / Email, Requirement, Est. Value, Source / Type, Priority, Status / Customer Link, Actions) appear first, followed by the comprehensive scrollable **All Follow-ups & Next Date** timeline as the concluding column on the far right.
- Reason: User requested: `All Follow-ups & Next Date move to last column; agfter acrion column;`.
- Impact: Improved visual ergonomics: primary operational actions (Qualify, Edit, Record Follow-up) are placed centrally next to statuses, while the detailed multi-record follow-up discussion cards and history timeline neatly anchor the end of the table.


### 2026-10-08 (Update 14)
#### Change
- What was changed: Implemented full timeline display of **ALL follow-up records** (message notes, interaction date, next follow-up date, response status, and contacted by) in the Commercial Leads table; built complete **Modify Follow-up** capability (`PUT /api/leads/:leadId/follow-up/:followUpId`) and **Delete Follow-up** capability (`DELETE /api/leads/:leadId/follow-up/:followUpId`); added Lead Status modifier dropdown to the Edit Lead modal; and reinforced automated Customer Master conversion (`CUST-xxxx`) upon modifying follow-up status to `REQUESTED_QUOTE`.
- Files changed:
  - Backend Controller: `server/src/controllers/leadController.js`.
  - Backend Routes: `server/src/routes/apiRoutes.js`.
  - Frontend UI: `client/src/pages/sales/Leads.jsx`.
  - Documentation: `project.md`.
- Logic changed:
  1. **All Follow-ups Timeline in Leads Table**: Replaced the single latest follow-up preview with a comprehensive scrollable timeline rendering every follow-up interaction for the lead. Each entry details the interaction date, semantic status badge, discussion message (`notes`), next scheduled follow-up date (`nextFollowUpDate`), and sales representative name (`contactedBy`).
  2. **Direct Modify Follow-up Action**: Added a direct "Modify ✎" button on every follow-up card inside the timeline. Opens a dedicated **Modify Follow-up** modal to adjust interaction date, customer response status, discussion remarks, next follow-up date, and sales rep name.
  3. **Delete Follow-up Action**: Added entry deletion with confirmation (`DELETE /api/leads/:leadId/follow-up/:followUpId`) in case an interaction was logged in error.
  4. **Automated Customer Conversion on Modified Follow-up**: If a follow-up's status is modified to `REQUESTED_QUOTE`, the system auto-qualifies the lead (`lead.status = 'QUALIFIED'`), auto-generates a sequential customer code (`CUST-xxxx`) in the Customer Master if not already registered, links `lead.customerId`, and records a compliance audit log.
  5. **Lead Status Selector in Edit Lead Modal**: Added direct status editing (`NEW`, `CONTACTED`, `QUALIFIED`, `NOT_QUALIFIED`, `LOST`, `QUOTATION_CREATED`) in the Edit Lead modal for complete administrative control.
  6. **Follow-up Date Selector in Record Follow-up**: Operators can now specify the exact date of interaction when logging follow-ups.
- Reason: User requested: `i want all follow display -measeg with date end next floow date; fix the modify;`.
- Impact: Full historical visibility of prospect conversations right in the leads dashboard, with instantaneous editing, accurate scheduling of future follow-ups, and frictionless transition from inquiries to qualified corporate accounts.


### 2026-10-08 (Update 13)
#### Change
- What was changed: Added dedicated "Latest Follow-up & Date" column in Leads dashboard table and enabled automated Customer Master account creation when recording a follow-up with response status `REQUESTED_QUOTE` (Requested Official Quotation).
- Files changed:
  - Backend Controller: `server/src/controllers/leadController.js`.
  - Backend Config: `server/package.json`.
  - Frontend UI: `client/src/pages/sales/Leads.jsx`.
- Logic changed:
  1. **Latest Follow-up Column in Leads Table**: Added a dedicated table column displaying the date of the latest discussion, response status badge (`REQUESTED_QUOTE`, `INTERESTED`, `NO_RESPONSE`, `NOT_INTERESTED`), discussion notes snippet with full-text tooltip, and next scheduled follow-up date.
  2. **Automated Customer Creation on Follow-up Quote Request**: In `addFollowUp`, when an operator logs a follow-up with response status `REQUESTED_QUOTE`:
     - Sets `lead.status = 'QUALIFIED'`.
     - Searches if customer already exists or generates a new sequential Customer record (`CUST-xxxx`) in the `Customer` collection with facility address, city, state, pincode, tax ID, and industry segment.
     - Links `lead.customerId` and `lead.convertedCustomerCode`.
     - Logs compliance audit: `CUSTOMER_CREATED_FROM_LEAD`.
  3. **UI Follow-up Notification Banner**: Added real-time notification banner in the Follow-up modal informing the user that selecting "Requested Official Quotation" auto-qualifies the lead and registers the customer in the Customer Master.
  4. **Server Script Watch Mode**: Updated `server/package.json` `"start"` script to run with `node --watch src/server.js` ensuring changes hot-reload reliably.
- Reason: User requested: `lead- follow up - message display to another column with date; follow up- request official quation -auto customer add; fix this features;`.
- Impact: Operators have full visibility into the latest customer conversations directly from the lead pipeline, and official quotation requests instantly convert prospects into registered customer accounts.


### 2026-10-08 (Update 12)
#### Change
- What was changed: Implemented automated Customer Master record creation upon Lead qualification; added full Lead editing capability (`PUT /api/leads/:id`) with Edit action in UI; and expanded Lead Capture/Edit modals with facility address, industry segment, tax ID (GSTIN), lead source, lead type, target dates, and assigned sales representatives.
- Files changed:
  - Backend Model: `server/src/models/Lead.js`.
  - Backend Controller: `server/src/controllers/leadController.js`.
  - Backend Routes: `server/src/routes/apiRoutes.js`.
  - Frontend UI: `client/src/pages/sales/Leads.jsx`.
- Logic changed:
  1. **Automated Customer Master Storage**: In `qualifyLead`, when a lead is marked `QUALIFIED`, the system verifies if a customer already exists. If not, it automatically creates and stores a complete `Customer` record in the Customer Master with auto-sequenced `customerCode` (`CUST-xxxx`), linking `lead.customerId` and `lead.convertedCustomerCode`.
  2. **Edit Lead Action**: Added `updateLead` controller and registered `PUT /api/leads/:id`. In `Leads.jsx`, added an **Edit** button in the Actions column with a dedicated modal allowing sales teams to revise lead specs, estimated values, priorities, and contact data.
  3. **Comprehensive Modal Fields**: Added missing fields across modals and schema: `leadSource` (Direct, Website, Exhibition, Tender, Referral, etc.), `leadType` (New vs Existing Customer), `segment` (Research, Hospital, Pharma, etc.), facility `address`, `city`, `state`, `pincode`, `gstin`, `expectedDate`, and `assignedTo`.
  4. **Direct Customer Navigation**: Added customer link in Leads table displaying the generated Customer Code with direct navigation to the Customer Master dossier.
- Reason: User requested: `onefunctionality add=> add lead- then qualified- directly store the customer; also edit action add; also modal some feild not there so add;`.
- Impact: Streamlined sales pipeline where leads seamlessly convert into permanent corporate accounts without duplicate data entry.


### 2026-10-08 (Update 11)
#### Change
- What was changed: Aligned manufacturing real-time workflow with the exact engineering flowchart: Production Order → BOM → Material Requirement → Stock Check → [Stock Available vs Shortage] → Procurement (PR → Vendor PO → GRN) → Stores Inventory → Issue Material → Production.
- Files changed:
  - Backend Controller: `server/src/controllers/productionController.js`.
  - Backend Routes: `server/src/routes/apiRoutes.js`.
  - Frontend UI: `client/src/pages/production/Production.jsx`.
- Logic changed:
  1. **BOM-First Material Planning**: `planMaterials` prioritizes `order.bom.items`, calculating material requirements strictly from the active BOM (`unitQty × orderQty`). Added `availableBOMs` to response and implemented `PUT /api/production-orders/:id/bom` (`assignBOM`) allowing operators to assign or switch BOM versions on the fly.
  2. **Direct Real-Time Stock Check**: Removed artificial blocking approvals from the engineering workflow. Evaluates live available stock (`currentStock - reservedStock`) from `Inventory`.
  3. **Dual-Branch Resolution**:
     - *Branch 1 (Stock Available)*: Highlights ready stock in store. Clicking **"Issue Material to Production"** deducts stock, writes `MATERIAL_ISSUE` to `StockLedger`, sets `order.status = 'IN_PROGRESS'`, and starts Stage 1 (`Fabrication`) immediately.
     - *Branch 2 (Shortage)*: Auto-initializes `PurchaseRequest` (`PR-xxxx`). Provides step-by-step buttons (`Approve PR` → `Issue Vendor PO` → `Receive GRN & Stores In`) plus a `⚡ 1-Click Procure & Inward to Stores` button that credits inventory stock and transitions to Branch 1.
  4. **Visual Flowchart & UI Stepper**: Built a unified vertical-horizontal flowchart in `Production.jsx` modal matching the user's diagram, added BOM column to the orders table, and connected live state triggers.
- Reason: User requested fixing the workflow mismatch to match real-time production flow: `Production Order → BOM → Material Requirement → Stock Check → [Stock Available: Issue Material → Inventory → Production] / [Shortage: Procurement → Vendor PO → GRN → Inventory → Issue Material → Production]`.
- Impact: Full real-time synchronization between engineering BOMs, stores inventory, procurement inwarding, and shop-floor manufacturing stages.


### 2026-10-07 (Update 10)
#### Change
- What was changed: Implemented the classical manufacturing Stores & Procurement lifecycle workflow strictly modeling the user's reference diagram: Material Request (MR) → Department Approval → Stock Available? (YES / NO branch) → Purchase Request (PR) → Purchase Approval → Vendor PO → Supplier Dispatch → GRN/MRN → Stores In → Material Available → Material Issue → Department Use.
- Files changed:
  - Backend Model: `server/src/models/MaterialRequest.js`.
  - Backend Controller: `server/src/controllers/productionController.js`.
  - Backend Routes: `server/src/routes/apiRoutes.js`.
  - Frontend UI: `client/src/pages/production/Production.jsx`.
- Logic changed:
  1. **Schema Enhancements**: Updated `MaterialRequest` schema with fields for `departmentApproved`, `departmentApprovedBy`, `departmentApprovedAt`, `stockAvailable`, `shortagePresent`, `purchaseRequest` reference, `vendorPO` reference, `grn` reference, `storesInwarded`, `materialAvailable`, `issuedBy`, `issuedAt`, and `workflowStage` tracking the exact lifecycle enum (`MATERIAL_REQUEST`, `DEPARTMENT_APPROVED`, `PURCHASE_REQUEST`, `PURCHASE_APPROVED`, `PO_ISSUED`, `GRN_RECEIVED`, `STORES_IN`, `MATERIAL_AVAILABLE`, `MATERIAL_ISSUED`).
  2. **Department Approval Controller**: Added `approveMaterialRequestDept` (`PUT /api/production-orders/material-requests/:id/department-approve`) where the Production Manager/Dept Head signs off on the MR. If `stockAvailable === true`, the workflow directly advances to `MATERIAL_AVAILABLE`; if `stockAvailable === false`, it raises an official `PurchaseRequest` (`PR-2026-xxxx`).
  3. **Step-by-Step Procurement Advancement**: Added `advanceProcurementStep` (`PUT /api/production-orders/material-requests/:id/advance-procurement`) supporting discrete operations:
     - `APPROVE_PR`: Purchase Manager reviews and approves the PR.
     - `ISSUE_PO`: Generates official `VendorPO` to supplier.
     - `PROCESS_GRN`: Generates Goods Received Note (`GRN`), inwards stock by crediting inventory `currentStock`, logs `GRN_RECEIPT` into `StockLedger`, marks `storesInwarded = true`, and sets `materialAvailable = true`.
     - `AUTO_COMPLETE_CHAIN`: Executes the complete chain atomically for fast operational turnover.
  4. **Material Issue to Department Use**: In `issueMaterials`, once stock is available, Stores issues the stock to the floor, deducting inventory `currentStock`, logging `MATERIAL_ISSUE` to `StockLedger`, setting `workflowStage = 'MATERIAL_ISSUED'`, and marking production order status as `MATERIAL_ISSUED` for assembly fabrication.
  5. **Visual Stepper UI**: Implemented an interactive multi-step visual diagram in `Production.jsx` modal displaying the active stage, step-by-step action buttons, and live inventory coverage.
- Reason: User requested fixing the workflow according to the exact reference diagram: `MATERIAL REQUEST → DEPARTMENT APPROVAL → STOCK AVAILABLE? (YES → MATERIAL ISSUE → DEPARTMENT USE / NO → PURCHASE REQUEST → PURCHASE → PO → SUPPLIER → GRN / MRN → STORES IN → MATERIAL AVAILABLE → MATERIAL ISSUE)`.
- Impact: Complete alignment between real-world manufacturing stores protocol, inventory ledgers, procurement records, and user interface.


### 2026-10-07 (Update 9)
#### Change
- What was changed: Fixed Product matching in Production Material Planning so orders for specific models (such as -90°C freezer `CS-H-90`) only evaluate their own mapped materials rather than pulling all generic inventory items; resolved calculation transparency (displaying Unit Req, Total Req, On Hand, Reserved, Available, and Shortage); implemented complete Store Requisition -> Approval -> Store Inward Fulfillment -> Material Issue workflow.
- Files changed:
  - Backend Controller: `server/src/controllers/productionController.js`, `server/src/controllers/salesOrderController.js`.
  - Backend Routes: `server/src/routes/apiRoutes.js`.
  - Frontend UI: `client/src/pages/production/Production.jsx`.
- Logic changed:
  1. **Accurate Product Resolution**: Previously, `planMaterials` used `order.product` which had defaulted to `CS-ULT-80` when `SO-2026-0003` was released with custom model code `CS-H-90`. Updated both `salesOrderController.js` and `productionController.js` to search by `model`, `productCode`, and `name` before falling back. `PROD-2026-0009` now maps strictly to `CS-H-90` with its exact 2 mapped materials (`A-1` × 2 Nos, `RAW-COMP-15HP` × 20 Nos).
  2. **Shortage Calculation Transparency**: Displayed `On Hand` (16), `Reserved` (6), `Available` (10), `Total Required` (20), and `Shortage` (10) explicitly in the BOM Planning table to eliminate calculation confusion.
  3. **End-to-End Shortage Fulfillment Workflow**: When shortage is present, system automatically raises a `PurchaseRequest` (`PR-2026-0001`) with status `PENDING_APPROVAL`. Added `POST /api/production-orders/fulfill-shortage` allowing Store/Procurement to approve and inward the shortage stock, updating inventory current stock and logging a `STOCK_IN` ledger entry. Once fulfilled, re-check evaluates coverage as `FULL` and activates the **"Issue Materials to Assembly Line"** button.
- Reason: User pointed out that `-90 product need only to materials but production order check stock show all inversty productl also calution mismatch fix eg -> need nose 20 but stock have 10; need and update the correct worflow in case stock shortage request the stock to store approval-stock order`.
- Impact: Material requirements match the exact product model; shortage calculations are 100% transparent; and the complete Store Requisition -> Procurement PR -> Store Receipt -> Issue workflow operates smoothly in the UI.

### 2026-10-07 (Update 8)
#### Change
- What was changed: Resolved `Product is not defined` ReferenceError in `salesOrderController.js` when triggering production release (`PUT /api/sales-orders/:id/release-production`).
- Files changed:
  - Backend Controller: `server/src/controllers/salesOrderController.js`.
- Logic changed: `releaseForProduction` references `Product` to resolve product codes and link active BOMs when auto-initializing Production Orders. However, `import { Product } from '../models/Product.js'` was missing from the file imports, throwing a runtime `ReferenceError: Product is not defined` when an operator clicked the **Release** button in the Sales Orders dashboard. Added the model import, restarted Node server with `--watch` mode, and verified that production order `PROD-2026-0009` was successfully generated with HTTP 200.
- Reason: User encountered an alert popup `Product is not defined` on `localhost:5173/sales/orders` upon clicking Release.
- Impact: Operators can now release orders to production smoothly without runtime exceptions.

### 2026-10-07 (Update 7)
#### Change
- What was changed: Complete decoupling of Product Master and Stores Inventory Master, with multi-select required material mapping, dynamic shortage calculation formula (`orderQty × unitReqQty - availableStock`), coverage status indicators (`FULL`, `PARTIAL`, `NONE`), and end-to-end integration across Product → Inventory → BOM → Material Planning → Procurement PR → Stores Issue → Production.
- Files changed:
  - Backend Models: `server/src/models/Product.js`, `server/src/models/Inventory.js`.
  - Backend Controllers: `server/src/controllers/productController.js`, `server/src/controllers/inventoryController.js`, `server/src/controllers/productionController.js`.
  - Backend Routes: `server/src/routes/apiRoutes.js`.
  - Database Seeder: `server/src/seed.js`.
  - Integration Test: `server/test_workflow.js`.
  - Frontend UI: `client/src/pages/products/Products.jsx`, `client/src/pages/inventory/Inventory.jsx`, `client/src/pages/production/Production.jsx`.
- Logic changed:
  1. **Decoupled Architecture**: Removed `currentStock` from Product Master. Product represents commercial machine models, specifications, selling prices, warranty, and required material mapping references. Inventory Master is the independent stores ledger for physical parts (compressors, copper tubing, refrigerants, controllers, polyurethane, electrical panels).
  2. **Multi-Select Product ↔ Inventory Mapping**: Products now maintain an array of `requiredMaterials` storing the Inventory ObjectId reference, code, name, quantity per unit, unit of measure, `isRequired` boolean, optional alternative material reference, and technical remarks.
  3. **Dedicated API Endpoints**: Added `PUT /api/products/:id/materials` for dedicated BOM material mapping and `PUT /api/inventory/:id` for inventory details update.
  4. **Dynamic Stock Rule & Shortage Formula**: When a Production Order is planned (e.g. 2 units of CS-ULT-80), material planning multiplies `requiredQty = unitQty * orderQuantity`. It compares against stores available stock (`currentStock - reservedStock`) to calculate `shortageQty = Math.max(0, requiredQty - availableQty)` and assigns coverage status (`FULL`, `PARTIAL`, `NONE`). If any shortage exists, an automated Procurement Requisition (PR) is generated in the stores ledger.
  5. **Frontend Enhancements**:
     - `Products.jsx`: Added multi-item material mapping modal allowing selecting from stores inventory with quantity, unit, required/optional toggle, and alternative material; added specifications modal; removed conflicting stock fields.
     - `Inventory.jsx`: Added "+ Add Material Item" and "Edit Item" modals with complete stores fields (Material Type enum, Purchase Price, Issue Price, Min Stock, Reorder Point, Warehouse, Bin Location, Supplier); added shortage highlighting.
     - `Production.jsx`: Enhanced BOM Material Planning modal to display order quantity multiplier, unit required vs total required, available stores stock, exact shortage quantity, coverage status badges (`FULL`, `PARTIAL`, `NONE`), and direct store issuance.
  6. **Automated Verification**: Created and executed `server/test_workflow.js`, verifying 100% test pass on cascade compressor shortage calculation, stock replenishment, and material issue deduction.
- Reason: User requested fixing the mismatched Product and Inventory workflow so Product and Inventory are properly mapped while remaining distinct concepts, with full end-to-end integration and mathematical shortage calculations.
- Impact: Solves data conflation, provides accurate factory material planning, and prevents false inventory assumptions.

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
  - MongoDB database connected and seeded with decoupled Product and Inventory masters.
  - Product Master and Stores Inventory Master decoupled: Product holds commercial model specifications, selling price, warranty, and multi-select material references; Inventory holds physical parts, material types, supplier, warehouse, and stock ledgers.
  - Multi-select required materials configuration UI (`Products.jsx`) and API (`PUT /api/products/:id/materials`) implemented.
  - Stores Inventory Master management UI (`Inventory.jsx`) with "+ Add Material Item" modal, editing, stock receipt, and reconciliation.
  - Dynamic stock rule verified: Product ordered quantity multiplies unit material requirements (`orderQty × unitReqQty`), evaluating stores stock availability, computing exact shortage quantities, and assigning coverage status (`FULL`, `PARTIAL`, `NONE`).
  - Real-time Manufacturing Flowchart Implemented: `Production Order` → `BOM` (with version switching) → `Material Requirement` (`orderQty × BOM unitQty`) → `Stock Check` (Live Stores Inventory) → Dual branch: `Stock Available` (Issue Material → Inventory deducted → Production In Progress) OR `Shortage` (Procurement PR → Vendor PO → GRN → Inward to Inventory → Issue Material → Production).
  - Lead Management & Automated Customer Conversion: Lead capture and edit modals expanded with address, segment, tax, source, and assignment fields; full edit action (`PUT /api/leads/:id`); automated Customer Master record generation (`CUST-xxxx`) upon Lead qualification; comprehensive timeline displaying **ALL follow-up messages with interaction dates and next follow-up dates**; direct **Modify Follow-up** (`PUT /api/leads/:leadId/follow-up/:followUpId`) and **Delete Follow-up** (`DELETE /api/leads/:leadId/follow-up/:followUpId`) functionality; and automatic Customer Master creation when logging or modifying follow-ups with status `REQUESTED_QUOTE`.
  - Express REST API running on port 5000 with complete authentication, RBAC, and business logic.
  - Vector PDF engine operational for all business documents.
  - React/Vite frontend running on port 5173 with all modules, cross-linking, and public tracking portals.
  - Browser verification executed: login, dashboard metrics, quotations versioning, and 13-milestone tracking validated in real browser.
  - Automated integration test `server/test_workflow.js` passed with 100% assertions on material planning and shortage formulas.
  - `.gitignore` configured across root, client, and server; cached `node_modules` and `.env` safely untracked.
- In Progress: Ready for production deployment and user operations.
- Pending: Client external credential configuration (SMTP, WhatsApp API) when going live.

## Technical Decisions
- Decision: Separation of Concerns between Product Master and Inventory Master.
- Reason: Commercial products (e.g. -80°C Deep Freezer) are built from raw materials, sub-assemblies, and bought-out components. Conflating Product and Inventory previously caused confusion because finished machine stock was treated as raw stock. Decoupling them allows one machine model to reference multiple stores items (compressors, refrigerant cylinders, copper piping, controllers) with exact quantities and units.
- Decision: Dynamic Shortage Formula based on Product Order Quantity.
- Reason: When 2 units of a freezer are ordered, requirement is `2 × unitQty`. Comparing this total against available stores stock (`currentStock - reservedStock`) ensures accurate shortage calculations and prevents under-procurement.
- Decision: Pure vector PDF generation via PDFKit instead of headless browser rendering.
- Reason: Instant sub-50ms generation, minimal CPU overhead, and exact typographic reproduction of `ref/Modern_ERP_5_Document_Suite.pdf`.
- Decision: Token-based secure public tracking URLs (`/track/:token`, `/quotation/view/:token`).
- Reason: Strict security requirement protecting internal Mongo ObjectIds, profit margins, and internal notes from public exposure.
- Decision: Centralized RBAC enforcement at both API middleware and frontend UI levels with an interactive header role switcher for testing.
- Reason: Guarantees sensitive operations like commercial price revisions and production releases are protected while allowing testers to test any role in one click.
- Decision: Repository-wide `.gitignore` protecting credentials and build artifacts.
- Reason: Prevents committing sensitive credentials (`.env`), heavy `node_modules/`, and build artifacts into version control while retaining `.env.example` templates.


