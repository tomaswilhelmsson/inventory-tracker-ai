import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { inventoryService } from './inventoryService';

export const yearEndCountService = {
  /**
   * Initiate a year-end count for a specific year
   */
  async initiateYearEndCount(year: number) {
    // Check if year is locked
    const isLocked = await prisma.lockedYear.findUnique({
      where: { year },
    });

    // Get existing counts for this year
    const existingCounts = await prisma.yearEndCount.findMany({
      where: { year },
      orderBy: { revision: 'desc' },
    });

    let revision = 1;

    if (existingCounts.length > 0) {
      if (isLocked) {
        // Year is locked and counts exist - cannot create new count
        throw new AppError(400, `Year ${year} is locked. Cannot create new count. Unlock the year first to create a new revision.`);
      }
      // Year is unlocked and counts exist - create next revision
      revision = existingCounts[0].revision + 1;
    }

    // Get all products with remaining inventory
    const products = await prisma.product.findMany({
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
    const yearEndCount = await prisma.yearEndCount.create({
      data: {
        year,
        revision,
        status: 'draft',
      },
    });

    // Create count items for each product with remaining inventory
    const countItems = [];
    for (const product of products) {
      const expectedQuantity = product.purchaseLots.reduce(
        (sum, lot) => sum + lot.remainingQuantity,
        0
      );

      // Only create item if product has inventory
      if (expectedQuantity > 0) {
        const item = await prisma.yearEndCountItem.create({
          data: {
            yearEndCountId: yearEndCount.id,
            productId: product.id,
            expectedQuantity,
            countedQuantity: null,
            variance: null,
            value: null,
          },
        });
        countItems.push(item);
      }
    }

    return {
      ...yearEndCount,
      itemsCount: countItems.length,
    };
  },

  /**
   * Get count sheet with products sorted alphabetically
   */
  async getCountSheet(countId: number) {
    const count = await prisma.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        items: {
          include: {
            product: {
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
          orderBy: {
            product: {
              name: 'asc', // Alphabetical sorting for easy lookup
            },
          },
        },
      },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    // Calculate progress
    const totalProducts = count.items.length;
    const countedProducts = count.items.filter((item) => item.countedQuantity !== null).length;

    return {
      ...count,
      progress: {
        total: totalProducts,
        counted: countedProducts,
        percentage: totalProducts > 0 ? Math.round((countedProducts / totalProducts) * 100) : 0,
      },
    };
  },

  /**
   * Update count item with actual counted quantity (auto-save)
   */
  async updateCountItem(countId: number, productId: number, countedQuantity: number) {
    // Verify count exists and is in draft status
    const count = await prisma.yearEndCount.findUnique({
      where: { id: countId },
    });

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    if (count.status !== 'draft') {
      throw new AppError(400, 'Cannot update confirmed year-end count');
    }

    // Find the count item
    const item = await prisma.yearEndCountItem.findFirst({
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
    const lots = await prisma.purchaseLot.findMany({
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
      value += quantityFromLot * lot.unitCost;
      remainingToValue -= quantityFromLot;
    }

    // Update the count item
    return await prisma.yearEndCountItem.update({
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
   * Calculate variances for all items
   */
  async calculateVariances(countId: number) {
    const count = await prisma.yearEndCount.findUnique({
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
   * Generate year-end report with lot breakdown
   */
  async generateYearEndReport(countId: number) {
    const count = await prisma.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: true,
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

    if (!count) {
      throw new AppError(404, 'Year-end count not found');
    }

    // Get lot breakdown for each product
    const reportItems = await Promise.all(
      count.items.map(async (item) => {
        const lots = await prisma.purchaseLot.findMany({
          where: {
            productId: item.productId,
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

        return {
          productId: item.productId,
          productName: item.product.name,
          supplierName: item.product.supplier.name,
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
            
            return {
              purchaseDate: lot.purchaseDate,
              year: lot.year,
              quantity: lot.quantity,
              remainingQuantity: lot.remainingQuantity,
              unitCost: lot.unitCost,
              lotValue: lot.remainingQuantity * lot.unitCost,
              supplier: supplierName,
            };
          }),
        };
      })
    );

    const totalExpected = count.items.reduce((sum, item) => sum + item.expectedQuantity, 0);
    const totalCounted = count.items.reduce((sum, item) => sum + (item.countedQuantity || 0), 0);
    const totalValue = count.items.reduce((sum, item) => sum + (item.value || 0), 0);

    return {
      year: count.year,
      status: count.status,
      confirmedAt: count.confirmedAt,
      totalExpected,
      totalCounted,
      totalVariance: totalCounted - totalExpected,
      totalValue,
      items: reportItems,
    };
  },

  /**
   * Confirm year-end count and lock the year
   * This updates lot quantities using FIFO consumption
   */
  async confirmYearEndCount(countId: number) {
    const count = await prisma.yearEndCount.findUnique({
      where: { id: countId },
      include: {
        items: true,
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
      const uncountedProducts = await prisma.product.findMany({
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

    // Update lot quantities using FIFO for each product
    for (const item of count.items) {
      await inventoryService.consumeInventoryFIFO(item.productId, item.countedQuantity!);
    }

    // Lock the year
    await prisma.lockedYear.create({
      data: {
        year: count.year,
      },
    });

    // Update count status
    const confirmedCount = await prisma.yearEndCount.update({
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
      count = await prisma.yearEndCount.findUnique({
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
                  supplier: true,
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
      const counts = await prisma.yearEndCount.findMany({
        where: { year },
        orderBy: { revision: 'desc' },
        take: 1,
        include: {
          items: {
            include: {
              product: {
                include: {
                  supplier: true,
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
    const revisions = await prisma.yearEndCount.findMany({
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
    const count1 = await prisma.yearEndCount.findUnique({
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

    const count2 = await prisma.yearEndCount.findUnique({
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
    const allProductIds = new Set([...items1Map.keys(), ...items2Map.keys()]);

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
    const lockedYear = await prisma.lockedYear.findFirst({
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
    const lockedYear = await prisma.lockedYear.findUnique({
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
    await prisma.yearUnlockAudit.create({
      data: {
        year,
        reasonCategory,
        description: description.trim(),
      },
    });

    // Delete the locked year record to unlock it
    await prisma.lockedYear.delete({
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
    const history = await prisma.yearUnlockAudit.findMany({
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
    const latestPurchase = await prisma.purchaseLot.findFirst({
      orderBy: { year: 'desc' },
      select: { year: true },
    });

    if (!latestPurchase) {
      return { needsCount: false, pendingYear: null };
    }

    // Get the latest confirmed count
    const latestConfirmedCount = await prisma.yearEndCount.findFirst({
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
};
