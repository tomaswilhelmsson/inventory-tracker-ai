/**
 * Clear all data from the database except the admin user
 * This prepares the database for a clean import of legacy data
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function clearData() {
  console.log('🗑️  Clearing database data (keeping admin user)...\n');
  
  try {
    // Delete in the correct order to respect foreign key constraints
    
    // 1. Delete year-end count items first (references year-end counts and products)
    const deletedCountItems = await prisma.yearEndCountItem.deleteMany({});
    console.log(`  ✓ Deleted ${deletedCountItems.count} year-end count items`);
    
    // 2. Delete year-end counts
    const deletedCounts = await prisma.yearEndCount.deleteMany({});
    console.log(`  ✓ Deleted ${deletedCounts.count} year-end counts`);
    
    // 3. Delete locked years
    const deletedLockedYears = await prisma.lockedYear.deleteMany({});
    console.log(`  ✓ Deleted ${deletedLockedYears.count} locked years`);
    
    // 4. Delete year unlock audits
    const deletedAudits = await prisma.yearUnlockAudit.deleteMany({});
    console.log(`  ✓ Deleted ${deletedAudits.count} unlock audits`);
    
    // 5. Delete purchase lots (references products and suppliers)
    const deletedLots = await prisma.purchaseLot.deleteMany({});
    console.log(`  ✓ Deleted ${deletedLots.count} purchase lots`);
    
    // 6. Delete products (references units and suppliers)
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`  ✓ Deleted ${deletedProducts.count} products`);
    
    // 7. Delete suppliers
    const deletedSuppliers = await prisma.supplier.deleteMany({});
    console.log(`  ✓ Deleted ${deletedSuppliers.count} suppliers`);
    
    // 8. Delete units
    const deletedUnits = await prisma.unit.deleteMany({});
    console.log(`  ✓ Deleted ${deletedUnits.count} units`);
    
    // Keep users (admin user should remain)
    const userCount = await prisma.user.count();
    console.log(`  ℹ️  Kept ${userCount} user(s) (admin)`);
    
    console.log('\n✅ Database cleared successfully!');
    console.log('\nYou can now run: npm run import:legacy');
    
  } catch (error) {
    console.error('\n❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearData().catch(console.error);
