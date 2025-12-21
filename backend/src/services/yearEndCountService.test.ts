/**
 * Year-End Count Service Unit Tests
 * 
 * Tests the year-end inventory counting functionality including:
 * - Initiating counts with revision tracking
 * - Updating count items with variance calculation
 * - Confirming counts and locking years
 * - Year unlock with audit trail
 */

import { testPrisma } from '../../tests/setup';
import { TestFactory } from '../../tests/factories';
import { createYearEndCountService } from './yearEndCountService';
import { createInventoryService } from './inventoryService';

// Create service instances with test Prisma client
const inventoryService = createInventoryService(testPrisma);
const yearEndCountService = createYearEndCountService(testPrisma, inventoryService);

describe('yearEndCountService', () => {
  describe('initiateYearEndCount', () => {
    it('should create a year-end count with revision 1 for first count', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Bolt');
      
      // Create purchase lot with remaining inventory
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-15'),
      });

      const result = await yearEndCountService.initiateYearEndCount(2023);

      expect(result.year).toBe(2023);
      expect(result.revision).toBe(1);
      expect(result.status).toBe('draft');
      expect(result.itemsCount).toBe(1); // One product with inventory
    });

    it('should create count items for all products with remaining inventory', async () => {
      const { product: product1, supplier: supplier1 } = await TestFactory.createCompleteProductSetup('Product A');
      const { product: product2, supplier: supplier2 } = await TestFactory.createCompleteProductSetup('Product B');
      const { product: product3 } = await TestFactory.createCompleteProductSetup('Product C (no inventory)');
      
      // Products A and B have inventory
      await TestFactory.createPurchaseLot({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 2.0,
        purchaseDate: new Date('2023-02-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 30,
        unitCost: 3.0,
        purchaseDate: new Date('2023-03-01'),
      });

      // Product C has no inventory (no lot created)

      const result = await yearEndCountService.initiateYearEndCount(2023);

      // Should create items only for products A and B
      expect(result.itemsCount).toBe(2);

      const items = await testPrisma.yearEndCountItem.findMany({
        where: { yearEndCountId: result.id },
      });

      expect(items).toHaveLength(2);
      expect(items.some(i => i.productId === product1.id)).toBe(true);
      expect(items.some(i => i.productId === product2.id)).toBe(true);
      expect(items.some(i => i.productId === product3.id)).toBe(false); // No inventory
    });

    it('should calculate expected quantity from remaining quantities', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Multi-Lot Product');
      
      // Create multiple lots
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 30,
        unitCost: 1.5,
        purchaseDate: new Date('2023-06-01'),
      });

      const result = await yearEndCountService.initiateYearEndCount(2023);

      const items = await testPrisma.yearEndCountItem.findMany({
        where: { yearEndCountId: result.id },
      });

      // Expected quantity should be sum of all lots: 50 + 30 = 80
      expect(items[0].expectedQuantity).toBe(80);
      expect(items[0].countedQuantity).toBeNull();
      expect(items[0].variance).toBeNull();
      expect(items[0].value).toBeNull();
    });

    it('should increment revision when unlocked year has existing counts', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Create first count (revision 1)
      const count1 = await yearEndCountService.initiateYearEndCount(2023);
      expect(count1.revision).toBe(1);

      // Create second count (revision 2) - year is not locked
      const count2 = await yearEndCountService.initiateYearEndCount(2023);
      expect(count2.revision).toBe(2);

      // Create third count (revision 3)
      const count3 = await yearEndCountService.initiateYearEndCount(2023);
      expect(count3.revision).toBe(3);
    });

    it('should throw error when trying to create count for locked year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Create and confirm first count (this locks the year)
      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Update count item
      const items = await testPrisma.yearEndCountItem.findMany({
        where: { yearEndCountId: count.id },
      });
      
      await yearEndCountService.updateCountItem(count.id, items[0].productId, 100);
      
      // Confirm count (locks year)
      await yearEndCountService.confirmYearEndCount(count.id);

      // Try to create another count for the same year - should fail
      await expect(
        yearEndCountService.initiateYearEndCount(2023)
      ).rejects.toThrow('Year 2023 is locked. Cannot create new count.');
    });

    it('should handle products with zero remaining quantity after consumption', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Consumed Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Consume all inventory
      await inventoryService.consumeInventoryFIFO(product.id, 0);

      const result = await yearEndCountService.initiateYearEndCount(2023);

      // Should not create items for products with no inventory
      expect(result.itemsCount).toBe(0);
    });
  });

  describe('updateCountItem', () => {
    it('should update count item with counted quantity and calculate variance', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Widget');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Count shows 95 units (5 missing)
      const updatedItem = await yearEndCountService.updateCountItem(count.id, product.id, 95);

      expect(updatedItem.countedQuantity).toBe(95);
      expect(updatedItem.expectedQuantity).toBe(100);
      expect(updatedItem.variance).toBe(-5); // Shortage
      expect(updatedItem.value).toBeCloseTo(190.0, 2); // 95 × $2.00
    });

    it('should calculate FIFO value correctly for multi-lot product', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Multi-Cost Product');
      
      // Lot 1: 20 @ $1.00 (oldest)
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 20,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Lot 2: 30 @ $2.00
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-06-01'),
      });

      // Lot 3: 50 @ $3.00 (newest)
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 3.0,
        purchaseDate: new Date('2023-12-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Count shows 60 units total
      // FIFO valuation: 20 @ $1 + 30 @ $2 + 10 @ $3 = $20 + $60 + $30 = $110
      const updatedItem = await yearEndCountService.updateCountItem(count.id, product.id, 60);

      expect(updatedItem.countedQuantity).toBe(60);
      expect(updatedItem.expectedQuantity).toBe(100); // 20 + 30 + 50
      expect(updatedItem.variance).toBe(-40); // Shortage
      expect(updatedItem.value).toBeCloseTo(110.0, 2);
    });

    it('should handle surplus variance (counted > expected)', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Surplus Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 1.5,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Count shows 55 units (5 extra found)
      const updatedItem = await yearEndCountService.updateCountItem(count.id, product.id, 55);

      expect(updatedItem.countedQuantity).toBe(55);
      expect(updatedItem.expectedQuantity).toBe(50);
      expect(updatedItem.variance).toBe(5); // Surplus
    });

    it('should handle exact match (no variance)', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Exact Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 75,
        unitCost: 2.5,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Count matches exactly
      const updatedItem = await yearEndCountService.updateCountItem(count.id, product.id, 75);

      expect(updatedItem.countedQuantity).toBe(75);
      expect(updatedItem.expectedQuantity).toBe(75);
      expect(updatedItem.variance).toBe(0); // Exact
      expect(updatedItem.value).toBeCloseTo(187.5, 2); // 75 × $2.50
    });

    it('should throw error when count not found', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Product');

      await expect(
        yearEndCountService.updateCountItem(99999, product.id, 10)
      ).rejects.toThrow('Year-end count not found');
    });

    it('should throw error when updating confirmed count', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Confirmed Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Update and confirm
      await yearEndCountService.updateCountItem(count.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count.id);

      // Try to update after confirmation
      await expect(
        yearEndCountService.updateCountItem(count.id, product.id, 95)
      ).rejects.toThrow('Cannot update confirmed year-end count');
    });

    it('should throw error when product not in count', async () => {
      const { product: product1, supplier: supplier1 } = await TestFactory.createCompleteProductSetup('Product 1');
      const { product: product2 } = await TestFactory.createCompleteProductSetup('Product 2 (not in count)');
      
      await TestFactory.createPurchaseLot({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);

      // Try to update product that's not in the count
      await expect(
        yearEndCountService.updateCountItem(count.id, product2.id, 10)
      ).rejects.toThrow('Count item not found for this product');
    });
  });

  describe('confirmYearEndCount', () => {
    it('should confirm count and update lot quantities using FIFO', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('FIFO Test');
      
      // Create 3 lots with different dates
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 30,
        unitCost: 1.5,
        purchaseDate: new Date('2023-06-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 20,
        unitCost: 2.0,
        purchaseDate: new Date('2023-12-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Count shows 60 units total (40 consumed following FIFO)
      await yearEndCountService.updateCountItem(count.id, product.id, 60);
      
      const result = await yearEndCountService.confirmYearEndCount(count.id);

      expect(result.status).toBe('confirmed');
      expect(result.confirmedAt).toBeDefined();

      // Check lot quantities after FIFO consumption
      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      // FIFO: 60 remaining goes to newest lots
      // Lot 3 (2023-12): 20 remaining
      // Lot 2 (2023-06): 30 remaining
      // Lot 1 (2023-01): 10 remaining (40 consumed from oldest)
      expect(lots[0].remainingQuantity).toBe(10);
      expect(lots[1].remainingQuantity).toBe(30);
      expect(lots[2].remainingQuantity).toBe(20);
    });

    it('should lock the year after confirmation', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Lock Test');
      
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

      // Check if year is locked
      const lockedYear = await testPrisma.lockedYear.findUnique({
        where: { year: 2023 },
      });

      expect(lockedYear).toBeDefined();
      expect(lockedYear!.year).toBe(2023);
    });

    it('should throw error when count not found', async () => {
      await expect(
        yearEndCountService.confirmYearEndCount(99999)
      ).rejects.toThrow('Year-end count not found');
    });

    it('should throw error when count already confirmed', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Double Confirm');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 100);
      
      // Confirm once
      await yearEndCountService.confirmYearEndCount(count.id);

      // Try to confirm again
      await expect(
        yearEndCountService.confirmYearEndCount(count.id)
      ).rejects.toThrow('Year-end count already confirmed');
    });

    it('should throw error when not all products are counted', async () => {
      const { product: product1, supplier: supplier1 } = await TestFactory.createCompleteProductSetup('Product A');
      const { product: product2, supplier: supplier2 } = await TestFactory.createCompleteProductSetup('Product B');
      
      await TestFactory.createPurchaseLot({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Only count product A, leave product B uncounted
      await yearEndCountService.updateCountItem(count.id, product1.id, 50);

      // Try to confirm - should fail
      await expect(
        yearEndCountService.confirmYearEndCount(count.id)
      ).rejects.toThrow(/Cannot confirm count.*not counted/);
    });
  });

  describe('unlockYear', () => {
    it('should unlock most recent locked year with audit trail', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Unlock Test');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Create and confirm count (locks year)
      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count.id);

      // Unlock the year
      const result = await yearEndCountService.unlockYear(
        2023,
        'data_error',
        'Found error in inventory count'
      );

      expect(result.year).toBe(2023);
      expect(result.reasonCategory).toBe('data_error');
      expect(result.description).toBe('Found error in inventory count');

      // Verify year is unlocked
      const lockedYear = await testPrisma.lockedYear.findUnique({
        where: { year: 2023 },
      });
      expect(lockedYear).toBeNull();

      // Verify audit record created
      const auditRecords = await testPrisma.yearUnlockAudit.findMany({
        where: { year: 2023 },
      });
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0].reasonCategory).toBe('data_error');
      expect(auditRecords[0].description).toBe('Found error in inventory count');
    });

    it('should throw error when year is not locked', async () => {
      await expect(
        yearEndCountService.unlockYear(2023, 'data_error', 'Test reason')
      ).rejects.toThrow('Year 2023 is not locked');
    });

    it('should throw error when unlocking non-most-recent year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Multi-Year Test');
      
      // Create and lock 2022
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-01'),
      });

      const count2022 = await yearEndCountService.initiateYearEndCount(2022);
      await yearEndCountService.updateCountItem(count2022.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count2022.id);

      // Create and lock 2023
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count2023 = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count2023.id, product.id, 100);
      await yearEndCountService.confirmYearEndCount(count2023.id);

      // Try to unlock 2022 (not most recent)
      await expect(
        yearEndCountService.unlockYear(2022, 'data_error', 'Test')
      ).rejects.toThrow('Can only unlock most recently locked year (2023)');
    });

    it('should throw error with invalid reason category', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Test');
      
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

      await expect(
        yearEndCountService.unlockYear(2023, 'invalid_category', 'Test')
      ).rejects.toThrow(/Invalid reason category/);
    });

    it('should throw error with empty description', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Test');
      
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

      await expect(
        yearEndCountService.unlockYear(2023, 'data_error', '')
      ).rejects.toThrow('Description is required');
    });
  });

  describe('getMostRecentLockedYear', () => {
    it('should return most recent locked year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Multi-Year');
      
      // Lock 2021, 2022, 2023
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

      const mostRecent = await yearEndCountService.getMostRecentLockedYear();
      expect(mostRecent).toBe(2023);
    });

    it('should return null when no years are locked', async () => {
      const mostRecent = await yearEndCountService.getMostRecentLockedYear();
      expect(mostRecent).toBeNull();
    });
  });

  describe('checkPendingCount', () => {
    it('should detect pending count when purchases exist without confirmed count', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Pending Test');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const result = await yearEndCountService.checkPendingCount();

      expect(result.needsCount).toBe(true);
      expect(result.pendingYear).toBe(2023);
      expect(result.latestPurchaseYear).toBe(2023);
      expect(result.latestCountYear).toBe(0);
    });

    it('should return no pending count when year is confirmed', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Confirmed Test');
      
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

      const result = await yearEndCountService.checkPendingCount();

      expect(result.needsCount).toBe(false);
      expect(result.pendingYear).toBeNull();
    });

    it('should return no pending count when no purchases exist', async () => {
      const result = await yearEndCountService.checkPendingCount();

      expect(result.needsCount).toBe(false);
      expect(result.pendingYear).toBeNull();
    });
  });

  describe('getCountSheet', () => {
    it('should retrieve count sheet with progress tracking', async () => {
      const { product: product1, supplier: supplier1 } = await TestFactory.createCompleteProductSetup('Product A');
      const { product: product2, supplier: supplier2 } = await TestFactory.createCompleteProductSetup('Product B');
      
      await TestFactory.createPurchaseLot({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Count only one product
      await yearEndCountService.updateCountItem(count.id, product1.id, 50);

      const sheet = await yearEndCountService.getCountSheet(count.id);

      expect(sheet.id).toBe(count.id);
      expect(sheet.year).toBe(2023);
      expect(sheet.status).toBe('draft');
      expect(sheet.items).toHaveLength(2);
      expect(sheet.progress.total).toBe(2);
      expect(sheet.progress.counted).toBe(1); // Only product1 counted
      expect(sheet.progress.percentage).toBe(50);
    });

    it('should sort products alphabetically in count sheet', async () => {
      const { product: productZ, supplier: supplierZ } = await TestFactory.createCompleteProductSetup('Z Product');
      const { product: productA, supplier: supplierA } = await TestFactory.createCompleteProductSetup('A Product');
      const { product: productM, supplier: supplierM } = await TestFactory.createCompleteProductSetup('M Product');
      
      await TestFactory.createPurchaseLot({
        productId: productZ.id,
        supplierId: supplierZ.id,
        quantity: 10,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: productA.id,
        supplierId: supplierA.id,
        quantity: 10,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: productM.id,
        supplierId: supplierM.id,
        quantity: 10,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      const sheet = await yearEndCountService.getCountSheet(count.id);

      // Should be sorted alphabetically
      expect(sheet.items[0].product.name).toBe('A Product');
      expect(sheet.items[1].product.name).toBe('M Product');
      expect(sheet.items[2].product.name).toBe('Z Product');
    });

    it('should throw error when count sheet not found', async () => {
      await expect(
        yearEndCountService.getCountSheet(99999)
      ).rejects.toThrow('Year-end count not found');
    });
  });

  describe('calculateVariances', () => {
    it('should calculate variance summary for all items', async () => {
      const { product: product1, supplier: supplier1 } = await TestFactory.createCompleteProductSetup('Product A');
      const { product: product2, supplier: supplier2 } = await TestFactory.createCompleteProductSetup('Product B');
      
      await TestFactory.createPurchaseLot({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 100,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 50,
        unitCost: 3.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      // Product A: counted 95 (shortage of 5)
      await yearEndCountService.updateCountItem(count.id, product1.id, 95);
      
      // Product B: counted 55 (surplus of 5)
      await yearEndCountService.updateCountItem(count.id, product2.id, 55);

      const summary = await yearEndCountService.calculateVariances(count.id);

      expect(summary.totalProducts).toBe(2);
      expect(summary.countedProducts).toBe(2);
      expect(summary.totalExpected).toBe(150); // 100 + 50
      expect(summary.totalCounted).toBe(150); // 95 + 55
      expect(summary.totalVariance).toBe(0); // -5 + 5
      // FIFO valuation: Product A (95×$2=$190) + Product B (50×$3=$150, can't value beyond available lots)
      expect(summary.totalValue).toBeCloseTo(340.0, 2);
      
      // Check item statuses
      const itemA = summary.items.find(i => i.productName === 'Product A');
      expect(itemA!.status).toBe('shortage');
      expect(itemA!.variance).toBe(-5);
      
      const itemB = summary.items.find(i => i.productName === 'Product B');
      expect(itemB!.status).toBe('surplus');
      expect(itemB!.variance).toBe(5);
    });

    it('should mark uncounted products as pending', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Uncounted Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      
      const summary = await yearEndCountService.calculateVariances(count.id);

      expect(summary.countedProducts).toBe(0);
      expect(summary.items[0].status).toBe('pending');
    });

    it('should mark exact matches as exact', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Exact Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 75,
        unitCost: 1.5,
        purchaseDate: new Date('2023-01-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 75);
      
      const summary = await yearEndCountService.calculateVariances(count.id);

      expect(summary.items[0].status).toBe('exact');
      expect(summary.items[0].variance).toBe(0);
    });
  });

  describe('generateYearEndReport', () => {
    it('should generate report with lot breakdown', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Multi-Lot Product');
      
      // Create 2 lots
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-15'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-06-01'),
      });

      const count = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count.id, product.id, 75);
      
      const report = await yearEndCountService.generateYearEndReport(count.id);

      expect(report.year).toBe(2023);
      expect(report.totalExpected).toBe(80); // 50 + 30
      expect(report.totalCounted).toBe(75);
      expect(report.totalVariance).toBe(-5);
      
      // Check lot breakdown
      const productReport = report.items[0];
      expect(productReport.lotBreakdown).toHaveLength(2);
      expect(productReport.lotBreakdown[0].remainingQuantity).toBe(50);
      expect(productReport.lotBreakdown[0].unitCost).toBe(1.0);
      expect(productReport.lotBreakdown[1].remainingQuantity).toBe(30);
      expect(productReport.lotBreakdown[1].unitCost).toBe(2.0);
    });

    it('should throw error when report count not found', async () => {
      await expect(
        yearEndCountService.generateYearEndReport(99999)
      ).rejects.toThrow('Year-end count not found');
    });
  });

  describe('getByYear', () => {
    it('should get latest revision when revision not specified', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Create 3 revisions
      await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.initiateYearEndCount(2023);

      const result = await yearEndCountService.getByYear(2023);

      expect(result.year).toBe(2023);
      expect(result.revision).toBe(3); // Latest revision
    });

    it('should get specific revision when specified', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.initiateYearEndCount(2023);

      const result = await yearEndCountService.getByYear(2023, 1);

      expect(result.year).toBe(2023);
      expect(result.revision).toBe(1);
    });

    it('should throw error when year not found', async () => {
      await expect(
        yearEndCountService.getByYear(2099)
      ).rejects.toThrow('Year-end count for 2099 not found');
    });

    it('should throw error when specific revision not found', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await yearEndCountService.initiateYearEndCount(2023);

      await expect(
        yearEndCountService.getByYear(2023, 5)
      ).rejects.toThrow('Year-end count for 2023 revision 5 not found');
    });
  });

  describe('getAllRevisions', () => {
    it('should return all revisions for a year in ascending order', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.initiateYearEndCount(2023);

      const revisions = await yearEndCountService.getAllRevisions(2023);

      expect(revisions).toHaveLength(3);
      expect(revisions[0].revision).toBe(1);
      expect(revisions[1].revision).toBe(2);
      expect(revisions[2].revision).toBe(3);
      expect(revisions[0].status).toBe('draft');
    });

    it('should return empty array when no revisions exist', async () => {
      const revisions = await yearEndCountService.getAllRevisions(2099);
      expect(revisions).toHaveLength(0);
    });
  });

  describe('compareRevisions', () => {
    it('should compare two revisions side-by-side', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Revision 1: count 95
      const count1 = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count1.id, product.id, 95);

      // Revision 2: count 90
      const count2 = await yearEndCountService.initiateYearEndCount(2023);
      await yearEndCountService.updateCountItem(count2.id, product.id, 90);

      const comparison = await yearEndCountService.compareRevisions(2023, 1, 2);

      expect(comparison.year).toBe(2023);
      expect(comparison.revision1.revision).toBe(1);
      expect(comparison.revision2.revision).toBe(2);
      expect(comparison.comparison).toHaveLength(1);
      
      const productComparison = comparison.comparison[0];
      expect(productComparison.revision1.countedQuantity).toBe(95);
      expect(productComparison.revision2.countedQuantity).toBe(90);
      expect(productComparison.difference.countedQuantity).toBe(-5);
    });

    it('should throw error when revision1 not found', async () => {
      await expect(
        yearEndCountService.compareRevisions(2023, 1, 2)
      ).rejects.toThrow('Year-end count for 2023 revision 1 not found');
    });

    it('should throw error when revision2 not found', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      await yearEndCountService.initiateYearEndCount(2023);

      await expect(
        yearEndCountService.compareRevisions(2023, 1, 99)
      ).rejects.toThrow('Year-end count for 2023 revision 99 not found');
    });
  });

  describe('getUnlockHistory', () => {
    it('should retrieve unlock history for a year', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('History Test');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Lock and unlock year twice
      for (let i = 1; i <= 2; i++) {
        const count = await yearEndCountService.initiateYearEndCount(2023);
        await yearEndCountService.updateCountItem(count.id, product.id, 100);
        await yearEndCountService.confirmYearEndCount(count.id);
        
        await yearEndCountService.unlockYear(2023, 'data_error', `Unlock attempt ${i}`);
      }

      const history = await yearEndCountService.getUnlockHistory(2023);

      expect(history).toHaveLength(2);
      expect(history[0].description).toBe('Unlock attempt 1');
      expect(history[1].description).toBe('Unlock attempt 2');
      expect(history[0].reasonCategory).toBe('data_error');
    });

    it('should return empty array when no unlock history exists', async () => {
      const history = await yearEndCountService.getUnlockHistory(2099);
      expect(history).toHaveLength(0);
    });
  });
});
