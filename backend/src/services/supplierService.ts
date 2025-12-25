import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const supplierService = {
  // Get all suppliers with optional search
  async getAll(search?: string) {
    // Sanitize search input: trim whitespace and limit length to prevent DoS
    const sanitizedSearch = search?.trim().substring(0, 100);
    
    const where = sanitizedSearch && sanitizedSearch.length > 0
      ? {
          name: {
            contains: sanitizedSearch,
            mode: 'insensitive' as const,
          },
        }
      : {};

    return await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
            purchaseLots: true,
          },
        },
      },
    });
  },

  // Get supplier by ID
  async getById(id: number) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: true,
        purchaseLots: {
          select: {
            id: true,
            quantity: true,
            unitCost: true,
            purchaseDate: true,
          },
        },
        _count: {
          select: {
            products: true,
            purchaseLots: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }

    // Calculate total purchase value
    const totalPurchaseValue = supplier.purchaseLots.reduce(
      (sum, lot) => sum + lot.quantity * lot.unitCost,
      0
    );

    return {
      ...supplier,
      totalPurchaseValue,
    };
  },

  // Create supplier
  async create(data: { 
    name: string; 
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    notes?: string;
  }) {
    // Check for duplicate name
    const existing = await prisma.supplier.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError(400, 'Supplier with this name already exists');
    }

    return await prisma.supplier.create({
      data,
    });
  },

  // Update supplier
  async update(id: number, data: { 
    name?: string; 
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    notes?: string;
  }) {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }

    // Check for duplicate name if changing name
    if (data.name && data.name !== supplier.name) {
      const existing = await prisma.supplier.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new AppError(400, 'Supplier with this name already exists');
      }
    }

    return await prisma.supplier.update({
      where: { id },
      data,
    });
  },

  // Delete supplier
  async delete(id: number) {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            purchaseLots: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }

    // Prevent deletion if has associated products (products still need suppliers)
    if (supplier._count.products > 0) {
      throw new AppError(400, 'Cannot delete supplier with associated products. Reassign products first.');
    }

    // Allow deletion even with purchase history - data is preserved in JSON snapshots
    // Foreign keys will be set to NULL automatically (onDelete: SetNull)
    await prisma.supplier.delete({
      where: { id },
    });

    return { 
      message: 'Supplier deleted successfully',
      purchasesAffected: supplier._count.purchaseLots,
    };
  },
};
