import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './src/models/Product.js';
import { Inventory, StockLedger } from './src/models/Inventory.js';
import { BOM } from './src/models/BOM.js';
import { ProductionOrder } from './src/models/ProductionOrder.js';
import { MaterialRequest } from './src/models/MaterialRequest.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cryo_erp';

async function testCompleteWorkflow() {
  console.log('--- STARTING END-TO-END PRODUCT + INVENTORY WORKFLOW TEST ---');
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // 1. Verify Inventory Master
  const inventoryItems = await Inventory.find({});
  console.log(`✓ Inventory Master: Found ${inventoryItems.length} stores raw material items.`);
  const compressor = inventoryItems.find(i => i.itemCode === 'RAW-COMP-15HP');
  const refrigerant = inventoryItems.find(i => i.itemCode === 'RAW-REF-R508B');
  const copperPipe = inventoryItems.find(i => i.itemCode === 'RAW-COP-PIPE');

  if (!compressor || !refrigerant || !copperPipe) {
    throw new Error('Required inventory items missing!');
  }
  console.log(`  - Compressor: Stock = ${compressor.currentStock} ${compressor.unit}, Type = ${compressor.materialType}, Supplier = ${compressor.supplier}`);
  console.log(`  - Refrigerant: Stock = ${refrigerant.currentStock} ${refrigerant.unit}, Type = ${refrigerant.materialType}`);
  console.log(`  - Copper Pipe: Stock = ${copperPipe.currentStock} ${copperPipe.unit}, Type = ${copperPipe.materialType}`);

  // 2. Verify Product Master & Mapping
  const product = await Product.findOne({ model: 'CS-ULT-80' }).populate('requiredMaterials.material');
  if (!product) throw new Error('Product CS-ULT-80 not found');

  console.log(`✓ Product Master: ${product.name} (Model: ${product.model}, Code: ${product.productCode})`);
  console.log(`  - Selling Price: ₹${product.sellingPrice.toLocaleString('en-IN')}, Warranty: ${product.warranty}, Category: ${product.category}`);
  console.log(`  - Mapped Materials (${product.requiredMaterials.length} items):`);
  product.requiredMaterials.forEach(rm => {
    console.log(`    * ${rm.materialCode} - ${rm.materialName}: ${rm.quantity} ${rm.unit} (Required: ${rm.isRequired})`);
  });

  // 3. Test Stock Rule: Product Qty != Inventory Stock
  // Scenario: Order for 2 units of CS-ULT-80
  const orderQuantity = 2;
  console.log(`\n--- SIMULATING PRODUCTION ORDER: ${orderQuantity} UNITS OF ${product.model} ---`);

  // Let's set compressor available stock to 1 to simulate exact shortage from prompt:
  // "Product: -80°C Deep Freezer, Quantity Ordered: 2. Inventory: Compressor Required: 2, Available Stock: 1, Shortage: 1"
  compressor.currentStock = 1;
  compressor.reservedStock = 0;
  await compressor.save();
  console.log(`✓ Set Compressor Stock = 1 ${compressor.unit} to test shortage calculation`);

  // Evaluate requirements
  let shortagePresent = false;
  const planningItems = [];

  for (const rm of product.requiredMaterials) {
    const invItem = await Inventory.findById(rm.material._id || rm.material);
    const unitQty = rm.quantity;
    const requiredQty = unitQty * orderQuantity;
    const availableQty = Math.max(0, (invItem.currentStock || 0) - (invItem.reservedStock || 0));
    const shortageQty = Math.max(0, requiredQty - availableQty);

    let coverageStatus = 'FULL';
    if (shortageQty > 0) {
      coverageStatus = availableQty > 0 ? 'PARTIAL' : 'NONE';
      shortagePresent = true;
    }

    planningItems.push({
      materialCode: rm.materialCode,
      materialName: rm.materialName,
      unitQty,
      requiredQty,
      availableQty,
      shortageQty,
      unit: rm.unit,
      coverageStatus
    });
  }

  console.log('\n--- MATERIAL PLANNING EVALUATION TABLE ---');
  console.table(planningItems);

  // Validate compressor shortage
  const compPlan = planningItems.find(p => p.materialCode === 'RAW-COMP-15HP');
  console.log(`✓ Verified Compressor: Req = ${compPlan.requiredQty}, Avail = ${compPlan.availableQty}, Shortage = ${compPlan.shortageQty}, Coverage = ${compPlan.coverageStatus}`);
  if (compPlan.requiredQty !== 4 || compPlan.availableQty !== 1 || compPlan.shortageQty !== 3) {
    throw new Error('Shortage formula mismatch!');
  }
  console.log('✓ DYNAMIC SHORTAGE FORMULA VERIFIED: 4 Required (2 freezers × 2 compressors), 1 Avail -> Shortage = 3 accurately detected!');

  // 4. Test Stock Replenishment & Issue
  console.log('\n--- SIMULATING REPLENISHMENT & MATERIAL ISSUE ---');
  // Receive 5 compressors into stock
  compressor.currentStock += 5;
  await compressor.save();
  console.log(`✓ Received 5 Compressors via Stores Stock-In. New Stock = ${compressor.currentStock}`);

  // Re-check
  const recheckAvail = compressor.currentStock - compressor.reservedStock;
  const recheckShortage = Math.max(0, compPlan.requiredQty - recheckAvail);
  console.log(`✓ Re-checked Compressor: Req = ${compPlan.requiredQty}, Avail = ${recheckAvail}, Shortage = ${recheckShortage}`);
  if (recheckShortage !== 0) throw new Error('Shortage should be 0 after replenishment!');

  // Issue 2 compressors to production floor
  const prevStock = compressor.currentStock;
  compressor.currentStock -= compPlan.requiredQty;
  await compressor.save();

  await StockLedger.create({
    itemCode: compressor.itemCode,
    itemName: compressor.itemName,
    transactionType: 'MATERIAL_ISSUE',
    quantity: compPlan.requiredQty,
    previousStock: prevStock,
    newStock: compressor.currentStock,
    referenceType: 'PRODUCTION',
    referenceNumber: 'PRD-TEST-001',
    remarks: 'Issued for CS-ULT-80 production assembly',
    performedBy: 'Automated Test'
  });

  console.log(`✓ Issued 2 Compressors. Stores On-Hand Stock reduced from ${prevStock} to ${compressor.currentStock}.`);
  console.log('✓ Stock Ledger entry created for audit trail.');

  // Reset compressor stock back to safe level for normal operations
  compressor.currentStock = 12;
  compressor.reservedStock = 0;
  await compressor.save();

  console.log('\n--- ALL WORKFLOW CHECKS PASSED SUCCESSFULLY ---');
  await mongoose.disconnect();
}

testCompleteWorkflow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
