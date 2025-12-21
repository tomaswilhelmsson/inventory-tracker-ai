/**
 * FIFO Calculation Unit Tests
 * 
 * Tests the core inventory FIFO (First-In-First-Out) consumption logic.
 * These tests validate that inventory is consumed from oldest lots first.
 */

import { testPrisma } from '../../tests/setup';
import { TestFactory } from '../../tests/factories';
import { createInventoryService } from './inventoryService';

// Create service instance with test Prisma client
const inventoryService = createInventoryService(testPrisma);

describe('inventoryService - FIFO Calculations', () => {
  describe('consumeInventoryFIFO - Single Lot', () => {
    it('should set remaining quantity to target (single lot)', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Bolt');
      
      // Create a single lot with 100 units
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-15'),
      });

      // Set target to 100 (all remain)
      await inventoryService.consumeInventoryFIFO(product.id, 100);

      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
      });

      expect(lots).toHaveLength(1);
      expect(lots[0].remainingQuantity).toBe(100); // Target achieved
    });

    it('should handle partial remaining quantity', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Widget');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 100,
        unitCost: 2.0,
        purchaseDate: new Date('2022-06-01'),
      });

      // Set target to 60 (40 consumed from the 100)
      await inventoryService.consumeInventoryFIFO(product.id, 60);

      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
      });

      expect(lots[0].quantity).toBe(100); // Original quantity unchanged
      expect(lots[0].remainingQuantity).toBe(60); // Target: 60 remain
    });

    it('should handle zero consumption (no change)', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Part');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 1.5,
        purchaseDate: new Date('2023-01-01'),
      });

      await inventoryService.consumeInventoryFIFO(product.id, 0);

      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
      });

      expect(lots[0].remainingQuantity).toBe(0);
    });
  });

  describe('consumeInventoryFIFO - Multi-Lot FIFO Ordering', () => {
    it('should allocate remaining quantity to newest lots (FIFO consumption)', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Component');
      
      // Create lots: 50 (2022) + 30 (2023) + 20 (2024) = 100 total
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 30,
        unitCost: 1.2,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 20,
        unitCost: 1.5,
        purchaseDate: new Date('2024-01-01'),
      });

      // Target: 60 remaining (40 consumed following FIFO)
      // Remaining goes to newest lots: 20 (2024) + 30 (2023) + 10 (2022)
      await inventoryService.consumeInventoryFIFO(product.id, 60);

      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      expect(lots[0].remainingQuantity).toBe(10); // 2022: 40 consumed, 10 remain
      expect(lots[1].remainingQuantity).toBe(30); // 2023: all 30 remain 
      expect(lots[2].remainingQuantity).toBe(20); // 2024: all 20 remain
    });

    it('should deplete oldest lots when target is small', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Material');
      
      // Lot 1 (2022): 100 units
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2022-06-15'),
      });

      // Lot 2 (2023): 100 units
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 100,
        unitCost: 1.1,
        purchaseDate: new Date('2023-03-20'),
      });

      // Target: 50 remaining (150 consumed)
      // Remaining goes to newest lot (2023): 50 from Lot 2
      await inventoryService.consumeInventoryFIFO(product.id, 50);

      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      expect(lots[0].remainingQuantity).toBe(0); // 2022: fully consumed
      expect(lots[1].remainingQuantity).toBe(50); // 2023: 50 remain
    });
  });

  describe('consumeInventoryFIFO - Edge Cases', () => {
    it('should reject negative target quantity', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Item');
      
      await expect(
        inventoryService.consumeInventoryFIFO(product.id, -10)
      ).rejects.toThrow('Target quantity cannot be negative');
    });

    it('should handle empty inventory (no lots)', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('EmptyProduct');
      
      // No lots created - should not throw
      await expect(
        inventoryService.consumeInventoryFIFO(product.id, 10)
      ).resolves.not.toThrow();
    });

    it('should handle target exceeding total inventory', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Limited');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 30,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Target exceeds available (asking for 100 to remain, only have 30 total)
      // Should keep all 30
      await inventoryService.consumeInventoryFIFO(product.id, 100);

      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
      });

      // Should keep the entire lot since target > available
      expect(lots[0].remainingQuantity).toBe(30);
    });
  });

  describe('getCurrentInventoryValue - FIFO Value Calculation', () => {
    it('should calculate value from single lot correctly', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('ValueTest1');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 2.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const result = await inventoryService.getCurrentInventoryValue(product.id);
      
      // 50 units @ $2.00 = $100.00
      expect(result.value).toBeCloseTo(100.0, 2);
      expect(result.quantity).toBe(50);
    });

    it('should calculate value spanning multiple lots with different costs', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('ValueTest2');
      
      // Lot 1: 20 units @ $1.00
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 20,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-01'),
      });

      // Lot 2: 30 units @ $1.50
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 30,
        unitCost: 1.5,
        purchaseDate: new Date('2023-01-01'),
      });

      // Lot 3: 50 units @ $2.00
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 2.0,
        purchaseDate: new Date('2024-01-01'),
      });

      const result = await inventoryService.getCurrentInventoryValue(product.id);
      
      // Total: (20 × $1.00) + (30 × $1.50) + (50 × $2.00) = $20 + $45 + $100 = $165
      expect(result.value).toBeCloseTo(165.0, 2);
      expect(result.quantity).toBe(100);
    });
  });
});
