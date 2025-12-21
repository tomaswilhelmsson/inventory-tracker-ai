# Database Seeding

## ADDED Requirements

### Requirement: Comprehensive Multi-Year Test Data
The seed script SHALL generate comprehensive test data spanning multiple years to support development, testing, and demonstration of the complete inventory lifecycle.

#### Scenario: Multi-year purchase history
- **WHEN** the seed script is executed
- **THEN** the system creates purchase lots for years 2022, 2023, 2024, and 2025 with realistic quantities, costs, and FIFO consumption patterns

#### Scenario: Diverse suppliers and products
- **WHEN** the seed script is executed
- **THEN** the system creates at least 8 suppliers and 18 products across diverse categories and units to demonstrate varied inventory scenarios

#### Scenario: Year-end count history
- **WHEN** the seed script is executed
- **THEN** the system creates confirmed year-end counts for years 2022, 2023, and 2024 with realistic variances and FIFO value calculations

### Requirement: Locked Year Demonstration
The seed script SHALL create locked year records to demonstrate year-end count confirmation and data immutability.

#### Scenario: Multiple locked years
- **WHEN** the seed script is executed
- **THEN** the system creates locked year records for 2022, 2023, and 2024 matching their confirmed year-end counts

#### Scenario: Unlockable year state
- **WHEN** the seed script is executed
- **THEN** the system ensures the most recent locked year (2024) can be unlocked for testing unlock workflows

### Requirement: Year Unlock Audit Trail Demonstration
The seed script SHALL create unlock audit records to demonstrate the year unlock and revision workflow.

#### Scenario: Unlock audit record
- **WHEN** the seed script is executed
- **THEN** the system creates at least one YearUnlockAudit record showing a realistic correction scenario with reason category and description

#### Scenario: Multiple count revisions
- **WHEN** the seed script is executed
- **THEN** the system creates year 2023 with both revision 1 (original) and revision 2 (recount) to demonstrate unlock/recount workflow

### Requirement: Count Reminder Trigger
The seed script SHALL create data conditions that trigger the year-end count reminder banner.

#### Scenario: Pending year data
- **WHEN** the seed script is executed
- **THEN** the system creates purchase lots for year 2025 without a corresponding year-end count to trigger the reminder banner

#### Scenario: Reminder validation
- **WHEN** the application loads with seeded data
- **THEN** the count reminder banner displays for year 2025 on the dashboard

### Requirement: FIFO Accuracy
The seed script SHALL ensure all purchase lot remaining quantities accurately reflect FIFO consumption through year-end counts.

#### Scenario: FIFO consumption calculation
- **WHEN** the seed script generates purchase lots
- **THEN** remaining quantities are calculated using FIFO order based on all confirmed year-end counts

#### Scenario: Verifiable FIFO logic
- **WHEN** reviewing seed data for a product
- **THEN** the remaining quantities for older lots are consumed before newer lots, following strict chronological FIFO order

### Requirement: Data Snapshots
The seed script SHALL include complete product and supplier snapshots for all purchase lots to ensure historical data integrity.

#### Scenario: Product snapshot inclusion
- **WHEN** creating a purchase lot
- **THEN** the system includes a productSnapshot JSON containing product details (id, name, description, unit) at time of purchase

#### Scenario: Supplier snapshot inclusion
- **WHEN** creating a purchase lot
- **THEN** the system includes a supplierSnapshot JSON containing supplier details (id, name, contact information) at time of purchase

### Requirement: Realistic Test Scenarios
The seed script SHALL generate data patterns that represent real-world inventory management scenarios.

#### Scenario: Variance diversity
- **WHEN** creating year-end count items
- **THEN** the system includes a mix of exact matches (40%), small variances (50%), and large variances (10%) to simulate real counting outcomes

#### Scenario: Cost progression
- **WHEN** creating multi-year purchase lots
- **THEN** unit costs increase year-over-year (2023: +5%, 2024: +7%, 2025: +3%) to simulate inflation and market changes

#### Scenario: Seasonal purchase patterns
- **WHEN** generating purchase lots within a year
- **THEN** purchases are distributed across all quarters with realistic date patterns

### Requirement: Seed Script Execution
The seed script SHALL provide clear feedback and handle errors gracefully during execution.

#### Scenario: Progress logging
- **WHEN** the seed script executes
- **THEN** the system logs progress for each major data section (suppliers, products, purchases, counts, locks)

#### Scenario: Idempotent execution
- **WHEN** the seed script is run multiple times
- **THEN** the system uses upsert operations to avoid duplicate data and can safely re-run

#### Scenario: Error handling
- **WHEN** seed script encounters an error
- **THEN** the system logs the error details and exits with non-zero status code
