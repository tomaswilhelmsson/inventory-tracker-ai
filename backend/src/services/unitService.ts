import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const unitService = {
  // Get all units with product count
  async getAll() {
    return await prisma.unit.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  },

  // Get unit by ID with related products
  async getById(id: number) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!unit) {
      throw new AppError(404, 'Unit not found');
    }

    return unit;
  },

  // Create unit
  async create(data: { name: string }) {
    // Validate name
    if (!data.name || !data.name.trim()) {
      throw new AppError(400, 'Unit name is required');
    }

    // Check for duplicate name
    const existing = await prisma.unit.findUnique({
      where: { name: data.name.trim() },
    });

    if (existing) {
      throw new AppError(400, 'Unit with this name already exists');
    }

    return await prisma.unit.create({
      data: {
        name: data.name.trim(),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  },

  // Update unit
  async update(id: number, data: { name?: string }) {
    // Check if unit exists
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new AppError(404, 'Unit not found');
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new AppError(400, 'Unit name cannot be empty');
      }

      // Check for duplicate name if changing name
      if (data.name.trim() !== unit.name) {
        const existing = await prisma.unit.findUnique({
          where: { name: data.name.trim() },
        });
        if (existing) {
          throw new AppError(400, 'Unit with this name already exists');
        }
      }
    }

    return await prisma.unit.update({
      where: { id },
      data: {
        name: data.name?.trim(),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  },

  // Delete unit
  async delete(id: number) {
    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!unit) {
      throw new AppError(404, 'Unit not found');
    }

    // Prevent deletion if unit has products
    if (unit._count.products > 0) {
      throw new AppError(
        400,
        `Cannot delete unit with ${unit._count.products} product(s). Reassign products first.`
      );
    }

    await prisma.unit.delete({
      where: { id },
    });

    return { message: 'Unit deleted successfully' };
  },
};
