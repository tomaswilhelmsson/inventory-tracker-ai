import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const productService = {
  // Get all products with optional filtering
  async getAll(filters?: { search?: string; supplierId?: number }) {
    const where: any = {};

    if (filters?.search) {
      // Sanitize search input: trim whitespace and limit length to prevent DoS
      const sanitizedSearch = filters.search.trim().substring(0, 100);
      
      // Only apply filter if there's actual content after sanitization
      if (sanitizedSearch.length > 0) {
        where.name = {
          contains: sanitizedSearch,
          mode: 'insensitive' as const,
        };
      }
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    return await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        unit: {
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
        _count: {
          select: {
            purchaseLots: true,
          },
        },
      },
    });
  },

  // Get product by ID with inventory details
  async getById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        unit: true,
        supplier: true,
        purchaseLots: {
          orderBy: { purchaseDate: 'asc' }, // FIFO order
          where: {
            remainingQuantity: { gt: 0 },
          },
        },
      },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Calculate current inventory
    const totalQuantity = product.purchaseLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity,
      0
    );

    const totalValue = product.purchaseLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity * lot.unitCost,
      0
    );

    return {
      ...product,
      currentInventory: {
        quantity: totalQuantity,
        value: totalValue,
      },
    };
  },

  // Create product
  async create(data: { name: string; description?: string; unitId: number; supplierId: number }) {
    // Check for duplicate name
    const existing = await prisma.product.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError(400, 'Product with this name already exists');
    }

    // Verify unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId },
    });

    if (!unit) {
      throw new AppError(400, 'Unit not found');
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new AppError(400, 'Supplier not found');
    }

    return await prisma.product.create({
      data,
      include: {
        unit: {
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
  },

  // Update product
  async update(id: number, data: { name?: string; description?: string; unitId?: number; supplierId?: number }) {
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Check for duplicate name if changing name
    if (data.name && data.name !== product.name) {
      const existing = await prisma.product.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new AppError(400, 'Product with this name already exists');
      }
    }

    // Verify unit exists if changing unit
    if (data.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: data.unitId },
      });
      if (!unit) {
        throw new AppError(400, 'Unit not found');
      }
    }

    // Verify supplier exists if changing supplier
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });
      if (!supplier) {
        throw new AppError(400, 'Supplier not found');
      }
    }

    return await prisma.product.update({
      where: { id },
      data,
      include: {
        unit: {
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
  },

  // Delete product
  async delete(id: number) {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchaseLots: true,
            yearEndCountItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Prevent deletion if referenced in year-end counts (data integrity for locked years)
    if (product._count.yearEndCountItems > 0) {
      throw new AppError(400, 'Cannot delete product referenced in year-end counts');
    }

    // Allow deletion even with purchase history - data is preserved in JSON snapshots
    // Foreign keys will be set to NULL automatically (onDelete: SetNull)
    await prisma.product.delete({
      where: { id },
    });

    return { 
      message: 'Product deleted successfully',
      purchasesAffected: product._count.purchaseLots,
    };
  },
};
