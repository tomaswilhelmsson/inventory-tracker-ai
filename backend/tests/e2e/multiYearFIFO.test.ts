/**
 * Multi-Year FIFO E2E Tests
 * 
 * End-to-end tests validating FIFO calculations across multiple years.
 * Includes the critical user-specified bolt scenario.
 */

import { testPrisma } from '../setup';
import { TestFactory } from '../factories';
import { createInventoryService } from '../../src/services/inventoryService';

// Create service instance with test Prisma client
const inventoryService = createInventoryService(testPrisma);

describe('Multi-Year FIFO E2E Tests', () => {
  describe('User-Specified Bolt Scenario', () => {
    /**
     * CRITICAL TEST: Validates the exact user requirement
     * 
     * Scenario:
     * - 2022: Purchase 10 bolts @ $1.00, use 2 → 8 remaining @ $8.00
     * - 2023: Purchase 5 bolts @ $1.50, use 2 more → 11 remaining @ $13.50
     * - 2024: Use 10 bolts → 1 remaining @ $1.50
     *   - Purchase 1 (2022) should have 0 remaining
     *   - Purchase 2 (2023) should have 1 remaining
     */
    it('should correctly handle multi-year bolt consumption with FIFO', async () => {
      // Setup: Create product "10mm Bolt"
      const supplier = await TestFactory.createSupplier({ name: 'Bolt Supplier' });
      const unit = await TestFactory.createUnit('pieces');
      const product = await TestFactory.createProduct(
        '10mm Bolt',
        supplier.id,
        unit.id,
        'Standard 10mm bolts'
      );

      // ============================================================================
      // YEAR 2022
      // ============================================================================
      
      // Purchase 1: Buy 10 bolts @ $1.00 each
      const purchase1 = await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 10,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-15'),
      });

      // Year-end count 2022: Used 2 bolts, leaving 8 remaining
      await inventoryService.consumeInventoryFIFO(product.id, 8);

      // Verify 2022 state
      const lots2022 = await testPrisma.purchaseLot.findUnique({
        where: { id: purchase1.id },
      });
      expect(lots2022?.remainingQuantity).toBe(8);
      
      const value2022 = await inventoryService.getCurrentInventoryValue(product.id);
      expect(value2022.value).toBeCloseTo(8.0, 2); // 8 bolts @ $1.00 = $8.00

      // ============================================================================
      // YEAR 2023
      // ============================================================================
      
      // Purchase 2: Buy 5 bolts @ $1.50 each
      const purchase2 = await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: supplier.id,
        quantity: 5,
        unitCost: 1.5,
        purchaseDate: new Date('2023-01-20'),
      });

      // Year-end count 2023: Used 2 more bolts, leaving 11 total
      // FIFO: 2 consumed from Purchase 1 (oldest), leaving 6 from Purchase 1
      await inventoryService.consumeInventoryFIFO(product.id, 11);

      // Verify 2023 state
      const lots2023 = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      expect(lots2023[0].remainingQuantity).toBe(6); // Purchase 1: 8 - 2 = 6
      expect(lots2023[1].remainingQuantity).toBe(5); // Purchase 2: untouched

      const value2023 = await inventoryService.getCurrentInventoryValue(product.id);
      // (6 × $1.00) + (5 × $1.50) = $6.00 + $7.50 = $13.50
      expect(value2023.value).toBeCloseTo(13.5, 2);

      // ============================================================================
      // YEAR 2024
      // ============================================================================
      
      // Year-end count 2024: Used 10 bolts, leaving 1 total
      // FIFO: First consume all 6 from Purchase 1, then 4 from Purchase 2
      await inventoryService.consumeInventoryFIFO(product.id, 1);

      // CRITICAL ASSERTIONS: Verify FIFO lot depletion
      const lots2024 = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      // Purchase 1 (2022) should be FULLY CONSUMED (0 remaining)
      expect(lots2024[0].id).toBe(purchase1.id);
      expect(lots2024[0].remainingQuantity).toBe(0);
      
      // Purchase 2 (2023) should have 1 remaining (4 consumed from original 5)
      expect(lots2024[1].id).toBe(purchase2.id);
      expect(lots2024[1].remainingQuantity).toBe(1);

      const value2024 = await inventoryService.getCurrentInventoryValue(product.id);
      // 1 bolt @ $1.50 = $1.50
      expect(value2024.value).toBeCloseTo(1.5, 2);

      // Final validation: FIFO ordering maintained
      expect(lots2024[0].purchaseDate < lots2024[1].purchaseDate).toBe(true);
      
      console.log('\n✅ Bolt Scenario Test Results:');
      console.log(`2022: Purchase 1 (10 @ $1.00) → ${lots2024[0].remainingQuantity} remaining`);
      console.log(`2023: Purchase 2 (5 @ $1.50) → ${lots2024[1].remainingQuantity} remaining`);
      console.log(`2024: Total value: $${value2024.value.toFixed(2)}`);
      console.log('FIFO ordering validated: Oldest lot depleted first ✓\n');
    });
  });

  describe('Three-Year Inventory Cycle', () => {
    it('should handle cross-year inventory carry-forward correctly', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Widget A');

      // Year 2022: Multiple purchases
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 100,
        unitCost: 5.0,
        purchaseDate: new Date('2022-01-15'),
      });

      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 5.5,
        purchaseDate: new Date('2022-06-20'),
      });

      // Count 2022: 120 remaining (30 consumed from first lot)
      await inventoryService.consumeInventoryFIFO(product.id, 120);

      let lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      expect(lots[0].remainingQuantity).toBe(70); // 100 - 30 = 70
      expect(lots[1].remainingQuantity).toBe(50); // Untouched

      // Year 2023: New purchase
      await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 80,
        unitCost: 6.0,
        purchaseDate: new Date('2023-03-10'),
      });

      // Count 2023: 150 remaining (50 more consumed from first lot)
      await inventoryService.consumeInventoryFIFO(product.id, 150);

      lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      expect(lots[0].remainingQuantity).toBe(20); // 70 - 50 = 20
      expect(lots[1].remainingQuantity).toBe(50); // Still untouched
      expect(lots[2].remainingQuantity).toBe(80); // New lot untouched

      // Year 2024: No new purchases, consumption continues
      await inventoryService.consumeInventoryFIFO(product.id, 60);

      lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      expect(lots[0].remainingQuantity).toBe(0); // Fully depleted
      expect(lots[1].remainingQuantity).toBe(0); // Fully depleted  
      expect(lots[2].remainingQuantity).toBe(60); // 80 - 20 = 60

      const finalValue = await inventoryService.getCurrentInventoryValue(product.id);
      expect(finalValue.value).toBeCloseTo(360.0, 2); // 60 × $6.00
    });
  });

  describe('Multiple Products - Independent FIFO', () => {
    it('should handle FIFO independently for each product', async () => {
      // Product A
      const setupA = await TestFactory.createCompleteProductSetup('Product A');
      
      await TestFactory.createPurchaseLot({
        productId: setupA.product.id,
        supplierId: setupA.supplier.id,
        quantity: 100,
        unitCost: 1.0,
        purchaseDate: new Date('2022-01-01'),
      });

      // Product B
      const setupB = await TestFactory.createCompleteProductSetup('Product B');
      
      await TestFactory.createPurchaseLot({
        productId: setupB.product.id,
        supplierId: setupB.supplier.id,
        quantity: 200,
        unitCost: 2.0,
        purchaseDate: new Date('2022-01-01'),
      });

      // Consume from both products
      await inventoryService.consumeInventoryFIFO(setupA.product.id, 80);
      await inventoryService.consumeInventoryFIFO(setupB.product.id, 150);

      // Verify independent values
      const valueA = await inventoryService.getCurrentInventoryValue(setupA.product.id);
      const valueB = await inventoryService.getCurrentInventoryValue(setupB.product.id);

      expect(valueA.value).toBeCloseTo(80.0, 2); // 80 × $1.00
      expect(valueB.value).toBeCloseTo(300.0, 2); // 150 × $2.00
    });
  });

  describe('Year Boundary Edge Cases', () => {
    it('should respect exact dates for FIFO ordering (Dec 31 vs Jan 1)', async () => {
      const { product } = await TestFactory.createCompleteProductSetup('Boundary Test');

      // Purchase on Dec 31, 2022
      const purchase1 = await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 1.0,
        purchaseDate: new Date('2022-12-31'),
      });

      // Purchase on Jan 1, 2023
      const purchase2 = await TestFactory.createPurchaseLot({
        productId: product.id,
        supplierId: product.supplierId,
        quantity: 50,
        unitCost: 1.1,
        purchaseDate: new Date('2023-01-01'),
      });

      // Consume 60 units - should take all from Dec 31 and 10 from Jan 1
      await inventoryService.consumeInventoryFIFO(product.id, 60);

      const lots = await testPrisma.purchaseLot.findMany({
        where: { productId: product.id },
        orderBy: { purchaseDate: 'asc' },
      });

      expect(lots[0].id).toBe(purchase1.id);
      expect(lots[0].remainingQuantity).toBe(10); // Dec 31 lot: 40 consumed
      
      expect(lots[1].id).toBe(purchase2.id);
      expect(lots[1].remainingQuantity).toBe(50); // Jan 1 lot: 0 consumed (FIFO maintained)

      const value = await inventoryService.getCurrentInventoryValue(product.id);
      // (10 × $1.00) + (50 × $1.10) = $10 + $55 = $65
      expect(value.value).toBeCloseTo(65.0, 2);
    });
  });
});
