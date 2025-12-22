import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function verifyImport() {
  console.log('📊 Verifying imported data...\n');
  
  // Count records
  const supplierCount = await prisma.supplier.count();
  const unitCount = await prisma.unit.count();
  const productCount = await prisma.product.count();
  const purchaseCount = await prisma.purchaseLot.count();
  const yearEndCount = await prisma.yearEndCount.count();
  const lockedYearCount = await prisma.lockedYear.count();
  
  console.log('Record counts:');
  console.log(`  Suppliers: ${supplierCount}`);
  console.log(`  Units: ${unitCount}`);
  console.log(`  Products: ${productCount}`);
  console.log(`  Purchase Lots: ${purchaseCount}`);
  console.log(`  Year-End Counts: ${yearEndCount}`);
  console.log(`  Locked Years: ${lockedYearCount}\n`);
  
  // Check purchase lots with remaining quantity
  const lotsWithRemaining = await prisma.purchaseLot.findMany({
    where: { remainingQuantity: { gt: 0 } },
    select: { year: true },
  });
  
  const yearCounts: Record<number, number> = {};
  lotsWithRemaining.forEach(lot => {
    yearCounts[lot.year] = (yearCounts[lot.year] || 0) + 1;
  });
  
  console.log('Purchase lots with remaining quantity by year:');
  Object.entries(yearCounts).sort().forEach(([year, count]) => {
    console.log(`  ${year}: ${count} lots`);
  });
  console.log('');
  
  // Check locked years
  const lockedYears = await prisma.lockedYear.findMany({
    orderBy: { year: 'asc' },
  });
  
  console.log('Locked years:');
  lockedYears.forEach(y => {
    console.log(`  ${y.year} (locked at ${y.lockedAt.toISOString().split('T')[0]})`);
  });
  console.log('');
  
  // Check year-end counts
  const yearEndCounts = await prisma.yearEndCount.findMany({
    orderBy: { year: 'asc' },
    include: { _count: { select: { items: true } } },
  });
  
  console.log('Year-end counts:');
  yearEndCounts.forEach(c => {
    console.log(`  ${c.year} (revision ${c.revision}): ${c.status}, ${c._count.items} items`);
  });
  console.log('');
  
  // Sample a few products
  const sampleProducts = await prisma.product.findMany({
    take: 5,
    include: {
      supplier: { select: { name: true } },
      unit: { select: { name: true } },
      purchaseLots: {
        where: { remainingQuantity: { gt: 0 } },
        select: {
          quantity: true,
          remainingQuantity: true,
          unitCost: true,
          purchaseDate: true,
        },
      },
    },
  });
  
  console.log('Sample products with active inventory:');
  sampleProducts.forEach(p => {
    if (p.purchaseLots.length > 0) {
      const totalRemaining = p.purchaseLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
      const totalValue = p.purchaseLots.reduce((sum, lot) => sum + (lot.remainingQuantity * lot.unitCost), 0);
      console.log(`  ${p.name}`);
      console.log(`    Supplier: ${p.supplier.name}, Unit: ${p.unit.name}`);
      console.log(`    Total remaining: ${totalRemaining}, Value: ${totalValue.toFixed(2)}`);
      console.log(`    Purchase lots: ${p.purchaseLots.length}`);
    }
  });
  
  await prisma.$disconnect();
  console.log('\n✅ Verification complete!');
}

verifyImport().catch(console.error);
