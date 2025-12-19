/**
 * Migration script to convert product.unit from String to Unit relation
 * 
 * Steps:
 * 1. Create default units from existing product units
 * 2. Add unitId column to products
 * 3. Map each product to its corresponding unit
 * 4. Remove old unit string column
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting unit migration...');

  try {
    // Step 1: Get all unique unit strings from existing products
    console.log('\n📊 Step 1: Analyzing existing product units...');
    const products = await prisma.$queryRaw<Array<{ unit: string }>>`
      SELECT DISTINCT unit FROM products WHERE unit IS NOT NULL
    `;
    
    const existingUnits = products.map(p => p.unit);
    console.log(`Found ${existingUnits.length} unique units:`, existingUnits);

    // Step 2: Create default units (ensuring common units exist)
    console.log('\n📝 Step 2: Creating default units...');
    const defaultUnits = [
      'pieces', 'kg', 'g', 'tons', 
      'liters', 'ml', 'm3', 
      'm', 'm2', 
      'boxes', 'pallets', 'rolls'
    ];

    // Merge existing and default units (unique)
    const allUnits = Array.from(new Set([...defaultUnits, ...existingUnits]));
    
    const createdUnits: { [key: string]: number } = {};
    
    for (const unitName of allUnits) {
      const unit = await prisma.unit.upsert({
        where: { name: unitName },
        update: {},
        create: { name: unitName }
      });
      createdUnits[unitName] = unit.id;
      console.log(`  ✓ Unit "${unitName}" (ID: ${unit.id})`);
    }

    console.log(`\n✅ Created/verified ${Object.keys(createdUnits).length} units`);

    // Step 3: Update products with unitId based on their unit string
    console.log('\n🔗 Step 3: Mapping products to units...');
    
    // Get all products with their unit strings
    const allProducts = await prisma.$queryRaw<Array<{ id: number; unit: string | null }>>`
      SELECT id, unit FROM products
    `;

    let updateCount = 0;
    for (const product of allProducts) {
      const unitName = product.unit || 'pieces'; // Default to "pieces" if null
      const unitId = createdUnits[unitName];
      
      if (!unitId) {
        console.error(`  ❌ No unit ID found for "${unitName}"`);
        continue;
      }

      await prisma.$executeRaw`
        UPDATE products SET unitId = ${unitId} WHERE id = ${product.id}
      `;
      updateCount++;
    }

    console.log(`✅ Updated ${updateCount} products with unit references`);

    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
