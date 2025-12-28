import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const productService = {
  // Get all products with optional filtering
  async getAll(filters?: { search?: string; supplierId?: number; includeInactive?: boolean }) {
    const where: any = {};

    // Filter by active status (default: active only)
    if (filters?.includeInactive !== true) {
      where.isActive = true;
    }

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
      // Filter products that have this supplier in their suppliers array
      where.suppliers = {
        some: {
          supplierId: filters.supplierId,
        },
      };
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
        suppliers: {
          include: {
            supplier: true,
          },
        },
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
  async create(data: { name: string; description?: string; unitId: number; supplierIds: number[] }) {
    // Validate required fields
    if (!data.supplierIds || data.supplierIds.length === 0) {
      throw new AppError(400, 'At least one supplier is required');
    }

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

    // Verify all suppliers exist
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: data.supplierIds } },
    });

    if (suppliers.length !== data.supplierIds.length) {
      throw new AppError(400, 'One or more suppliers not found');
    }

    // Create product with supplier associations
    return await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        unitId: data.unitId,
        suppliers: {
          create: data.supplierIds.map(supplierId => ({
            supplierId,
          })),
        },
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
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
    });
  },

  // Update product
  async update(id: number, data: { name?: string; description?: string; unitId?: number; supplierIds?: number[] }) {
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

    // Verify suppliers exist if changing suppliers
    if (data.supplierIds !== undefined) {
      if (data.supplierIds.length === 0) {
        throw new AppError(400, 'At least one supplier is required');
      }

      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: data.supplierIds } },
      });

      if (suppliers.length !== data.supplierIds.length) {
        throw new AppError(400, 'One or more suppliers not found');
      }
    }

    // Prepare update data
    const updateData: any = {
      name: data.name,
      description: data.description,
      unitId: data.unitId,
    };

    // Update suppliers if provided
    if (data.supplierIds !== undefined) {
      updateData.suppliers = {
        // Delete all existing associations
        deleteMany: {},
        // Create new associations
        create: data.supplierIds.map(supplierId => ({
          supplierId,
        })),
      };
    }

    return await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
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
    });
  },

  // Add supplier to product
  async addSupplier(productId: number, supplierId: number, preferredUnitCost?: number) {
    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }

    // Check if association already exists
    const existing = await prisma.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    });

    if (existing) {
      throw new AppError(400, 'Product already associated with this supplier');
    }

    // Create association
    return await prisma.productSupplier.create({
      data: {
        productId,
        supplierId,
        preferredUnitCost,
      },
      include: {
        supplier: true,
      },
    });
  },

  // Remove supplier from product
  async removeSupplier(productId: number, supplierId: number) {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        suppliers: true,
      },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Ensure product has more than one supplier
    if (product.suppliers.length <= 1) {
      throw new AppError(400, 'Cannot remove last supplier from product. Products must have at least one supplier.');
    }

    // Check if association exists
    const association = await prisma.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    });

    if (!association) {
      throw new AppError(404, 'Product-supplier association not found');
    }

    // Delete association
    await prisma.productSupplier.delete({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    });

    return { message: 'Supplier removed from product' };
  },

  // Update preferred unit cost for product-supplier combination
  async updateSupplierCost(productId: number, supplierId: number, preferredUnitCost: number) {
    // Check if association exists
    const association = await prisma.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    });

    if (!association) {
      throw new AppError(404, 'Product-supplier association not found');
    }

    // Update preferred unit cost
    return await prisma.productSupplier.update({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
      data: {
        preferredUnitCost,
      },
      include: {
        supplier: true,
      },
    });
  },

  // Get suggested price for product-supplier combination
  async getSuggestedPrice(productId: number, supplierId: number) {
    // Get the association
    const association = await prisma.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    });

    if (!association) {
      return null; // No suggested price if no association
    }

    return {
      preferredUnitCost: association.preferredUnitCost,
      source: 'preferred' as const,
    };
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

  // Toggle active status of a product
  async toggleActive(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    return await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
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
        _count: {
          select: {
            purchaseLots: true,
          },
        },
      },
    });
  },
};
