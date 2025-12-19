# Purchase Tracking

## ADDED Requirements

### Requirement: Record Purchase
The system SHALL allow users to record purchases as lots with product, quantity, unit cost, and purchase date.

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

### Requirement: Update Purchase Lot
The system SHALL allow users to update purchase lot details if the year is not locked.

#### Scenario: Update purchase quantity before year lock
- **WHEN** a user updates purchase lot ID 50's quantity from 1000 to 1200 and the year is not locked
- **THEN** the system updates both quantity and remainingQuantity fields

#### Scenario: Update purchase unit cost before year lock
- **WHEN** a user updates purchase lot ID 50's unit cost from $2.50 to $2.75 and the year is not locked
- **THEN** the system updates the unit cost

#### Scenario: Prevent update of purchase in locked year
- **WHEN** a user attempts to update purchase lot ID 50 from year 2023 and that year is locked
- **THEN** the system rejects the update with an error message

### Requirement: Delete Purchase Lot
The system SHALL allow deletion of purchase lots if the year is not locked and remaining quantity equals original quantity.

#### Scenario: Delete unused purchase lot
- **WHEN** a user deletes purchase lot ID 50 with remainingQuantity = quantity = 1000 and year not locked
- **THEN** the system removes the purchase lot record

#### Scenario: Prevent deletion of partially consumed lot
- **WHEN** a user attempts to delete purchase lot ID 50 with remainingQuantity 800 but original quantity 1000
- **THEN** the system rejects the deletion with an error message

#### Scenario: Prevent deletion of purchase in locked year
- **WHEN** a user attempts to delete purchase lot ID 50 from year 2023 and that year is locked
- **THEN** the system rejects the deletion with an error message

### Requirement: List Purchase Lots
The system SHALL provide a list of purchase lots with filtering and sorting options.

#### Scenario: Retrieve all purchase lots for a product
- **WHEN** a user requests purchase lots for product ID 10
- **THEN** the system returns all lots for that product ordered by purchase date ascending

#### Scenario: Filter purchase lots by year
- **WHEN** a user filters purchase lots by year 2024
- **THEN** the system returns only lots purchased in 2024

#### Scenario: Filter purchase lots by supplier
- **WHEN** a user filters purchase lots by supplier ID 5
- **THEN** the system returns only lots from that supplier

#### Scenario: View lots with remaining inventory
- **WHEN** a user requests lots with remaining inventory
- **THEN** the system returns only lots where remainingQuantity > 0

### Requirement: Calculate Lot Value
The system SHALL calculate the current value of purchase lots based on remaining quantity.

#### Scenario: Calculate single lot value
- **WHEN** a purchase lot has remainingQuantity 800 and unitCost $2.50
- **THEN** the system calculates lot value as $2000.00

#### Scenario: Calculate total value across lots
- **WHEN** a user requests total inventory value for product ID 10
- **THEN** the system sums the value of all lots with remainingQuantity > 0
