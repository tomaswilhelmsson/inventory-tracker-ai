# Spec: Test Infrastructure

## ADDED Requirements

### Requirement: Test Framework Configuration
**ID**: `TEST-INFRA-001`  
**Priority**: High  
**Category**: Infrastructure

The system SHALL provide a Jest-based testing framework configured for TypeScript with the following characteristics:
- In-memory SQLite database for test isolation
- Global setup and teardown hooks
- Coverage reporting with minimum 80% threshold for critical services
- Test execution under 30 seconds for the complete suite

#### Scenario: Developer runs test suite
**Given** the developer has installed test dependencies  
**When** they execute `npm run test:backend`  
**Then** all tests run using in-memory SQLite database  
**And** tests complete in under 30 seconds  
**And** coverage report is generated showing percentages per file  
**And** tests pass with no shared state between test cases

#### Scenario: Test database isolation
**Given** a test modifies database state  
**When** the next test runs  
**Then** the database is clean with no residual data  
**And** foreign key constraints are enabled  
**And** all tables are empty except for test-specific setup

---

### Requirement: Test Data Factories
**ID**: `TEST-INFRA-002`  
**Priority**: High  
**Category**: Test Utilities

The system SHALL provide factory functions for creating test data with realistic defaults and optional overrides for:
- Users (with hashed passwords)
- Suppliers (with contact information)
- Units (with unique names)
- Products (with supplier and unit relationships)
- Purchase lots (with snapshots and FIFO-relevant fields)

#### Scenario: Creating test product with minimal setup
**Given** a developer needs a product for testing  
**When** they call `TestFactory.createProduct('Bolt', supplierId, unitId)`  
**Then** a product is created with name 'Bolt'  
**And** the product has a supplier relationship  
**And** the product has a unit relationship  
**And** the product has a default description

#### Scenario: Creating purchase lot with snapshots
**Given** a developer needs a purchase lot for FIFO testing  
**When** they call `TestFactory.createPurchaseLot({ productId, quantity: 10, unitCost: 1.5, purchaseDate })`  
**Then** a purchase lot is created with quantity 10  
**And** remainingQuantity equals quantity (10)  
**And** productSnapshot JSON is populated with product details  
**And** supplierSnapshot JSON is populated with supplier details  
**And** year is extracted from purchaseDate

---

### Requirement: Test Isolation
**ID**: `TEST-INFRA-003`  
**Priority**: Critical  
**Category**: Test Quality

Each test case SHALL execute in complete isolation with no shared state:
- Database is cleaned before each test
- No global variables persist between tests
- Each test can create its own data without conflicts
- Tests can run in parallel without interference

#### Scenario: Parallel test execution
**Given** two tests create products with the same name  
**When** tests run in parallel  
**Then** both tests succeed without conflicts  
**And** each test sees only its own product  
**And** database state is isolated between tests

---

### Requirement: Coverage Reporting
**ID**: `TEST-INFRA-004`  
**Priority**: Medium  
**Category**: Quality Assurance

The system SHALL generate test coverage reports with:
- Line coverage percentage
- Branch coverage percentage
- Function coverage percentage
- Minimum threshold enforcement (80% for critical services)
- HTML report for detailed coverage visualization

#### Scenario: Coverage threshold enforcement
**Given** critical services have less than 80% test coverage  
**When** the developer runs the test suite  
**Then** the test command exits with failure  
**And** a coverage report identifies uncovered lines  
**And** the developer can see which functions lack tests

#### Scenario: Coverage report generation
**Given** all tests pass  
**When** the developer runs `npm run test:coverage`  
**Then** an HTML coverage report is generated in `coverage/` directory  
**And** the report shows per-file coverage percentages  
**And** uncovered lines are highlighted in red  
**And** covered lines are highlighted in green

---

## MODIFIED Requirements

None (new capability)

---

## REMOVED Requirements

None
