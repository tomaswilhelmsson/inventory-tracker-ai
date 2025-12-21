/**
 * Purchase Service Unit Tests
 * 
 * Tests the purchase lot management functionality including:
 * - Creating purchase lots with snapshots
 * - Locked year validation (preventing modifications)
 * - Updating purchase lots with quantity adjustments
 * - Deleting unused purchase lots
 */

import { testPrisma } from '../../tests/setup';
import { TestFactory } from '../../tests/factories';
import { createPurchaseService } from './purchaseService';
import { createYearEndCountService } from './yearEndCountService';
import { createInventoryService } from './inventoryService';

// Create service instances with test Prisma client
const purchaseService = createPurchaseService(testPrisma);
const inventoryService = createInventoryService(testPrisma);
const yearEndCountService = createYearEndCountService(testPrisma, inventoryService);

describe('purchaseService', () => {
  describe('create', () => {
    it('should create purchase lot with snapshots', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Test Product');

      const result = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 5.0,
        purchaseDate: new Date('2023-06-15'),
      });

      expect(result.productId).toBe(product.id);
      expect(result.supplierId).toBe(supplier.id);
      expect(result.quantity).toBe(100);
      expect(result.remainingQuantity).toBe(100); // Initially equals quantity
      expect(result.unitCost).toBe(5.0);
      expect(result.year).toBe(2023);
      
      // Check product snapshot
      expect(result.productSnapshot).toBeDefined();
      expect(result.productSnapshot.id).toBe(product.id);
      expect(result.productSnapshot.name).toBe('Test Product');
      expect(result.productSnapshot.unit).toBeDefined();
      
      // Check supplier snapshot
      expect(result.supplierSnapshot).toBeDefined();
      expect(result.supplierSnapshot.id).toBe(supplier.id);
      expect(result.supplierSnapshot.name).toContain('Supplier for Test Product');
    });

    it('should throw error when quantity is zero', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      await expect(
        purchaseService.create({
          productId: product.id,
          supplierId: supplier.id,
          quantity: 0,
          unitCost: 1.0,
          purchaseDate: new Date('2023-01-01'),
        })
      ).rejects.toThrow('Quantity must be greater than 0');
    });

    it('should throw error when quantity is negative', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      await expect(
        purchaseService.create({
          productId: product.id,
          supplierId: supplier.id,
          quantity: -10,
          unitCost: 1.0,
          purchaseDate: new Date('2023-01-01'),
        })
      ).rejects.toThrow('Quantity must be greater than 0');
    });

    it('should throw error when unitCost is zero', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      await expect(
        purchaseService.create({
          productId: product.id,
          supplierId: supplier.id,
          quantity: 100,
          unitCost: 0,
          purchaseDate: new Date('2023-01-01'),
        })
      ).rejects.toThrow('Unit cost must be greater than 0');
    });

    it('should throw error when unitCost is negative', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      await expect(
        purchaseService.create({
          productId: product.id,
          supplierId: supplier.id,
          quantity: 100,
          unitCost: -5.0,
          purchaseDate: new Date('2023-01-01'),
        })
      ).rejects.toThrow('Unit cost must be greater than 0');
    });

    it('should throw error when product not found', async () => {
      const { supplier } = await TestFactory.createCompleteProductSetup('Product');

      await expect(
        purchaseService.create({
          productId: 99999,
          supplierId: supplier.id,
          quantity: 100,
          unitCost: 1.0,
          purchaseDate: new Date('2023-01-01'),
        })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when supplier not found', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Product');

      await expect(
        purchaseService.create({
          productId: product.id,
          supplierId: 99999,
          quantity: 100,
          unitCost: 1.0,
          purchaseDate: new Date('2023-01-01'),
        })
      ).rejects.toThrow('Supplier not found');
    });

    it('should throw error when creating purchase for locked year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Locked Product');

      // Create and lock year 2023
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count.id);

      // Try to create another purchase in locked year 2023
      await expect(
        purchaseService.create({
          productId: product.id,
          supplierId: supplier.id,
          quantity: 50,
          unitCost: 2.0,
          purchaseDate: new Date('2023-06-15'),
        })
      ).rejects.toThrow('Cannot create purchase for locked year 2023');
    });

    it('should extract year from purchase date correctly', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const result = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 3.0,
        purchaseDate: new Date('2024-12-31'),
      });

      expect(result.year).toBe(2024);
    });
  });

  describe('getAll', () => {
    it('should return all purchase lots ordered by FIFO', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      // Create lots in random order
      await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-06-01'),
      });

      await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-01'),
      });

      await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 20,
        unitCost: 3.0,
        purchaseDate: new Date('2024-03-01'),
      });

      const lots = await purchaseService.getAll();

      expect(lots).toHaveLength(3);
      // Should be ordered oldest to newest (FIFO)
      expect(lots[0].purchaseDate.getFullYear()).toBe(2022);
      expect(lots[1].purchaseDate.getFullYear()).toBe(2023);
      expect(lots[2].purchaseDate.getFullYear()).toBe(2024);
    });

    it('should filter by productId', async () => {
      const { product: product1, supplier: supplier1 } = await TestFactory.createCompleteProductSetup('Product A');
      const { product: product2, supplier: supplier2 } = await TestFactory.createCompleteProductSetup('Product B');

      await purchaseService.create({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await purchaseService.create({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const lots = await purchaseService.getAll({ productId: product1.id });

      expect(lots).toHaveLength(1);
      expect(lots[0].productId).toBe(product1.id);
    });

    it('should filter by supplierId', async () => {
      const supplier1 = await TestFactory.createSupplier({ name: 'Supplier A' });
      const supplier2 = await TestFactory.createSupplier({ name: 'Supplier B' });
      const unit = await TestFactory.createUnit('pieces');
      const product1 = await TestFactory.createProduct('Product 1', supplier1.id, unit.id);
      const product2 = await TestFactory.createProduct('Product 2', supplier2.id, unit.id);

      await purchaseService.create({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await purchaseService.create({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const lots = await purchaseService.getAll({ supplierId: supplier1.id });

      expect(lots).toHaveLength(1);
      expect(lots[0].supplierId).toBe(supplier1.id);
    });

    it('should filter by year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-01'),
      });

      await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-06-01'),
      });

      const lots = await purchaseService.getAll({ year: 2023 });

      expect(lots).toHaveLength(1);
      expect(lots[0].year).toBe(2023);
    });

    it('should filter by hasRemainingInventory', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const lot1 = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 2.0,
        purchaseDate: new Date('2023-06-01'),
      });

      // Consume all inventory from lot1
      await testPrisma.purchaseLot.update({
        where: { id: lot1.id },
        data: { remainingQuantity: 0 },
      });

      const lots = await purchaseService.getAll({ hasRemainingInventory: true });

      expect(lots).toHaveLength(1);
      expect(lots[0].remainingQuantity).toBeGreaterThan(0);
    });

    it('should parse JSON snapshots correctly', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Snapshot Test');

      await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 25,
        unitCost: 4.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const lots = await purchaseService.getAll();

      expect(lots[0].productSnapshot).toBeInstanceOf(Object);
      expect(lots[0].supplierSnapshot).toBeInstanceOf(Object);
      expect(lots[0].productSnapshot.name).toBe('Snapshot Test');
    });
  });

  describe('getById', () => {
    it('should retrieve purchase lot by ID with lot value', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 3.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const result = await purchaseService.getById(created.id);

      expect(result.id).toBe(created.id);
      expect(result.quantity).toBe(50);
      expect(result.unitCost).toBe(3.0);
      expect(result.lotValue).toBe(150.0); // 50 × $3.00
      expect(result.productSnapshot).toBeInstanceOf(Object);
      expect(result.supplierSnapshot).toBeInstanceOf(Object);
    });

    it('should calculate lot value based on remaining quantity', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Consume some inventory
      await testPrisma.purchaseLot.update({
        where: { id: created.id },
        data: { remainingQuantity: 60 },
      });

      const result = await purchaseService.getById(created.id);

      expect(result.lotValue).toBe(120.0); // 60 × $2.00 (not 100 × $2.00)
    });

    it('should throw error when lot not found', async () => {
      await expect(
        purchaseService.getById(99999)
      ).rejects.toThrow('Purchase lot not found');
    });
  });

  describe('update', () => {
    it('should update purchase lot quantity', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const updated = await purchaseService.update(created.id, { quantity: 150 });

      expect(updated.quantity).toBe(150);
      expect(updated.remainingQuantity).toBe(150); // No consumption yet
    });

    it('should update remainingQuantity proportionally when quantity changes', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Consume 30 units (70 remaining)
      await testPrisma.purchaseLot.update({
        where: { id: created.id },
        data: { remainingQuantity: 70 },
      });

      // Update quantity to 120 (consumed 30, so remaining should be 90)
      const updated = await purchaseService.update(created.id, { quantity: 120 });

      expect(updated.quantity).toBe(120);
      expect(updated.remainingQuantity).toBe(90); // 120 - 30 consumed
    });

    it('should update unitCost', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const updated = await purchaseService.update(created.id, { unitCost: 2.5 });

      expect(updated.unitCost).toBe(2.5);
    });

    it('should update purchase date and recalculate year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const updated = await purchaseService.update(created.id, {
        purchaseDate: new Date('2024-06-15'),
      });

      expect(updated.year).toBe(2024);
      expect(updated.purchaseDate.getFullYear()).toBe(2024);
    });

    it('should throw error when updating non-existent lot', async () => {
      await expect(
        purchaseService.update(99999, { quantity: 100 })
      ).rejects.toThrow('Purchase lot not found');
    });

    it('should throw error when updating lot from locked year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Locked Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Lock year 2023
      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count.id);

      // Try to update
      await expect(
        purchaseService.update(created.id, { quantity: 150 })
      ).rejects.toThrow('Cannot update purchase from locked year 2023');
    });

    it('should throw error when moving purchase to locked year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2024-01-01'),
      });

      // Lock year 2023
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 50);
      await yearEndCountService.confirmYearEndCount(count.id);

      // Try to move to locked year
      await expect(
        purchaseService.update(created.id, { purchaseDate: new Date('2023-06-15') })
      ).rejects.toThrow('Cannot move purchase to locked year 2023');
    });

    it('should throw error when updating quantity to zero', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await expect(
        purchaseService.update(created.id, { quantity: 0 })
      ).rejects.toThrow('Quantity must be greater than 0');
    });

    it('should throw error when updating unitCost to negative', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await expect(
        purchaseService.update(created.id, { unitCost: -5.0 })
      ).rejects.toThrow('Unit cost must be greater than 0');
    });
  });

  describe('delete', () => {
    it('should delete unused purchase lot', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const result = await purchaseService.delete(created.id);

      expect(result.message).toBe('Purchase lot deleted successfully');

      // Verify deletion
      const lot = await testPrisma.purchaseLot.findUnique({ where: { id: created.id } });
      expect(lot).toBeNull();
    });

    it('should throw error when deleting non-existent lot', async () => {
      await expect(
        purchaseService.delete(99999)
      ).rejects.toThrow('Purchase lot not found');
    });

    it('should throw error when deleting lot from locked year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Locked Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Lock year 2023
      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count.id);

      // Try to delete
      await expect(
        purchaseService.delete(created.id)
      ).rejects.toThrow('Cannot delete purchase from locked year 2023');
    });

    it('should throw error when deleting partially consumed lot', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      const created = await purchaseService.create({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Consume some inventory
      await testPrisma.purchaseLot.update({
        where: { id: created.id },
        data: { remainingQuantity: 60 },
      });

      // Try to delete
      await expect(
        purchaseService.delete(created.id)
      ).rejects.toThrow('Cannot delete partially consumed purchase lot');
    });
  });

  describe('isYearLocked', () => {
    it('should return true for locked year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count.id);

      const isLocked = await purchaseService.isYearLocked(2023);
      expect(isLocked).toBe(true);
    });

    it('should return false for unlocked year', async () => {
      const isLocked = await purchaseService.isYearLocked(2024);
      expect(isLocked).toBe(false);
    });
  });

  describe('getLockedYears', () => {
    it('should return all locked years in descending order', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Multi-Year Product');

      // Lock years 2021, 2022, 2023
      for (const year of [2021, 2022, 2023]) {
        await TestFactory.createPurchaseLot({
          productId: product.id,
          supplierId: supplier.id,
          quantity: 100,
          unitCost: 1.0,
          purchaseDate: new Date(`${year}-01-01`),
        });

        const count = await yearEndCountService.initiateYearEndCount(year);
        await yearEndCountService.updateCountItem(count.id, product.id, 100);
        await yearEndCountService.confirmYearEndCount(count.id);
      }

      const lockedYears = await purchaseService.getLockedYears();

      expect(lockedYears).toHaveLength(3);
      expect(lockedYears[0].year).toBe(2023); // Descending order
      expect(lockedYears[1].year).toBe(2022);
      expect(lockedYears[2].year).toBe(2021);
    });

    it('should return empty array when no years are locked', async () => {
      const lockedYears = await purchaseService.getLockedYears();
      expect(lockedYears).toHaveLength(0);
    });
  });
});
