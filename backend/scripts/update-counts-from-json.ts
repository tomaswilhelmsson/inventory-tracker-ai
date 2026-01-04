import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface JsonPurchase {
  purchase_id: string;
  product_id: string;
  supplier_id: string;
  purchase_date: string;
  quantity: string;
  quantity_left: string;
  verification_number: string | null;
  price_excluding_vat: string;
}

/**
 * This script updates purchase quantities and remaining quantities from the JSON file
 * to ensure decimal precision matches the physical counts that were recorded.
 * Only updates quantity and remainingQuantity fields, preserving all other data.
 */
async function updateCountsFromJson() {
  try {
    console.log('Starting count update from JSON...\n');

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

    const jsonPurchases: JsonPurchase[] = purchasesTable.data;

    console.log(`Found ${jsonPurchases.length} purchases in JSON file\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;
    let multipleFoundCount = 0;

    // Process each purchase from JSON
    for (const jsonPurchase of jsonPurchases) {
      const purchaseDate = new Date(jsonPurchase.purchase_date);
      const quantity = parseFloat(jsonPurchase.quantity);
      const quantityLeft = parseFloat(jsonPurchase.quantity_left);
      const verificationNumber = jsonPurchase.verification_number;
      const priceExclVat = parseFloat(jsonPurchase.price_excluding_vat);
      const unitCost = priceExclVat / quantity;

      try {
        // Find matching purchase lot by date, unit cost (within tolerance), and verification number
        // This combination should uniquely identify most lots
        const matchingLots = await prisma.purchaseLot.findMany({
          where: {
            purchaseDate: purchaseDate,
            verificationNumber: verificationNumber,
          },
          include: {
            product: { select: { name: true } },
            supplier: { select: { name: true } },
          },
        });

        // Further filter by unit cost with tolerance
        const costTolerance = 0.01;
        const exactMatches = matchingLots.filter(lot => 
          Math.abs(lot.unitCost - unitCost) < costTolerance
        );

        if (exactMatches.length === 0) {
          notFoundCount++;
          continue;
        }

        // If multiple matches, try to narrow down by original quantity
        let matchingLot = exactMatches[0];
        if (exactMatches.length > 1) {
          // Try to find exact match by quantity (some may have been rounded during import)
          const qtyTolerance = 0.5;
          const qtyMatches = exactMatches.filter(lot =>
            Math.abs(lot.quantity - quantity) < qtyTolerance
          );
          
          if (qtyMatches.length === 1) {
            matchingLot = qtyMatches[0];
          } else {
            console.log(
              `⚠️  Multiple matches: Date ${jsonPurchase.purchase_date}, ` +
              `Verification ${verificationNumber || 'N/A'} (${exactMatches.length} lots) - using first match`
            );
            multipleFoundCount++;
            // Continue anyway with first match rather than skipping
          }
        }

        // Check if update is needed
        const needsUpdate = 
          matchingLot.quantity !== quantity || 
          matchingLot.remainingQuantity !== quantityLeft;

        if (needsUpdate) {
          await prisma.purchaseLot.update({
            where: { id: matchingLot.id },
            data: {
              quantity: quantity,
              remainingQuantity: quantityLeft,
            },
          });

          console.log(
            `✓ Updated: ${matchingLot.product?.name || 'Unknown'} from ${matchingLot.supplier?.name || 'Unknown'}\n` +
            `  Date: ${jsonPurchase.purchase_date}, Verification: ${verificationNumber || 'N/A'}\n` +
            `  Qty: ${matchingLot.quantity.toFixed(2)} → ${quantity.toFixed(2)}\n` +
            `  Remaining: ${matchingLot.remainingQuantity.toFixed(2)} → ${quantityLeft.toFixed(2)}`
          );
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(
          `✗ Error processing purchase (Date ${jsonPurchase.purchase_date}, Ver ${verificationNumber}):`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log('\n=== Update Complete ===');
    console.log(`Updated: ${updatedCount} purchase lots`);
    console.log(`Skipped: ${skippedCount} lots (no changes needed)`);
    console.log(`Not found: ${notFoundCount} lots`);
    console.log(`Multiple matches: ${multipleFoundCount} lots`);

    // Verify inventory totals
    console.log('\n=== Inventory Verification ===');
    const allLots = await prisma.purchaseLot.findMany({
      where: {
        remainingQuantity: { gt: 0 },
      },
      include: {
        product: true,
      },
    });

    const productInventory = new Map<number, { name: string; total: number }>();
    
    for (const lot of allLots) {
      if (lot.productId) {
        const existing = productInventory.get(lot.productId) || { 
          name: lot.product?.name || 'Unknown', 
          total: 0 
        };
        existing.total += lot.remainingQuantity;
        productInventory.set(lot.productId, existing);
      }
    }

    console.log(`Total products with inventory: ${productInventory.size}`);
    console.log(`Total lots with remaining quantity: ${allLots.length}`);

    // Show a few examples of inventory totals
    console.log('\nSample inventory totals:');
    let count = 0;
    for (const [productId, data] of productInventory.entries()) {
      if (count < 5) {
        console.log(`  ${data.name}: ${data.total.toFixed(2)}`);
        count++;
      }
    }

  } catch (error) {
    console.error('Error updating counts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateCountsFromJson()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
