import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface JsonPurchase {
  purchase_id: string;
  product_id: string;
  quantity_left: string;
  date_counted: string | null;
}

/**
 * This script restores inventory counts to match the year-end count from 2024-01-06
 * as recorded in wiltm_se_db_1.json. This ensures the database reflects the physical
 * count before any FIFO adjustments were applied.
 */
async function restoreYearEndCounts() {
  try {
    console.log('Starting year-end count restoration...\n');

    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../csv/wiltm_se_db_1.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);

    // Find the Purchases table in the JSON
    const purchasesTable = jsonData.find(
      (item: any) => item.type === 'table' && item.name === 'Purchases'
    );

    if (!purchasesTable) {
      throw new Error('Purchases table not found in JSON file');
    }

    const purchases: JsonPurchase[] = purchasesTable.data;

    console.log(`Found ${purchases.length} purchases in JSON file\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each purchase
    for (const purchase of purchases) {
      const purchaseId = parseInt(purchase.purchase_id);
      const quantityLeft = parseFloat(purchase.quantity_left);

      try {
        // Find the corresponding purchase lot in the database
        const lot = await prisma.purchaseLot.findFirst({
          where: {
            legacyPurchaseId: purchaseId,
          },
          include: {
            product: {
              select: { name: true },
            },
          },
        });

        if (!lot) {
          console.log(`⚠️  Purchase ${purchaseId}: No matching lot found (may not have been imported)`);
          skippedCount++;
          continue;
        }

        // Update the remaining quantity to match the year-end count
        if (lot.remainingQuantity !== quantityLeft) {
          await prisma.purchaseLot.update({
            where: { id: lot.id },
            data: {
              remainingQuantity: quantityLeft,
            },
          });

          console.log(
            `✓ Purchase ${purchaseId} (${lot.product?.name}): ` +
            `${lot.remainingQuantity.toFixed(2)} → ${quantityLeft.toFixed(2)}`
          );
          updatedCount++;
        }
      } catch (error) {
        console.error(`✗ Error updating purchase ${purchaseId}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Restoration Complete ===');
    console.log(`Updated: ${updatedCount} lots`);
    console.log(`Skipped: ${skippedCount} lots (not found)`);
    console.log(`Errors: ${errorCount} lots`);

    // Verify total inventory
    console.log('\n=== Inventory Summary ===');
    const products = await prisma.product.findMany({
      include: {
        purchaseLots: {
          where: {
            remainingQuantity: { gt: 0 },
          },
        },
      },
    });

    let totalItems = 0;
    for (const product of products) {
      const totalQty = product.purchaseLots.reduce(
        (sum, lot) => sum + lot.remainingQuantity,
        0
      );
      if (totalQty > 0) {
        totalItems++;
      }
    }

    console.log(`Total products with inventory: ${totalItems}`);

  } catch (error) {
    console.error('Error restoring year-end counts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
restoreYearEndCounts()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
