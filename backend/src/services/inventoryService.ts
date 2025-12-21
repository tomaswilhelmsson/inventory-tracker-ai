import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Create inventory service with dependency injection support
 * @param dbClient - Prisma client instance (defaults to production client)
 */
export const createInventoryService = (dbClient: PrismaClient = prisma) => ({
  /**
   * Get lots by FIFO order (oldest first)
   * CRITICAL: MUST use ORDER BY purchaseDate ASC
   */
  async getLotsByFIFOOrder(productId: number) {
    return await dbClient.purchaseLot.findMany({
      where: {
        productId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering - oldest first
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Get current inventory quantity for a product
   * CRITICAL: MUST use ORDER BY purchaseDate ASC for consistency
   */
  async getCurrentInventoryQuantity(productId: number) {
    const lots = await dbClient.purchaseLot.findMany({
      where: {
        productId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
    });

    return lots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
  },

  /**
   * Get current inventory value for a product using FIFO
   * CRITICAL: MUST use ORDER BY purchaseDate ASC
   */
  async getCurrentInventoryValue(productId: number) {
    const lots = await dbClient.purchaseLot.findMany({
      where: {
        productId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
    });

    const quantity = lots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    const value = lots.reduce((sum, lot) => sum + lot.remainingQuantity * lot.unitCost, 0);

    return {
      quantity,
      value,
      lots: lots.map((lot) => ({
        id: lot.id,
        purchaseDate: lot.purchaseDate,
        remainingQuantity: lot.remainingQuantity,
        unitCost: lot.unitCost,
        lotValue: lot.remainingQuantity * lot.unitCost,
        year: lot.year,
      })),
    };
  },

  /**
   * Get inventory value for all products or filtered by supplier
   * CRITICAL: MUST use ORDER BY purchaseDate ASC for all lot queries
   */
  async getInventoryValue(filters?: { supplierId?: number }) {
    const where: any = {
      remainingQuantity: { gt: 0 },
    };

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    const lots = await dbClient.purchaseLot.findMany({
      where,
      orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by product
    const productInventory: Record<
      number,
      {
        productId: number;
        productName: string;
        unit: { id: number; name: string; createdAt: Date };
        quantity: number;
        value: number;
        lots: any[];
      }
    > = {};

    lots.forEach((lot) => {
      // Skip lots with deleted products (should not happen in practice since we filter by remainingQuantity > 0)
      if (!lot.productId || !lot.product) {
        return;
      }

      if (!productInventory[lot.productId]) {
        productInventory[lot.productId] = {
          productId: lot.productId,
          productName: lot.product.name,
          unit: lot.product.unit,
          quantity: 0,
          value: 0,
          lots: [],
        };
      }

      productInventory[lot.productId].quantity += lot.remainingQuantity;
      productInventory[lot.productId].value += lot.remainingQuantity * lot.unitCost;
      
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
      
      productInventory[lot.productId].lots.push({
        id: lot.id,
        purchaseDate: lot.purchaseDate,
        remainingQuantity: lot.remainingQuantity,
        unitCost: lot.unitCost,
        year: lot.year,
        supplier: supplierName,
      });
    });

    const products = Object.values(productInventory);
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + p.value, 0);

    return {
      totalQuantity,
      totalValue,
      products,
    };
  },

  /**
   * Set inventory to target quantity using FIFO (oldest lots consumed first)
   * CRITICAL: MUST process lots in ORDER BY purchaseDate ASC
   * This is used during year-end count to adjust remaining quantities to match physical count
   * 
   * @param productId - The product to adjust
   * @param targetQuantity - The FINAL quantity that should remain (from physical count)
   * 
   * Example: If lots are [100, 200, 300] and targetQuantity is 250:
   *   - Lot 1 (oldest): 0 remaining (fully consumed)
   *   - Lot 2 (middle): 0 remaining (fully consumed)  
   *   - Lot 3 (newest): 250 remaining (this is where inventory sits)
   * 
   * This follows FIFO: oldest inventory consumed first, newest inventory remains
   */
  async consumeInventoryFIFO(productId: number, targetQuantity: number) {
    if (targetQuantity < 0) {
      throw new AppError(400, 'Target quantity cannot be negative');
    }

    // Get ALL lots for the product in REVERSE FIFO order (newest first)
    // We process newest first to "fill up" the target quantity from the back
    const lots = await dbClient.purchaseLot.findMany({
      where: { productId },
      orderBy: { purchaseDate: 'desc' }, // CRITICAL: Newest first for distributing remaining inventory
    });

    let remainingToAllocate = targetQuantity;
    const updates: { id: number; newRemainingQuantity: number }[] = [];

    // Process lots from newest to oldest, allocating the target quantity
    // This ensures oldest lots are consumed first (have 0 remaining)
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

    // Apply updates in a transaction
    await dbClient.$transaction(
      updates.map((update) =>
        dbClient.purchaseLot.update({
          where: { id: update.id },
          data: { remainingQuantity: update.newRemainingQuantity },
        })
      )
    );

    return {
      updatedLots: updates.length,
      targetQuantity,
    };
  },
});

// Export default instance using production Prisma client
export const inventoryService = createInventoryService();
