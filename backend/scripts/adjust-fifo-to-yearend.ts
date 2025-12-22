import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

/**
 * Adjust FIFO lots to match the year-end count
 * 
 * The import created year-end counts but didn't adjust FIFO lots.
 * This script simulates what confirmYearEndCount() does: calls
 * consumeInventoryFIFO for each product to adjust lot quantities
 * to match the counted quantities in the year-end count.
 */

async function consumeInventoryFIFO(productId: number, targetQuantity: number) {
  if (targetQuantity < 0) {
    throw new Error('Target quantity cannot be negative');
  }

  // Get ALL lots for the product in REVERSE FIFO order (newest first)
  const lots = await prisma.purchaseLot.findMany({
    where: { productId },
    orderBy: { purchaseDate: 'desc' }, // Newest first
  });

  let remainingToAllocate = targetQuantity;
  const updates: { id: number; newRemainingQuantity: number }[] = [];

  // Process lots from newest to oldest, allocating the target quantity
  for (const lot of lots) {
    if (remainingToAllocate <= 0) {
      // No more inventory to allocate - this lot should be fully consumed
      updates.push({
        id: lot.id,
        newRemainingQuantity: 0,
      });
    } else if (remainingToAllocate >= lot.quantity) {
      // Keep entire lot (it's needed to meet target quantity)
      updates.push({
        id: lot.id,
        newRemainingQuantity: lot.quantity,
      });
      remainingToAllocate -= lot.quantity;
    } else {
      // Partially keep this lot (only need some of it to meet target)
      updates.push({
        id: lot.id,
        newRemainingQuantity: remainingToAllocate,
      });
      remainingToAllocate = 0;
    }
  }

  // Apply updates
  for (const update of updates) {
    await prisma.purchaseLot.update({
      where: { id: update.id },
      data: { remainingQuantity: update.newRemainingQuantity },
    });
  }

  return {
    updatedLots: updates.length,
    targetQuantity,
  };
}

async function adjustFIFOToYearEnd() {
  console.log('=== ADJUST FIFO LOTS TO MATCH YEAR-END COUNT ===\n');

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

  console.log(`Year-End Count: ${yearEndCount.year}`);
  console.log(`Items: ${yearEndCount.items.length}\n`);

  console.log('Adjusting FIFO lots to match counted quantities...\n');

  let processed = 0;
  let totalOldValue = 0;
  let totalNewValue = 0;

  for (const item of yearEndCount.items) {
    const productName = item.product.name;
    const targetQty = item.countedQuantity || 0;

    // Get current FIFO value
    const currentLots = await prisma.purchaseLot.findMany({
      where: {
        productId: item.productId,
        remainingQuantity: { gt: 0 },
      },
    });

    const oldValue = currentLots.reduce((sum, lot) => sum + lot.remainingQuantity * lot.unitCost, 0);

    // Adjust FIFO lots
    await consumeInventoryFIFO(item.productId, targetQty);

    // Get new FIFO value
    const newLots = await prisma.purchaseLot.findMany({
      where: {
        productId: item.productId,
        remainingQuantity: { gt: 0 },
      },
    });

    const newValue = newLots.reduce((sum, lot) => sum + lot.remainingQuantity * lot.unitCost, 0);

    totalOldValue += oldValue;
    totalNewValue += newValue;

    if (Math.abs(oldValue - newValue) > 0.01) {
      console.log(`${productName}: ${oldValue.toFixed(2)} → ${newValue.toFixed(2)} SEK`);
    }

    processed++;
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Products processed: ${processed}`);
  console.log(`Old FIFO total value: ${totalOldValue.toFixed(2)} SEK`);
  console.log(`New FIFO total value: ${totalNewValue.toFixed(2)} SEK`);
  console.log(`Year-end count value: ${yearEndCount.items.reduce((sum, item) => sum + (item.value || 0), 0).toFixed(2)} SEK`);

  console.log('\n✓ FIFO lots adjusted to match year-end count');

  await prisma.$disconnect();
}

adjustFIFOToYearEnd().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
