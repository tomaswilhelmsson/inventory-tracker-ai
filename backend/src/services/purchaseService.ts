import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { validatePurchaseDate, validateQuantity } from '../utils/validation';
import { calculateExclVAT, calculateInclVAT, allocateShipping, validateInvoiceTotal } from '../utils/vatCalculations';
import { config } from '../utils/config';

/**
 * Factory function to create purchaseService with injectable dependencies
 * @param dbClient - Prisma client instance (defaults to production prisma)
 */
export const createPurchaseService = (dbClient: PrismaClient = prisma) => ({
  // Check if a year is locked
  async isYearLocked(year: number): Promise<boolean> {
    const lockedYear = await dbClient.lockedYear.findUnique({
      where: { year },
    });
    return !!lockedYear;
  },

  // Get all locked years
  async getLockedYears() {
    return await dbClient.lockedYear.findMany({
      orderBy: { year: 'desc' },
    });
  },

  // Get all purchase lots with filtering
  async getAll(filters?: {
    productId?: number;
    supplierId?: number;
    year?: number;
    batchId?: number;
    hasRemainingInventory?: boolean;
  }) {
    const where: any = {};

    if (filters?.productId !== undefined) {
      where.productId = filters.productId;
    }

    if (filters?.supplierId !== undefined) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.year) {
      where.year = filters.year;
    }

    if (filters?.batchId !== undefined) {
      where.batchId = filters.batchId;
    }

    if (filters?.hasRemainingInventory) {
      where.remainingQuantity = { gt: 0 };
    }

    const lots = await dbClient.purchaseLot.findMany({
      where,
      orderBy: { purchaseDate: 'asc' }, // CRITICAL: FIFO ordering
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        batch: {
          select: {
            id: true,
            verificationNumber: true,
            invoiceTotalInclVAT: true,
            invoiceTotalExclVAT: true,
            shippingCost: true,
          },
        },
      },
    });

    // Parse JSON snapshots and add to response
    return lots.map((lot: any) => ({
      ...lot,
      productSnapshot: JSON.parse(lot.productSnapshot),
      supplierSnapshot: JSON.parse(lot.supplierSnapshot),
    }));
  },

  // Get purchase lot by ID
  async getById(id: number) {
    const lot = await dbClient.purchaseLot.findUnique({
      where: { id },
      include: {
        product: true,
        supplier: true,
        batch: {
          select: {
            id: true,
            verificationNumber: true,
            invoiceTotalInclVAT: true,
            invoiceTotalExclVAT: true,
            shippingCost: true,
          },
        },
      },
    });

    if (!lot) {
      throw new AppError(404, 'Purchase lot not found');
    }

    const lotValue = lot.remainingQuantity * lot.unitCost;

    return {
      ...lot,
      lotValue,
      productSnapshot: JSON.parse(lot.productSnapshot),
      supplierSnapshot: JSON.parse(lot.supplierSnapshot),
    };
  },

  // Create purchase lot
  async create(data: {
    productId: number;
    supplierId: number;
    purchaseDate: Date;
    quantity: number;
    unitCost: number;
    vatRate?: number; // Optional VAT rate (defaults to config default)
    pricesIncludeVAT?: boolean; // Whether unitCost includes VAT (default true)
    verificationNumber?: string; // Optional invoice/verification number
  }) {
    // Validate purchase date
    validatePurchaseDate(data.purchaseDate);

    // Validate quantity and unitCost
    if (data.quantity <= 0) {
      throw new AppError(400, 'Quantity must be greater than 0');
    }
    validateQuantity(data.quantity, 'Quantity');

    if (data.unitCost <= 0) {
      throw new AppError(400, 'Unit cost must be greater than 0');
    }

    // Extract year from purchase date
    const year = new Date(data.purchaseDate).getFullYear();

    // Check if year is locked
    const yearLocked = await this.isYearLocked(year);
    if (yearLocked) {
      throw new AppError(400, `Cannot create purchase for locked year ${year}`);
    }

    // Verify product exists and fetch full details for snapshot
    const product = await dbClient.product.findUnique({
      where: { id: data.productId },
      include: {
        unit: true,
      },
    });
    if (!product) {
      throw new AppError(400, 'Product not found');
    }

    // Verify supplier exists and fetch full details for snapshot
    const supplier = await dbClient.supplier.findUnique({
      where: { id: data.supplierId },
    });
    if (!supplier) {
      throw new AppError(400, 'Supplier not found');
    }

    // VAT calculations
    const vatRate = data.vatRate !== undefined ? data.vatRate : config.vat.defaultRate;
    const pricesIncludeVAT = data.pricesIncludeVAT !== undefined ? data.pricesIncludeVAT : true;
    
    // Validate VAT rate
    if (vatRate < 0 || vatRate > 1) {
      throw new AppError(400, 'VAT rate must be between 0 and 1');
    }
    
    // Calculate both VAT-inclusive and VAT-exclusive costs
    let unitCostInclVAT: number;
    let unitCostExclVAT: number;
    
    if (pricesIncludeVAT) {
      // User entered price including VAT
      unitCostInclVAT = data.unitCost;
      unitCostExclVAT = calculateExclVAT(data.unitCost, vatRate);
    } else {
      // User entered price excluding VAT
      unitCostExclVAT = data.unitCost;
      unitCostInclVAT = calculateInclVAT(data.unitCost, vatRate);
    }

    // Create immutable snapshots
    const productSnapshot = JSON.stringify({
      id: product.id,
      name: product.name,
      description: product.description || '',
      unit: {
        id: product.unit.id,
        name: product.unit.name,
      },
      supplierIdRef: product.supplierId,
    });

    const supplierSnapshot = JSON.stringify({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      taxId: supplier.taxId || '',
    });

    const newLot = await dbClient.purchaseLot.create({
      data: {
        productId: data.productId,
        supplierId: data.supplierId,
        purchaseDate: data.purchaseDate,
        quantity: data.quantity,
        unitCost: unitCostExclVAT, // Legacy field - use excl VAT
        unitCostExclVAT,
        unitCostInclVAT,
        vatRate,
        year,
        remainingQuantity: data.quantity, // Initialize remaining = quantity
        verificationNumber: data.verificationNumber,
        productSnapshot,
        supplierSnapshot,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
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

    // Return with parsed snapshots
    return {
      ...newLot,
      productSnapshot: JSON.parse(newLot.productSnapshot),
      supplierSnapshot: JSON.parse(newLot.supplierSnapshot),
    };
  },

  // Update purchase lot
  async update(
    id: number,
    data: {
      purchaseDate?: Date;
      quantity?: number;
      unitCost?: number;
    }
  ) {
    // Get existing lot
    const lot = await dbClient.purchaseLot.findUnique({ where: { id } });
    if (!lot) {
      throw new AppError(404, 'Purchase lot not found');
    }

    // Check if year is locked
    const yearLocked = await this.isYearLocked(lot.year);
    if (yearLocked) {
      throw new AppError(400, `Cannot update purchase from locked year ${lot.year}`);
    }

    // Validate purchase date if provided
    if (data.purchaseDate) {
      validatePurchaseDate(data.purchaseDate);
    }

    // Validate updates
    if (data.quantity !== undefined) {
      if (data.quantity <= 0) {
        throw new AppError(400, 'Quantity must be greater than 0');
      }
      validateQuantity(data.quantity, 'Quantity');
    }

    if (data.unitCost !== undefined && data.unitCost <= 0) {
      throw new AppError(400, 'Unit cost must be greater than 0');
    }

    // If quantity changes, update remainingQuantity proportionally
    const updateData: any = { ...data };
    if (data.quantity !== undefined) {
      const consumedQuantity = lot.quantity - lot.remainingQuantity;
      updateData.remainingQuantity = Math.max(0, data.quantity - consumedQuantity);
    }

    // If purchase date changes, update year
    if (data.purchaseDate) {
      const newYear = new Date(data.purchaseDate).getFullYear();
      const newYearLocked = await this.isYearLocked(newYear);
      if (newYearLocked) {
        throw new AppError(400, `Cannot move purchase to locked year ${newYear}`);
      }
      updateData.year = newYear;
    }

    const updatedLot = await dbClient.purchaseLot.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
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

    // Return with parsed snapshots
    return {
      ...updatedLot,
      productSnapshot: JSON.parse(updatedLot.productSnapshot),
      supplierSnapshot: JSON.parse(updatedLot.supplierSnapshot),
    };
  },

  // Delete purchase lot
  async delete(id: number) {
    // Get existing lot
    const lot = await dbClient.purchaseLot.findUnique({ where: { id } });
    if (!lot) {
      throw new AppError(404, 'Purchase lot not found');
    }

    // Check if year is locked
    const yearLocked = await this.isYearLocked(lot.year);
    if (yearLocked) {
      throw new AppError(400, `Cannot delete purchase from locked year ${lot.year}`);
    }

    // Only allow deletion if lot is unused (remainingQuantity = quantity)
    if (lot.remainingQuantity !== lot.quantity) {
      throw new AppError(
        400,
        'Cannot delete partially consumed purchase lot. Remaining quantity must equal original quantity.'
      );
    }

    await dbClient.purchaseLot.delete({
      where: { id },
    });

    return { message: 'Purchase lot deleted successfully' };
  },

  /**
   * Calculate shipping cost allocation per line item proportionally based on subtotal
   * @param items - Array of line items with quantity and unitCost
   * @param totalShipping - Total shipping cost to distribute
   * @returns Array of shipping allocations per item
   */
  calculateShippingAllocation(
    items: Array<{ quantity: number; unitCost: number }>,
    totalShipping: number
  ): number[] {
    if (totalShipping === 0) {
      return items.map(() => 0);
    }

    // Calculate subtotal for each item
    const subtotals = items.map(item => item.quantity * item.unitCost);
    const totalSubtotal = subtotals.reduce((sum, subtotal) => sum + subtotal, 0);

    // Distribute shipping proportionally
    return subtotals.map(subtotal => (subtotal / totalSubtotal) * totalShipping);
  },

  /**
   * Validate invoice total matches sum of line items + shipping (within tolerance)
   * @param lineItemsTotal - Sum of all line item totals
   * @param shippingCost - Shipping cost
   * @param invoiceTotal - Expected invoice total
   * @param tolerance - Acceptable difference (default $0.01)
   * @throws AppError if mismatch exceeds tolerance
   */
  validateInvoiceTotal(
    lineItemsTotal: number,
    shippingCost: number,
    invoiceTotal: number,
    tolerance: number = 0.01
  ): void {
    const expectedTotal = lineItemsTotal + shippingCost;
    const difference = Math.abs(expectedTotal - invoiceTotal);

    if (difference > tolerance) {
      throw new AppError(
        400,
        `Invoice total mismatch: Expected ${expectedTotal.toFixed(2)}, got ${invoiceTotal.toFixed(2)} (difference: $${difference.toFixed(2)})`
      );
    }
  },

  /**
   * Create a batch of purchase lots from a single invoice
   * @param data - Batch purchase data
   * @returns Created batch with all lots
   */
  async createBatch(data: {
    supplierId: number;
    purchaseDate: Date;
    verificationNumber?: string;
    invoiceTotal: number; // Grand total from invoice (always incl VAT)
    shippingCost: number;
    notes?: string;
    vatRate?: number; // VAT rate for batch (defaults to config)
    pricesIncludeVAT?: boolean; // Whether line item prices include VAT (default true)
    items: Array<{
      productId: number;
      quantity: number;
      unitCost?: number;  // Either unitCost or totalCost required
      totalCost?: number; // Either unitCost or totalCost required
    }>;
  }) {
    // Validate purchase date
    validatePurchaseDate(data.purchaseDate);

    // Validate at least 1 item
    if (!data.items || data.items.length === 0) {
      throw new AppError(400, 'At least 1 line item is required');
    }

    // Validate shipping cost >= 0
    if (data.shippingCost < 0) {
      throw new AppError(400, 'Shipping cost cannot be negative');
    }

    // Extract year from purchase date
    const year = new Date(data.purchaseDate).getFullYear();

    // Check if year is locked
    const yearLocked = await this.isYearLocked(year);
    if (yearLocked) {
      throw new AppError(400, `Cannot create purchase for locked year ${year}`);
    }

    // Verify supplier exists
    const supplier = await dbClient.supplier.findUnique({
      where: { id: data.supplierId },
    });
    if (!supplier) {
      throw new AppError(400, 'Supplier not found');
    }

    // VAT configuration
    const vatRate = data.vatRate !== undefined ? data.vatRate : config.vat.defaultRate;
    const pricesIncludeVAT = data.pricesIncludeVAT !== undefined ? data.pricesIncludeVAT : true;
    
    // Validate VAT rate
    if (vatRate < 0 || vatRate > 1) {
      throw new AppError(400, 'VAT rate must be between 0 and 1');
    }

    // Process each item: validate, fetch product details, calculate costs
    const processedItems = await Promise.all(
      data.items.map(async (item) => {
        // Validate either unitCost or totalCost provided (not both)
        if (item.unitCost !== undefined && item.totalCost !== undefined) {
          throw new AppError(400, 'Provide either unitCost or totalCost, not both');
        }
        if (item.unitCost === undefined && item.totalCost === undefined) {
          throw new AppError(400, 'Either unitCost or totalCost is required');
        }

        // Validate quantity
        if (item.quantity <= 0) {
          throw new AppError(400, 'Quantity must be greater than 0');
        }
        validateQuantity(item.quantity, 'Quantity');

        // Calculate unitCost or totalCost
        let unitCost: number;
        let totalCost: number;

        if (item.unitCost !== undefined) {
          if (item.unitCost <= 0) {
            throw new AppError(400, 'Unit cost must be greater than 0');
          }
          unitCost = item.unitCost;
          totalCost = unitCost * item.quantity;
        } else {
          // Calculate from totalCost
          if (item.totalCost! <= 0) {
            throw new AppError(400, 'Total cost must be greater than 0');
          }
          totalCost = item.totalCost!;
          unitCost = totalCost / item.quantity;
        }

        // Fetch product details
        const product = await dbClient.product.findUnique({
          where: { id: item.productId },
          include: { unit: true, supplier: true },
        });
        if (!product) {
          throw new AppError(400, `Product with ID ${item.productId} not found`);
        }

        // Validate product belongs to the same supplier
        if (product.supplierId !== data.supplierId) {
          throw new AppError(
            400,
            `Product "${product.name}" belongs to a different supplier. All products must be from the same supplier.`
          );
        }

        // Calculate VAT amounts based on entry mode
        let unitCostInclVAT: number;
        let unitCostExclVAT: number;
        
        if (pricesIncludeVAT) {
          // User entered prices including VAT
          unitCostInclVAT = unitCost;
          unitCostExclVAT = calculateExclVAT(unitCost, vatRate);
        } else {
          // User entered prices excluding VAT
          unitCostExclVAT = unitCost;
          unitCostInclVAT = calculateInclVAT(unitCost, vatRate);
        }

        return {
          productId: item.productId,
          product,
          quantity: item.quantity,
          unitCost, // Original entered value
          totalCost,
          unitCostInclVAT,
          unitCostExclVAT,
        };
      })
    );

    // Calculate totals (excl VAT for proper accounting)
    const lineItemsTotalExclVAT = processedItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitCostExclVAT), 
      0
    );
    
    // Calculate shipping allocation per item (based on excl VAT amounts)
    const shippingAllocations = allocateShipping(
      processedItems.map(item => ({ 
        quantity: item.quantity, 
        unitCostExclVAT: item.unitCostExclVAT 
      })),
      data.shippingCost
    );

    // Validate invoice total matches calculated total
    const validation = validateInvoiceTotal(
      processedItems.map(item => ({ 
        quantity: item.quantity, 
        unitCost: item.unitCost // As entered by user
      })),
      data.shippingCost,
      vatRate,
      data.invoiceTotal,
      pricesIncludeVAT
    );
    
    if (!validation.isValid) {
      throw new AppError(
        400,
        `Invoice total mismatch: entered ${data.invoiceTotal.toFixed(2)}, calculated ${validation.calculatedTotal.toFixed(2)} (difference: ${validation.difference.toFixed(2)})`
      );
    }

    // Create batch and lots in a transaction
    const result = await dbClient.$transaction(async (tx) => {
      // Create purchase batch
      // Invoice total from user (always incl VAT)
      // Calculate excl VAT total from line items + shipping
      const totalExclVAT = lineItemsTotalExclVAT + data.shippingCost;
      const totalInclVAT = calculateInclVAT(totalExclVAT, vatRate);
      
      const batch = await tx.purchaseBatch.create({
        data: {
          supplierId: data.supplierId,
          purchaseDate: data.purchaseDate,
          verificationNumber: data.verificationNumber,
          invoiceTotalInclVAT: data.invoiceTotal,
          invoiceTotalExclVAT: totalExclVAT,
          shippingCost: data.shippingCost,
          notes: data.notes,
          vatRate,
          pricesIncludeVAT,
        },
      });

      // Create snapshots once (shared across items)
      const supplierSnapshot = JSON.stringify({
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || '',
        taxId: supplier.taxId || '',
      });

      // Create all purchase lots
      const lots = await Promise.all(
        processedItems.map(async (item, index) => {
          // Calculate final unit cost including shipping allocation (excl VAT basis)
          const shippingPerUnit = shippingAllocations[index] / item.quantity;
          const finalUnitCostExclVAT = item.unitCostExclVAT + shippingPerUnit;
          const finalUnitCostInclVAT = calculateInclVAT(finalUnitCostExclVAT, vatRate);

          // Create product snapshot
          const productSnapshot = JSON.stringify({
            id: item.product.id,
            name: item.product.name,
            description: item.product.description || '',
            unit: {
              id: item.product.unit.id,
              name: item.product.unit.name,
            },
            supplierIdRef: item.product.supplierId,
          });

          return tx.purchaseLot.create({
            data: {
              productId: item.productId,
              supplierId: data.supplierId,
              batchId: batch.id,
              purchaseDate: data.purchaseDate,
              quantity: item.quantity,
              unitCost: finalUnitCostExclVAT, // Legacy field: excl VAT for backward compatibility
              unitCostExclVAT: finalUnitCostExclVAT,
              unitCostInclVAT: finalUnitCostInclVAT,
              vatRate,
              remainingQuantity: item.quantity,
              year,
              verificationNumber: data.verificationNumber,
              productSnapshot,
              supplierSnapshot,
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
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
        })
      );

      return { batch, lots };
    });

    // Return with parsed snapshots
    return {
      batch: result.batch,
      lots: result.lots.map(lot => ({
        ...lot,
        productSnapshot: JSON.parse(lot.productSnapshot),
        supplierSnapshot: JSON.parse(lot.supplierSnapshot),
      })),
    };
  },

  /**
   * Get purchase batch by ID with all associated lots
   * @param id - Batch ID
   * @returns Batch with lots
   */
  async getBatchById(id: number) {
    const batch = await dbClient.purchaseBatch.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        purchaseLots: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new AppError(404, 'Purchase batch not found');
    }

    return {
      ...batch,
      purchaseLots: batch.purchaseLots.map((lot: any) => ({
        ...lot,
        productSnapshot: JSON.parse(lot.productSnapshot),
        supplierSnapshot: JSON.parse(lot.supplierSnapshot),
      })),
    };
  },
});

// Default export for production use
export const purchaseService = createPurchaseService();
