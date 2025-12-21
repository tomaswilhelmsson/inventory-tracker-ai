# Implementation Tasks

## 1. Test Infrastructure Setup

- [x] 1.1 Install testing dependencies
  - jest, @types/jest, ts-jest
  - supertest, @types/supertest
  - Add to package.json devDependencies
- [x] 1.2 Create Jest configuration file (jest.config.js)
  - Set preset to ts-jest
  - Configure test environment as node
  - Set test match patterns for *.test.ts files
  - Configure coverage collection for services/
  - Set coverage thresholds (80% for critical services)
- [x] 1.3 Create test setup file (backend/tests/setup.ts)
  - Initialize Prisma client with in-memory SQLite
  - Implement beforeEach hook for database cleanup
  - Implement afterAll hook for Prisma disconnect
  - Enable foreign key constraints
- [x] 1.4 Add npm scripts to package.json
  - `test:backend`: Run all backend tests
  - `test:watch`: Run tests in watch mode
  - `test:coverage`: Run tests with coverage report
  - `test:unit`: Run only unit tests
  - `test:integration`: Run only integration tests
  - `test:e2e`: Run only E2E tests
- [x] 1.5 Create .gitignore entries
  - coverage/
  - *.test.db
  - test-results/

## 2. Test Data Factories

- [x] 2.1 Create factory utilities file (backend/tests/factories.ts)
  - Export TestFactory namespace
  - Document factory usage with JSDoc comments
- [x] 2.2 Implement user factory
  - createUser(overrides?: Partial<User>)
  - Generate hashed passwords with bcrypt
  - Return created user with id
- [x] 2.3 Implement supplier factory
  - createSupplier(overrides?: Partial<Supplier>)
  - Generate unique names with timestamps
  - Include contact information
- [x] 2.4 Implement unit factory
  - createUnit(name: string)
  - Use upsert to avoid duplicates
  - Return unit with id
- [x] 2.5 Implement product factory
  - createProduct(name, supplierId, unitId)
  - Include default description
  - Return product with relationships
- [x] 2.6 Implement purchase lot factory
  - createPurchaseLot({ productId, quantity, unitCost, purchaseDate, supplierId })
  - Generate productSnapshot JSON
  - Generate supplierSnapshot JSON
  - Calculate year from purchaseDate
  - Set remainingQuantity = quantity initially
  - Return created lot with all fields

## 3. FIFO Calculation Unit Tests

- [x] 3.1 Create test file (backend/src/services/inventoryService.test.ts)
  - Import test utilities and factories
  - Set up test database for each test
- [x] 3.2 Single-lot FIFO tests
  - Test exact consumption (target = quantity)
  - Test partial consumption (target < quantity)
  - Test zero consumption (target = 0)
  - Test over-consumption (target > total available)
- [x] 3.3 Multi-lot FIFO ordering tests
  - Test oldest lot consumed first
  - Test consumption spanning multiple lots
  - Test newest lots remain when target met early
  - Verify remainingQuantity values for each lot
- [x] 3.4 Edge case tests
  - Test negative target quantity (expect error)
  - Test empty inventory (no lots)
  - Test target exceeding total inventory
  - Test lots with zero remainingQuantity
- [x] 3.5 FIFO value calculation tests
  - Test single-lot value calculation
  - Test multi-lot value with different unit costs
  - Test partial lot consumption value
  - Verify value accuracy within $0.01

## 4. Year-End Count Service Unit Tests

- [ ] 4.1 Create test file (backend/src/services/yearEndCountService.test.ts)
  - Import test utilities and factories
  - Set up test scenarios with products and lots
- [ ] 4.2 Count initiation tests
  - Test creating count with expected quantities
  - Test expected quantity calculation from lots
  - Test draft status on creation
  - Test null countedQuantity on new items
- [ ] 4.3 Count update tests
  - Test updating countedQuantity
  - Test variance calculation (expected - counted)
  - Test FIFO value calculation on update
  - Test rejecting updates to confirmed counts
- [ ] 4.4 Variance calculation tests
  - Test exact match (variance = 0)
  - Test surplus (variance > 0)
  - Test shortage (variance < 0)
  - Test aggregate variance across multiple products
- [ ] 4.5 Count confirmation tests (unit level)
  - Test status change to "confirmed"
  - Test confirmedAt timestamp set
  - Test rejection of incomplete counts
  - Mock consumeInventoryFIFO for isolation

## 5. Year-End Count API Integration Tests

- [ ] 5.1 Create test file (backend/tests/integration/yearEndCount.test.ts)
  - Set up Express app with routes
  - Use supertest for HTTP requests
  - Authenticate requests with test JWT token
- [ ] 5.2 POST /api/year-end-count tests
  - Test successful count creation
  - Test rejection for locked year
  - Test multiple revisions after unlock
  - Verify response structure and status codes
- [ ] 5.3 PUT /api/year-end-count/:id/items/:productId tests
  - Test updating counted quantity
  - Test variance and value in response
  - Test rejection for confirmed count
  - Test validation errors for invalid data
- [ ] 5.4 POST /api/year-end-count/:id/confirm tests
  - Test successful confirmation
  - Test lot quantity updates via FIFO
  - Test year locking after confirmation
  - Test rejection of incomplete counts
  - Mock backup creation (don't actually create backups)
- [ ] 5.5 Year unlock API tests
  - Test POST /api/year-end-count/:year/unlock
  - Test rejection of non-recent year unlock
  - Test unlock audit record creation
  - Test GET /api/year-end-count/:year/unlock-history
- [ ] 5.6 Revision API tests
  - Test GET /api/year-end-count/:year/revisions
  - Test GET /api/year-end-count/:year?revision=X
  - Test creating new revision after unlock

## 6. Purchase API Integration Tests

- [ ] 6.1 Create test file (backend/tests/integration/purchases.test.ts)
  - Set up test products and suppliers
  - Test authenticated requests
- [ ] 6.2 POST /api/purchases tests
  - Test successful purchase creation
  - Test lot creation with snapshots
  - Test remainingQuantity initialization
  - Test validation errors
- [ ] 6.3 GET /api/purchases tests
  - Test listing all purchases
  - Test filtering by year
  - Test filtering by product
  - Test FIFO ordering in response
- [ ] 6.4 DELETE /api/purchases/:id tests
  - Test successful deletion (full remainingQuantity only)
  - Test rejection for partially consumed lots
  - Test rejection for locked year purchases

## 7. Multi-Year FIFO E2E Tests

- [x] 7.1 Create test file (backend/tests/e2e/multiYearFIFO.test.ts)
  - Set up complete test environment
  - Use real API calls (no mocking)
- [x] 7.2 User-specified bolt scenario test
  - Create "10mm Bolt" product
  - Execute 2022 operations (purchase 10 @ $1, count 8 remaining)
  - Verify Purchase 1 remainingQuantity: 8, value: $8.00
  - Execute 2023 operations (purchase 5 @ $1.50, count 11 remaining)
  - Verify Purchase 1: 6, Purchase 2: 5, value: $13.50
  - Execute 2024 operations (count 1 remaining)
  - Verify Purchase 1: 0 (CRITICAL), Purchase 2: 1, value: $1.50
  - Assert FIFO ordering validated
  - Assert all years locked
- [x] 7.3 Three-year inventory cycle test
  - Test cross-year inventory carry-forward
  - Test multiple purchases per year
  - Test progressive lot depletion
  - Verify inventory values at each year-end
- [x] 7.4 Multiple products multi-year test
  - Test independent FIFO per product
  - Test different consumption patterns
  - Verify no cross-product interference
- [x] 7.5 Year boundary edge case test
  - Test Dec 31 vs Jan 1 purchases
  - Test FIFO ordering by exact date
  - Verify correct year assignment

## 8. Data Integrity Tests

- [ ] 8.1 Create test file (backend/tests/e2e/dataIntegrity.test.ts)
  - Test invariants across operations
- [ ] 8.2 Inventory consistency tests
  - Test sum(remainingQuantity) = total inventory
  - Test FIFO value matches expected
  - Test no negative remainingQuantity
  - Test remainingQuantity ≤ original quantity
- [ ] 8.3 Locked year immutability tests
  - Test cannot modify lots in locked year
  - Test cannot delete purchases in locked year
  - Test year-end count records immutable
  - Test unlock only affects most recent year
- [ ] 8.4 Revision tracking tests
  - Test revision increments correctly
  - Test each revision is independent
  - Test historical revisions remain unchanged

## 9. Verification and Testing

- [ ] 9.1 Run all tests and verify 100% pass rate
  - Fix any failing tests
  - Verify no console errors or warnings
- [ ] 9.2 Check test coverage
  - Run npm run test:coverage
  - Verify >80% coverage for inventoryService.ts
  - Verify >80% coverage for yearEndCountService.ts
  - Verify >70% coverage for routes
- [ ] 9.3 Verify test execution time
  - Ensure total test suite completes in <30 seconds
  - Identify and optimize slow tests if needed
- [ ] 9.4 Test isolation verification
  - Run tests in random order (--runInBand --randomize)
  - Verify no test failures due to order
  - Verify no shared state between tests
- [ ] 9.5 Edge case validation
  - Manually review edge case coverage
  - Add any missing edge case tests
  - Verify error handling paths are tested

## 10. Documentation

- [x] 10.1 Create testing guide (backend/tests/README.md)
  - How to run tests (npm commands)
  - How to write new tests
  - How to use test factories
  - Testing best practices
  - Troubleshooting common issues
- [x] 10.2 Add JSDoc comments to test utilities
  - Document factory functions
  - Document test helpers
  - Include usage examples
- [x] 10.3 Update main README.md
  - Add "Testing" section
  - Document test commands
  - Mention coverage thresholds
  - Link to testing guide
- [x] 10.4 Add inline comments to complex tests
  - Explain multi-year scenarios
  - Document FIFO calculation expectations
  - Clarify assertion purposes

## Dependencies

- Tasks 1.x (infrastructure) must be completed before all other tasks
- Tasks 2.x (factories) must be completed before 3.x-8.x (tests)
- Tasks 3.x-8.x (tests) can be done in parallel after 1.x and 2.x
- Task 9.x (verification) must be completed after all tests are written
- Task 10.x (documentation) can be done in parallel with implementation

## Parallel Work Opportunities

- FIFO unit tests (3.x) can be written in parallel with YEC unit tests (4.x)
- Integration tests (5.x, 6.x) can be written in parallel once infrastructure is ready
- E2E tests (7.x, 8.x) can be written in parallel once infrastructure is ready
- Documentation (10.x) can be written alongside implementation

## Timeline Estimate

- Infrastructure setup (1.x, 2.x): 4-6 hours
- Unit tests (3.x, 4.x): 6-8 hours
- Integration tests (5.x, 6.x): 8-10 hours
- E2E tests (7.x, 8.x): 6-8 hours
- Verification (9.x): 2-3 hours
- Documentation (10.x): 2 hours
- **Total**: 28-37 hours
