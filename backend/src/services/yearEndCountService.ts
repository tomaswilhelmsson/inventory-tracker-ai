import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { createInventoryService } from './inventoryService';

/**
 * Factory function to create yearEndCountService with injectable dependencies
 * @param dbClient - Prisma client instance (defaults to production prisma)
 * @param inventoryServiceInstance - Inventory service instance (defaults to production inventoryService)
 */
export const createYearEndCountService = (
  dbClient: PrismaClient = prisma,
  inventoryServiceInstance = createInventoryService(dbClient)
) => ({
  /**
   * Initiate a year-end count for a specific year
   */
  async initiateYearEndCount(year: number) {
    // Check if year is locked
    const isLocked = await dbClient.lockedYear.findUnique({
      where: { year },
    });

    // Get existing counts for this year
    const existingCounts = await dbClient.yearEndCount.findMany({
      where: { year },
      orderBy: { revision: 'desc' },
      include: {
        items: true,
        finishedGoodsItems: true,
      },
    });

    let revision = 1;
    let previousCount = null;

    if (existingCounts.length > 0) {
      if (isLocked) {
        // Year is locked and counts exist - cannot create new count
        throw new AppError(400, `Year ${year} is locked. Cannot create new count. Unlock the year first to create a new revision.`);
      }
      // Year is unlocked and counts exist - create next revision
      revision = existingCounts[0].revision + 1;
      previousCount = existingCounts[0]; // Store previous count to copy counted values
    }

    // Get all products with remaining inventory
    const products = await dbClient.product.findMany({
      include: {
        purchaseLots: {
          where: {
            remainingQuantity: { gt: 0 },
          },
          orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
        },
      },
    });

    // Create year-end count
    const yearEndCount = await dbClient.yearEndCount.create({
      data: {
        year,
        revision,
        status: 'draft',
      },
    });

    // Create a map of previous counted quantities for products
    const previousProductCounts = new Map();
    if (previousCount) {
      previousCount.items.forEach((item: any) => {
        previousProductCounts.set(item.productId, item.countedQuantity);
      });
    }

    // Create count items for each product with remaining inventory
    const countItems = [];
    for (const product of products) {
      const expectedQuantity = product.purchaseLots.reduce(
        (sum, lot) => sum + lot.remainingQuantity,
        0
      );

      // Only create item if product has inventory
      if (expectedQuantity > 0) {
        // Copy counted quantity from previous revision if it exists
        const previousCountedQty = previousProductCounts.get(product.id) || null;
        
        // Calculate FIFO value if we have a counted quantity
        let fifoValue = null;
        if (previousCountedQty !== null && previousCountedQty > 0) {
          const lots = product.purchaseLots;
          let remainingToValue = previousCountedQty;
          let value = 0;

          for (const lot of lots) {
            if (remainingToValue <= 0) break;
            const quantityFromLot = Math.min(remainingToValue, lot.remainingQuantity);
            const costPerUnit = lot.unitCostExclVAT ?? lot.unitCost;
            value += quantityFromLot * costPerUnit;
            remainingToValue -= quantityFromLot;
          }
          fifoValue = value;
        }
        
        const item = await dbClient.yearEndCountItem.create({
          data: {
            yearEndCountId: yearEndCount.id,
            productId: product.id,
            expectedQuantity,
            countedQuantity: previousCountedQty,
            variance: previousCountedQty !== null ? previousCountedQty - expectedQuantity : null,
            value: fifoValue,
          },
        });
        countItems.push(item);
      }
    }

    // Get all active finished goods
    const finishedGoods = await dbClient.finishedGood.findMany({
      where: { isActive: true },
    });

    // Create a map of previous counted quantities for finished goods
    const previousFGCounts = new Map();
    if (previousCount) {
      previousCount.finishedGoodsItems.forEach((item: any) => {
        previousFGCounts.set(item.finishedGoodId, item.countedQuantity);
      });
    }

    // Create count items for each active finished good with expectedQuantity = 0
    // Users will enter the counted quantity manually
    const finishedGoodsItems = [];
    for (const finishedGood of finishedGoods) {
      // Copy counted quantity from previous revision if it exists
      const previousCountedQty = previousFGCounts.get(finishedGood.id) || null;
      
      const item = await dbClient.finishedGoodsCountItem.create({
        data: {
          yearEndCountId: yearEndCount.id,
          finishedGoodId: finishedGood.id,
          expectedQuantity: 0, // No expected quantity for finished goods
          countedQuantity: previousCountedQty,
          variance: previousCountedQty !== null ? previousCountedQty - 0 : null,
          materialCostPerUnit: finishedGood.materialCost,
          totalValue: previousCountedQty !== null ? previousCountedQty * finishedGood.materialCost : null,
        },
      });
      finishedGoodsItems.push(item);
    }

    return {
      ...yearEndCount,
      itemsCount: countItems.length,
      finishedGoodsItemsCount: finishedGoodsItems.length,
    };
  },

  /**
   * Get count sheet with products sorted alphabetically
   */
  async getCountSheet(countId: number) {
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        items: {
          include: {
            product: {
              include: {
                unit: true,
                suppliers: {
                  include: {
                    supplier: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            product: {
              name: 'asc', // Alphabetical sorting for easy lookup
            },
          },
        },
        finishedGoodsItems: {
          include: {
            finishedGood: {
              include: {
                unit: true,
              },
            },
          },
          orderBy: {
            finishedGood: {
              name: 'asc', // Alphabetical sorting for easy lookup
            },
          },
        },
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    // Calculate progress for raw materials
    const totalProducts = count.items.length;
    const countedProducts = count.items.filter((item) => item.countedQuantity !== null).length;

    // Calculate progress for finished goods
    const totalFinishedGoods = count.finishedGoodsItems.length;
    const countedFinishedGoods = count.finishedGoodsItems.filter((item) => item.countedQuantity !== null).length;

    return {
      ...count,
      progress: {
        total: totalProducts,
        counted: countedProducts,
        percentage: totalProducts > 0 ? Math.round((countedProducts / totalProducts) * 100) : 0,
      },
      finishedGoodsProgress: {
        total: totalFinishedGoods,
        counted: countedFinishedGoods,
        percentage: totalFinishedGoods > 0 ? Math.round((countedFinishedGoods / totalFinishedGoods) * 100) : 0,
      },
    };
  },

  /**
   * Refresh expected quantities from current inventory
   * Preserves all counted quantities that have been entered
   * Adds new products with inventory, removes products without inventory
   */
  async refreshExpectedQuantities(countId: number) {
    // Verify count exists and is in draft status
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        items: true,
        finishedGoodsItems: true,
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    if (count.status !== 'draft') {
      throw new AppError(400, 'Cannot refresh confirmed year-end count');
    }

    // Get all products with current remaining inventory
    const products = await dbClient.product.findMany({
      include: {
        purchaseLots: {
          where: {
            remainingQuantity: { gt: 0 },
          },
          orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
        },
      },
    });

    // Create a map of existing count items by productId
    const existingItemsMap = new Map(
      count.items.map((item) => [item.productId, item])
    );

    // Track which products should be in the count
    const currentProductIds = new Set<number>();

    // Process each product with inventory
    for (const product of products) {
      const expectedQuantity = product.purchaseLots.reduce(
        (sum, lot) => sum + lot.remainingQuantity,
        0
      );

      // Only process products with inventory
      if (expectedQuantity > 0) {
        currentProductIds.add(product.id);
        const existingItem = existingItemsMap.get(product.id);

        if (existingItem) {
          // Update existing item's expected quantity
          await dbClient.yearEndCountItem.update({
            where: { id: existingItem.id },
            data: {
              expectedQuantity,
              // Recalculate variance if item has been counted
              variance: existingItem.countedQuantity !== null 
                ? existingItem.countedQuantity - expectedQuantity 
                : null,
            },
          });

          // Recalculate FIFO value if item has been counted
          if (existingItem.countedQuantity !== null) {
            const lots = product.purchaseLots;
            let remainingToValue = existingItem.countedQuantity;
            let value = 0;

            for (const lot of lots) {
              if (remainingToValue <= 0) break;
              const quantityFromLot = Math.min(remainingToValue, lot.remainingQuantity);
              const costPerUnit = lot.unitCostExclVAT ?? lot.unitCost;
              value += quantityFromLot * costPerUnit;
              remainingToValue -= quantityFromLot;
            }

            await dbClient.yearEndCountItem.update({
              where: { id: existingItem.id },
              data: { value },
            });
          }
        } else {
          // Create new item for product not previously in count
          await dbClient.yearEndCountItem.create({
            data: {
              yearEndCountId: countId,
              productId: product.id,
              expectedQuantity,
              countedQuantity: null,
              variance: null,
              value: null,
            },
          });
        }
      }
    }

    // Remove items for products that no longer have inventory
    const itemsToRemove = count.items.filter(
      (item) => !currentProductIds.has(item.productId)
    );

    for (const item of itemsToRemove) {
      await dbClient.yearEndCountItem.delete({
        where: { id: item.id },
      });
    }

    // Handle finished goods - update material costs from current finished good records
    const finishedGoods = await dbClient.finishedGood.findMany({
      where: { isActive: true },
    });

    // Create a map of existing finished goods items
    const existingFGItemsMap = new Map(
      count.finishedGoodsItems?.map((item) => [item.finishedGoodId, item]) || []
    );

    // Track which finished goods should be in the count
    const currentFinishedGoodIds = new Set<number>();
    let fgItemsAdded = 0;

    // Process each active finished good
    for (const fg of finishedGoods) {
      currentFinishedGoodIds.add(fg.id);
      const existingFGItem = existingFGItemsMap.get(fg.id);

      if (existingFGItem) {
        // Update material cost if it has changed
        if (existingFGItem.materialCostPerUnit !== fg.materialCost) {
          await dbClient.finishedGoodsCountItem.update({
            where: { id: existingFGItem.id },
            data: {
              materialCostPerUnit: fg.materialCost,
              // Recalculate total value if item has been counted
              totalValue: existingFGItem.countedQuantity !== null
                ? existingFGItem.countedQuantity * fg.materialCost
                : null,
            },
          });
        }
      } else {
        // Add new finished good item
        await dbClient.finishedGoodsCountItem.create({
          data: {
            yearEndCountId: countId,
            finishedGoodId: fg.id,
            expectedQuantity: 0,
            countedQuantity: null,
            variance: null,
            materialCostPerUnit: fg.materialCost,
            totalValue: null,
          },
        });
        fgItemsAdded++;
      }
    }

    // Remove finished goods items for inactive finished goods
    const fgItemsToRemove = Array.from(existingFGItemsMap.values()).filter(
      (item) => !currentFinishedGoodIds.has(item.finishedGoodId)
    );

    for (const item of fgItemsToRemove) {
      await dbClient.finishedGoodsCountItem.delete({
        where: { id: item.id },
      });
    }

    return {
      message: 'Expected quantities and finished goods refreshed successfully',
      itemsUpdated: currentProductIds.size,
      itemsAdded: currentProductIds.size - existingItemsMap.size + itemsToRemove.length,
      itemsRemoved: itemsToRemove.length,
      finishedGoodsItemsAdded: fgItemsAdded,
      finishedGoodsItemsRemoved: fgItemsToRemove.length,
    };
  },

  /**
   * Update count item with actual counted quantity (auto-save)
   */
  async updateCountItem(countId: number, productId: number, countedQuantity: number) {
    // Verify count exists and is in draft status
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    if (count.status !== 'draft') {
      throw new AppError(400, 'Cannot update confirmed year-end count');
    }

    // Find the count item
    const item = await dbClient.yearEndCountItem.findFirst({
      where: {
        yearEndCountId: countId,
        productId,
      },
    });

    if (!item) {
      throw new AppError(404, 'Count item not found for this product');
    }

    // Calculate variance
    const variance = countedQuantity - item.expectedQuantity;

    // Calculate FIFO value for counted quantity
    const lots = await dbClient.purchaseLot.findMany({
      where: {
        productId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
    });

    let remainingToValue = countedQuantity;
    let value = 0;

    for (const lot of lots) {
      if (remainingToValue <= 0) break;

      const quantityFromLot = Math.min(remainingToValue, lot.remainingQuantity);
      // Use unitCostExclVAT (primary) or fall back to unitCost for backward compatibility
      const costPerUnit = lot.unitCostExclVAT ?? lot.unitCost;
      value += quantityFromLot * costPerUnit;
      remainingToValue -= quantityFromLot;
    }

    // Update the count item
    return await dbClient.yearEndCountItem.update({
      where: { id: item.id },
      data: {
        countedQuantity,
        variance,
        value,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Update finished good count item with actual counted quantity
   */
  async updateFinishedGoodCountItem(countId: number, finishedGoodId: number, countedQuantity: number) {
    // Verify count exists and is in draft status
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    if (count.status !== 'draft') {
      throw new AppError(400, 'Cannot update confirmed year-end count');
    }

    // Find the count item
    const item = await dbClient.finishedGoodsCountItem.findFirst({
      where: {
        yearEndCountId: countId,
        finishedGoodId,
      },
    });

    if (!item) {
      throw new AppError(404, 'Finished good count item not found');
    }

    // Calculate variance (counted - expected, where expected is always 0)
    const variance = countedQuantity - item.expectedQuantity;

    // Calculate total value using material cost
    const totalValue = countedQuantity * item.materialCostPerUnit;

    // Update the count item
    return await dbClient.finishedGoodsCountItem.update({
      where: { id: item.id },
      data: {
        countedQuantity,
        variance,
        totalValue,
      },
      include: {
        finishedGood: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Calculate variances for all items
   */
  async calculateVariances(countId: number) {
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    const summary = {
      totalProducts: count.items.length,
      countedProducts: count.items.filter((item) => item.countedQuantity !== null).length,
      totalExpected: count.items.reduce((sum, item) => sum + item.expectedQuantity, 0),
      totalCounted: count.items.reduce((sum, item) => sum + (item.countedQuantity || 0), 0),
      totalVariance: count.items.reduce((sum, item) => sum + (item.variance || 0), 0),
      totalValue: count.items.reduce((sum, item) => sum + (item.value || 0), 0),
      items: count.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        expectedQuantity: item.expectedQuantity,
        countedQuantity: item.countedQuantity,
        variance: item.variance,
        value: item.value,
        status:
          item.countedQuantity === null
            ? 'pending'
            : item.variance === 0
            ? 'exact'
            : (item.variance || 0) > 0
            ? 'surplus'
            : 'shortage',
      })),
    };

    return summary;
  },

  /**
   * Calculate variances for finished goods items
   */
  async calculateFinishedGoodsVariances(countId: number) {
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        finishedGoodsItems: {
          include: {
            finishedGood: {
              include: {
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    const summary = {
      totalFinishedGoods: count.finishedGoodsItems.length,
      countedFinishedGoods: count.finishedGoodsItems.filter((item) => item.countedQuantity !== null).length,
      totalExpected: count.finishedGoodsItems.reduce((sum, item) => sum + item.expectedQuantity, 0),
      totalCounted: count.finishedGoodsItems.reduce((sum, item) => sum + (item.countedQuantity || 0), 0),
      totalVariance: count.finishedGoodsItems.reduce((sum, item) => sum + (item.variance || 0), 0),
      totalValue: count.finishedGoodsItems.reduce((sum, item) => sum + (item.totalValue || 0), 0),
      items: count.finishedGoodsItems.map((item) => ({
        finishedGoodId: item.finishedGoodId,
        finishedGoodName: item.finishedGood.name,
        unitName: item.finishedGood.unit?.name || '',
        expectedQuantity: item.expectedQuantity,
        countedQuantity: item.countedQuantity,
        variance: item.variance,
        materialCostPerUnit: item.materialCostPerUnit,
        totalValue: item.totalValue,
        status:
          item.countedQuantity === null
            ? 'pending'
            : item.variance === 0
            ? 'exact'
            : (item.variance || 0) > 0
            ? 'surplus'
            : 'shortage',
      })),
    };

    return summary;
  },

  /**
   * Generate year-end report with lot breakdown
   */
  async generateYearEndReport(countId: number) {
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  unit: true,
                  suppliers: {
                    include: {
                      supplier: true,
                    },
                  },
                },
              },
            },
          orderBy: {
            product: {
              name: 'asc',
            },
          },
        },
        finishedGoodsItems: {
          include: {
            finishedGood: {
              include: {
                unit: true,
              },
            },
          },
          orderBy: {
            finishedGood: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    // Fetch ALL revisions for this year to enable comparison
    const allYearRevisions = await dbClient.yearEndCount.findMany({
      where: { 
        year: count.year,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        revision: 'asc',
      },
    });

    // PERFORMANCE FIX: Batch fetch all lots in a single query instead of N queries
    // This eliminates the N+1 query problem
    const productIds = count.items.map(item => item.productId);
    const allLots = await dbClient.purchaseLot.findMany({
      where: {
        productId: { in: productIds },
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group lots by product in memory
    const lotsByProduct = allLots.reduce((acc, lot) => {
      if (lot.productId !== null) {
        if (!acc[lot.productId]) {
          acc[lot.productId] = [];
        }
        acc[lot.productId].push(lot);
      }
      return acc;
    }, {} as Record<number, typeof allLots>);

    // Build report items using pre-fetched lots
    const reportItems = count.items.map((item) => {
      const lots = lotsByProduct[item.productId] || [];
      
      // Get supplier name(s) - show first supplier or "Multiple suppliers"
      let supplierName = 'Unknown';
      if (item.product.suppliers && item.product.suppliers.length > 0) {
        if (item.product.suppliers.length === 1) {
          supplierName = item.product.suppliers[0].supplier.name;
        } else {
          supplierName = `Multiple (${item.product.suppliers.map(ps => ps.supplier.name).join(', ')})`;
        }
      }
      
      return {
        productId: item.productId,
        productName: item.product.name,
        supplierName,
        expectedQuantity: item.expectedQuantity,
        countedQuantity: item.countedQuantity,
        variance: item.variance,
        value: item.value,
        lotBreakdown: lots.map((lot) => {
          // Get supplier name from relation or snapshot
          let supplierName = 'Unknown';
          if (lot.supplier?.name) {
            supplierName = lot.supplier.name;
          } else if (lot.supplierSnapshot) {
            const snapshot = typeof lot.supplierSnapshot === 'string' 
              ? JSON.parse(lot.supplierSnapshot) 
              : lot.supplierSnapshot;
            supplierName = snapshot.name || 'Unknown';
          }
          
          // Use unitCostExclVAT (primary) or fall back to unitCost for backward compatibility
          const costPerUnit = lot.unitCostExclVAT ?? lot.unitCost;
          
          return {
            purchaseDate: lot.purchaseDate,
            year: lot.year,
            quantity: lot.quantity,
            remainingQuantity: lot.remainingQuantity,
            unitCost: costPerUnit,
            lotValue: lot.remainingQuantity * costPerUnit,
            supplier: supplierName,
          };
        }),
      };
    });

    const totalExpected = count.items.reduce((sum, item) => sum + item.expectedQuantity, 0);
    const totalCounted = count.items.reduce((sum, item) => sum + (item.countedQuantity || 0), 0);
    const totalValue = count.items.reduce((sum, item) => sum + (item.value || 0), 0);

    // Build finished goods report items
    const finishedGoodsReportItems = count.finishedGoodsItems.map((item) => ({
      finishedGoodId: item.finishedGoodId,
      finishedGoodName: item.finishedGood.name,
      unitName: item.finishedGood.unit?.name || '',
      expectedQuantity: item.expectedQuantity,
      countedQuantity: item.countedQuantity,
      variance: item.variance,
      materialCostPerUnit: item.materialCostPerUnit,
      totalValue: item.totalValue,
    }));

    const totalFinishedGoodsExpected = count.finishedGoodsItems.reduce((sum, item) => sum + item.expectedQuantity, 0);
    const totalFinishedGoodsCounted = count.finishedGoodsItems.reduce((sum, item) => sum + (item.countedQuantity || 0), 0);
    const totalFinishedGoodsValue = count.finishedGoodsItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);

    // Get all revisions for this year (for audit trail)
    const allRevisions = await dbClient.yearEndCount.findMany({
      where: { year: count.year },
      orderBy: { revision: 'asc' },
      select: {
        id: true,
        revision: true,
        status: true,
        createdAt: true,
        confirmedAt: true,
      },
    });

    // Build revision comparison data: organize by product across all revisions
    const revisionComparison = new Map<number, any>();
    
    for (const rev of allYearRevisions) {
      for (const item of rev.items) {
        if (!revisionComparison.has(item.productId)) {
          revisionComparison.set(item.productId, {
            productId: item.productId,
            productName: item.product.name,
            revisions: {},
          });
        }
        
        const productData = revisionComparison.get(item.productId)!;
        productData.revisions[rev.revision] = {
          expectedQuantity: item.expectedQuantity,
          countedQuantity: item.countedQuantity,
          variance: item.variance,
          value: item.value,
        };
      }
    }

    // Convert to array and calculate changes between consecutive revisions
    const comparisonItems = Array.from(revisionComparison.values()).map(item => {
      const revisionNumbers = Object.keys(item.revisions).map(Number).sort((a, b) => a - b);
      const changes: Record<string, number> = {};
      
      for (let i = 1; i < revisionNumbers.length; i++) {
        const prevRev = revisionNumbers[i - 1];
        const currRev = revisionNumbers[i];
        const prevCounted = item.revisions[prevRev]?.countedQuantity || 0;
        const currCounted = item.revisions[currRev]?.countedQuantity || 0;
        changes[`${prevRev}_to_${currRev}`] = currCounted - prevCounted;
      }
      
      return {
        ...item,
        changes,
      };
    });

    // Get unlock history for this year
    const unlockHistory = await dbClient.yearUnlockAudit.findMany({
      where: { year: count.year },
      orderBy: { unlockedAt: 'desc' },
      select: {
        reasonCategory: true,
        description: true,
        unlockedAt: true,
      },
    });

    return {
      year: count.year,
      revision: count.revision,
      status: count.status,
      confirmedAt: count.confirmedAt,
      totalExpected,
      totalCounted,
      totalVariance: totalCounted - totalExpected,
      totalValue,
      items: reportItems,
      finishedGoods: {
        totalExpected: totalFinishedGoodsExpected,
        totalCounted: totalFinishedGoodsCounted,
        totalVariance: totalFinishedGoodsCounted - totalFinishedGoodsExpected,
        totalValue: totalFinishedGoodsValue,
        items: finishedGoodsReportItems,
      },
      revisionHistory: allRevisions,
      unlockHistory,
      revisionComparison: comparisonItems,
      hasMultipleRevisions: allYearRevisions.length > 1,
    };
  },

  /**
   * Confirm year-end count and lock the year
   * This updates lot quantities using FIFO consumption
   */
  async confirmYearEndCount(countId: number) {
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        items: true,
        finishedGoodsItems: true,
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    if (count.status === 'confirmed') {
      throw new AppError(400, 'Year-end count already confirmed');
    }

    // Validate all products have been counted
    const uncountedItems = count.items.filter((item) => item.countedQuantity === null);
    if (uncountedItems.length > 0) {
      const uncountedProducts = await dbClient.product.findMany({
        where: {
          id: {
            in: uncountedItems.map((item) => item.productId),
          },
        },
        select: {
          name: true,
        },
      });

      throw new AppError(
        400,
        `Cannot confirm count. ${uncountedItems.length} products not counted: ${uncountedProducts.map((p) => p.name).join(', ')}`
      );
    }

    // Validate all finished goods have been counted
    const uncountedFinishedGoods = count.finishedGoodsItems.filter((item) => item.countedQuantity === null);
    if (uncountedFinishedGoods.length > 0) {
      const uncountedFG = await dbClient.finishedGood.findMany({
        where: {
          id: {
            in: uncountedFinishedGoods.map((item) => item.finishedGoodId),
          },
        },
        select: {
          name: true,
        },
      });

      throw new AppError(
        400,
        `Cannot confirm count. ${uncountedFinishedGoods.length} finished goods not counted: ${uncountedFG.map((fg) => fg.name).join(', ')}`
      );
    }

    // CRITICAL: Wrap all updates in a transaction to ensure atomicity
    // Either all changes succeed or all are rolled back
    const confirmedCount = await dbClient.$transaction(async (tx) => {
      // Update lot quantities using FIFO for each product
      for (const item of count.items) {
        await inventoryServiceInstance.consumeInventoryFIFO(item.productId, item.countedQuantity!, tx);
      }

      // Lock the year
      await tx.lockedYear.create({
        data: {
          year: count.year,
        },
      });

      // Update count status
      const updated = await tx.yearEndCount.update({
        where: { id: countId },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return updated;
    });

    return {
      ...confirmedCount,
      message: `Year ${count.year} confirmed and locked. All lot quantities updated using FIFO.`,
    };
  },

  /**
   * Get year-end count by year and optional revision
   * Defaults to latest revision if not specified
   */
  async getByYear(year: number, revision?: number) {
    let count;

    if (revision !== undefined) {
      // Get specific revision
      count = await dbClient.yearEndCount.findUnique({
        where: {
          year_revision: {
            year,
            revision,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  unit: true,
                  suppliers: { include: { supplier: true } },
                },
              },
            },
            orderBy: {
              product: {
                name: 'asc',
              },
            },
          },
        },
      });
    } else {
      // Get latest revision
      const counts = await dbClient.yearEndCount.findMany({
        where: { year },
        orderBy: { revision: 'desc' },
        take: 1,
        include: {
          items: {
            include: {
              product: {
                include: {
                  unit: true,
                  suppliers: { include: { supplier: true } },
                },
              },
            },
            orderBy: {
              product: {
                name: 'asc',
              },
            },
          },
        },
      });
      count = counts[0] || null;
    }

    if (!count) {
      const revisionMsg = revision !== undefined ? ` revision ${revision}` : '';
      throw new AppError(404, `Year-end count for ${year}${revisionMsg} not found`);
    }

    return count;
  },

  /**
   * Get all revisions for a year
   */
  async getAllRevisions(year: number) {
    const revisions = await dbClient.yearEndCount.findMany({
      where: { year },
      orderBy: { revision: 'asc' },
      select: {
        id: true,
        year: true,
        revision: true,
        status: true,
        confirmedAt: true,
        createdAt: true,
      },
    });

    return revisions;
  },

  /**
   * Compare two revisions side-by-side
   */
  async compareRevisions(year: number, revision1: number, revision2: number) {
    // Get both revisions
    const count1 = await dbClient.yearEndCount.findUnique({
      where: {
        year_revision: {
          year,
          revision: revision1,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const count2 = await dbClient.yearEndCount.findUnique({
      where: {
        year_revision: {
          year,
          revision: revision2,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!count1) {
      throw new AppError(404, `Year-end count for ${year} revision ${revision1} not found`);
    }

    if (!count2) {
      throw new AppError(404, `Year-end count for ${year} revision ${revision2} not found`);
    }

    // Create a map of products for easy lookup
    const items1Map = new Map(count1.items.map(item => [item.productId, item]));
    const items2Map = new Map(count2.items.map(item => [item.productId, item]));

    // Get all unique product IDs
    const allProductIds = new Set([...Array.from(items1Map.keys()), ...Array.from(items2Map.keys())]);

    // Compare items
    const comparison = Array.from(allProductIds).map(productId => {
      const item1 = items1Map.get(productId);
      const item2 = items2Map.get(productId);

      return {
        productId,
        productName: item1?.product.name || item2?.product.name || 'Unknown',
        revision1: {
          expectedQuantity: item1?.expectedQuantity || 0,
          countedQuantity: item1?.countedQuantity,
          variance: item1?.variance,
          value: item1?.value,
        },
        revision2: {
          expectedQuantity: item2?.expectedQuantity || 0,
          countedQuantity: item2?.countedQuantity,
          variance: item2?.variance,
          value: item2?.value,
        },
        difference: {
          expectedQuantity: (item2?.expectedQuantity || 0) - (item1?.expectedQuantity || 0),
          countedQuantity: (item2?.countedQuantity || 0) - (item1?.countedQuantity || 0),
          variance: (item2?.variance || 0) - (item1?.variance || 0),
          value: (item2?.value || 0) - (item1?.value || 0),
        },
      };
    });

    return {
      year,
      revision1: {
        revision: count1.revision,
        status: count1.status,
        confirmedAt: count1.confirmedAt,
      },
      revision2: {
        revision: count2.revision,
        status: count2.status,
        confirmedAt: count2.confirmedAt,
      },
      comparison,
    };
  },

  /**
   * Get most recently locked year
   */
  async getMostRecentLockedYear(): Promise<number | null> {
    const lockedYear = await dbClient.lockedYear.findFirst({
      orderBy: { year: 'desc' },
    });
    return lockedYear?.year || null;
  },

  /**
   * Unlock a year with audit trail
   */
  async unlockYear(year: number, reasonCategory: string, description: string) {
    // Validate reason category
    const validCategories = ['data_error', 'recount_required', 'audit_adjustment', 'other'];
    if (!validCategories.includes(reasonCategory)) {
      throw new AppError(400, `Invalid reason category. Must be one of: ${validCategories.join(', ')}`);
    }

    if (!description || description.trim().length === 0) {
      throw new AppError(400, 'Description is required for year unlock');
    }

    // Check if year is locked
    const lockedYear = await dbClient.lockedYear.findUnique({
      where: { year },
    });

    if (!lockedYear) {
      throw new AppError(400, `Year ${year} is not locked`);
    }

    // Check if this is the most recently locked year
    const mostRecentLockedYear = await this.getMostRecentLockedYear();
    if (mostRecentLockedYear !== year) {
      throw new AppError(400, `Can only unlock most recently locked year (${mostRecentLockedYear}). Cannot unlock year ${year}.`);
    }

    // Create unlock audit record
    await dbClient.yearUnlockAudit.create({
      data: {
        year,
        reasonCategory,
        description: description.trim(),
      },
    });

    // Delete the locked year record to unlock it
    await dbClient.lockedYear.delete({
      where: { year },
    });

    return {
      year,
      message: `Year ${year} unlocked successfully`,
      reasonCategory,
      description: description.trim(),
    };
  },

  /**
   * Get unlock history for a year
   */
  async getUnlockHistory(year: number) {
    const history = await dbClient.yearUnlockAudit.findMany({
      where: { year },
      orderBy: { unlockedAt: 'asc' },
    });

    return history;
  },

  /**
   * Check if there is a pending year-end count
   * Returns the pending year if purchases exist without confirmed count
   */
  async checkPendingCount() {
    // Get the latest purchase year
    const latestPurchase = await dbClient.purchaseLot.findFirst({
      orderBy: { year: 'desc' },
      select: { year: true },
    });

    if (!latestPurchase) {
      return { needsCount: false, pendingYear: null };
    }

    // Get the latest confirmed count
    const latestConfirmedCount = await dbClient.yearEndCount.findFirst({
      where: { status: 'confirmed' },
      orderBy: { year: 'desc' },
      select: { year: true },
    });

    const latestPurchaseYear = latestPurchase.year;
    const latestCountYear = latestConfirmedCount?.year || 0;

    const needsCount = latestPurchaseYear > latestCountYear;

    return {
      needsCount,
      pendingYear: needsCount ? latestPurchaseYear : null,
      latestPurchaseYear,
      latestCountYear,
    };
  },

  /**
   * Delete a draft year-end count
   * Only draft counts can be deleted - confirmed counts are immutable
   */
  async deleteYearEndCount(countId: number) {
    // Find count with item count
    const count = await dbClient.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    // Validate status - only drafts can be deleted
    if (count.status === 'confirmed') {
      throw new AppError(
        400,
        'Cannot delete confirmed year-end count. Confirmed counts are immutable for audit trail.'
      );
    }

    // Store item count before deletion
    const deletedItems = count._count.items;

    // Delete count (cascade will handle items)
    await dbClient.yearEndCount.delete({
      where: { id: countId },
    });

    return {
      message: 'Draft year-end count deleted successfully',
      deletedItems,
    };
  },
});

// Default export for production use
export const yearEndCountService = createYearEndCountService();
