import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { inventoryService } from './inventoryService';

export const yearEndCountService = {
  /**
   * Initiate a year-end count for a specific year
   */
  async initiateYearEndCount(year: number) {
    // Check if count already exists for this year
    const existing = await prisma.yearEndCount.findUnique({
      where: { year },
    });

    if (existing) {
      throw new AppError(400, `Year-end count for ${year} already exists`);
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
   * Get year-end count by year
   */
  async getByYear(year: number) {
    const count = await prisma.yearEndCount.findUnique({
      where: { year },
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
      throw new AppError(404, `Year-end count for ${year} not found`);
    }

    return count;
  },
};
