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

  describe('getLotsByFIFOOrder', () => {
    it('should return lots ordered by purchase date (oldest first)', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Component');
      
      // Create lots in random order
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 30,
        unitCost: 1.2,
        purchaseDate: new Date('2023-06-15'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-10'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 20,
        unitCost: 1.5,
        purchaseDate: new Date('2024-03-20'),
      });

      const lots = await inventoryService.getLotsByFIFOOrder(product.id);

      // Should be ordered oldest to newest
      expect(lots).toHaveLength(3);
      expect(lots[0].purchaseDate.getFullYear()).toBe(2022);
      expect(lots[1].purchaseDate.getFullYear()).toBe(2023);
      expect(lots[2].purchaseDate.getFullYear()).toBe(2024);
    });

    it('should only return lots with remaining quantity > 0', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Widget');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Consume all inventory
      await inventoryService.consumeInventoryFIFO(product.id, 0);

      const lots = await inventoryService.getLotsByFIFOOrder(product.id);

      // Should return empty array (no lots with remaining > 0)
      expect(lots).toHaveLength(0);
    });
  });

  describe('getCurrentInventoryQuantity', () => {
    it('should sum remaining quantities across all lots', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Part');
      
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
        unitCost: 1.5,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 20,
        unitCost: 2.0,
        purchaseDate: new Date('2024-01-01'),
      });

      const quantity = await inventoryService.getCurrentInventoryQuantity(product.id);

      // Total: 50 + 30 + 20 = 100
      expect(quantity).toBe(100);
    });

    it('should return 0 for product with no lots', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Empty');
      
      const quantity = await inventoryService.getCurrentInventoryQuantity(product.id);
      
      expect(quantity).toBe(0);
    });

    it('should reflect quantity after consumption', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Consumed');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Set target to 60 remaining
      await inventoryService.consumeInventoryFIFO(product.id, 60);

      const quantity = await inventoryService.getCurrentInventoryQuantity(product.id);
      
      expect(quantity).toBe(60);
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

  describe('getInventoryValue - Aggregated Inventory Reporting', () => {
    it('should aggregate inventory across all products', async () => {
      const { product: product1, supplier: supplier1 } = await TestFactory.createCompleteProductSetup('Product A');
      const { product: product2, supplier: supplier2 } = await TestFactory.createCompleteProductSetup('Product B');
      
      // Product A: 50 units @ $1.00 = $50
      await TestFactory.createPurchaseLot({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Product B: 30 units @ $2.00 = $60
      await TestFactory.createPurchaseLot({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-02-01'),
      });

      const result = await inventoryService.getInventoryValue();

      expect(result.totalQuantity).toBe(80); // 50 + 30
      expect(result.totalValue).toBeCloseTo(110.0, 2); // $50 + $60
      expect(result.products).toHaveLength(2);
      
      // Check product A
      const productA = result.products.find(p => p.productName === 'Product A');
      expect(productA).toBeDefined();
      expect(productA!.quantity).toBe(50);
      expect(productA!.value).toBeCloseTo(50.0, 2);
      
      // Check product B
      const productB = result.products.find(p => p.productName === 'Product B');
      expect(productB).toBeDefined();
      expect(productB!.quantity).toBe(30);
      expect(productB!.value).toBeCloseTo(60.0, 2);
    });

    it('should group multiple lots by product', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Multi-Lot Product');
      
      // Create 3 lots of the same product at different costs
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 20,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 30,
        unitCost: 1.5,
        purchaseDate: new Date('2023-01-01'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 50,
        unitCost: 2.0,
        purchaseDate: new Date('2024-01-01'),
      });

      const result = await inventoryService.getInventoryValue();

      // Should be grouped into a single product
      expect(result.products).toHaveLength(1);
      expect(result.products[0].productName).toBe('Multi-Lot Product');
      expect(result.products[0].quantity).toBe(100); // 20 + 30 + 50
      expect(result.products[0].value).toBeCloseTo(165.0, 2); // (20×$1) + (30×$1.5) + (50×$2)
      expect(result.products[0].lots).toHaveLength(3);
    });

    it('should filter by supplierId when provided', async () => {
      const supplier1 = await TestFactory.createSupplier({ name: 'Supplier A' });
      const supplier2 = await TestFactory.createSupplier({ name: 'Supplier B' });
      const unit = await TestFactory.createUnit('pieces');
      
      const product1 = await TestFactory.createProduct('Product from A', supplier1.id, unit.id);
      const product2 = await TestFactory.createProduct('Product from B', supplier2.id, unit.id);
      
      // Supplier A product: 50 units @ $1.00
      await TestFactory.createPurchaseLot({
        productId: product1.id,
        supplierId: supplier1.id,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Supplier B product: 30 units @ $2.00
      await TestFactory.createPurchaseLot({
        productId: product2.id,
        supplierId: supplier2.id,
        quantity: 30,
        unitCost: 2.0,
        purchaseDate: new Date('2023-02-01'),
      });

      // Filter by Supplier A
      const result = await inventoryService.getInventoryValue({ supplierId: supplier1.id });

      expect(result.totalQuantity).toBe(50); // Only Supplier A's product
      expect(result.totalValue).toBeCloseTo(50.0, 2);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].productName).toBe('Product from A');
    });

    it('should include supplier name from relation', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Test Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 10,
        unitCost: 5.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const result = await inventoryService.getInventoryValue();

      expect(result.products).toHaveLength(1);
      expect(result.products[0].lots).toHaveLength(1);
      expect(result.products[0].lots[0].supplier).toBe(supplier.name);
    });

    it('should fallback to supplier snapshot when relation is null', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Snapshot Test');
      
      // Create lot with snapshot
      const lot = await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 25,
        unitCost: 3.0,
        purchaseDate: new Date('2023-01-01'),
      });

      // Remove supplier relation to simulate deleted supplier
      await testPrisma.purchaseLot.update({
        where: { id: lot.id },
        data: { supplierId: null },
      });

      const result = await inventoryService.getInventoryValue();

      expect(result.products).toHaveLength(1);
      expect(result.products[0].lots).toHaveLength(1);
      // Should get supplier name from snapshot
      expect(result.products[0].lots[0].supplier).toBe(supplier.name);
    });

    it('should exclude lots with zero remaining quantity', async () => {
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

      const result = await inventoryService.getInventoryValue();

      // Should not include the consumed lot
      expect(result.totalQuantity).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.products).toHaveLength(0);
    });

    it('should include product unit information', async () => {
      const { product, unit } = await TestFactory.createCompleteProductSetup('Unit Test Product');
      
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 15,
        unitCost: 4.0,
        purchaseDate: new Date('2023-01-01'),
      });

      const result = await inventoryService.getInventoryValue();

      expect(result.products).toHaveLength(1);
      expect(result.products[0].unit).toBeDefined();
      expect(result.products[0].unit.name).toBe(unit.name);
    });

    it('should return empty result when no inventory exists', async () => {
      // Don't create any products or lots
      const result = await inventoryService.getInventoryValue();

      expect(result.totalQuantity).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.products).toHaveLength(0);
    });

    it('should include lot details (year, purchase date, costs)', async () => {
      const { product, supplier } = await TestFactory.createCompleteProductSetup('Detailed Lot Test');
      
      const purchaseDate = new Date('2023-06-15');
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 40,
        unitCost: 2.5,
        purchaseDate,
      });

      const result = await inventoryService.getInventoryValue();

      const lot = result.products[0].lots[0];
      expect(lot.purchaseDate).toEqual(purchaseDate);
      expect(lot.remainingQuantity).toBe(40);
      expect(lot.unitCost).toBe(2.5);
      expect(lot.year).toBe(2023);
    });
  });
});
