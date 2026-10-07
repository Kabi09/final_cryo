# ERP — FULL END-TO-END BUSINESS WORKFLOW

**Project:** Cryo Scientific Systems ERP

## 1. Master Workflow

```text
LEAD / ENQUIRY
→ CONTACT
→ QUALIFICATION
→ CUSTOMER
→ FOLLOW-UP
→ QUOTATION
→ INTERNAL APPROVAL
→ SEND TO CUSTOMER
→ NEGOTIATION
→ CUSTOMER ACCEPTANCE / WON
→ PROFORMA INVOICE
→ CUSTOMER PO
→ PO VERIFICATION
→ SALES ORDER
→ PAYMENT / PAYMENT VERIFICATION
→ PRODUCTION RELEASE
→ PRODUCTION ORDER
→ PRODUCTION PLANNING
→ BOM / BOQ
→ BOM VERSION SELECTION
→ MATERIAL PLANNING
→ MATERIAL REQUEST
→ DEPARTMENT APPROVAL
→ INVENTORY / STOCK CHECK
→ PROCUREMENT IF REQUIRED
→ MATERIAL ISSUE
→ MATERIAL READINESS
→ PRODUCTION SCHEDULING
→ PRODUCTION START
→ FABRICATION
→ REFRIGERATION
→ ELECTRICAL
→ ASSEMBLY
→ MATERIAL CONSUMPTION
→ WIP
→ PRODUCTION COMPLETED
→ QA / TESTING
→ SERIAL NUMBER
→ FINISHED GOODS
→ DISPATCH READINESS
→ PACKING
→ FINAL INVOICE
→ DISPATCH
→ SHIPMENT / TRANSPORT
→ IN TRANSIT
→ DELIVERY
→ POD
→ INSTALLATION
→ COMMISSIONING
→ WARRANTY ACTIVATION
→ PROCESS COMPLETED
```

## 2. Sales Workflow

```text
01 LEAD / ENQUIRY
↓
02 CONTACT
↓
03 QUALIFICATION
├─ NOT QUALIFIED → LOST
└─ QUALIFIED
   ↓
04 EXISTING CUSTOMER?
├─ YES → SELECT CUSTOMER
└─ NO → CREATE CUSTOMER
   ↓
05 FOLLOW-UP
├─ NO RESPONSE → NEXT FOLLOW-UP → LOOP
├─ NOT INTERESTED → LOST
└─ INTERESTED
   ↓
06 QUOTATION
↓
07 INTERNAL APPROVAL
↓
08 SEND QUOTATION TO CUSTOMER
↓
09 NEGOTIATION
├─ ACCEPT → 11 CUSTOMER ACCEPTANCE / WON
├─ CHANGE → 10 QUOTATION REVISION → APPROVAL → SEND → NEGOTIATION
└─ REJECT → LOST / CLOSE
↓
12 PROFORMA INVOICE
↓
13 CUSTOMER PO
↓
14 PO VERIFICATION
├─ MISMATCH → HOLD → CORRECT → RE-VERIFY
└─ MATCH
   ↓
15 SALES ORDER
↓
16 PAYMENT / PAYMENT VERIFICATION
↓
17 PRODUCTION RELEASE
```

## 3. Production Workflow

```text
17 PRODUCTION RELEASE
↓
18 PRODUCTION ORDER
↓
19 PRODUCTION PLANNING
├─ Production Quantity
├─ Target Delivery Date
├─ Priority
├─ Work Center
├─ Assigned Team
├─ Duration
├─ Start Date
├─ Planned End Date
└─ Production Schedule
↓
20 BOM / BOQ
↓
21 BOM VERSION SELECTION
↓
22 MATERIAL PLANNING
├─ Required Quantity
├─ Scrap / Wastage
├─ Alternative Material
├─ Available Stock
├─ Reserved Stock
└─ Shortage Quantity
↓
23 MATERIAL REQUEST
↓
24 DEPARTMENT APPROVAL
↓
25 INVENTORY / STOCK CHECK
├─ FULL → RESERVE / ISSUE STOCK
├─ PARTIAL → ISSUE AVAILABLE → CALCULATE SHORTAGE → PROCUREMENT
└─ NONE → PROCUREMENT
↓
37 MATERIAL ISSUE
↓
38 MATERIAL READINESS
↓
39 PRODUCTION SCHEDULING
↓
40 PRODUCTION START
↓
41 FABRICATION
↓
42 REFRIGERATION
↓
43 ELECTRICAL
↓
44 ASSEMBLY
↓
45 MATERIAL CONSUMPTION
↓
46 WIP
↓
47 PRODUCTION COMPLETED
↓
48 QA / TESTING
```

## 4. Procurement Workflow

```text
MATERIAL SHORTAGE
↓
26 PURCHASE REQUEST
↓
27 PURCHASE APPROVAL
↓
28 RFQ
↓
29 VENDOR QUOTATIONS
↓
30 QUOTATION COMPARISON
↓
31 VENDOR SELECTION
↓
32 VENDOR PO
↓
33 SUPPLIER DELIVERY
↓
34 GRN / MRN
↓
35 STORE / INVENTORY
↓
36 MATERIAL AVAILABLE
↓
37 MATERIAL ISSUE
```

GRN should capture received, accepted, rejected and damaged quantities where applicable.

## 5. QA Workflow

```text
48 QA / TESTING
↓
QA RESULT
├─ PASS → CERTIFICATE
└─ FAIL → RECTIFICATION → RETEST
                     ├─ PASS → CERTIFICATE
                     └─ FAIL → REWORK / SCRAP
↓
SERIAL NUMBER ASSIGNMENT
↓
49 FINISHED GOODS / FINISHED GOODS STOCK
```

Production completion does not automatically make the product dispatch-ready. QA must pass.

## 6. Dispatch / Delivery / Installation / Warranty

```text
49 FINISHED GOODS
↓
50 DISPATCH READINESS CHECK
├─ READY
└─ NOT READY → CORRECTION / HOLD / RELEASE → RECHECK
↓
51 PACKING
↓
52 FINAL INVOICE
↓
53 DISPATCH
↓
54 SHIPMENT / TRANSPORT
↓
55 IN TRANSIT
↓
56 DELIVERY
↓
57 POD / PROOF OF DELIVERY
↓
58 INSTALLATION
↓
59 COMMISSIONING
↓
60 WARRANTY ACTIVATION
↓
PROCESS COMPLETED
```

If installation is not required, that step may be skipped according to the applicable business process.

## 7. Separate Service Module

Service is **not** an automatic next step after warranty activation. It is a separate after-sales module triggered by a customer complaint or service request.

```text
SERVICE DASHBOARD
↓
SERVICE REQUEST / CUSTOMER COMPLAINT
↓
SERVICE TICKET
↓
WARRANTY CHECK
├─ VALID WARRANTY → FREE SERVICE
└─ EXPIRED / NOT COVERED
   ↓
SERVICE QUOTATION
↓
CUSTOMER APPROVAL
↓
PAYMENT
↓
CHARGEABLE SERVICE
↓
SERVICE ASSIGNMENT
↓
SERVICE SCHEDULING
↓
ENGINEER / SERVICE PERSON
↓
CHECK-IN
↓
SITE / MACHINE INSPECTION
↓
DIAGNOSIS
↓
WORK DETAILS / FINDINGS
↓
SPARE / MATERIAL REQUIRED?
├─ NO → REPAIR
└─ YES → STOCK CHECK
          ├─ AVAILABLE → ISSUE SPARE
          └─ NOT AVAILABLE → PROCUREMENT → SPARE RECEIVED
↓
REPAIR
↓
SERVICE WORK
↓
TESTING / READINGS
├─ PASS → CUSTOMER SIGN-OFF
└─ FAIL → REPAIR AGAIN → RETEST
↓
SERVICE REPORT
↓
CHECK-OUT
↓
SERVICE CLOSED
```

## 8. Service Ticket States

```text
OPEN
↓
ASSIGNED
↓
SCHEDULED
↓
IN PROGRESS
↓
DIAGNOSIS
↓
WAITING FOR SPARE
↓
SPARE RECEIVED
↓
RE-SCHEDULED
↓
REPAIR
↓
TESTING
↓
CUSTOMER SIGN-OFF
↓
CLOSED
```

Additional controlled waiting states can include:

- WAITING FOR CUSTOMER
- WAITING FOR SITE ACCESS
- WAITING FOR APPROVAL
- WAITING FOR MACHINE
- WAITING FOR FACTORY

## 9. Service — Spare Not Available Scenario

If the engineer has already reached the customer and the required spare is unavailable:

```text
ENGINEER CHECK-IN
↓
DIAGNOSIS
↓
SPARE REQUIRED
↓
SPARE NOT AVAILABLE
↓
SERVICE CANNOT CONTINUE
↓
WORK STOPPED / VISIT ON HOLD
↓
RECORD CURRENT MACHINE CONDITION
↓
SERVICE PERSON CHECK-OUT
↓
SERVICE STATUS = WAITING FOR SPARE
↓
PROCUREMENT
↓
SPARE RECEIVED
↓
SERVICE VISIT RESCHEDULED
↓
ENGINEER ASSIGNMENT
↓
ENGINEER CHECK-IN
↓
SPARE ISSUE
↓
REPAIR
↓
TESTING
↓
CUSTOMER SIGN-OFF
↓
CHECK-OUT
↓
SERVICE REPORT
↓
SERVICE CLOSED
```

The ticket must **not** be closed just because a spare is unavailable.

## 10. Service — Multiple Visit Scenario

```text
SERVICE TICKET
↓
VISIT 1
↓
CHECK-IN
↓
INSPECTION
↓
DIAGNOSIS
↓
SPARE NOT AVAILABLE
↓
WAITING FOR SPARE
↓
CHECK-OUT
↓
PROCUREMENT
↓
SPARE RECEIVED
↓
VISIT 2
↓
CHECK-IN
↓
SPARE ISSUE
↓
REPAIR
↓
TESTING
↓
PASS
↓
CUSTOMER SIGN-OFF
↓
CHECK-OUT
↓
SERVICE CLOSED
```

One service ticket can contain multiple visits until successful completion.

## 11. Service Testing

Testing should preserve actual readings/results.

Example:

```text
Required Temperature : -80°C
Actual Temperature   : -81°C
Result               : PASS
```

```text
REPAIR
↓
TESTING / READINGS
├─ PASS → CUSTOMER SIGN-OFF
└─ FAIL → REPAIR AGAIN → RETEST
```

## 12. Factory Return Service

```text
SERVICE TICKET
↓
FACTORY RETURN
↓
RETURN RECEIVED
↓
INSPECTION
↓
REPAIR
↓
RETEST
↓
REDISPATCH
↓
CUSTOMER
↓
SIGN-OFF
↓
SERVICE CLOSED
```

## 13. Service Report

A service report should preserve:

- Service ticket
- Customer
- Product
- Serial number
- Warranty
- Engineer/service person
- Visit date
- Check-in time
- Check-out time
- Complaint
- Site/machine inspection
- Diagnosis
- Root cause
- Work performed
- Materials/spares used
- Test readings
- Photos/documents
- Customer sign-off
- Remarks

## 14. Service History and Maintenance

Service is operational work; warranty is coverage/entitlement.

```text
SERVICE CLOSED
↓
SERVICE HISTORY UPDATED
↓
├─ NO FURTHER ACTION
├─ FUTURE SERVICE → NEW SERVICE TICKET
└─ PREVENTIVE MAINTENANCE DUE → MAINTENANCE MODULE
```

Maintenance should not automatically start after every service closure.

## 15. Cross-Module Relationship

```text
Lead
↓
Quotation
↓
Customer Acceptance
↓
Proforma
↓
Customer PO
↓
Sales Order
↓
Production Order
↓
BOM
↓
Material Request
↓
Inventory Check
↓
Purchase Request (if shortage)
↓
Vendor PO
↓
GRN
↓
Inventory
↓
Material Issue
↓
Production
↓
QA
↓
Serial Number
↓
Finished Goods
↓
Packing
↓
Final Invoice
↓
Dispatch
↓
Delivery / POD
↓
Installation
↓
Commissioning
↓
Warranty
↓
Service Ticket — only when service is required
```

## 16. Main ERP Modules

```text
ERP
├── Dashboard
├── Sales
│   ├── Lead
│   ├── Customer
│   ├── Quotation
│   ├── Negotiation
│   ├── Quotation Revision
│   ├── Acceptance
│   ├── Proforma
│   ├── Customer PO
│   ├── PO Verification
│   ├── Sales Order
│   └── Payment
├── Production
│   ├── Production Order
│   ├── Production Planning
│   ├── BOM / BOQ
│   ├── BOM Version
│   ├── Material Planning
│   ├── Material Request
│   ├── Material Issue
│   ├── Production Scheduling
│   ├── Fabrication
│   ├── Refrigeration
│   ├── Electrical
│   ├── Assembly
│   ├── Material Consumption
│   └── WIP
├── Procurement
│   ├── Purchase Request
│   ├── Purchase Approval
│   ├── RFQ
│   ├── Vendor Quotations
│   ├── Quotation Comparison
│   ├── Vendor Selection
│   ├── Vendor PO
│   ├── Supplier Delivery
│   └── GRN / MRN
├── Inventory / Stores
│   ├── Stock
│   ├── Stock In
│   ├── Stock Out
│   ├── Material Issue
│   ├── Material Return
│   ├── Warehouse Transfer
│   ├── Stock Adjustment
│   └── Stock Balance
├── Quality
│   ├── QA / Testing
│   ├── Rectification
│   ├── Retest
│   ├── Certificate
│   └── Serial Traceability
├── Finance / Logistics
│   ├── Final Invoice
│   ├── Accounts
│   ├── Dispatch
│   ├── Shipment
│   ├── Delivery
│   └── POD
├── Installation / Warranty
│   ├── Installation
│   ├── Commissioning
│   └── Warranty
├── Service
│   ├── Service Dashboard
│   ├── Service Request
│   ├── Service Ticket
│   ├── Warranty Check
│   ├── Service Quotation
│   ├── Engineer Assignment
│   ├── Scheduling
│   ├── Check-in / Check-out
│   ├── Inspection
│   ├── Diagnosis
│   ├── Spare Parts
│   ├── Repair
│   ├── Testing
│   ├── Customer Sign-off
│   ├── Service Report
│   └── Service History
└── Controls
    ├── Users
    ├── Roles & Permissions
    ├── Approvals
    ├── Notifications
    ├── Audit Trail
    ├── Documents
    └── Reports
```

## 17. Important Business Rules

1. Do not build isolated CRUD pages. Transactions must link to their source and downstream records.
2. Do not overwrite commercial history; quotation revisions must be versioned.
3. Do not allow arbitrary status changes; use controlled transitions.
4. Critical actions require permission and audit logging.
5. Inventory changes must use controlled stock movements.
6. Serialised products must remain traceable through production, delivery, warranty and service.
7. Every important failure/exception needs an explicit recovery path.
8. Documents should be linked to their source record/version.
9. Dashboard metrics should be derived from transactions, not manually entered.
10. Service closure occurs only after the required repair/testing/customer sign-off process is completed.

## 18. Exception Paths

```text
PAYMENT FAILURE
MATERIAL SHORTAGE
PROCUREMENT DELAY
PRODUCTION HOLD
PRODUCTION DELAY
BOM REVISION
ALTERNATIVE MATERIAL
QA FAILURE
REWORK / SCRAP
DELIVERY FAILURE
INSTALLATION FAILURE
RMA
REPLACEMENT
CREDIT NOTE
REFUND
STOCK ADJUSTMENT
WAREHOUSE TRANSFER
VENDOR RETURN
SERVICE SPARE SHORTAGE
FACTORY RETURN
CUSTOMER SIGN-OFF FAILURE
```

## 19. Final Architecture

```text
                         SALES
                           ↓
                    CUSTOMER ORDER
                           ↓
                  PAYMENT VERIFICATION
                           ↓
                       PRODUCTION
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
         INVENTORY                 PROCUREMENT
              └────────────┬────────────┘
                           ↓
                    MATERIAL READY
                           ↓
                      MANUFACTURING
                           ↓
                       QA / TESTING
                           ↓
                     SERIAL NUMBER
                           ↓
                     FINISHED GOODS
                           ↓
                       PACKING
                           ↓
                    FINAL INVOICE
                           ↓
                       DISPATCH
                           ↓
                    DELIVERY / POD
                           ↓
                 INSTALLATION
                           ↓
                 COMMISSIONING
                           ↓
                WARRANTY ACTIVE
                           ↓
                   PROCESS COMPLETED

                CUSTOMER COMPLAINT
                         ↓
                   SERVICE MODULE
                         ↓
             TICKET → WARRANTY CHECK
                         ↓
          ENGINEER → INSPECTION → DIAGNOSIS
                         ↓
                SPARE / MATERIAL
                         ↓
                   REPAIR → TEST
                         ↓
                 SIGN-OFF → CLOSED
```

## 20. Final Business Journey

```text
CUSTOMER ENQUIRY
→ COMMERCIAL PROCESS
→ CUSTOMER ORDER
→ PAYMENT
→ PRODUCTION
→ MATERIAL / PROCUREMENT
→ MANUFACTURING
→ QUALITY
→ FINISHED PRODUCT
→ INVOICE
→ DISPATCH
→ DELIVERY
→ INSTALLATION
→ COMMISSIONING
→ WARRANTY
→ SERVICE WHEN REQUIRED
```

This document represents the current consolidated ERP workflow and keeps the main order lifecycle separate from the after-sales Service module.


# 21. CUSTOMER ORDER TRACKING PORTAL

The ERP should provide one secure, customer-facing tracking URL for each order.

Example:

`https://company.com/track/8F4K-92LM-X7PQ`

The customer should be able to follow the complete journey without logging into the internal ERP.

## Customer Timeline

```text
ENQUIRY RECEIVED
      ↓
PRODUCT / REQUIREMENT
      ↓
QUOTATION CREATED
      ↓
QUOTATION SENT
      ↓
QUOTATION ACCEPTED + DATE
      ↓
PROFORMA INVOICE
      ↓
CUSTOMER PO RECEIVED
      ↓
PO VERIFIED
      ↓
ORDER PLACED
      ↓
PAYMENT VERIFIED
      ↓
PRODUCTION RELEASED
      ↓
PRODUCTION STARTED
      ↓
PRODUCTION IN PROGRESS
      ↓
QA / TESTING
      ↓
QA PASSED
      ↓
FINISHED GOODS
      ↓
PACKING
      ↓
DISPATCH READY
      ↓
DISPATCHED
      ↓
SHIPMENT BOOKED
      ↓
TRACKING NUMBER / TRACKING URL
      ↓
IN TRANSIT
      ↓
OUT FOR DELIVERY
      ↓
DELIVERED
      ↓
POD
      ↓
INSTALLATION
      ↓
COMMISSIONING
      ↓
WARRANTY ACTIVATED
      ↓
ORDER COMPLETED
```

## Customer Tracking Example

```text
┌─────────────────────────────────────────────┐
│              YOUR ORDER STATUS              │
│                                             │
│ Order: SO-2026-00452                        │
│ Product: -80°C Deep Freezer                 │
│ Quantity: 2                                 │
│                                             │
│ ✓ Enquiry Received — 07 Oct 2026            │
│ ✓ Quotation Sent — 08 Oct 2026              │
│ ✓ Quotation Accepted — 10 Oct 2026          │
│ ✓ Proforma Invoice — 10 Oct 2026            │
│ ✓ Customer PO — 11 Oct 2026                 │
│ ✓ Order Placed — 12 Oct 2026                │
│ ✓ Payment Verified — 12 Oct 2026            │
│ ✓ Production Started — 15 Oct 2026          │
│ ● Production In Progress                    │
│ ○ QA / Testing                              │
│ ○ Ready for Dispatch                        │
│ ○ Dispatched                                │
│ ○ In Transit                                │
│ ○ Delivered                                 │
│ ○ Installation                              │
│ ○ Commissioning                             │
│ ○ Warranty Activated                        │
│                                             │
│              [ Track Shipment ]             │
│              [ View Documents ]             │
│              [ Contact Us ]                 │
└─────────────────────────────────────────────┘
```

## Shipment Tracking

When the parcel/product is booked with a courier or transport provider:

```text
DISPATCH
   ↓
COURIER / TRANSPORT BOOKING
   ↓
BOOKING CONFIRMED
   ↓
TRACKING NUMBER
   ↓
TRACKING URL
   ↓
CUSTOMER TRACKS SHIPMENT
```

Store:

```text
Transport / Courier Provider
Booking Number
Shipment Number
Tracking Number
Tracking URL
Booked Date
Expected Delivery Date
```

The ERP should store the real tracking URL supplied by the courier/transport provider. It must not invent tracking information.

Customer can click:

```text
[ Track Shipment ]
```

and open the provider's tracking page.

## Delivery Tracking

```text
DISPATCHED
   ↓
IN TRANSIT
   ↓
OUT FOR DELIVERY
   ↓
DELIVERED
   ↓
POD
```

Customer can see:

```text
✓ Dispatched
✓ In Transit
● Out for Delivery
○ Delivered
```

After delivery:

```text
DELIVERED
   ↓
POD
   ↓
[ View POD ]
```

## Customer-Facing Information

Recommended:

```text
✓ Enquiry date
✓ Product / requirement
✓ Quotation number/status
✓ Quotation accepted date
✓ Proforma status/date
✓ Customer PO number/date
✓ Order number/date
✓ Payment verification status
✓ Production status
✓ Expected production completion
✓ QA status
✓ Finished goods status
✓ Dispatch status
✓ Courier / transport provider
✓ Tracking number
✓ Tracking URL
✓ Expected delivery
✓ Delivery status
✓ POD
✓ Installation status
✓ Commissioning status
✓ Warranty status and dates
✓ Approved customer documents
```

Do not expose by default:

```text
✗ Internal notes
✗ Internal approval comments
✗ Supplier prices
✗ Purchase cost
✗ Internal margins
✗ Vendor quotation comparison
✗ Internal stock quantities
✗ Employee/internal operational details
✗ Internal audit information
```

## Secure Tracking URL

Do not expose database IDs such as:

```text
/track/123
/track/order/45
```

Use a random, unpredictable, revocable public token:

```text
/track/8F4K-92LM-X7PQ
```

Architecture:

```text
INTERNAL SALES ORDER
       ↓
SECURE PUBLIC TRACKING TOKEN
       ↓
CUSTOMER TRACKING URL
       ↓
PUBLIC TRACKING API
       ↓
CUSTOMER TRACKING PAGE
```

## Tracking Events

The customer timeline should be generated from ERP events rather than manually maintained.

```text
ERP TRANSACTION
      ↓
BUSINESS EVENT
      ↓
TRACKING EVENT
      ↓
CUSTOMER TIMELINE
```

Example event types:

```text
ENQUIRY_RECEIVED
QUOTATION_SENT
QUOTATION_ACCEPTED
PROFORMA_CREATED
CUSTOMER_PO_RECEIVED
PO_VERIFIED
ORDER_PLACED
PAYMENT_VERIFIED
PRODUCTION_STARTED
PRODUCTION_COMPLETED
QA_STARTED
QA_PASSED
READY_FOR_DISPATCH
DISPATCHED
SHIPMENT_BOOKED
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
POD_RECEIVED
INSTALLATION_SCHEDULED
INSTALLATION_COMPLETED
COMMISSIONING_COMPLETED
WARRANTY_ACTIVATED
```

## Customer Notifications

Important milestone changes can trigger:

```text
STATUS CHANGE
    ↓
NOTIFICATION
    ↓
EMAIL / SMS / WHATSAPP
    ↓
CUSTOMER
    ↓
TRACKING URL
```

Useful notifications:

```text
Quotation Sent
Quotation Accepted
Order Confirmed
Payment Verified
Production Started
Production Completed
QA Passed
Ready for Dispatch
Dispatched
In Transit
Out for Delivery
Delivered
Installation Scheduled
Installation Completed
Warranty Activated
```

## Tracking + Service

The same customer portal can later provide:

```text
ORDER TRACKING
      ↓
DELIVERY
      ↓
INSTALLATION
      ↓
WARRANTY
      ↓
[ RAISE SERVICE REQUEST ]
      ↓
SERVICE TICKET
      ↓
WARRANTY CHECK
      ↓
SERVICE WORKFLOW
```

The service request should automatically link:

```text
Customer
Sales Order
Product
Serial Number
Warranty
```

## Final Customer Experience

The goal is:

```text
ONE CUSTOMER
      ↓
ONE ORDER
      ↓
ONE SECURE TRACKING URL
      ↓
COMPLETE CUSTOMER JOURNEY
```

The customer should be able to answer:

```text
What did I enquire about?
When was the quotation sent?
When did I accept it?
When was my PO received?
When was the order placed?
Was payment verified?
Has production started?
What stage is production in?
Has QA passed?
Is the product ready?
Has it been dispatched?
Which courier/transport has it?
What is the tracking number?
Where is the shipment?
When was it delivered?
Can I view the POD?
When is installation?
Has commissioning completed?
When does warranty start/end?
How do I raise a service request?
```













┌──────────────────────────────┐
│ 01. LEAD / ENQUIRY           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 02. CONTACT                  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 03. QUALIFICATION            │
└──────────────┬───────────────┘
               │
          ┌────┴──────┐
          │           │
          ▼           ▼
   ┌────────────┐  ┌─────────────────────┐
   │ QUALIFIED  │  │ NOT QUALIFIED       │
   └─────┬──────┘  │ → LOST              │
         │         └─────────────────────┘
         ▼
┌──────────────────────────────┐
│ 04. EXISTING CUSTOMER?       │
└──────────────┬───────────────┘
               │
          ┌────┴─────┐
          │          │
         YES         NO
          │          │
          ▼          ▼
┌──────────────┐  ┌────────────────┐
│ SELECT       │  │ CREATE         │
│ CUSTOMER     │  │ CUSTOMER       │
└──────┬───────┘  └───────┬────────┘
       │                  │
       └────────┬─────────┘
                ▼
┌──────────────────────────────┐
│ 05. FOLLOW-UP                │
└──────────────┬───────────────┘
               │
       ┌───────┼────────────────┐
       │       │                │
       ▼       ▼                ▼
┌──────────┐ ┌────────────┐ ┌─────────────────┐
│ NO       │ │ INTERESTED │ │ NOT INTERESTED  │
│ RESPONSE │ │            │ │ → LOST          │
└────┬─────┘ └──────┬─────┘ └─────────────────┘
     │              │
     │              ▼
     │     ┌────────────────────────┐
     │     │ 06. QUOTATION          │
     │     └───────────┬────────────┘
     │                 ▼
     │     ┌────────────────────────┐
     │     │ 07. INTERNAL APPROVAL  │
     │     └───────────┬────────────┘
     │                 ▼
     │     ┌────────────────────────┐
     │     │ 08. SEND QUOTATION     │
     │     │     TO CUSTOMER        │
     │     └───────────┬────────────┘
     │                 ▼
     │     ┌────────────────────────┐
     │     │ 09. NEGOTIATION        │
     │     └───────────┬────────────┘
     │                 │
     │         ┌───────┼────────┐
     │         │       │        │
     │         ▼       ▼        ▼
     │      ACCEPT   CHANGE   REJECT
     │         │       │        │
     │         │       │        ▼
     │         │       │   ┌──────────────┐
     │         │       │   │ LOST / CLOSE │
     │         │       │   └──────────────┘
     │         │       │
     │         │       ▼
     │         │  ┌────────────────────┐
     │         │  │ 10. QUOTATION      │
     │         │  │     REVISION       │
     │         │  └─────────┬──────────┘
     │         │            ▼
     │         │  ┌────────────────────┐
     │         │  │ INTERNAL APPROVAL  │
     │         │  └─────────┬──────────┘
     │         │            ▼
     │         │  ┌────────────────────┐
     │         │  │ SEND TO CUSTOMER   │
     │         │  └─────────┬──────────┘
     │         │            │
     │         │            └──────► 09. NEGOTIATION ↺
     │         │
     │         ▼
     │  ┌────────────────────────────┐
     │  │ 11. CUSTOMER ACCEPTANCE    │
     │  │     / WON                  │
     │  └─────────────┬──────────────┘
     │                │
     │                ▼
     │  ┌────────────────────────────┐
     │  │ 12. PROFORMA INVOICE       │
     │  └─────────────┬──────────────┘
     │                │
     │                ▼
     │  ┌────────────────────────────┐
     │  │ 13. CUSTOMER PO            │
     │  └─────────────┬──────────────┘
     │                │
     │                ▼
     │  ┌────────────────────────────┐
     │  │ 14. PO VERIFICATION        │
     │  └─────────────┬──────────────┘
     │                │
     │           ┌────┴─────┐
     │           │          │
     │         MATCH      MISMATCH
     │           │          │
     │           │          ▼
     │           │     ┌──────────┐
     │           │     │ HOLD     │
     │           │     └────┬─────┘
     │           │          ▼
     │           │     ┌──────────┐
     │           │     │ CORRECT  │
     │           │     └────┬─────┘
     │           │          │
     │           │          └──► RE-VERIFY ↺
     │           │
     │           ▼
     │  ┌────────────────────────────┐
     │  │ 15. SALES ORDER            │
     │  └─────────────┬──────────────┘
     │                │
     │                ▼
     │  ┌────────────────────────────┐
     │  │ 16. PAYMENT / PAYMENT GATE │
     │  └─────────────┬──────────────┘
     │                │
     │                ▼
     │        NEXT: PRODUCTION ORDER
     │
     └──── NO RESPONSE
              │
              ▼
       NEXT FOLLOW-UP
              │
              └──────► 05. FOLLOW-UP ↺




















                         ┌──────────────────────────┐
                         │ 15. SALES ORDER          │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 16. PAYMENT /            │
                         │     PAYMENT VERIFICATION │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 17. PRODUCTION RELEASE   │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 18. PRODUCTION ORDER     │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 19. PRODUCTION PLANNING  │
                         └────────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │ Production Quantity                           │
              │ Target Delivery Date                          │
              │ Priority                                      │
              │ Work Center                                   │
              │ Assigned Team                                 │
              │ Duration                                      │
              │ Start Date                                    │
              │ Planned End Date                              │
              │ Production Schedule                           │
              └───────────────────────┬───────────────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 20. BOM / BOQ            │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 21. BOM VERSION         │
                         │     SELECTION            │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 22. MATERIAL PLANNING    │
                         └────────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │ Required Quantity                             │
              │ Scrap / Wastage                               │
              │ Alternative Material                          │
              │ Available Stock                               │
              │ Reserved Stock                                │
              │ Shortage Quantity                             │
              └───────────────────────┬───────────────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 23. MATERIAL REQUEST     │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 24. DEPARTMENT APPROVAL  │
                         └────────────┬─────────────┘
                                      ↓
                         ┌──────────────────────────┐
                         │ 25. INVENTORY /          │
                         │     STOCK CHECK          │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    │                 │                  │
                    ▼                 ▼                  ▼
             ┌────────────┐   ┌────────────┐    ┌────────────┐
             │    FULL    │   │   PARTIAL  │    │    NONE    │
             └─────┬──────┘   └─────┬──────┘    └─────┬──────┘
                   │                │                  │
                   ▼                ▼                  │
             ┌────────────┐   ┌────────────────┐      │
             │ RESERVE /  │   │ ISSUE          │      │
             │ ISSUE      │   │ AVAILABLE      │      │
             │ STOCK      │   │ STOCK          │      │
             └─────┬──────┘   └───────┬────────┘      │
                   │                   ▼               │
                   │           ┌────────────────┐      │
                   │           │ CALCULATE      │      │
                   │           │ SHORTAGE       │      │
                   │           └───────┬────────┘      │
                   │                   │               │
                   │                   ▼               │
                   │             PROCUREMENT ◄─────────┘
                   │                   │
                   └──────────┐        │
                              │        ▼
                              │  ┌──────────────────────┐
                              │  │ 26. PURCHASE REQUEST │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 27. PURCHASE         │
                              │  │     APPROVAL         │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 28. RFQ              │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 29. VENDOR           │
                              │  │     QUOTATIONS       │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 30. QUOTATION        │
                              │  │     COMPARISON       │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 31. VENDOR SELECTION │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 32. VENDOR PO        │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 33. SUPPLIER         │
                              │  │     DELIVERY         │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 34. GRN / MRN        │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 35. STORE /          │
                              │  │     INVENTORY        │
                              │  └──────────┬───────────┘
                              │             ↓
                              │  ┌──────────────────────┐
                              │  │ 36. MATERIAL         │
                              │  │     AVAILABLE        │
                              │  └──────────┬───────────┘
                              │             │
                              └─────────────┤
                                            ↓
                              ┌────────────────────────┐
                              │ 37. MATERIAL ISSUE     │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 38. MATERIAL           │
                              │     READINESS          │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 39. PRODUCTION         │
                              │     SCHEDULING         │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 40. PRODUCTION START   │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 41. FABRICATION        │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 42. REFRIGERATION      │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 43. ELECTRICAL         │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 44. ASSEMBLY           │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 45. MATERIAL           │
                              │     CONSUMPTION        │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 46. WIP                │
                              │     (WORK IN PROGRESS) │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 47. PRODUCTION         │
                              │     COMPLETED          │
                              └────────────┬───────────┘
                                           ↓
                              ┌────────────────────────┐
                              │ 48. QA / TESTING       │
                              └────────────┬───────────┘
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                              ▼                         ▼
                         ┌──────────┐             ┌──────────┐
                         │   PASS   │             │   FAIL   │
                         └────┬─────┘             └────┬─────┘
                              │                         │
                              ▼                         ▼
                    ┌──────────────────┐       ┌──────────────────┐
                    │ CERTIFICATE      │       │ RECTIFICATION    │
                    └────────┬─────────┘       └────────┬─────────┘
                             │                          │
                             ▼                          ▼
                    ┌──────────────────┐          ┌──────────────┐
                    │ FINISHED GOODS  │          │    RETEST    │
                    └──────────────────┘          └──────┬───────┘
                                                        │
                                               ┌────────┴────────┐
                                               │                 │
                                               ▼                 ▼
                                          ┌──────────┐     ┌──────────┐
                                          │   PASS   │     │   FAIL   │
                                          └────┬─────┘     └────┬─────┘
                                               │                │
                                               ▼                ▼
                                      ┌────────────────┐  ┌────────────────┐
                                      │ CERTIFICATE    │  │ REWORK / SCRAP │
                                      └───────┬────────┘  └────────────────┘
                                              │
                                              ▼
                                      ┌────────────────┐
                                      │ FINISHED GOODS │
                                      └────────────────┘


























┌──────────────────────────────┐
│ 48. QA / TESTING             │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       QA RESULT              │
└──────────────┬───────────────┘
               │
          ┌────┴────┐
          ↓         ↓
       ┌──────┐   ┌──────┐
       │ PASS │   │ FAIL │
       └──┬───┘   └──┬───┘
          │          │
          ↓          ↓
┌────────────────┐  ┌────────────────┐
│ CERTIFICATE    │  │ RECTIFICATION  │
└───────┬────────┘  └───────┬────────┘
        │                   ↓
        │              ┌──────────┐
        │              │  RETEST  │
        │              └────┬─────┘
        │                   │
        │              ┌────┴─────┐
        │              ↓          ↓
        │           ┌──────┐   ┌──────┐
        │           │ PASS │   │ FAIL │
        │           └──┬───┘   └──┬───┘
        │              │          │
        │              │          ↓
        │              │   ┌────────────────┐
        │              │   │ REWORK / SCRAP │
        │              │   └────────────────┘
        │              │
        └──────────────┘
               │
               ↓
┌──────────────────────────────┐
│ SERIAL NUMBER ASSIGNMENT     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 49. FINISHED GOODS           │
│     / FINISHED GOODS STOCK   │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 50. DISPATCH READINESS CHECK │
└──────────────┬───────────────┘
               ↓
       ┌───────┴────────┐
       ↓                ↓
   ┌────────┐      ┌──────────┐
   │ READY  │      │ NOT READY│
   └───┬────┘      └─────┬────┘
       │                  │
       │             CORRECTION /
       │             HOLD / RELEASE
       │                  │
       │                  └──────► DISPATCH
       │                           READINESS CHECK ↺
       ↓
┌──────────────────────────────┐
│ 51. PACKING                  │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 52. FINAL INVOICE            │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 53. DISPATCH                 │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 54. SHIPMENT / TRANSPORT     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 55. IN TRANSIT               │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 56. DELIVERY                 │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 57. POD                      │
│     PROOF OF DELIVERY        │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 58. INSTALLATION             │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 59. COMMISSIONING            │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ 60. WARRANTY ACTIVATION      │
└──────────────────────────────┘
               │
               ▼
        ┌─────────────────┐
        │    PROCESS      │
        │    COMPLETED    │
        └─────────────────┘



















SERVICE DASHBOARD
       ↓
SERVICE REQUEST / CUSTOMER COMPLAINT
       ↓
SERVICE TICKET
       ↓
WARRANTY CHECK
       │
       ├────────────── VALID WARRANTY
       │                     ↓
       │                FREE SERVICE
       │
       └────────────── EXPIRED / NOT COVERED
                             ↓
                      SERVICE QUOTATION
                             ↓
                      CUSTOMER APPROVAL
                             ↓
                          PAYMENT
                             ↓
                     CHARGEABLE SERVICE
                             ↓
                    SERVICE ASSIGNMENT
                             ↓
                    SERVICE SCHEDULING
                             ↓
                    ENGINEER / PERSON
                             ↓
                       CHECK-IN
                             ↓
                     SITE / MACHINE
                        INSPECTION
                             ↓
                         DIAGNOSIS
                             ↓
                    WORK DETAILS / FINDINGS
                             ↓
                 SPARE / MATERIAL REQUIRED?
                    │                 │
                   NO                YES
                    │                 ↓
                    │             STOCK CHECK
                    │                 ↓
                    │          ┌──────┴──────┐
                    │          ↓             ↓
                    │       AVAILABLE    NOT AVAILABLE
                    │          ↓             ↓
                    │      ISSUE SPARE   PROCUREMENT
                    │          │             ↓
                    │          │        SPARE RECEIVED
                    │          └──────┬──────┘
                    │                 ↓
                    └─────────────── REPAIR
                                      ↓
                               SERVICE WORK
                                      ↓
                              TESTING / READINGS
                                      ↓
                                ┌─────┴─────┐
                                ↓           ↓
                              PASS         FAIL
                                ↓           ↓
                         CUSTOMER SIGN-OFF  REPAIR AGAIN
                                ↓           ↓
                         SERVICE REPORT    RETEST
                                ↓
                         CHECK-OUT
                                ↓
                         SERVICE CLOSED






