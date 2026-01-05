import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Factory function to create finishedGoodService with injectable dependencies
 * @param dbClient - Prisma client instance (defaults to production prisma)
 */
export const createFinishedGoodService = (dbClient: PrismaClient = prisma) => ({
  /**
   * Create a new finished good
   */
  async create(data: {
    name: string;
    description?: string;
    unitId: number;
    materialCost: number;
  }) {
    // Validate material cost
    if (data.materialCost < 0) {
      throw new AppError(400, 'Material cost must be zero or greater');
    }

    // Verify unit exists
    const unit = await dbClient.unit.findUnique({
      where: { id: data.unitId },
    });

    if (!unit) {
      throw new AppError(400, 'Unit not found');
    }

    // Check for duplicate name
    const existing = await dbClient.finishedGood.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError(400, 'Finished good name must be unique');
    }

    return await dbClient.finishedGood.create({
      data: {
        name: data.name,
        description: data.description,
        unitId: data.unitId,
        materialCost: data.materialCost,
      },
      include: {
        unit: true,
      },
    });
  },

  /**
   * Get all finished goods with optional filters
   */
  async getAll(filters?: { isActive?: boolean }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await dbClient.finishedGood.findMany({
      where,
      include: {
        unit: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  },

  /**
   * Get finished good by ID
   */
  async getById(id: number) {
    const finishedGood = await dbClient.finishedGood.findUnique({
      where: { id },
      include: {
        unit: true,
      },
    });

    if (!finishedGood) {
      throw new AppError(404, 'Finished good not found');
    }

    return finishedGood;
  },

  /**
   * Update finished good
   */
  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      unitId?: number;
      materialCost?: number;
      isActive?: boolean;
    }
  ) {
    // Verify finished good exists
    const existing = await dbClient.finishedGood.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, 'Finished good not found');
    }

    // Validate material cost if provided
    if (data.materialCost !== undefined && data.materialCost < 0) {
      throw new AppError(400, 'Material cost must be zero or greater');
    }

    // Verify unit exists if changing
    if (data.unitId) {
      const unit = await dbClient.unit.findUnique({
        where: { id: data.unitId },
      });

      if (!unit) {
        throw new AppError(400, 'Unit not found');
      }
    }

    // Check for duplicate name if changing name
    if (data.name && data.name !== existing.name) {
      const duplicate = await dbClient.finishedGood.findUnique({
        where: { name: data.name },
      });

      if (duplicate) {
        throw new AppError(400, 'Finished good name must be unique');
      }
    }

    return await dbClient.finishedGood.update({
      where: { id },
      data,
      include: {
        unit: true,
      },
    });
  },

  /**
   * Update material cost only
   */
  async updateMaterialCost(id: number, materialCost: number) {
    if (materialCost < 0) {
      throw new AppError(400, 'Material cost must be zero or greater');
    }

    const existing = await dbClient.finishedGood.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, 'Finished good not found');
    }

    return await dbClient.finishedGood.update({
      where: { id },
      data: { materialCost },
      include: {
        unit: true,
      },
    });
  },

  /**
   * Delete finished good (soft delete if used in counts)
   */
  async delete(id: number) {
    const finishedGood = await dbClient.finishedGood.findUnique({
      where: { id },
      include: {
        finishedGoodsCountItems: true,
      },
    });

    if (!finishedGood) {
      throw new AppError(404, 'Finished good not found');
    }

    // Check if used in any year-end counts
    if (finishedGood.finishedGoodsCountItems.length > 0) {
      throw new AppError(
        400,
        'Cannot delete finished good that is referenced in year-end counts. Consider marking it as inactive instead.'
      );
    }

    // Safe to delete
    await dbClient.finishedGood.delete({
      where: { id },
    });

    return {
      message: 'Finished good deleted successfully',
    };
  },
});

// Default export for production use
export const finishedGoodService = createFinishedGoodService();
