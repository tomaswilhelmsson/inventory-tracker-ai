# Database Integrity and Performance

## ADDED Requirements

### Requirement: Atomic Year-End Count Confirmation
The system SHALL execute year-end count confirmation as an atomic transaction to prevent partial updates and data corruption.

#### Scenario: Successful year-end count confirmation
- **WHEN** a year-end count is confirmed with all products counted
- **THEN** all FIFO inventory consumption updates SHALL be applied
- **AND** the year SHALL be locked
- **AND** the count status SHALL be updated to "confirmed"
- **AND** all operations SHALL succeed or fail together (atomicity)

#### Scenario: Year-end count confirmation failure during FIFO update
- **WHEN** a year-end count confirmation is attempted
- **AND** an error occurs during FIFO inventory consumption
- **THEN** no inventory lots SHALL be modified
- **AND** the year SHALL NOT be locked
- **AND** the count status SHALL remain "draft"
- **AND** appropriate error SHALL be returned

#### Scenario: Year-end count confirmation failure during year locking
- **WHEN** a year-end count confirmation is attempted
- **AND** FIFO updates succeed but year locking fails
- **THEN** all changes SHALL be rolled back
- **AND** no inventory lots SHALL remain modified
- **AND** the count status SHALL remain "draft"

### Requirement: Database Query Performance Indexes
The system SHALL maintain database indexes on frequently queried fields to ensure performant queries as data grows.

#### Scenario: Product queries filtered by supplier
- **WHEN** products are queried with supplierId filter
- **THEN** the database SHALL use an index on Product.supplierId
- **AND** query time SHALL be optimized

#### Scenario: Product queries filtered by unit
- **WHEN** products are queried with unitId filter
- **THEN** the database SHALL use an index on Product.unitId
- **AND** query time SHALL be optimized

#### Scenario: Year-end count queries by year
- **WHEN** year-end counts are queried by year
- **THEN** the database SHALL use an index on YearEndCount.year
- **AND** query time SHALL be optimized

#### Scenario: Year-end count queries by status
- **WHEN** year-end counts are filtered by status (e.g., finding draft counts)
- **THEN** the database SHALL use an index on YearEndCount.status
- **AND** query time SHALL be optimized

### Requirement: Optimized Report Generation
The system SHALL optimize report generation to avoid N+1 query problems when fetching related data.

#### Scenario: Year-end report with lot breakdown
- **WHEN** generating a year-end report with lot details for 100 products
- **THEN** the system SHALL fetch all required purchase lots in a single batch query
- **AND** group the lots by product in application memory
- **AND** NOT execute one query per product (N+1 pattern)
- **AND** total database queries SHALL be O(1) not O(N)

#### Scenario: Empty year-end report
- **WHEN** generating a year-end report with no products
- **THEN** no purchase lot queries SHALL be executed
- **AND** empty report SHALL be returned

### Requirement: Database Schema Documentation
The system SHALL include clear documentation in the database schema explaining nullable foreign keys and cascade delete behavior.

#### Scenario: Nullable foreign keys documented
- **WHEN** reviewing the PurchaseLot schema
- **THEN** comments SHALL explain why productId and supplierId are nullable
- **AND** reference the snapshot preservation strategy

#### Scenario: Cascade delete behavior documented
- **WHEN** reviewing relationships with onDelete: Cascade
- **THEN** comments SHALL explain which deletions cascade
- **AND** warn about potential data loss scenarios
