# Design: Comprehensive Testing Infrastructure

## Architecture Overview

### Testing Layers
```
┌─────────────────────────────────────────────────────────┐
│                    E2E Tests                            │
│  Multi-year scenarios, complete workflows              │
│  (Purchases → Year-End Counts → FIFO validation)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Integration Tests                          │
│  API endpoints + Database operations                    │
│  (POST /purchases, POST /year-end-count/confirm)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Unit Tests                             │
│  Pure functions, FIFO calculations                      │
│  (consumeInventoryFIFO, calculateVariances)            │
└─────────────────────────────────────────────────────────┘
```

## Test Database Strategy

### Approach: In-Memory SQLite with Prisma
```typescript
// Before each test
await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
await prisma.$executeRawUnsafe('DELETE FROM ...');
await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

// Run test with clean state

// After test (optional cleanup)
```

**Rationale**:
- ✅ Fast test execution (in-memory)
- ✅ Perfect isolation (each test gets clean DB)
- ✅ No test interference
- ✅ Same ORM (Prisma) as production
- ❌ Doesn't test MariaDB-specific features (acceptable trade-off)

### Alternative Considered: Shared Test Database
- ❌ Risk of test interference
- ❌ Harder to parallelize
- ❌ Requires careful cleanup

## FIFO Calculation Testing

### Core Function Under Test
`inventoryService.consumeInventoryFIFO(productId, targetQuantity)`

### Test Categories

#### 1. Single-Lot Scenarios
```javascript
describe('consumeInventoryFIFO - Single Lot', () => {
  test('exact consumption depletes lot to zero')
  test('partial consumption leaves correct remainder')
  test('no consumption leaves lot unchanged')
})
```

#### 2. Multi-Lot Scenarios
```javascript
describe('consumeInventoryFIFO - Multi Lot', () => {
  test('consumes oldest lot first')
  test('spans multiple lots when quantity exceeds first lot')
  test('leaves newest lots untouched when target met')
})
```

#### 3. Edge Cases
```javascript
describe('consumeInventoryFIFO - Edge Cases', () => {
  test('handles zero target quantity')
  test('handles target exceeding total available')
  test('handles empty inventory (no lots)')
  test('rejects negative target quantity')
})
```

#### 4. Multi-Year Scenarios (User Requirement)
```javascript
describe('consumeInventoryFIFO - Multi-Year', () => {
  test('bolt scenario: 2022 purchase → 2024 consumption', async () => {
    // Setup
    const product = await createProduct('10mm Bolt');
    
    // 2022: Purchase 10 @ $1
    await createPurchase({ product, quantity: 10, unitCost: 1.0, date: '2022-01-15' });
    
    // Year-end 2022: Use 2, leaving 8
    await consumeInventoryFIFO(product.id, 8);
    expect(await getRemainingQuantity(product.id)).toBe(8);
    expect(await getInventoryValue(product.id)).toBe(8.0);
    
    // 2023: Purchase 5 @ $1.50
    await createPurchase({ product, quantity: 5, unitCost: 1.5, date: '2023-01-20' });
    
    // Year-end 2023: Use 2 more, leaving 11
    await consumeInventoryFIFO(product.id, 11);
    expect(await getRemainingQuantity(product.id)).toBe(11);
    expect(await getInventoryValue(product.id)).toBeCloseTo(13.5);
    
    // Year-end 2024: Use 10, leaving 1
    await consumeInventoryFIFO(product.id, 1);
    
    // Verify lot states
    const lots = await getPurchaseLots(product.id);
    expect(lots[0].remainingQuantity).toBe(0); // 2022 lot fully consumed
    expect(lots[1].remainingQuantity).toBe(1); // 2023 lot has 1 left
    expect(await getInventoryValue(product.id)).toBeCloseTo(1.5);
  });
})
```

## Year-End Count Testing

### Workflow Under Test
```
POST /year-end-count { year: 2024 }
  → Initiates count
  → Creates count items with expectedQuantity

PUT /year-end-count/:id/items/:productId { countedQuantity: X }
  → Updates count
  → Calculates variance and FIFO value

POST /year-end-count/:id/confirm
  → Updates lot quantities via consumeInventoryFIFO
  → Locks year
  → Creates backup (mocked)
```

### Integration Test Structure
```javascript
describe('Year-End Count API', () => {
  describe('POST /year-end-count', () => {
    test('creates count with expected quantities from current inventory')
    test('rejects count for locked year')
    test('allows multiple revisions after unlock')
  })
  
  describe('PUT /year-end-count/:id/items/:productId', () => {
    test('updates counted quantity and calculates variance')
    test('calculates FIFO value correctly')
    test('rejects updates to confirmed count')
  })
  
  describe('POST /year-end-count/:id/confirm', () => {
    test('updates lot quantities using FIFO')
    test('locks year after confirmation')
    test('rejects incomplete counts')
    test('creates immutable count record')
  })
})
```

## Test Data Factories

### Purpose
Simplify test setup by providing reusable data creation functions.

### Factory Functions
```typescript
// Test utilities
export const TestFactory = {
  async createUser(overrides?: Partial<User>) {
    return prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash: await bcrypt.hash('test123', 10),
        ...overrides,
      },
    });
  },

  async createSupplier(overrides?: Partial<Supplier>) {
    return prisma.supplier.create({
      data: {
        name: `Supplier-${Date.now()}`,
        contactPerson: 'Test Contact',
        ...overrides,
      },
    });
  },

  async createUnit(name: string = 'pieces') {
    return prisma.unit.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  },

  async createProduct(name: string, supplierId: number, unitId: number) {
    return prisma.product.create({
      data: {
        name,
        supplierId,
        unitId,
        description: 'Test product',
      },
    });
  },

  async createPurchaseLot(data: {
    productId: number;
    supplierId: number;
    quantity: number;
    unitCost: number;
    purchaseDate: Date;
  }) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { supplier: true, unit: true },
    });

    return prisma.purchaseLot.create({
      data: {
        ...data,
        year: data.purchaseDate.getFullYear(),
        remainingQuantity: data.quantity,
        productSnapshot: JSON.stringify({
          id: product!.id,
          name: product!.name,
          unit: { id: product!.unit.id, name: product!.unit.name },
        }),
        supplierSnapshot: JSON.stringify({
          id: product!.supplier.id,
          name: product!.supplier.name,
        }),
      },
    });
  },
};
```

## Test Organization

### Directory Structure
```
backend/
  src/
    services/
      inventoryService.ts
      inventoryService.test.ts        ← Unit tests
      yearEndCountService.ts
      yearEndCountService.test.ts     ← Unit tests
  tests/
    setup.ts                          ← Global test setup
    factories.ts                      ← Test data factories
    integration/
      purchases.test.ts               ← API tests
      yearEndCount.test.ts            ← API tests
    e2e/
      multiYearFIFO.test.ts          ← Complete scenarios
```

## Jest Configuration

### Key Settings
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/routes/**/*.ts',
    '!src/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
```

### Setup File Pattern
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file::memory:?cache=shared', // In-memory SQLite
    },
  },
});

beforeAll(async () => {
  // Run migrations on test database
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
});

beforeEach(async () => {
  // Clean database before each test
  const tables = ['users', 'year_unlock_audits', 'locked_years', 
                 'year_end_count_items', 'year_end_counts', 
                 'purchase_lots', 'products', 'suppliers', 'units'];
  
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
  }
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## Trade-offs and Decisions

### Decision: In-Memory SQLite vs. Real Database
- **Chosen**: In-memory SQLite
- **Rationale**: Speed and isolation outweigh MariaDB-specific testing needs
- **Trade-off**: Won't catch MariaDB-specific issues (acceptable for FIFO logic tests)

### Decision: Jest vs. Vitest for Backend
- **Chosen**: Jest
- **Rationale**: Industry standard, better TypeScript support, rich ecosystem
- **Trade-off**: Separate from Vite (but backend doesn't use Vite anyway)

### Decision: Mocking vs. Real GCS for Backup Tests
- **Chosen**: Mock GCS interactions
- **Rationale**: Don't want tests depending on external services or credentials
- **Trade-off**: Won't catch GCS-specific issues (acceptable, focus is FIFO logic)

### Decision: Test Coverage Target (80%)
- **Chosen**: 80% for critical services
- **Rationale**: High enough to catch most bugs, realistic to achieve and maintain
- **Trade-off**: 100% coverage unrealistic for first implementation

## Performance Considerations

### Expected Test Execution Time
- Unit tests (FIFO calculations): ~5 seconds (fast, no DB)
- Integration tests (APIs): ~10 seconds (in-memory DB)
- E2E tests (multi-year): ~15 seconds (full workflows)
- **Total**: <30 seconds

### Parallelization Strategy
Jest runs tests in parallel by default. Since each test uses an in-memory database, there's no shared state to worry about.

## Validation Strategy

### How to Verify Tests Work
1. **Write failing test first** (TDD approach)
2. **Run test, confirm failure**
3. **Fix code**
4. **Run test, confirm pass**
5. **Run all tests, confirm no regression**

### Mutation Testing (Future)
Consider adding Stryker.js to verify test quality by introducing intentional bugs and ensuring tests catch them.

## CI/CD Integration (Future)

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:backend
      - run: npm run test:coverage
```

This is out of scope for the initial implementation but the test infrastructure will be CI-ready.
