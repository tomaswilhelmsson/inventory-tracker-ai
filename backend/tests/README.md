# Testing Guide

## Overview

This directory contains comprehensive automated tests for the inventory tracking system, with a focus on FIFO (First-In-First-Out) calculation accuracy and year-end count workflows.

## Running Tests

```bash
# Run all backend tests
npm run test:backend

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only  
npm run test:e2e          # End-to-end tests only
```

## Test Structure

```
backend/
  src/
    services/
      inventoryService.test.ts        # Unit tests for FIFO calculations
  tests/
    setup.ts                          # Global test setup and database config
    factories.ts                      # Test data factories
    integration/                      # API integration tests (future)
    e2e/
      multiYearFIFO.test.ts          # Multi-year FIFO scenarios
```

## Test Infrastructure

### In-Memory Database

Tests use an in-memory SQLite database for complete isolation:
- Each test gets a clean database state
- No interference between tests
- Fast execution (<5 seconds for full suite)
- No production data affected

### Test Data Factories

Use `TestFactory` helpers to create test data easily:

```typescript
import { TestFactory } from '../tests/factories';

// Create a complete product setup (supplier + unit + product)
const { supplier, unit, product } = await TestFactory.createCompleteProductSetup('10mm Bolt');

// Create a purchase lot
await TestFactory.createPurchaseLot({
  productId: product.id,
  supplierId: supplier.id,
  quantity: 100,
  unitCost: 1.50,
  purchaseDate: new Date('2023-01-15'),
});
```

### Dependency Injection

Services use dependency injection to allow testing with the test database:

```typescript
import { createInventoryService } from '../../src/services/inventoryService';
import { testPrisma } from '../setup';

// Create service with test database
const inventoryService = createInventoryService(testPrisma);

// Use in tests
await inventoryService.consumeInventoryFIFO(productId, targetQuantity);
```

## Key Test Scenarios

### FIFO Calculation Tests

Located in: `backend/src/services/inventoryService.test.ts`

- **Single-lot scenarios**: Partial consumption, zero consumption
- **Multi-lot FIFO ordering**: Validates oldest lots consumed first
- **Edge cases**: Negative quantities, empty inventory, exceeding total
- **Value calculations**: FIFO cost accounting with multiple unit costs

### Multi-Year FIFO E2E Tests

Located in: `backend/tests/e2e/multiYearFIFO.test.ts`

#### User-Specified Bolt Scenario (CRITICAL)

Validates the exact user requirement across three years:

**2022**: Purchase 10 bolts @ $1.00, use 2 → 8 remaining @ $8.00  
**2023**: Purchase 5 bolts @ $1.50, use 2 more → 11 remaining @ $13.50  
**2024**: Use 10 bolts → 1 remaining @ $1.50

**Assertions**:
- Purchase 1 (2022): 0 remaining (fully consumed)
- Purchase 2 (2023): 1 remaining
- FIFO ordering validated (oldest lot depleted first)

#### Other E2E Scenarios

- Three-year inventory cycle with carry-forward
- Multiple products with independent FIFO
- Year boundary edge cases (Dec 31 vs Jan 1)

## Writing New Tests

### Basic Test Structure

```typescript
import { testPrisma } from '../setup';
import { TestFactory } from '../factories';
import { createInventoryService } from '../../src/services/inventoryService';

const inventoryService = createInventoryService(testPrisma);

describe('My Test Suite', () => {
  it('should do something', async () => {
    // Arrange: Create test data
    const { product } = await TestFactory.createCompleteProductSetup('Test Product');
    
    await TestFactory.createPurchaseLot({
      productId: product.id,
      supplierId: product.supplierId,
      quantity: 100,
      unitCost: 1.0,
      purchaseDate: new Date('2023-01-01'),
    });

    // Act: Perform operation
    await inventoryService.consumeInventoryFIFO(product.id, 50);

    // Assert: Verify results
    const lots = await testPrisma.purchaseLot.findMany({
      where: { productId: product.id },
    });
    
    expect(lots[0].remainingQuantity).toBe(50);
  });
});
```

### Best Practices

1. **Use descriptive test names**: Explain what scenario is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Keep tests focused**: One assertion concept per test
4. **Use factories**: Don't manually create database records
5. **Test edge cases**: Negative values, empty data, boundary conditions
6. **Add comments**: Explain complex FIFO scenarios with calculations

## Understanding FIFO Logic

The `consumeInventoryFIFO` function uses a **target quantity** approach:

- **targetQuantity**: The FINAL quantity that should remain (not amount to consume)
- **Allocation**: Remaining inventory is allocated to NEWEST lots first
- **Result**: OLDEST lots are consumed first (FIFO principle)

**Example**:
- Lots: [100 (2022), 200 (2023), 300 (2024)] = 600 total
- Target: 250 remaining
- Result:
  - Lot 1 (2022): 0 remaining (fully consumed)
  - Lot 2 (2023): 0 remaining (fully consumed)
  - Lot 3 (2024): 250 remaining (inventory sits here)

## Coverage Goals

- **Critical services**: >80% coverage (inventoryService, yearEndCountService)
- **Routes**: >70% coverage
- **Overall**: Configured thresholds enforce minimum coverage

Check coverage:
```bash
npm run test:coverage
```

View HTML report:
```bash
open coverage/lcov-report/index.html
```

## Troubleshooting

### Tests Failing with "Foreign key constraint violated"

Ensure you're creating test data in the correct order:
1. Create unit
2. Create supplier
3. Create product (requires supplier + unit)
4. Create purchase lot (requires product + supplier)

### Tests Passing Locally but Failing in CI

- Check Node.js version compatibility (requires Node 18+)
- Ensure all dependencies are installed (`npm ci`)
- Verify environment variables aren't being used in tests

### Slow Test Execution

- Tests should complete in <30 seconds
- If slower, check for:
  - Actual HTTP requests instead of mocked calls
  - Missing `await` keywords causing test overlap
  - Expensive database operations in loops

## Future Enhancements

- [ ] Integration tests for API endpoints
- [ ] Year-end count service unit tests
- [ ] Purchase service tests
- [ ] Data integrity validation tests
- [ ] Performance benchmarks
- [ ] Mutation testing with Stryker

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [FIFO Implementation](../src/services/inventoryService.ts)
