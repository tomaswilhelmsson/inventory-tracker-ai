import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const purchaseService = {
  // Check if a year is locked
  async isYearLocked(year: number): Promise<boolean> {
    const lockedYear = await prisma.lockedYear.findUnique({
      where: { year },
    });
    return !!lockedYear;
  },

  // Get all locked years
  async getLockedYears() {
    return await prisma.lockedYear.findMany({
      orderBy: { year: 'desc' },
    });
  },

  // Get all purchase lots with filtering
  async getAll(filters?: {
    productId?: number;
    supplierId?: number;
    year?: number;
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

    if (filters?.hasRemainingInventory) {
      where.remainingQuantity = { gt: 0 };
    }

    const lots = await prisma.purchaseLot.findMany({
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
      },
    });

    // Parse JSON snapshots and add to response
    return lots.map(lot => ({
      ...lot,
      productSnapshot: JSON.parse(lot.productSnapshot),
      supplierSnapshot: JSON.parse(lot.supplierSnapshot),
    }));
  },

  // Get purchase lot by ID
  async getById(id: number) {
    const lot = await prisma.purchaseLot.findUnique({
      where: { id },
      include: {
        product: true,
        supplier: true,
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
  }) {
    // Validate quantity and unitCost
    if (data.quantity <= 0) {
      throw new AppError(400, 'Quantity must be greater than 0');
    }

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
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        unit: true,
      },
    });
    if (!product) {
      throw new AppError(400, 'Product not found');
    }

    // Verify supplier exists and fetch full details for snapshot
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });
    if (!supplier) {
      throw new AppError(400, 'Supplier not found');
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

    const newLot = await prisma.purchaseLot.create({
      data: {
        ...data,
        year,
        remainingQuantity: data.quantity, // Initialize remaining = quantity
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
    const lot = await prisma.purchaseLot.findUnique({ where: { id } });
    if (!lot) {
      throw new AppError(404, 'Purchase lot not found');
    }

    // Check if year is locked
    const yearLocked = await this.isYearLocked(lot.year);
    if (yearLocked) {
      throw new AppError(400, `Cannot update purchase from locked year ${lot.year}`);
    }

    // Validate updates
    if (data.quantity !== undefined && data.quantity <= 0) {
      throw new AppError(400, 'Quantity must be greater than 0');
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

    const updatedLot = await prisma.purchaseLot.update({
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
    const lot = await prisma.purchaseLot.findUnique({ where: { id } });
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

    await prisma.purchaseLot.delete({
      where: { id },
    });

    return { message: 'Purchase lot deleted successfully' };
  },
};
