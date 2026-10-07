import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Customer } from './models/Customer.js';
import { Product } from './models/Product.js';
import { BOM } from './models/BOM.js';
import { Inventory, StockLedger } from './models/Inventory.js';
import { Lead } from './models/Lead.js';
import { Quotation } from './models/Quotation.js';
import { ProformaInvoice } from './models/ProformaInvoice.js';
import { CustomerPO } from './models/CustomerPO.js';
import { SalesOrder } from './models/SalesOrder.js';
import { Payment } from './models/Payment.js';
import { ProductionOrder } from './models/ProductionOrder.js';
import { MaterialRequest } from './models/MaterialRequest.js';
import { PurchaseRequest, VendorPO, GRN } from './models/Procurement.js';
import { QAInspection, SerialNumber } from './models/QAInspection.js';
import { TaxInvoice, Shipment } from './models/Dispatch.js';
import { Installation, Warranty } from './models/Installation.js';
import { ServiceTicket } from './models/ServiceTicket.js';
import { AuditLog } from './models/AuditLog.js';
import { ROLES } from './config/constants.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cryo_erp');
    console.log('Connected to MongoDB for database seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      BOM.deleteMany({}),
      Inventory.deleteMany({}),
      StockLedger.deleteMany({}),
      Lead.deleteMany({}),
      Quotation.deleteMany({}),
      ProformaInvoice.deleteMany({}),
      CustomerPO.deleteMany({}),
      SalesOrder.deleteMany({}),
      Payment.deleteMany({}),
      ProductionOrder.deleteMany({}),
      MaterialRequest.deleteMany({}),
      PurchaseRequest.deleteMany({}),
      VendorPO.deleteMany({}),
      GRN.deleteMany({}),
      QAInspection.deleteMany({}),
      SerialNumber.deleteMany({}),
      TaxInvoice.deleteMany({}),
      Shipment.deleteMany({}),
      Installation.deleteMany({}),
      Warranty.deleteMany({}),
      ServiceTicket.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('Cleared existing data.');

    // 1. Seed Users for each department/role
    const demoPassword = 'password123';
    const usersData = [
      { name: 'Dr. Vikram Raman', email: 'admin@cryoscientific.com', role: ROLES.SUPER_ADMIN, department: 'Executive Management' },
      { name: 'Karthik Raja', email: 'sales@cryoscientific.com', role: ROLES.SALES, department: 'Sales & Marketing' },
      { name: 'Ananya Sharma', email: 'sales.mgr@cryoscientific.com', role: ROLES.SALES_MANAGER, department: 'Sales & Commercial' },
      { name: 'Ramesh Sundaram', email: 'prod.mgr@cryoscientific.com', role: ROLES.PRODUCTION_MANAGER, department: 'Plant Manufacturing' },
      { name: 'Murugan P', email: 'production@cryoscientific.com', role: ROLES.PRODUCTION, department: 'Assembly Floor' },
      { name: 'Senthil Kumar', email: 'store@cryoscientific.com', role: ROLES.STORE, department: 'Warehouse & Stores' },
      { name: 'Priya Narayanan', email: 'procurement@cryoscientific.com', role: ROLES.PROCUREMENT, department: 'Procurement' },
      { name: 'Rajesh V', email: 'qa@cryoscientific.com', role: ROLES.QA, department: 'Quality Assurance & Testing' },
      { name: 'Srinivasan M', email: 'finance@cryoscientific.com', role: ROLES.FINANCE, department: 'Accounts & Billing' },
      { name: 'Naveen Kumar', email: 'dispatch@cryoscientific.com', role: ROLES.DISPATCH, department: 'Logistics & Dispatch' },
      { name: 'Harish Babu', email: 'service.mgr@cryoscientific.com', role: ROLES.SERVICE_MANAGER, department: 'Customer Service' },
      { name: 'Deepak Raj', email: 'engineer@cryoscientific.com', role: ROLES.SERVICE_ENGINEER, department: 'Field Service Operations' }
    ];

    const users = [];
    for (const u of usersData) {
      const created = await User.create({ ...u, password: demoPassword });
      users.push(created);
    }
    console.log(`Seeded ${users.length} Users.`);

    // 2. Seed Customers
    const customer1 = await Customer.create({
      customerCode: 'CUST-0001',
      name: 'ABC Research Laboratories Pvt Ltd',
      contactPerson: 'Mr. Arun Kumar',
      email: 'arun.kumar@abcresearch.com',
      phone: '+91 98401 23456',
      address: 'Plot 45, Phase II, Guindy Industrial Estate',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600032',
      gstin: '33YYYYYYYYYY1Z8',
      segment: 'Research & Labs',
      publicToken: 'ABC8F4K92LM'
    });

    const customer2 = await Customer.create({
      customerCode: 'CUST-0002',
      name: 'Apex Apollo Specialty Hospitals',
      contactPerson: 'Dr. Suresh Varma',
      email: 'dr.suresh@apollohealth.org',
      phone: '+91 94440 98765',
      address: '21 Greams Lane, Thousand Lights',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600006',
      gstin: '33AAPCH9871P1Z2',
      segment: 'Hospital & Healthcare',
      publicToken: 'APX4K92LM7X'
    });
    console.log('Seeded Customers.');

    // 3. Seed Products
    const prod1 = await Product.create({
      productCode: 'CFS-ULT-500',
      name: 'Ultra Low Temperature Freezer (-80°C)',
      category: 'Ultra Low Temperature Freezer',
      model: 'CFS-ULT-500',
      brand: 'Cryo Scientific',
      description: 'Cascade refrigeration ultra-low temperature laboratory upright freezer (-50°C to -86°C). Designed for biological sample preservation.',
      unit: 'Units',
      baseCost: 165000,
      minSellingPrice: 220000,
      sellingPrice: 250000,
      taxRate: 18,
      warrantyMonths: 12,
      serialised: true,
      currentStock: 4,
      specifications: [
        { label: 'Temperature Range', value: '-50°C to -86°C (Setpoint -80°C)' },
        { label: 'Internal Capacity', value: '498 Litres / 17.6 Cu.Ft' },
        { label: 'Refrigeration System', value: 'Dual Stage Cascade Semi-Hermetic Compressors' },
        { label: 'Refrigerants', value: 'CFC/HCFC-Free Green Eco Blends (R404A / R508B)' },
        { label: 'Controller', value: '7-inch Touchscreen Microprocessor with USB logging' },
        { label: 'Dimensions (W x D x H)', value: '1120 mm x 980 mm x 1980 mm' },
        { label: 'Electrical Supply', value: '230V AC ± 10%, 50 Hz, Single Phase' }
      ]
    });

    const prod2 = await Product.create({
      productCode: 'CFS-DF-300',
      name: 'Biomedical Deep Freezer (-40°C)',
      category: 'Deep Freezer',
      model: 'CFS-DF-300',
      brand: 'Cryo Scientific',
      description: 'Heavy duty biomedical upright deep freezer for enzyme, plasma and test specimen storage.',
      unit: 'Units',
      baseCost: 95000,
      minSellingPrice: 125000,
      sellingPrice: 145000,
      taxRate: 18,
      warrantyMonths: 12,
      serialised: true,
      currentStock: 6,
      specifications: [
        { label: 'Temperature Range', value: '-20°C to -40°C' },
        { label: 'Capacity', value: '310 Litres' },
        { label: 'Power', value: '230V / 50Hz' }
      ]
    });

    const prod3 = await Product.create({
      productCode: 'CFS-BBR-450',
      name: 'Blood Bank Refrigerator (+4°C)',
      category: 'Blood Bank Refrigerator',
      model: 'CFS-BBR-450',
      brand: 'Cryo Scientific',
      description: 'Precision forced-air circulation blood bag storage refrigerator with 7-day temperature chart recorder.',
      unit: 'Units',
      baseCost: 110000,
      minSellingPrice: 155000,
      sellingPrice: 180000,
      taxRate: 18,
      warrantyMonths: 12,
      serialised: true,
      currentStock: 3,
      specifications: [
        { label: 'Temperature Range', value: '+2°C to +6°C (Target +4.0°C)' },
        { label: 'Bag Capacity', value: '240 Blood Bags (450ml)' },
        { label: 'Door', value: 'Heated Triple Pane Glass with self-closing hinge' }
      ]
    });
    console.log('Seeded Products.');

    // 4. Seed Inventory Materials & Stock
    const inventoryData = [
      { itemCode: 'RAW-SS-304', itemName: 'Stainless Steel Sheet SS304 1.2mm', category: 'RAW_MATERIAL', unit: 'Sheets', currentStock: 120, reservedStock: 20, minStockLevel: 25, reorderPoint: 40, unitCost: 3200 },
      { itemCode: 'RAW-COMP-15HP', itemName: 'Hermetic Cascade Compressor 1.5HP', category: 'RAW_MATERIAL', unit: 'Nos', currentStock: 18, reservedStock: 6, minStockLevel: 4, reorderPoint: 8, unitCost: 42000 },
      { itemCode: 'RAW-REF-R508B', itemName: 'Ultra-Low Cryo Refrigerant R508B (Cylinder 5kg)', category: 'RAW_MATERIAL', unit: 'Cylinders', currentStock: 14, reservedStock: 4, minStockLevel: 3, reorderPoint: 6, unitCost: 18500 },
      { itemCode: 'RAW-REF-R404A', itemName: 'First Stage Refrigerant R404A (10kg)', category: 'RAW_MATERIAL', unit: 'Cylinders', currentStock: 22, reservedStock: 4, minStockLevel: 5, reorderPoint: 10, unitCost: 6500 },
      { itemCode: 'RAW-PUF-FOAM', itemName: 'High Density Polyurethane PUF Chemical Set', category: 'RAW_MATERIAL', unit: 'Drums', currentStock: 35, reservedStock: 10, minStockLevel: 8, reorderPoint: 15, unitCost: 14000 },
      { itemCode: 'ELEC-PID-TOUCH', itemName: '7-inch Touchscreen Microprocessor Controller', category: 'RAW_MATERIAL', unit: 'Nos', currentStock: 25, reservedStock: 5, minStockLevel: 5, reorderPoint: 10, unitCost: 16500 },
      { itemCode: 'ELEC-PT100-SEN', itemName: 'Class A RTD PT-100 Ultra Cryo Temperature Sensor', category: 'RAW_MATERIAL', unit: 'Nos', currentStock: 60, reservedStock: 12, minStockLevel: 15, reorderPoint: 25, unitCost: 2800 },
      { itemCode: 'SPARE-EXP-VALV', itemName: 'Cryogenic Electronic Expansion Valve 0.5T', category: 'SPARE_PART', unit: 'Nos', currentStock: 8, reservedStock: 1, minStockLevel: 2, reorderPoint: 5, unitCost: 11500 },
      { itemCode: 'SPARE-DOOR-GSK', itemName: 'Magnetic Heated Silicon Door Gasket Set (CFS-500)', category: 'SPARE_PART', unit: 'Sets', currentStock: 15, reservedStock: 2, minStockLevel: 3, reorderPoint: 6, unitCost: 5200 },
      { itemCode: 'CFS-ULT-500', itemName: 'Ultra Low Temperature Freezer (-80°C) Model CFS-ULT-500', category: 'FINISHED_GOODS', unit: 'Units', currentStock: 4, reservedStock: 1, minStockLevel: 2, reorderPoint: 3, unitCost: 165000 }
    ];

    for (const inv of inventoryData) {
      await Inventory.create(inv);
      await StockLedger.create({
        itemCode: inv.itemCode,
        itemName: inv.itemName,
        transactionType: 'STOCK_IN',
        quantity: inv.currentStock,
        previousStock: 0,
        newStock: inv.currentStock,
        referenceType: 'MANUAL',
        remarks: 'Initial factory inventory setup',
        performedBy: 'System Seed'
      });
    }
    console.log('Seeded Inventory & Stock Ledgers.');

    // 5. Seed BOM for CFS-ULT-500
    const bom1 = await BOM.create({
      bomNumber: 'BOM-2026-0001',
      product: prod1._id,
      version: 'V1',
      title: 'Ultra Low Freezer CFS-ULT-500 Standard Production BOM',
      status: 'APPROVED',
      items: [
        { materialCode: 'RAW-SS-304', materialName: 'Stainless Steel Sheet SS304 1.2mm', quantity: 6, unit: 'Sheets', unitCost: 3200, workCenter: 'Fabrication' },
        { materialCode: 'RAW-PUF-FOAM', materialName: 'High Density Polyurethane PUF Chemical Set', quantity: 1, unit: 'Drums', unitCost: 14000, workCenter: 'Fabrication' },
        { materialCode: 'RAW-COMP-15HP', materialName: 'Hermetic Cascade Compressor 1.5HP', quantity: 2, unit: 'Nos', unitCost: 42000, workCenter: 'Refrigeration' },
        { materialCode: 'RAW-REF-R508B', materialName: 'Ultra-Low Cryo Refrigerant R508B', quantity: 1, unit: 'Cylinders', unitCost: 18500, workCenter: 'Refrigeration' },
        { materialCode: 'RAW-REF-R404A', materialName: 'First Stage Refrigerant R404A', quantity: 1, unit: 'Cylinders', unitCost: 6500, workCenter: 'Refrigeration' },
        { materialCode: 'ELEC-PID-TOUCH', materialName: '7-inch Touchscreen Controller', quantity: 1, unit: 'Nos', unitCost: 16500, workCenter: 'Electrical' },
        { materialCode: 'ELEC-PT100-SEN', materialName: 'Class A RTD PT-100 Sensor', quantity: 2, unit: 'Nos', unitCost: 2800, workCenter: 'Electrical' }
      ],
      totalEstimatedCost: 151500,
      approvedBy: users[0]._id,
      approvedAt: new Date()
    });
    console.log('Seeded BOM.');

    // 6. Seed Complete End-to-End Workflow Order 1 (Matching Modern_ERP_5_Document_Suite.pdf)
    // Quotation QT-2026-014
    const quotation1 = await Quotation.create({
      quotationNumber: 'QT-2026-014',
      baseQuotationNumber: 'QT-2026-014',
      revisionNumber: 'R00',
      customer: customer1._id,
      customerSnapshot: {
        name: customer1.name,
        contactPerson: customer1.contactPerson,
        email: customer1.email,
        phone: customer1.phone,
        address: `${customer1.address}, ${customer1.city}, ${customer1.state} - ${customer1.pincode}`,
        gstin: customer1.gstin
      },
      validityDate: new Date('2026-10-21'),
      items: [
        {
          product: prod1._id,
          productCode: 'CFS-ULT-500',
          description: 'Ultra Low Temperature Freezer (-80°C) Model CFS-ULT-500',
          quantity: 1,
          unit: 'Units',
          unitPrice: 250000,
          discount: 10000,
          taxRate: 18,
          taxableAmount: 240000,
          taxAmount: 43200,
          totalAmount: 283200
        }
      ],
      totalDiscount: 10000,
      taxableAmount: 240000,
      taxAmount: 43200,
      grandTotal: 283200,
      paymentTerms: '30% advance on order confirmation. Balance as per agreed delivery/payment milestone.',
      deliveryPeriod: '6–8 weeks.',
      warrantyTerms: '12 Months comprehensive manufacturer warranty.',
      notes: 'Quotation validity and pricing are subject to the terms stated above.',
      status: 'REVISED', // Revised to R01
      publicToken: 'QT8F4K92LM01'
    });

    // Quotation Revision QT-2026-014-R01 (Accepted by customer)
    const quotationRevision = await Quotation.create({
      quotationNumber: 'QT-2026-014-R01',
      baseQuotationNumber: 'QT-2026-014',
      revisionNumber: 'R01',
      customer: customer1._id,
      customerSnapshot: quotation1.customerSnapshot,
      validityDate: new Date('2026-10-21'),
      items: quotation1.items,
      totalDiscount: 10000,
      taxableAmount: 240000,
      taxAmount: 43200,
      grandTotal: 283200,
      paymentTerms: '30% advance on order confirmation. Balance as per agreed delivery/payment milestone.',
      deliveryPeriod: '6–8 weeks.',
      warrantyTerms: '12 Months comprehensive manufacturer warranty.',
      notes: 'Revision R01 approved with requested commercial terms.',
      revisionReason: 'Customer requested commercial discount confirmation.',
      previousRevisionId: quotation1._id,
      status: 'ACCEPTED',
      approval: { status: 'APPROVED', approvedBy: 'Ananya Sharma', approvedAt: new Date('2026-10-07T10:00:00Z') },
      customerResponse: {
        status: 'ACCEPTED',
        respondedAt: new Date('2026-10-07T11:30:00Z'),
        comments: 'Accepted. Please issue Proforma Invoice for advance payment processing.',
        ipAddress: '122.178.44.12'
      },
      publicToken: 'QT8F4K92LMR1'
    });

    // Proforma Invoice PI-2026-001
    const pi1 = await ProformaInvoice.create({
      piNumber: 'PI-2026-001',
      quotation: quotationRevision._id,
      quotationNumber: quotationRevision.quotationNumber,
      customer: customer1._id,
      piDate: new Date('2026-10-07'),
      items: quotationRevision.items,
      totalDiscount: 10000,
      taxableAmount: 240000,
      taxAmount: 43200,
      grandTotal: 283200,
      advancePercent: 30,
      advanceAmount: 84960,
      balanceAmount: 198240,
      paymentTerms: 'Advance (30%) ₹84,960.00; Balance ₹198,240.00 before dispatch.',
      status: 'PO_RECEIVED',
      publicToken: 'PI8F4K92LM01'
    });

    // Customer PO PO-2026-0098
    const customerPo1 = await CustomerPO.create({
      poNumber: 'PO-2026-0098',
      poDate: new Date('2026-10-07'),
      proformaInvoice: pi1._id,
      quotation: quotationRevision._id,
      customer: customer1._id,
      orderValue: 283200,
      deliveryAddress: 'ABC RESEARCH LABORATORIES PVT LTD, Industrial Estate, Guindy, Chennai, Tamil Nadu',
      verificationStatus: 'MATCHED',
      verificationChecklist: {
        quantityMatch: true,
        priceMatch: true,
        specMatch: true,
        termsMatch: true,
        taxMatch: true
      },
      verifiedBy: 'Ananya Sharma',
      verifiedAt: new Date('2026-10-07T13:00:00Z'),
      salesOrderGenerated: true
    });

    // Sales Order SO-2026-0042
    const salesOrder1 = await SalesOrder.create({
      soNumber: 'SO-2026-0042',
      orderDate: new Date('2026-10-07'),
      customer: customer1._id,
      quotation: quotationRevision._id,
      quotationNumber: quotationRevision.quotationNumber,
      proformaInvoice: pi1._id,
      customerPO: customerPo1._id,
      customerPONumber: customerPo1.poNumber,
      items: quotationRevision.items,
      totalTaxable: 240000,
      totalTax: 43200,
      grandTotal: 283200,
      advanceRequired: 84960,
      advancePaid: 84960,
      balanceDue: 198240,
      paymentStatus: 'ADVANCE_VERIFIED',
      productionStatus: 'COMPLETED',
      qaStatus: 'PASSED',
      dispatchStatus: 'DELIVERED',
      installationStatus: 'COMPLETED',
      warrantyStatus: 'ACTIVE',
      currentStage: 'WARRANTY_ACTIVE',
      deliveryAddress: customerPo1.deliveryAddress,
      publicTrackingToken: 'TRACK8F4K92LMX7'
    });

    // Payment Record
    await Payment.create({
      paymentNumber: 'PAY-2026-0014',
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      customer: customer1._id,
      paymentType: 'ADVANCE',
      amount: 84960,
      paymentMode: 'NEFT',
      referenceNumber: 'AXISB2026100700984',
      status: 'VERIFIED',
      verifiedBy: 'Srinivasan M',
      verifiedAt: new Date('2026-10-07T14:00:00Z')
    });

    // Production Order PROD-2026-0001
    const prodOrder1 = await ProductionOrder.create({
      productionNumber: 'PROD-2026-0001',
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      product: prod1._id,
      productName: prod1.name,
      model: prod1.model,
      quantity: 1,
      targetDeliveryDate: new Date('2026-11-20'),
      workCenter: 'Cryo Cleanroom Line 1',
      assignedTeam: 'Cryo Team Alpha',
      bom: bom1._id,
      bomVersion: bom1.version,
      status: 'COMPLETED',
      stages: [
        { name: 'Fabrication', status: 'COMPLETED', assignedEngineer: 'Murugan P', startedAt: new Date('2026-10-07T08:00:00Z'), completedAt: new Date('2026-10-07T10:00:00Z'), remarks: 'SS304 chamber formed and PUF insulated' },
        { name: 'Refrigeration', status: 'COMPLETED', assignedEngineer: 'Murugan P', startedAt: new Date('2026-10-07T10:00:00Z'), completedAt: new Date('2026-10-07T12:00:00Z'), remarks: 'Cascade loop leak tested with dry nitrogen, charged with R404A/R508B' },
        { name: 'Electrical', status: 'COMPLETED', assignedEngineer: 'Murugan P', startedAt: new Date('2026-10-07T12:00:00Z'), completedAt: new Date('2026-10-07T13:30:00Z'), remarks: 'PID touchscreen board calibrated' },
        { name: 'Assembly', status: 'COMPLETED', assignedEngineer: 'Murugan P', startedAt: new Date('2026-10-07T13:30:00Z'), completedAt: new Date('2026-10-07T15:00:00Z'), remarks: 'Door gaskets & handles installed' },
        { name: 'Testing & QA Pre-check', status: 'COMPLETED', assignedEngineer: 'Murugan P', startedAt: new Date('2026-10-07T15:00:00Z'), completedAt: new Date('2026-10-07T16:00:00Z'), remarks: 'Pull-down test reached -81.2°C' }
      ]
    });

    // QA Inspection QA-2026-0001
    const qa1 = await QAInspection.create({
      qaNumber: 'QA-2026-0001',
      productionOrder: prodOrder1._id,
      productionNumber: prodOrder1.productionNumber,
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      product: prod1._id,
      productName: prod1.name,
      model: prod1.model,
      assignedSerialNumber: 'CRYO-ULT-2026-0091',
      parameters: [
        { parameter: 'Cascade Refrigeration Pull-down', specification: 'Reach -80.0°C within 180 mins', actualReading: '-81.2°C achieved in 134 mins', result: 'PASS' },
        { parameter: 'Vacuum Insulation Leak Rate', specification: '< 0.005 mbar/sec', actualReading: '0.0011 mbar/sec', result: 'PASS' },
        { parameter: 'High-Potential (Hi-Pot) Dielectric Test', specification: '1500V AC dielectric withstand', actualReading: 'Leakage 0.28mA (PASS)', result: 'PASS' },
        { parameter: 'Sound Acoustic Test', specification: '< 52 dBA at 1 meter', actualReading: '48.2 dBA', result: 'PASS' },
        { parameter: 'Power Interruption Alarm Check', specification: 'Battery backup audio/visual trigger', actualReading: 'Audible alarm in 1.5s', result: 'PASS' }
      ],
      overallResult: 'PASS',
      certificateNumber: 'QC-CERT-2026-0014',
      certificateIssuedAt: new Date('2026-10-07T16:30:00Z'),
      inspectorName: 'Rajesh V',
      inspectedAt: new Date('2026-10-07T16:30:00Z')
    });

    // Serial Number
    const serial1 = await SerialNumber.create({
      serialNumber: 'CRYO-ULT-2026-0091',
      product: prod1._id,
      productName: prod1.name,
      model: prod1.model,
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      customer: customer1._id,
      qaInspection: qa1._id,
      manufactureDate: new Date('2026-10-07'),
      status: 'INSTALLED_ACTIVE',
      location: 'ABC Research Laboratories - Main Biosafety Lab 3',
      warrantyStart: new Date('2026-10-07'),
      warrantyEnd: new Date('2027-10-07')
    });

    // Final Tax Invoice INV-2026-0042
    await TaxInvoice.create({
      invoiceNumber: 'INV-2026-0042',
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      customer: customer1._id,
      invoiceDate: new Date('2026-10-07'),
      items: [
        {
          productCode: prod1.model,
          description: `${prod1.name} (S/N: ${serial1.serialNumber})`,
          serialNumber: serial1.serialNumber,
          quantity: 1,
          unit: 'Units',
          unitPrice: 240000,
          taxableAmount: 240000,
          taxAmount: 43200,
          totalAmount: 283200
        }
      ],
      taxableAmount: 240000,
      taxAmount: 43200,
      grandTotal: 283200,
      paymentTerms: 'Full Payment Received',
      status: 'PAID'
    });

    // Shipment & Courier Tracking SHIP-2026-0014
    await Shipment.create({
      shipmentNumber: 'SHIP-2026-0014',
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      customer: customer1._id,
      serialNumbers: [serial1.serialNumber],
      carrierType: 'DEDICATED_TRANSPORT',
      carrierName: 'VRL Logistics Heavy Cargo',
      bookingNumber: 'VRL-BLR-CHE-9844',
      trackingNumber: 'VRL9844CHE',
      trackingUrl: 'https://www.vrllogistics.com/track?lr=VRL9844CHE',
      dispatchDate: new Date('2026-10-07T17:00:00Z'),
      actualDeliveryDate: new Date('2026-10-07T19:00:00Z'),
      status: 'DELIVERED',
      podReceived: true,
      podReceiverName: 'S. Ramanathan (Lab Stores In-charge)',
      podDate: new Date('2026-10-07T19:15:00Z'),
      remarks: 'Delivered in mint condition on air-cushioned hydraulic vehicle.'
    });

    // Installation & Commissioning INST-2026-001
    await Installation.create({
      installationNumber: 'INST-2026-001',
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      customer: customer1._id,
      serialNumber: serial1.serialNumber,
      productName: prod1.name,
      assignedEngineer: 'Deepak Raj',
      engineerPhone: '+91 98402 99887',
      scheduledDate: new Date('2026-10-07T20:00:00Z'),
      completedDate: new Date('2026-10-07T21:30:00Z'),
      status: 'COMMISSIONED_SUCCESS',
      commissioningDetails: {
        ambientTemperature: '24.2°C',
        chamberTargetTemp: '-80.0°C',
        chamberAchievedTemp: '-81.4°C',
        powerVoltage: '232V AC Steady',
        stabilizerInstalled: true,
        alarmCheckDone: true,
        userTrainingCompleted: true
      },
      customerSignoffName: 'Dr. Arun Kumar',
      customerSignoffDesignation: 'Principal Investigator',
      remarks: 'Commissioning successful. Staff trained on door operation and filter cleaning.'
    });

    // Warranty WAR-2026-0014
    await Warranty.create({
      warrantyNumber: 'WAR-2026-0014',
      serialNumber: serial1.serialNumber,
      product: prod1._id,
      productName: prod1.name,
      customer: customer1._id,
      salesOrder: salesOrder1._id,
      soNumber: salesOrder1.soNumber,
      startDate: new Date('2026-10-07'),
      endDate: new Date('2027-10-07'),
      durationMonths: 12,
      status: 'ACTIVE',
      terms: 'Comprehensive manufacturer warranty covering hermetic compressors, refrigeration loop, and microprocessor controls.'
    });

    // 7. Seed Active Service Ticket (Demonstrating Spare-Not-Available & Multi-Visit Flow)
    await ServiceTicket.create({
      ticketNumber: 'SRV-2026-0001',
      requestDate: new Date('2026-10-07T22:00:00Z'),
      customer: customer1._id,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      customerAddress: customer1.address,
      serialNumber: serial1.serialNumber,
      productName: prod1.name,
      model: prod1.model,
      complaintDescription: 'Chamber temperature alarm triggered; fluctuating between -72°C and -76°C.',
      priority: 'High',
      warrantyStatus: 'VALID_FREE',
      assignedEngineer: 'Deepak Raj',
      assignedEngineerPhone: '+91 98402 99887',
      status: 'WAITING_FOR_SPARE',
      currentMachineCondition: 'Compressor second stage staged off safely to prevent head pressure surge; awaiting 0.5T cryogenic expansion valve.',
      visits: [
        {
          visitNumber: 1,
          engineerName: 'Deepak Raj',
          engineerPhone: '+91 98402 99887',
          scheduledDate: new Date('2026-10-07T22:30:00Z'),
          checkInTime: new Date('2026-10-07T22:45:00Z'),
          checkOutTime: new Date('2026-10-07T23:45:00Z'),
          inspectionFindings: 'Stage 2 suction pressure sluggish. Expansion orifice partially restricted.',
          diagnosis: 'Faulty electronic expansion valve restricting R508B flow to secondary evaporator.',
          machineConditionOnArrival: 'Alarm active (-74°C)',
          spareRequired: true,
          spareDetails: [
            { itemCode: 'SPARE-EXP-VALV', itemName: 'Cryogenic Electronic Expansion Valve 0.5T', qty: 1, unit: 'Nos', isAvailable: false, issued: false }
          ],
          visitStatus: 'WAITING_FOR_SPARE'
        }
      ]
    });

    // 8. Seed Open Leads
    await Lead.create({
      leadNumber: 'LEAD-2026-0001',
      leadDate: new Date('2026-10-06'),
      leadSource: 'Website Inquiry',
      leadType: 'New Customer',
      customerName: 'Biocon Research Centre',
      contactPerson: 'Dr. Meenakshi Sundaram',
      phone: '+91 98840 55443',
      email: 'm.sundaram@biocon.com',
      requirement: '2 Units of Ultra Low Temperature Freezer (-80°C)',
      quantity: 2,
      expectedValue: 500000,
      priority: 'High',
      status: 'QUALIFIED',
      remarks: 'Urgent expansion for viral vector vaccine research.'
    });

    await Lead.create({
      leadNumber: 'LEAD-2026-0002',
      leadDate: new Date('2026-10-07'),
      leadSource: 'Exhibition Bangalore',
      leadType: 'New Customer',
      customerName: 'National Institute of Virology',
      contactPerson: 'Dr. Prakash Narain',
      phone: '+91 94432 11223',
      email: 'prakash@niv.res.in',
      requirement: 'Blood Bank Refrigerator (+4°C) with automatic chart logging',
      quantity: 1,
      expectedValue: 180000,
      priority: 'Medium',
      status: 'NEW',
      remarks: 'Requested technical catalog and compliance documents.'
    });

    // Seed Audit Log
    await AuditLog.create({
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      entityId: 'ROOT',
      entityNumber: 'INIT-2026',
      performedBy: 'System Administrator',
      userRole: 'SUPER_ADMIN',
      details: 'Cryo Scientific Systems ERP successfully initialized with complete production dataset and ISO workflows.'
    });

    console.log('Database seeded successfully with complete end-to-end dataset!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
