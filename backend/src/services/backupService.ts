import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';
import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/errorHandler';

/**
 * Database Backup Format
 */
export interface DatabaseBackup {
  version: string;
  exportedAt: string;
  schemaVersion: string;
  data: {
    units: any[];
    suppliers: any[];
    products: any[];
    productSuppliers: any[];
    purchaseBatches: any[];
    purchaseLots: any[];
    yearEndCounts: any[];
    yearEndCountItems: any[];
    lockedYears: any[];
    yearUnlockAudits: any[];
    finishedGoods: any[];
    finishedGoodsCountItems: any[];
  };
}

/**
 * Import Result Summary
 */
export interface ImportResult {
  success: boolean;
  recordsImported: {
    units: number;
    suppliers: number;
    products: number;
    productSuppliers: number;
    purchaseBatches: number;
    purchaseLots: number;
    yearEndCounts: number;
    yearEndCountItems: number;
    lockedYears: number;
    yearUnlockAudits: number;
    finishedGoods: number;
    finishedGoodsCountItems: number;
  };
  errors?: string[];
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Factory function to create backupService with injectable dependencies
 */
export const createBackupService = (dbClient: PrismaClient = prisma) => ({
  /**
   * Export entire database to JSON file
   */
  async exportDatabase(): Promise<string> {
    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const filename = `inventory-backup-${timestamp}.json`;
    const filePath = path.join(tmpDir, filename);

    // Query all tables (excluding users for security)
    const [
      units,
      suppliers,
      products,
      productSuppliers,
      purchaseBatches,
      purchaseLots,
      yearEndCounts,
      yearEndCountItems,
      lockedYears,
      yearUnlockAudits,
      finishedGoods,
      finishedGoodsCountItems,
    ] = await Promise.all([
      dbClient.unit.findMany(),
      dbClient.supplier.findMany(),
      dbClient.product.findMany(),
      dbClient.productSupplier.findMany(),
      dbClient.purchaseBatch.findMany(),
      dbClient.purchaseLot.findMany(),
      dbClient.yearEndCount.findMany(),
      dbClient.yearEndCountItem.findMany(),
      dbClient.lockedYear.findMany(),
      dbClient.yearUnlockAudit.findMany(),
      dbClient.finishedGood.findMany(),
      dbClient.finishedGoodsCountItem.findMany(),
    ]);

    // Create backup object
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schemaVersion: '20260105', // Current schema version (updated for finished goods)
      data: {
        units,
        suppliers,
        products,
        productSuppliers,
        purchaseBatches,
        purchaseLots,
        yearEndCounts,
        yearEndCountItems,
        lockedYears,
        yearUnlockAudits,
        finishedGoods,
        finishedGoodsCountItems,
      },
    };

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

    return filePath;
  },

  /**
   * Validate backup file structure
   */
  validateBackup(jsonContent: string): ValidationResult {
    const errors: string[] = [];

    try {
      const backup = JSON.parse(jsonContent);

      // Check required metadata fields
      if (!backup.version) {
        errors.push('Missing required field: version');
      }
      if (!backup.exportedAt) {
        errors.push('Missing required field: exportedAt');
      }
      if (!backup.schemaVersion) {
        errors.push('Missing required field: schemaVersion');
      }
      if (!backup.data) {
        errors.push('Missing required field: data');
        return { valid: false, errors };
      }

      // Check required data tables
      const requiredTables = [
        'units',
        'suppliers',
        'products',
        'productSuppliers',
        'purchaseBatches',
        'purchaseLots',
        'yearEndCounts',
        'yearEndCountItems',
        'lockedYears',
        'yearUnlockAudits',
        'finishedGoods',
        'finishedGoodsCountItems',
      ];

      for (const table of requiredTables) {
        if (!Array.isArray(backup.data[table])) {
          errors.push(`Missing or invalid required table: ${table}`);
        }
      }

      // Check schema version compatibility (basic check)
      // In production, you might want more sophisticated version checking
      if (backup.schemaVersion && backup.schemaVersion > '20241228') {
        errors.push('Incompatible schema version (backup is from a newer version)');
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push('Invalid JSON format');
      return { valid: false, errors };
    }
  },

  /**
   * Import database from JSON backup
   */
  async importDatabase(jsonContent: string): Promise<ImportResult> {
    // Validate backup first
    const validation = this.validateBackup(jsonContent);
    if (!validation.valid) {
      throw new AppError(400, `Invalid backup file: ${validation.errors.join(', ')}`);
    }

    const backup: DatabaseBackup = JSON.parse(jsonContent);

    // Import data in a transaction
    const result = await dbClient.$transaction(async (tx) => {
      // Delete existing data in reverse dependency order
      await tx.yearUnlockAudit.deleteMany({});
      await tx.lockedYear.deleteMany({});
      await tx.yearEndCountItem.deleteMany({});
      await tx.yearEndCount.deleteMany({});
      await tx.purchaseLot.deleteMany({});
      await tx.purchaseBatch.deleteMany({});
      await tx.productSupplier.deleteMany({});
      await tx.product.deleteMany({});
      await tx.supplier.deleteMany({});
      await tx.unit.deleteMany({});

      // Import new data in dependency order
      const imported = {
        units: 0,
        suppliers: 0,
        products: 0,
        productSuppliers: 0,
        purchaseBatches: 0,
        purchaseLots: 0,
        yearEndCounts: 0,
        yearEndCountItems: 0,
        lockedYears: 0,
        yearUnlockAudits: 0,
        finishedGoods: 0,
        finishedGoodsCountItems: 0,
      };

      if (backup.data.units.length > 0) {
        await tx.unit.createMany({ data: backup.data.units });
        imported.units = backup.data.units.length;
      }

      if (backup.data.suppliers.length > 0) {
        await tx.supplier.createMany({ data: backup.data.suppliers });
        imported.suppliers = backup.data.suppliers.length;
      }

      if (backup.data.products.length > 0) {
        await tx.product.createMany({ data: backup.data.products });
        imported.products = backup.data.products.length;
      }

      if (backup.data.productSuppliers.length > 0) {
        await tx.productSupplier.createMany({ data: backup.data.productSuppliers });
        imported.productSuppliers = backup.data.productSuppliers.length;
      }

      if (backup.data.purchaseBatches.length > 0) {
        await tx.purchaseBatch.createMany({ data: backup.data.purchaseBatches });
        imported.purchaseBatches = backup.data.purchaseBatches.length;
      }

      if (backup.data.purchaseLots.length > 0) {
        await tx.purchaseLot.createMany({ data: backup.data.purchaseLots });
        imported.purchaseLots = backup.data.purchaseLots.length;
      }

      if (backup.data.yearEndCounts.length > 0) {
        await tx.yearEndCount.createMany({ data: backup.data.yearEndCounts });
        imported.yearEndCounts = backup.data.yearEndCounts.length;
      }

      if (backup.data.yearEndCountItems.length > 0) {
        await tx.yearEndCountItem.createMany({ data: backup.data.yearEndCountItems });
        imported.yearEndCountItems = backup.data.yearEndCountItems.length;
      }

      if (backup.data.lockedYears.length > 0) {
        await tx.lockedYear.createMany({ data: backup.data.lockedYears });
        imported.lockedYears = backup.data.lockedYears.length;
      }

      if (backup.data.yearUnlockAudits.length > 0) {
        await tx.yearUnlockAudit.createMany({ data: backup.data.yearUnlockAudits });
        imported.yearUnlockAudits = backup.data.yearUnlockAudits.length;
      }

      if (backup.data.finishedGoods && backup.data.finishedGoods.length > 0) {
        await tx.finishedGood.createMany({ data: backup.data.finishedGoods });
        imported.finishedGoods = backup.data.finishedGoods.length;
      }

      if (backup.data.finishedGoodsCountItems && backup.data.finishedGoodsCountItems.length > 0) {
        await tx.finishedGoodsCountItem.createMany({ data: backup.data.finishedGoodsCountItems });
        imported.finishedGoodsCountItems = backup.data.finishedGoodsCountItems.length;
      }

      return imported;
    });

    return {
      success: true,
      recordsImported: result,
    };
  },

  /**
   * Clean up temporary file
   */
  cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to cleanup temp file:', error);
    }
  },
});

// Export default instance
export const backupService = createBackupService();
