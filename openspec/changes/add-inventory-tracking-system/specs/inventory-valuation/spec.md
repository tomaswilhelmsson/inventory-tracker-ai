# Inventory Valuation

## ADDED Requirements

### Requirement: FIFO Cost Calculation
The system SHALL calculate inventory value using First-In-First-Out (FIFO) method based on purchase lot order, always processing lots by purchaseDate ascending (oldest first).

#### Scenario: Calculate inventory value for single product
- **WHEN** product ID 10 has three lots: Lot A (date 2023-01-15, 100 units @ $2.00), Lot B (date 2023-06-20, 200 units @ $2.50), Lot C (date 2024-02-10, 150 units @ $3.00)
- **THEN** the system calculates total inventory value as (100 × $2.00) + (200 × $2.50) + (150 × $3.00) = $1150.00

#### Scenario: FIFO ordering by purchase date
- **WHEN** performing any operation on lots (valuation, consumption, reporting)
- **THEN** the system MUST order lots by purchaseDate ascending (oldest first) to maintain FIFO integrity

#### Scenario: Calculate inventory value across years
- **WHEN** product ID 10 has lots from 2022, 2023, and 2024 with remaining quantities
- **THEN** the system includes all lots with remainingQuantity > 0 regardless of year

#### Scenario: Multi-year inventory valuation with different costs
- **WHEN** product ID 10 has Lot A (2022 purchase, remainingQuantity 10 @ $1.00) and Lot B (2023 purchase, remainingQuantity 10 @ $2.00)
- **THEN** the system calculates total inventory value as (10 × $1.00) + (10 × $2.00) = $30.00

#### Scenario: FIFO order enforcement with same product different dates
- **WHEN** product ID 10 has Lot X (purchaseDate 2024-06-15, remainingQuantity 50 @ $3.00) and Lot Y (purchaseDate 2024-01-10, remainingQuantity 100 @ $2.50)
- **THEN** the system processes lots in order: Lot Y first (2024-01-10), then Lot X (2024-06-15), calculating value as (100 × $2.50) + (50 × $3.00) = $400.00

### Requirement: Inventory Consumption Tracking
The system SHALL track consumption of inventory lots following FIFO order, consuming from oldest lots first based on purchaseDate ascending.

#### Scenario: Consume from oldest lot first
- **WHEN** year-end count shows 250 total units for product with Lot A (2023-01-15, remaining 300) and Lot B (2024-02-10, remaining 200)
- **THEN** the system sets Lot A remainingQuantity to 250 and Lot B remainingQuantity to 0

#### Scenario: Consume across multiple lots
- **WHEN** year-end count shows 350 total units for product with Lot A (2023-01-15, remaining 300) and Lot B (2024-02-10, remaining 200)
- **THEN** the system sets Lot A remainingQuantity to 300 and Lot B remainingQuantity to 50

#### Scenario: Full lot depletion
- **WHEN** year-end count shows 150 total units for product with Lot A (2023-01-15, remaining 300) and Lot B (2024-02-10, remaining 200)
- **THEN** the system sets Lot A remainingQuantity to 150 and Lot B remainingQuantity to 0

#### Scenario: Multi-year FIFO consumption
- **WHEN** year-end 2024 count shows 5 total units for product with Lot A (2022, remainingQuantity 10 @ $1.00) and Lot B (2023, remainingQuantity 10 @ $2.00)
- **THEN** the system sets Lot A remainingQuantity to 0 (fully consumed) and Lot B remainingQuantity to 5, resulting in inventory value of 5 × $2.00 = $10.00

### Requirement: Total Inventory Value
The system SHALL calculate total inventory value across all products.

#### Scenario: Calculate company-wide inventory value
- **WHEN** a user requests total inventory value
- **THEN** the system sums the value of all lots with remainingQuantity > 0 across all products

#### Scenario: Calculate inventory value by supplier
- **WHEN** a user requests inventory value for supplier ID 5
- **THEN** the system sums the value of all lots from that supplier with remainingQuantity > 0

### Requirement: Inventory Quantity Summary
The system SHALL provide current inventory quantities by product.

#### Scenario: Calculate current quantity for product
- **WHEN** product ID 10 has three lots with remainingQuantity 100, 200, and 150
- **THEN** the system reports total current inventory as 450 units

#### Scenario: List products with zero inventory
- **WHEN** a user requests products with no inventory
- **THEN** the system returns all products where sum of remainingQuantity = 0

### Requirement: FIFO Ordering Enforcement
The system SHALL enforce purchaseDate ascending order for ALL lot operations to ensure FIFO integrity.

#### Scenario: Database queries must include ORDER BY purchaseDate ASC
- **WHEN** any database query retrieves purchase lots for FIFO calculations, consumption, or reporting
- **THEN** the query MUST include ORDER BY purchaseDate ASC to ensure oldest lots are processed first

#### Scenario: Prevent incorrect valuation from wrong ordering
- **WHEN** calculating inventory value or consuming lots
- **THEN** the system MUST NOT use any ordering other than purchaseDate ascending, as this would corrupt FIFO cost accuracy
