/**
 * Migration script to convert product.unit from String to Unit relation
 * 
 * This script handles the complete migration process:
 * 1. Create units table
 * 2. Seed default units
 * 3. Add unitId column to products
 * 4. Map products to units
 * 5. Drop old unit column
 */

import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting unit migration...\n');

  // Use better-sqlite3 for raw SQL operations
  const dbPath = path.join(__dirname, '../prisma/data/inventory.db');
  const db = new Database(dbPath);

  try {
    // Step 1: Create units table
    console.log('📝 Step 1: Creating units table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS "units" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL UNIQUE,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Units table created\n');

    // Step 2: Get existing product units
    console.log('📊 Step 2: Analyzing existing product units...');
    const existingUnits = db.prepare('SELECT DISTINCT unit FROM products WHERE unit IS NOT NULL').all() as Array<{ unit: string }>;
    const existingUnitNames = existingUnits.map(u => u.unit);
    console.log(`Found ${existingUnitNames.length} existing units:`, existingUnitNames);

    // Step 3: Seed default units
    console.log('\n📝 Step 3: Seeding default units...');
    const defaultUnits = [
      'pieces', 'kg', 'g', 'tons',
      'liters', 'ml', 'm3',
      'm', 'm2',
      'boxes', 'pallets', 'rolls'
    ];

    const allUnits = Array.from(new Set([...defaultUnits, ...existingUnitNames]));
    
    const insertUnit = db.prepare('INSERT OR IGNORE INTO units (name) VALUES (?)');
    const insertMany = db.transaction((units: string[]) => {
      for (const unit of units) {
        insertUnit.run(unit);
      }
    });
    
    insertMany(allUnits);
    console.log(`✅ Seeded ${allUnits.length} units\n`);

    // Step 4: Add unitId column to products
    console.log('🔗 Step 4: Adding unitId column to products...');
    db.exec('ALTER TABLE products ADD COLUMN unitId INTEGER');
    console.log('✅ Column added\n');

    // Step 5: Map products to units
    console.log('🔗 Step 5: Mapping products to units...');
    const products = db.prepare('SELECT id, unit FROM products').all() as Array<{ id: number; unit: string | null }>;
    
    const updateProduct = db.prepare('UPDATE products SET unitId = (SELECT id FROM units WHERE name = ?) WHERE id = ?');
    
    for (const product of products) {
      const unitName = product.unit || 'pieces';
      updateProduct.run(unitName, product.id);
    }
    console.log(`✅ Mapped ${products.length} products to units\n`);

    // Step 6: Create a temporary products table with the new schema
    console.log('🔄 Step 6: Recreating products table without unit column...');
    
    db.exec(`
      -- Create new products table
      CREATE TABLE "products_new" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "unitId" INTEGER NOT NULL,
        "supplierId" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "products_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
      
      -- Copy data from old table to new table
      INSERT INTO products_new (id, name, description, unitId, supplierId, createdAt)
      SELECT id, name, description, unitId, supplierId, createdAt FROM products;
      
      -- Drop old table
      DROP TABLE products;
      
      -- Rename new table
      ALTER TABLE products_new RENAME TO products;
      
      -- Recreate indexes
      CREATE UNIQUE INDEX "products_name_key" ON "products"("name");
    `);
    
    console.log('✅ Products table recreated\n');

    console.log('✨ Migration completed successfully!');
    console.log('\nVerifying migration...');
    
    // Verify
    const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get() as { count: number };
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    
    console.log(`  - Units in database: ${unitCount.count}`);
    console.log(`  - Products in database: ${productCount.count}`);
    
    // Check sample product
    const sampleProduct = db.prepare(`
      SELECT p.name, u.name as unit 
      FROM products p 
      JOIN units u ON p.unitId = u.id 
      LIMIT 1
    `).get();
    console.log('  - Sample product:', sampleProduct);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
