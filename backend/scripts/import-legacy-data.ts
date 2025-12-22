/**
 * Legacy Data Import Script
 * 
 * Imports data from the old system CSV file (wiltm_se_db_1.csv) into the new
 * inventory tracking system with FIFO support.
 * 
 * The old system had:
 * - Categories (not used in new system - mapped to product descriptions)
 * - Products with units and suppliers
 * - Purchases with quantities and "quantity_left" (remainingQuantity)
 * - A "locked" field indicating if year-end count was done
 * - A "date_counted" field for when inventory was counted
 * 
 * Migration strategy:
 * 1. Import all suppliers
 * 2. Import all units
 * 3. Import all products
 * 4. Import all purchases (creating purchase lots with snapshots)
 * 5. Create year-end counts for locked years based on date_counted
 * 
 * Run with: npx ts-node backend/scripts/import-legacy-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

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
  product_id: string;
  supplier_id: string;
  category_id: string;
  unit_id: string;
  purchase_date: string;
  price_excluding_vat: string;
  quantity: string;
  quantity_left: string;
  verification_number: string;
  locked: string;
  date_counted: string | null;
}

// Map old IDs to new IDs
const supplierIdMap = new Map<string, number>();
const unitIdMap = new Map<string, number>();
const productIdMap = new Map<string, number>();
const categoryMap = new Map<string, LegacyCategory>();

/**
 * Parse the multi-section CSV file
 */
function parseLegacyCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const categories: LegacyCategory[] = [];
  const units: LegacyUnit[] = [];
  const suppliers: LegacySupplier[] = [];
  const products: LegacyProduct[] = [];
  const purchases: LegacyPurchase[] = [];
  
  let currentSection = '';
  let sectionHeaders: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const values = parse(line, { columns: false, skip_empty_lines: true })[0];
    
    if (!values || values.length === 0) continue;
    
    // Detect section headers
    if (values[0] === 'category_id') {
      currentSection = 'categories';
      sectionHeaders = values;
      continue;
    } else if (values[0] === 'unit_id') {
      currentSection = 'units';
      sectionHeaders = values;
      continue;
    } else if (values[0] === 'supplier_id' && values.length > 5) {
      currentSection = 'suppliers';
      sectionHeaders = values;
      continue;
    } else if (values[0] === 'product_id' && values[1] === 'product_name') {
      currentSection = 'products';
      sectionHeaders = values;
      continue;
    } else if (values[0] === 'purchase_id' && values[1] === 'product_id') {
      currentSection = 'purchases';
      sectionHeaders = values;
      continue;
    }
    
    // Parse data rows
    if (currentSection === 'categories' && values[0] !== 'category_id') {
      const record: any = {};
      sectionHeaders.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      categories.push(record);
    } else if (currentSection === 'units' && values[0] !== 'unit_id') {
      const record: any = {};
      sectionHeaders.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      units.push(record);
    } else if (currentSection === 'suppliers' && values[0] !== 'supplier_id') {
      const record: any = {};
      sectionHeaders.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      suppliers.push(record);
    } else if (currentSection === 'products' && values[0] !== 'product_id') {
      const record: any = {};
      sectionHeaders.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      products.push(record);
    } else if (currentSection === 'purchases' && values[0] !== 'purchase_id') {
      const record: any = {};
      sectionHeaders.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      purchases.push(record);
    }
  }
  
  return { categories, units, suppliers, products, purchases };
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
      console.log(`  ↻ ${legacySupplier.supplier_name} (already exists, ID: ${legacySupplier.supplier_id} → ${existing.id})`);
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
 * Import products
 */
async function importProducts(products: LegacyProduct[], categories: LegacyCategory[]) {
  console.log(`\n🏷️  Importing ${products.length} products...`);
  
  // Build category map
  categories.forEach(cat => categoryMap.set(cat.category_id, cat));
  
  for (const legacyProduct of products) {
    const unitId = unitIdMap.get(legacyProduct.unit_id);
    
    if (!unitId) {
      console.log(`  ⚠️  Skipping ${legacyProduct.product_name} - unit not found (unit_id: ${legacyProduct.unit_id})`);
      continue;
    }
    
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: { name: legacyProduct.product_name },
    });
    
    if (existing) {
      productIdMap.set(legacyProduct.product_id, existing.id);
      console.log(`  ↻ ${legacyProduct.product_name} (already exists, ID: ${legacyProduct.product_id} → ${existing.id})`);
      continue;
    }
    
    // For products without a supplier, we'll set it during purchase import
    // Use the first supplier as a default for now
    const defaultSupplierId = Array.from(supplierIdMap.values())[0];
    
    if (!defaultSupplierId) {
      console.log(`  ⚠️  Skipping ${legacyProduct.product_name} - no suppliers available`);
      continue;
    }
    
    const newProduct = await prisma.product.create({
      data: {
        name: legacyProduct.product_name,
        description: legacyProduct.product_description || null,
        supplierId: defaultSupplierId, // Will be updated when we import purchases
        unitId: unitId,
      },
    });
    
    productIdMap.set(legacyProduct.product_id, newProduct.id);
    console.log(`  ✓ ${legacyProduct.product_name} (ID: ${legacyProduct.product_id} → ${newProduct.id})`);
  }
}

/**
 * Get or create an "Unknown" supplier
 */
async function getOrCreateUnknownSupplier(): Promise<number> {
  const existing = await prisma.supplier.findFirst({
    where: { name: 'Unknown Supplier (Orphaned)' },
  });
  
  if (existing) {
    return existing.id;
  }
  
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Unknown Supplier (Orphaned)',
      notes: 'Created automatically for purchases with missing supplier references',
    },
  });
  
  return supplier.id;
}

/**
 * Get or create an "Unknown" product for orphaned purchases
 */
async function getOrCreateUnknownProduct(productIdStr: string, unitId: number, supplierId: number): Promise<number> {
  const productName = `Unknown Product (Legacy ID: ${productIdStr})`;
  
  const existing = await prisma.product.findFirst({
    where: { name: productName },
  });
  
  if (existing) {
    return existing.id;
  }
  
  const product = await prisma.product.create({
    data: {
      name: productName,
      description: `Orphaned product from legacy system. Original product ID ${productIdStr} was not found in the products table.`,
      unitId,
      supplierId,
    },
  });
  
  return product.id;
}

/**
 * Import purchases as purchase lots
 */
async function importPurchases(purchases: LegacyPurchase[]) {
  console.log(`\n💰 Importing ${purchases.length} purchases...`);
  
  let imported = 0;
  let skipped = 0;
  let orphaned = 0;
  
  // Get a default unit for orphaned products
  let defaultUnitId = unitIdMap.get('1'); // "St" unit
  if (!defaultUnitId) {
    defaultUnitId = Array.from(unitIdMap.values())[0];
  }
  
  for (const legacyPurchase of purchases) {
    let productId = productIdMap.get(legacyPurchase.product_id);
    let supplierId = supplierIdMap.get(legacyPurchase.supplier_id);
    
    // Handle missing supplier
    if (!supplierId) {
      supplierId = await getOrCreateUnknownSupplier();
      orphaned++;
    }
    
    // Handle missing product
    if (!productId) {
      if (!defaultUnitId) {
        console.log(`  ⚠️  Skipping purchase ${legacyPurchase.purchase_id} - no default unit available`);
        skipped++;
        continue;
      }
      productId = await getOrCreateUnknownProduct(legacyPurchase.product_id, defaultUnitId, supplierId);
      productIdMap.set(legacyPurchase.product_id, productId); // Cache it
      orphaned++;
    }
    
    // Validate and parse numeric fields
    const quantity = parseFloat(legacyPurchase.quantity);
    const remainingQuantity = parseFloat(legacyPurchase.quantity_left);
    const priceTotal = parseFloat(legacyPurchase.price_excluding_vat);
    
    // Skip if essential data is invalid
    if (isNaN(quantity) || isNaN(remainingQuantity) || isNaN(priceTotal)) {
      console.log(`  ⚠️  Skipping purchase ${legacyPurchase.purchase_id} - invalid numeric data`);
      skipped++;
      continue;
    }
    
    const unitCost = quantity > 0 ? priceTotal / quantity : 0;
    
    // Parse and validate purchase date
    const purchaseDate = new Date(legacyPurchase.purchase_date);
    if (isNaN(purchaseDate.getTime())) {
      console.log(`  ⚠️  Skipping purchase ${legacyPurchase.purchase_id} - invalid date`);
      skipped++;
      continue;
    }
    
    const year = purchaseDate.getFullYear();
    
    // Check for duplicate purchase lots (same product, supplier, date, and quantity)
    const existingLot = await prisma.purchaseLot.findFirst({
      where: {
        productId,
        supplierId,
        purchaseDate,
        quantity,
      },
    });
    
    if (existingLot) {
      skipped++;
      continue;
    }
    
    // Get product and supplier details for snapshots
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { unit: true },
    });
    
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    
    if (!product || !supplier) {
      console.log(`  ⚠️  Skipping purchase ${legacyPurchase.purchase_id} - missing related data`);
      skipped++;
      continue;
    }
    
    // Update product's primary supplier if this is a significant purchase
    if (priceTotal > 1000) {
      await prisma.product.update({
        where: { id: productId },
        data: { supplierId },
      });
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
    const lot = await prisma.purchaseLot.create({
      data: {
        productId,
        supplierId,
        quantity,
        remainingQuantity,
        unitCost,
        purchaseDate,
        year,
        productSnapshot,
        supplierSnapshot,
      },
    });
    
    imported++;
    
    if (imported % 50 === 0) {
      console.log(`  ... imported ${imported} purchases`);
    }
  }
  
  console.log(`  ✓ Imported ${imported} purchases`);
  if (orphaned > 0) {
    console.log(`  ℹ️  Created ${orphaned} orphaned product/supplier entries`);
  }
  if (skipped > 0) {
    console.log(`  ⚠️  Skipped ${skipped} purchases`);
  }
}

/**
 * Create year-end counts for locked years
 * 
 * Logic:
 * - Year-end count for 2023 (performed ~2024-01-06): counts all remaining inventory at end of 2023
 * - Year-end count for 2024 (performed ~2025-03-27): counts all remaining inventory at end of 2024
 * 
 * The date_counted field indicates when the count was performed.
 * Count year = year(date_counted) - 1 (count performed in early next year)
 */
async function createYearEndCounts(purchases: LegacyPurchase[]) {
  console.log(`\n📊 Creating year-end counts for locked years...`);
  
  // Find distinct count dates from locked purchases
  const countDates = new Map<string, Date>();
  
  for (const purchase of purchases) {
    if (purchase.locked === '1' && purchase.date_counted && purchase.date_counted !== 'NULL') {
      const dateCounted = new Date(purchase.date_counted);
      // Validate date
      if (!isNaN(dateCounted.getTime())) {
        const dateKey = dateCounted.toISOString().split('T')[0];
        if (!countDates.has(dateKey)) {
          countDates.set(dateKey, dateCounted);
        }
      }
    }
  }
  
  console.log(`  Found ${countDates.size} count dates: ${Array.from(countDates.keys()).join(', ')}`);
  
  // Map count dates to fiscal years
  // 2024-01-06 count -> 2023 year-end
  // 2025-03-27 count -> 2024 year-end
  const yearEndCounts = new Map<number, Date>();
  for (const [dateKey, date] of countDates.entries()) {
    const countYear = date.getFullYear();
    const fiscalYear = countYear - 1; // Count performed in year N is for year N-1 end
    yearEndCounts.set(fiscalYear, date);
  }
  
  console.log(`  Creating year-end counts for: ${Array.from(yearEndCounts.keys()).sort().join(', ')}`);
  
  for (const [fiscalYear, countDate] of yearEndCounts.entries()) {
    // Check if year-end count already exists
    const existingCount = await prisma.yearEndCount.findFirst({
      where: { year: fiscalYear, revision: 1 },
    });
    
    if (existingCount) {
      console.log(`  ↻ Year-end count for ${fiscalYear} already exists, skipping`);
      continue;
    }
    
    // Get all purchase lots that were counted on this date
    // These represent the remaining inventory at the end of the fiscal year
    const countDateStr = countDate.toISOString().split('T')[0];
    const lotsAtCount: Array<{ productId: number; remainingQuantity: number; unitCost: number }> = [];
    
    for (const purchase of purchases) {
      if (purchase.locked === '1' && purchase.date_counted && purchase.date_counted !== 'NULL') {
        const purchaseDateCounted = new Date(purchase.date_counted);
        if (!isNaN(purchaseDateCounted.getTime())) {
          const purchaseCountDate = purchaseDateCounted.toISOString().split('T')[0];
          if (purchaseCountDate === countDateStr) {
            const productId = productIdMap.get(purchase.product_id);
            if (productId) {
              const remainingQty = parseFloat(purchase.quantity_left);
              const totalPrice = parseFloat(purchase.price_excluding_vat);
              const quantity = parseFloat(purchase.quantity);
              const unitCost = quantity > 0 ? totalPrice / quantity : 0;
              
              lotsAtCount.push({
                productId,
                remainingQuantity: remainingQty,
                unitCost,
              });
            }
          }
        }
      }
    }
    
    if (lotsAtCount.length === 0) {
      console.log(`  ⚠️  No inventory data for year ${fiscalYear}, skipping`);
      continue;
    }
    
    // Create year-end count
    const count = await prisma.yearEndCount.create({
      data: {
        year: fiscalYear,
        revision: 1,
        status: 'confirmed',
        confirmedAt: countDate,
      },
    });
    
    // Group by product and sum quantities
    const productTotals = new Map<number, { quantity: number; value: number }>();
    for (const lot of lotsAtCount) {
      if (!productTotals.has(lot.productId)) {
        productTotals.set(lot.productId, { quantity: 0, value: 0 });
      }
      const totals = productTotals.get(lot.productId)!;
      totals.quantity += lot.remainingQuantity;
      totals.value += lot.remainingQuantity * lot.unitCost;
    }
    
    // Create count items for each product
    for (const [productId, totals] of productTotals.entries()) {
      await prisma.yearEndCountItem.create({
        data: {
          yearEndCountId: count.id,
          productId,
          expectedQuantity: Math.round(totals.quantity),
          countedQuantity: Math.round(totals.quantity),
          variance: 0,
          value: totals.value,
        },
      });
    }
    
    // Lock the year
    await prisma.lockedYear.create({
      data: { year: fiscalYear, lockedAt: countDate },
    });
    
    console.log(`  ✓ Created year-end count for ${fiscalYear} with ${productTotals.size} products`);
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting legacy data import...\n');
  console.log('📁 Reading CSV file: csv/wiltm_se_db_1.csv');
  
  const csvPath = path.join(process.cwd(), 'csv', 'wiltm_se_db_1.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const data = parseLegacyCSV(csvPath);
  
  console.log(`\n📋 Parsed CSV data:`);
  console.log(`  - Categories: ${data.categories.length}`);
  console.log(`  - Units: ${data.units.length}`);
  console.log(`  - Suppliers: ${data.suppliers.length}`);
  console.log(`  - Products: ${data.products.length}`);
  console.log(`  - Purchases: ${data.purchases.length}`);
  
  // Confirm before proceeding
  console.log(`\n⚠️  This will import data into the database.`);
  console.log(`   Make sure you have a backup if needed.\n`);
  
  try {
    // Import in order (respecting foreign key dependencies)
    await importSuppliers(data.suppliers);
    await importUnits(data.units);
    await importProducts(data.products, data.categories);
    await importPurchases(data.purchases);
    await createYearEndCounts(data.purchases);
    
    console.log(`\n✅ Import completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`  - Suppliers imported: ${supplierIdMap.size}`);
    console.log(`  - Units imported: ${unitIdMap.size}`);
    console.log(`  - Products imported: ${productIdMap.size}`);
    
    const totalLots = await prisma.purchaseLot.count();
    const totalValue = await prisma.purchaseLot.aggregate({
      _sum: { unitCost: true },
    });
    
    console.log(`  - Purchase lots imported: ${totalLots}`);
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
