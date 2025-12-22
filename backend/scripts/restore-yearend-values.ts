import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

/**
 * RESTORE year-end count values to their original imported state
 * 
 * The previous "fix" was wrong - it lowered the year-end count values
 * to match current FIFO inventory. But the year-end count is OFFICIAL
 * BOOKKEEPING DATA that should never be changed.
 * 
 * The real problem is that FIFO lots need to be adjusted to produce
 * the correct inventory value that matches the year-end count.
 */
async function restoreYearEndValues() {
  console.log('=== RESTORE YEAR-END COUNT VALUES ===\n');

  // The year-end count should reflect the ACTUAL counted value
  // We need to recalculate using ORIGINAL import logic
  
  const yearEndCount = await prisma.yearEndCount.findFirst({
    where: {
      year: 2024,
      status: 'confirmed',
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!yearEndCount) {
    console.log('No year-end count found for 2024');
    return;
  }

  console.log('Recalculating year-end values using FIFO from ALL lots (before consumption)...\n');

  let totalValue = 0;
  let updated = 0;

  for (const item of yearEndCount.items) {
    if (item.countedQuantity === null || item.countedQuantity === 0) {
      // For 0 quantity, value should be 0
      if (item.value !== 0) {
        await prisma.yearEndCountItem.update({
          where: { id: item.id },
          data: { value: 0 },
        });
        updated++;
      }
      continue;
    }

    // Get ALL purchase lots for this product (not just remaining > 0)
    // because we need to calculate value as it was BEFORE consumption
    const allLots = await prisma.purchaseLot.findMany({
      where: {
        productId: item.productId,
      },
      orderBy: { purchaseDate: 'asc' }, // FIFO order
    });

    // Calculate FIFO value using ORIGINAL quantities (not remaining)
    let remainingToValue = item.countedQuantity;
    let value = 0;

    for (const lot of allLots) {
      if (remainingToValue <= 0) break;

      const quantityFromLot = Math.min(remainingToValue, lot.quantity);
      value += quantityFromLot * lot.unitCost;
      remainingToValue -= quantityFromLot;
    }

    if (Math.abs(value - (item.value || 0)) > 0.01) {
      await prisma.yearEndCountItem.update({
        where: { id: item.id },
        data: { value },
      });
      console.log(`${item.product.name}: ${item.value?.toFixed(2)} → ${value.toFixed(2)}`);
      updated++;
    }

    totalValue += value;
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Items updated: ${updated}`);
  console.log(`Total year-end value: ${totalValue.toFixed(2)} SEK`);
  console.log('\n✓ Year-end count values restored to match original import');

  await prisma.$disconnect();
}

restoreYearEndValues().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
