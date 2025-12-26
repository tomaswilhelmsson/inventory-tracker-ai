/**
 * JSON Data Import Script
 * 
 * Imports data from the old system JSON export (wiltm_se_db_1.json) into the new
 * inventory tracking system with FIFO support.
 * 
 * The JSON export contains:
 * - Categories: Product categories (not used in new system)
 * - Products: Product catalog with units
 * - Suppliers: Supplier information
 * - Purchases: All historical purchases with remaining quantities
 * - Purchases_2023: Year-end snapshot for 2023
 * - Purchases_2024: Year-end snapshot for 2024
 * - Units: Unit definitions
 * 
 * Migration strategy:
 * 1. Import all units
 * 2. Import all suppliers
 * 3. Import all products
 * 4. Import all purchases from Purchases table (creates purchase lots)
 * 5. Create year-end counts from Purchases_<year> tables
 * 
 * Run with: npx ts-node backend/scripts/import-from-json.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface JSONExport {
  type: string;
  version?: string;
  comment?: string;
  name?: string;
  database?: string;
  data?: any[];
}

interface LegacyCategory {
  category_id: string;
  category_name: string;
  category_description: string;
}

interface LegacyUnit {
  unit_id: string;
  unit_name: string;
  unit_description: string;
}

interface LegacySupplier {
  supplier_id: string;
  supplier_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  telephone: string;
  company_id_number: string;
}

interface LegacyProduct {
  product_id: string;
  product_name: string;
  product_description: string;
  unit_id: string;
}

interface LegacyPurchase {
  purchase_id: string;
  product_id?: string;
  product_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  category_id?: string;
  category_name?: string;
  unit_id?: string;
  unit_name?: string;
  purchase_date: string;
  price_excluding_vat: string;
  quantity: string;
  quantity_left: string;
  verification_number: string;
  locked: string;
  date_counted?: string | null;
}

// Map old IDs to new IDs
const supplierIdMap = new Map<string, number>();
const unitIdMap = new Map<string, number>();
const productIdMap = new Map<string, number>();
const purchaseLotIdMap = new Map<string, number>(); // Map legacy purchase_id to new lot id

/**
 * Parse the JSON export file
 */
function parseJSONExport(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records: JSONExport[] = JSON.parse(content);
  
  const categories: LegacyCategory[] = [];
  const units: LegacyUnit[] = [];
  const suppliers: LegacySupplier[] = [];
  const products: LegacyProduct[] = [];
  const purchases: LegacyPurchase[] = [];
  const purchases2023: LegacyPurchase[] = [];
  const purchases2024: LegacyPurchase[] = [];
  
  for (const record of records) {
    if (record.type === 'table' && record.data) {
      switch (record.name) {
        case 'Categories':
          categories.push(...record.data);
          break;
        case 'Units':
          units.push(...record.data);
          break;
        case 'Suppliers':
          suppliers.push(...record.data);
          break;
        case 'Products':
          products.push(...record.data);
          break;
        case 'Purchases':
          purchases.push(...record.data);
          break;
        case 'Purchases_2023':
          purchases2023.push(...record.data);
          break;
        case 'Purchases_2024':
          purchases2024.push(...record.data);
          break;
      }
    }
  }
  
  return { categories, units, suppliers, products, purchases, purchases2023, purchases2024 };
}

/**
 * Import units
 */
async function importUnits(units: LegacyUnit[]) {
  console.log(`\n📏 Importing ${units.length} units...`);
  
  for (const legacyUnit of units) {
    // Check if unit already exists
    const existing = await prisma.unit.findFirst({
      where: { name: legacyUnit.unit_name },
    });
    
    if (existing) {
      unitIdMap.set(legacyUnit.unit_id, existing.id);
      console.log(`  ↻ ${legacyUnit.unit_name} (already exists, ID: ${legacyUnit.unit_id} → ${existing.id})`);
    } else {
      const newUnit = await prisma.unit.create({
        data: {
          name: legacyUnit.unit_name,
        },
      });
      
      unitIdMap.set(legacyUnit.unit_id, newUnit.id);
      console.log(`  ✓ ${legacyUnit.unit_name} (ID: ${legacyUnit.unit_id} → ${newUnit.id})`);
    }
  }
}

/**
 * Import suppliers
 */
async function importSuppliers(suppliers: LegacySupplier[]) {
  console.log(`\n📦 Importing ${suppliers.length} suppliers...`);
  
  for (const legacySupplier of suppliers) {
    // Check if supplier already exists
    const existing = await prisma.supplier.findFirst({
      where: { name: legacySupplier.supplier_name },
    });
    
    if (existing) {
      supplierIdMap.set(legacySupplier.supplier_id, existing.id);
      console.log(`  ↻ ${legacySupplier.supplier_name} (already exists)`);
      continue;
    }
    
    const newSupplier = await prisma.supplier.create({
      data: {
        name: legacySupplier.supplier_name,
        contactPerson: null,
        email: null,
        phone: legacySupplier.telephone || null,
        address: legacySupplier.address_line1 || null,
        city: legacySupplier.city || null,
        country: legacySupplier.country || null,
        taxId: legacySupplier.company_id_number || null,
      },
    });
    
    supplierIdMap.set(legacySupplier.supplier_id, newSupplier.id);
    console.log(`  ✓ ${legacySupplier.supplier_name} (ID: ${legacySupplier.supplier_id} → ${newSupplier.id})`);
  }
}

/**
 * Import products
 */
async function importProducts(products: LegacyProduct[]) {
  console.log(`\n🏷️  Importing ${products.length} products...`);
  
  // Get first supplier as default
  const defaultSupplierId = Array.from(supplierIdMap.values())[0];
  
  for (const legacyProduct of products) {
    const unitId = unitIdMap.get(legacyProduct.unit_id);
    
    if (!unitId) {
      console.log(`  ⚠️  Skipping ${legacyProduct.product_name} - unit not found`);
      continue;
    }
    
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: { name: legacyProduct.product_name },
    });
    
    if (existing) {
      productIdMap.set(legacyProduct.product_id, existing.id);
      console.log(`  ↻ ${legacyProduct.product_name} (already exists)`);
      continue;
    }
    
    const newProduct = await prisma.product.create({
      data: {
        name: legacyProduct.product_name,
        description: legacyProduct.product_description || null,
        supplierId: defaultSupplierId,
        unitId: unitId,
      },
    });
    
    productIdMap.set(legacyProduct.product_id, newProduct.id);
    console.log(`  ✓ ${legacyProduct.product_name} (ID: ${legacyProduct.product_id} → ${newProduct.id})`);
  }
}

/**
 * Import purchases as purchase lots
 */
async function importPurchases(purchases: LegacyPurchase[]) {
  console.log(`\n💰 Importing ${purchases.length} purchases...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const legacyPurchase of purchases) {
    const productId = productIdMap.get(legacyPurchase.product_id!);
    const supplierId = supplierIdMap.get(legacyPurchase.supplier_id!);
    
    if (!productId || !supplierId) {
      console.log(`  ⚠️  Skipping purchase ${legacyPurchase.purchase_id} - missing product or supplier`);
      skipped++;
      continue;
    }
    
    // Parse numeric fields
    const quantity = parseFloat(legacyPurchase.quantity);
    const remainingQuantity = parseFloat(legacyPurchase.quantity_left);
    const priceTotal = parseFloat(legacyPurchase.price_excluding_vat);
    
    if (isNaN(quantity) || isNaN(remainingQuantity) || isNaN(priceTotal)) {
      console.log(`  ⚠️  Skipping purchase ${legacyPurchase.purchase_id} - invalid numeric data`);
      skipped++;
      continue;
    }
    
    const unitCost = quantity > 0 ? priceTotal / quantity : 0;
    
    // Parse purchase date
    const purchaseDate = new Date(legacyPurchase.purchase_date);
    if (isNaN(purchaseDate.getTime())) {
      console.log(`  ⚠️  Skipping purchase ${legacyPurchase.purchase_id} - invalid date`);
      skipped++;
      continue;
    }
    
    const year = purchaseDate.getFullYear();
    
    // Check for duplicate
    const existingLot = await prisma.purchaseLot.findFirst({
      where: {
        productId,
        supplierId,
        purchaseDate,
        quantity,
      },
    });
    
    if (existingLot) {
      purchaseLotIdMap.set(legacyPurchase.purchase_id, existingLot.id);
      skipped++;
      continue;
    }
    
    // Get product and supplier for snapshots
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { unit: true },
    });
    
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    
    if (!product || !supplier) {
      skipped++;
      continue;
    }
    
    // Create snapshots
    const productSnapshot = JSON.stringify({
      id: product.id,
      name: product.name,
      description: product.description || '',
      unit: {
        id: product.unit.id,
        name: product.unit.name,
      },
      supplierIdRef: supplierId,
    });
    
    const supplierSnapshot = JSON.stringify({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      taxId: supplier.taxId || '',
    });
    
    // Create purchase lot
    // Legacy data has price_excluding_vat, so we assume no VAT (rate = 0)
    // unitCostExclVAT = unitCostInclVAT when vatRate = 0
    const lot = await prisma.purchaseLot.create({
      data: {
        productId,
        supplierId,
        quantity,
        remainingQuantity,
        unitCost, // Legacy field (excl VAT)
        unitCostExclVAT: unitCost,
        unitCostInclVAT: unitCost,
        vatRate: 0, // Legacy data: no VAT
        purchaseDate,
        year,
        verificationNumber: legacyPurchase.verification_number || null,
        productSnapshot,
        supplierSnapshot,
      },
    });
    
    purchaseLotIdMap.set(legacyPurchase.purchase_id, lot.id);
    imported++;
    
    if (imported % 50 === 0) {
      console.log(`  ... imported ${imported} purchases`);
    }
  }
  
  console.log(`  ✓ Imported ${imported} purchases`);
  if (skipped > 0) {
    console.log(`  ⚠️  Skipped ${skipped} purchases (duplicates or invalid data)`);
  }
}

/**
 * Update product suppliers based on purchase history
 * Assigns each product to its most common supplier
 */
async function updateProductSuppliers() {
  console.log('\n🔄 Updating product suppliers based on purchase history...');
  
  // Get all products
  const products = await prisma.product.findMany();
  
  let updated = 0;
  
  for (const product of products) {
    // Get all purchase lots for this product
    const lots = await prisma.purchaseLot.findMany({
      where: { productId: product.id },
      select: { supplierId: true },
    });
    
    if (lots.length === 0) {
      continue;
    }
    
    // Count purchases by supplier
    const supplierCounts = new Map<number, number>();
    for (const lot of lots) {
      if (lot.supplierId) {
        supplierCounts.set(lot.supplierId, (supplierCounts.get(lot.supplierId) || 0) + 1);
      }
    }
    
    // Find most common supplier
    let mostCommonSupplierId = product.supplierId;
    let maxCount = 0;
    
    for (const [supplierId, count] of supplierCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonSupplierId = supplierId;
      }
    }
    
    // Update product if supplier changed
    if (mostCommonSupplierId !== product.supplierId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { supplierId: mostCommonSupplierId },
      });
      updated++;
    }
  }
  
  console.log(`  ✓ Updated ${updated} product suppliers`);
}

/**
 * Create year-end count from snapshot table
 */
async function createYearEndCount(year: number, purchases: LegacyPurchase[]) {
  console.log(`\n📊 Creating year-end count for ${year}...`);
  
  // Check if already exists
  const existing = await prisma.yearEndCount.findFirst({
    where: { year, revision: 1 },
  });
  
  if (existing) {
    console.log(`  ↻ Year-end count for ${year} already exists`);
    return;
  }
  
  // Find the date when this count was performed
  // Use the latest date_counted from the locked purchases
  let countDate = new Date(`${year + 1}-01-06`); // Default to Jan 6 of next year
  for (const purchase of purchases) {
    if (purchase.date_counted && purchase.date_counted !== 'null') {
      const dated = new Date(purchase.date_counted);
      if (!isNaN(dated.getTime())) {
        countDate = dated;
        break;
      }
    }
  }
  
  console.log(`  Using count date: ${countDate.toISOString().split('T')[0]}`);
  
  // Group purchases by product
  const productInventory = new Map<number, { quantity: number; value: number }>();
  
  let validPurchases = 0;
  let skippedPurchases = 0;
  
  for (const purchase of purchases) {
    // Try to find product by ID first, then by name
    let productId = productIdMap.get(purchase.product_id!);
    
    if (!productId && purchase.product_name) {
      // Look up by product name
      const product = await prisma.product.findFirst({
        where: { name: purchase.product_name },
      });
      if (product) {
        productId = product.id;
      }
    }
    
    if (!productId) {
      skippedPurchases++;
      continue;
    }
    
    const quantity = parseFloat(purchase.quantity_left);
    const totalPrice = parseFloat(purchase.price_excluding_vat);
    const purchaseQty = parseFloat(purchase.quantity);
    
    if (isNaN(quantity) || isNaN(totalPrice) || isNaN(purchaseQty)) {
      skippedPurchases++;
      continue;
    }
    
    const unitCost = purchaseQty > 0 ? totalPrice / purchaseQty : 0;
    const value = quantity * unitCost;
    
    if (!productInventory.has(productId)) {
      productInventory.set(productId, { quantity: 0, value: 0 });
    }
    
    const inventory = productInventory.get(productId)!;
    inventory.quantity += quantity;
    inventory.value += value;
    validPurchases++;
  }
  
  console.log(`  Processed ${validPurchases} purchases, skipped ${skippedPurchases}`);
  console.log(`  Found ${productInventory.size} products with inventory`);
  
  if (productInventory.size === 0) {
    console.log(`  ⚠️  No inventory data found, skipping year-end count`);
    return;
  }
  
  // Create year-end count
  const count = await prisma.yearEndCount.create({
    data: {
      year,
      revision: 1,
      status: 'confirmed',
      confirmedAt: countDate,
    },
  });
  
  // Create count items
  for (const [productId, inventory] of productInventory.entries()) {
    await prisma.yearEndCountItem.create({
      data: {
        yearEndCountId: count.id,
        productId,
        expectedQuantity: inventory.quantity,
        countedQuantity: inventory.quantity,
        variance: 0,
        value: inventory.value,
      },
    });
  }
  
  // Lock the year
  await prisma.lockedYear.create({
    data: { 
      year, 
      lockedAt: countDate 
    },
  });
  
  console.log(`  ✓ Created year-end count with ${productInventory.size} products`);
  
  // Calculate total value
  const totalValue = Array.from(productInventory.values()).reduce((sum, inv) => sum + inv.value, 0);
  console.log(`  📈 Total inventory value: ${totalValue.toFixed(2)} SEK`);
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting JSON data import...\n');
  console.log('📁 Reading JSON file: csv/wiltm_se_db_1.json');
  
  const jsonPath = path.join(process.cwd(), 'csv', 'wiltm_se_db_1.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON file not found: ${jsonPath}`);
    process.exit(1);
  }
  
  const data = parseJSONExport(jsonPath);
  
  console.log(`\n📋 Parsed JSON data:`);
  console.log(`  - Categories: ${data.categories.length}`);
  console.log(`  - Units: ${data.units.length}`);
  console.log(`  - Suppliers: ${data.suppliers.length}`);
  console.log(`  - Products: ${data.products.length}`);
  console.log(`  - Purchases: ${data.purchases.length}`);
  console.log(`  - Purchases_2023: ${data.purchases2023.length}`);
  console.log(`  - Purchases_2024: ${data.purchases2024.length}`);
  
  console.log(`\n⚠️  This will import data into the database.`);
  console.log(`   Make sure you have a backup if needed.\n`);
  
  try {
    // Import in order (respecting foreign key dependencies)
    await importUnits(data.units);
    await importSuppliers(data.suppliers);
    await importProducts(data.products);
    await importPurchases(data.purchases);
    
    // Update product suppliers based on purchase history
    await updateProductSuppliers();
    
    // Create year-end counts from snapshot tables
    if (data.purchases2023.length > 0) {
      await createYearEndCount(2023, data.purchases2023);
    }
    
    if (data.purchases2024.length > 0) {
      await createYearEndCount(2024, data.purchases2024);
    }
    
    console.log(`\n✅ Import completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`  - Units imported: ${unitIdMap.size}`);
    console.log(`  - Suppliers imported: ${supplierIdMap.size}`);
    console.log(`  - Products imported: ${productIdMap.size}`);
    console.log(`  - Purchase lots imported: ${purchaseLotIdMap.size}`);
    
    const yearEndCounts = await prisma.yearEndCount.count();
    console.log(`  - Year-end counts created: ${yearEndCounts}`);
    
    console.log(`\n🎉 Import complete!`);
    
  } catch (error) {
    console.error(`\n❌ Import failed:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
main().catch(console.error);
