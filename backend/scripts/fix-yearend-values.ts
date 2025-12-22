import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

/**
 * Fix year-end count values to match current FIFO lot values
 * 
 * PROBLEM: When year-end count was confirmed, the values were calculated
 * BEFORE the FIFO lots were adjusted, causing a mismatch between the
 * year-end report value and the actual current inventory value.
 * 
 * SOLUTION: Recalculate all year-end count item values based on the
 * current FIFO lot costs (which are correct after adjustment).
 */
async function fixYearEndValues() {
  console.log('=== FIX YEAR-END COUNT VALUES ===\n');

  // Get the 2024 year-end count
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
    console.log('No confirmed year-end count found for 2024');
    return;
  }

  console.log(`Found Year-End Count: ${yearEndCount.year}`);
  console.log(`Status: ${yearEndCount.status}`);
  console.log(`Items: ${yearEndCount.items.length}\n`);

  let totalOldValue = 0;
  let totalNewValue = 0;
  let updatedCount = 0;
  const updates: Array<{productName: string; oldValue: number; newValue: number; diff: number}> = [];

  // Process each item
  for (const item of yearEndCount.items) {
    // Get current FIFO lots for this product
    const lots = await prisma.purchaseLot.findMany({
      where: {
        productId: item.productId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' }, // FIFO order
    });

    // Calculate value based on current FIFO lots
    let newValue = 0;
    for (const lot of lots) {
      newValue += lot.remainingQuantity * lot.unitCost;
    }

    const oldValue = item.value || 0;
    const diff = Math.abs(newValue - oldValue);

    totalOldValue += oldValue;
    totalNewValue += newValue;

    // Update if there's a significant difference
    if (diff > 0.01) {
      await prisma.yearEndCountItem.update({
        where: { id: item.id },
        data: { value: newValue },
      });

      updates.push({
        productName: item.product.name,
        oldValue,
        newValue,
        diff,
      });

      updatedCount++;
    }
  }

  console.log(`=== RESULTS ===`);
  console.log(`Total items checked: ${yearEndCount.items.length}`);
  console.log(`Items updated: ${updatedCount}\n`);

  console.log(`Old total value: ${totalOldValue.toFixed(2)} SEK`);
  console.log(`New total value: ${totalNewValue.toFixed(2)} SEK`);
  console.log(`Difference: ${(totalNewValue - totalOldValue).toFixed(2)} SEK\n`);

  if (updates.length > 0) {
    console.log(`=== TOP 10 CHANGES ===`);
    updates
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 10)
      .forEach((update, i) => {
        console.log(`${i + 1}. ${update.productName}`);
        console.log(`   Old: ${update.oldValue.toFixed(2)} SEK → New: ${update.newValue.toFixed(2)} SEK (Δ ${update.diff.toFixed(2)} SEK)`);
      });
  }

  console.log('\n✓ Year-end count values updated to match current FIFO inventory');

  await prisma.$disconnect();
}

fixYearEndValues().catch((error) => {
  console.error('Error fixing year-end values:', error);
  process.exit(1);
});
