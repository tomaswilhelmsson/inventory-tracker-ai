# Purchase Tracking Specification Deltas

## MODIFIED Requirements

### Requirement: Record Purchase
The system SHALL allow users to record purchases as lots with product, quantity, unit cost, and purchase date, including backward registration in unlocked years.

#### Scenario: Create purchase lot with valid data
- **WHEN** a user records a purchase of product ID 10 from supplier ID 5 with 1000 units at $2.50 per unit on 2024-03-15
- **THEN** the system creates a purchase lot with remainingQuantity initialized to 1000

#### Scenario: Calculate year from purchase date
- **WHEN** a user records a purchase with date 2024-03-15
- **THEN** the system stores the year as 2024 for reporting purposes

#### Scenario: Reject purchase with zero quantity
- **WHEN** a user attempts to record a purchase with quantity 0
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject purchase with negative unit cost
- **WHEN** a user attempts to record a purchase with unit cost -5.00
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject purchase with invalid product
- **WHEN** a user attempts to record a purchase for non-existent product ID 999
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject purchase with invalid supplier
- **WHEN** a user attempts to record a purchase from non-existent supplier ID 999
- **THEN** the system rejects the request with a validation error

#### Scenario: Allow backward purchase registration in unlocked year
- **WHEN** a user in year 2025 records a purchase dated 2024-06-15 and year 2024 is not locked
- **THEN** the system creates the purchase lot successfully

#### Scenario: Reject backward purchase registration in locked year
- **WHEN** a user in year 2025 attempts to record a purchase dated 2024-06-15 and year 2024 is locked
- **THEN** the system rejects the request with error "Cannot create purchase for locked year 2024"

### Requirement: Update Purchase Lot
The system SHALL allow users to update purchase lot details if the year is not locked, including after year unlock.

#### Scenario: Update purchase quantity before year lock
- **WHEN** a user updates purchase lot ID 50's quantity from 1000 to 1200 and the year is not locked
- **THEN** the system updates both quantity and remainingQuantity fields

#### Scenario: Update purchase unit cost before year lock
- **WHEN** a user updates purchase lot ID 50's unit cost from $2.50 to $2.75 and the year is not locked
- **THEN** the system updates the unit cost

#### Scenario: Prevent update of purchase in locked year
- **WHEN** a user attempts to update purchase lot ID 50 from year 2023 and that year is locked
- **THEN** the system rejects the update with an error message

#### Scenario: Allow update after year unlock
- **WHEN** a user updates purchase lot ID 50 from year 2024 after year 2024 was unlocked
- **THEN** the system updates the purchase lot successfully

### Requirement: Delete Purchase Lot
The system SHALL allow deletion of purchase lots if the year is not locked and remaining quantity equals original quantity, including after year unlock.

#### Scenario: Delete unused purchase lot
- **WHEN** a user deletes purchase lot ID 50 with remainingQuantity = quantity = 1000 and year not locked
- **THEN** the system removes the purchase lot record

#### Scenario: Prevent deletion of partially consumed lot
- **WHEN** a user attempts to delete purchase lot ID 50 with remainingQuantity 800 but original quantity 1000
- **THEN** the system rejects the deletion with an error message

#### Scenario: Prevent deletion of purchase in locked year
- **WHEN** a user attempts to delete purchase lot ID 50 from year 2023 and that year is locked
- **THEN** the system rejects the deletion with an error message

#### Scenario: Allow deletion after year unlock
- **WHEN** a user deletes purchase lot ID 50 from year 2024 after year 2024 was unlocked
- **THEN** the system removes the purchase lot record (if unused)
