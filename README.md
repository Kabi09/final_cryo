# Cryo Scientific Systems ERP — Complete Production Suite

Enterprise Resource Planning web application built for **Cryo Scientific Systems Pvt Ltd**, manufacturing ultra-low temperature scientific freezers, biological cold storage, and hospital equipment.

---

## 🚀 Live Services & Architecture

- **Backend API Server**: `http://localhost:5000` (Node.js + Express + MongoDB + PDFKit)
- **Frontend Web Application**: `http://localhost:5173` (React 18 + Vite + Redux Toolkit + SCSS Modules)
- **Customer Order Tracking Portal**: `http://localhost:5173/track/:token`
- **Customer Quotation Review Portal**: `http://localhost:5173/quotation/view/:token`

---

## 🔑 Demo Access Credentials (Password for all: `password123`)

The application includes an **interactive RBAC role switcher in the top navigation bar** allowing instantaneous testing of any department.

| Role | Email | Department / Scope |
|---|---|---|
| **Super Admin** | `admin@cryoscientific.com` | Executive Management (Full Access) |
| **Sales Executive** | `sales@cryoscientific.com` | Commercial Lead Capture & Quotes |
| **Sales Manager** | `sales.mgr@cryoscientific.com` | Quote Approval, Revisions & Customers |
| **Production Manager** | `prod.mgr@cryoscientific.com` | BOM, Manufacturing & Floor Planning |
| **Store / Inventory** | `store@cryoscientific.com` | Stock In, Adjustments & Stores Issue |
| **Procurement** | `procurement@cryoscientific.com`| PRs, Vendor POs & GRN Inward |
| **Quality Assurance** | `qa@cryoscientific.com` | Pull-down testing, Certs & Serialization |
| **Finance / Accounts** | `finance@cryoscientific.com` | Payment verification, Pricing & Tax Invoices |
| **Dispatch / Logistics** | `dispatch@cryoscientific.com`| Dedicated carriers, Tracking & POD |
| **Service Engineer** | `engineer@cryoscientific.com` | Check-in, Diagnosis, Multi-visit & Sign-off |

---

## ⚙️ Running Locally

### 1. Database & Backend Server
```bash
# In server/
cd server
npm install
node src/seed.js    # Populates full catalog, users, stock, and sample orders
node src/server.js  # Starts Express server on port 5000
```

### 2. Frontend Client
```bash
# In client/
cd client
npm install
npm run dev         # Starts Vite dev server on port 5173
```

---

## 📦 Implemented Modules & Workflows

1. **Commercial Sales Pipeline**:
   - `Lead Capture` → `Qualification` (Qualified vs Lost) → `Customer Dossier (360°)` → `Follow-up Loops`
   - `Quotation Generation` → `Manager Approval` → `Transmission (Email/WhatsApp/Link)`
   - `Customer Review & Portal Acceptance` → `Quotation Revisions (R00, R01, etc.)`
   - `Proforma Invoice (PI)` generation with automatic 30% advance split
   - `Customer PO` with **5-Point Verification Checklist** (Match vs Mismatch Hold)
   - `Sales Order` with 360-degree traceability dossier
   - `Payment Gate`: Production release strictly unlocked upon 30% advance verification.

2. **Products, BOM & Dynamic Pricing**:
   - Equipment catalog with technical specifications
   - **RBAC-Protected Commercial Pricing Revisions** (audited with old/new prices)
   - Multi-level BOM with versioning (`V1`, `V2`) and work-center breakdowns.

3. **Stores & Inventory Control**:
   - Warehouse stock master with reorder-point & shortage alerts
   - **Stock In / Add Stock** receipt recording
   - **Stock Reconciliation & Adjustment**
   - Chronological, immutable **Stock Movement Ledger**.

4. **Manufacturing & Quality Assurance**:
   - 5-stage manufacturing: Fabrication → Refrigeration → Electrical → Assembly → Testing Pre-check
   - Automated BOM material requirement planning and stores issue
   - Quality inspection with real test readings (-80°C pull-down curve, vacuum, hi-pot 1500V)
   - Serialization assigning immutable serial numbers (`CRYO-ULT-2026-0091`) upon QA pass.

5. **Dispatch, Invoicing & Logistics**:
   - Statutory GST Final Tax Invoice generation
   - Carrier transport bookings with live tracking numbers & provider URLs
   - Proof of Delivery (POD) signature verification.

6. **Site Installation & Manufacturer Warranty**:
   - Engineer commissioning with achieved stabilization temperature (-81.4°C)
   - Automatic activation of 12-month manufacturer warranty.

7. **Dedicated After-Sales Service Operations Desk**:
   - Customer complaint logging
   - Automatic warranty coverage check (`VALID_FREE` vs `EXPIRED_CHARGEABLE`)
   - Engineer site check-in & condition logging
   - **Spare Unavailable Workflow**: Staging machine, checking out, moving to `WAITING_FOR_SPARE` without closing ticket, automated PR trigger, and rescheduling Visit 2 once received!
   - Actual test readings (-80°C PASS/FAIL) and customer digital sign-off.

8. **Document Generation Suite (Vector PDFKit)**:
   - Official document templates strictly modeled on client's `Modern_ERP_5_Document_Suite.pdf`:
     - Commercial Quotation & Revision
     - Proforma Invoice
     - Customer Purchase Order
     - Sales Order
     - Final Tax Invoice
     - Quality Inspection Certificate
     - Manufacturer Warranty Certificate
     - Service & Inspection Report.
