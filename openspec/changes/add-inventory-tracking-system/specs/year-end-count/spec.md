# Year-End Inventory Count

## ADDED Requirements

### Requirement: Initiate Year-End Count
The system SHALL allow users to initiate a year-end inventory count for a specific year.

#### Scenario: Start year-end count for current year
- **WHEN** a user initiates a year-end count for year 2024
- **THEN** the system creates a count record with status "draft" and fetches all products with remaining inventory

#### Scenario: Prevent duplicate count for same year
- **WHEN** a user attempts to initiate a year-end count for year 2024 and a count already exists
- **THEN** the system rejects the request with an error message

#### Scenario: Calculate expected quantities
- **WHEN** a year-end count is initiated for 2024
- **THEN** the system calculates expected quantity for each product as sum of all lot remainingQuantity values

### Requirement: Display Count Sheet
The system SHALL display a clear count sheet showing all products with expected quantities for easy physical counting.

#### Scenario: Generate count sheet with product list
- **WHEN** a user views the year-end count sheet for 2024
- **THEN** the system displays a table with columns: Product Name, Expected Quantity, Actual Count (input field), Variance, and includes all products with remainingQuantity > 0

#### Scenario: Show expected quantity from system
- **WHEN** the count sheet is displayed
- **THEN** each product row shows the expected quantity calculated from sum of lot remainingQuantity values (FIFO ordered)

#### Scenario: Provide empty input field for actual count
- **WHEN** the count sheet is displayed
- **THEN** each product row includes an empty input field labeled "Actual Count" where the employee enters the physical count

#### Scenario: Real-time variance calculation
- **WHEN** a user enters an actual count value
- **THEN** the system immediately calculates and displays variance (Actual Count - Expected Quantity) in the variance column

#### Scenario: Visual indicators for variance
- **WHEN** variance is calculated
- **THEN** the system displays positive variance in green (+), negative variance in red (-), and zero variance as exact match

#### Scenario: Sort products alphabetically for easy lookup
- **WHEN** the count sheet is displayed
- **THEN** products are sorted alphabetically by product name to make physical counting easier

### Requirement: Enter Count Data
The system SHALL allow users to enter actual counted quantities for each product during year-end count.

#### Scenario: Record counted quantity for product
- **WHEN** a user enters counted quantity 450 for product ID 10 in year-end count
- **THEN** the system stores the counted quantity and calculates variance (counted - expected)

#### Scenario: Update counted quantity before confirmation
- **WHEN** a user updates counted quantity from 450 to 475 for product ID 10 and count is still in draft
- **THEN** the system updates the counted quantity and recalculates variance

#### Scenario: Prevent count update after confirmation
- **WHEN** a user attempts to update counted quantity after count is confirmed
- **THEN** the system rejects the update with an error message

#### Scenario: Save draft counts incrementally
- **WHEN** a user enters actual count values
- **THEN** the system auto-saves the draft count data so the employee can pause and resume counting

#### Scenario: Highlight uncounted products
- **WHEN** viewing the count sheet
- **THEN** the system highlights rows where actual count is empty to show what still needs to be counted

### Requirement: Calculate Inventory Variance
The system SHALL calculate variance between expected and counted quantities for each product.

#### Scenario: Calculate positive variance
- **WHEN** product ID 10 has expected quantity 400 and counted quantity 450
- **THEN** the system calculates variance as +50 (surplus)

#### Scenario: Calculate negative variance
- **WHEN** product ID 10 has expected quantity 400 and counted quantity 375
- **THEN** the system calculates variance as -25 (shortage)

#### Scenario: Calculate zero variance
- **WHEN** product ID 10 has expected quantity 400 and counted quantity 400
- **THEN** the system calculates variance as 0 (match)

### Requirement: Export Count Sheet for Physical Counting
The system SHALL provide exportable count sheets for offline physical counting.

#### Scenario: Print count sheet to PDF
- **WHEN** a user requests to print the count sheet
- **THEN** the system generates a PDF with product names, expected quantities, and empty "Actual Count" column for manual entry

#### Scenario: Export count sheet to CSV for spreadsheet use
- **WHEN** a user exports the count sheet to CSV
- **THEN** the system generates a CSV file with columns: Product Name, Expected Quantity, Actual Count (empty), Notes (empty)

#### Scenario: Printable format optimization
- **WHEN** a count sheet is printed
- **THEN** the system formats it with clear headers, adequate spacing for manual writing, and page numbers if multiple pages

### Requirement: Import Count Data
The system SHALL allow importing actual count data from CSV to support offline counting workflows.

#### Scenario: Import counts from CSV file
- **WHEN** a user uploads a CSV file with Product Name and Actual Count columns
- **THEN** the system matches products by name and populates the actual count values

#### Scenario: Validate imported count data
- **WHEN** a CSV is imported
- **THEN** the system validates that all product names exist and all count values are non-negative integers

#### Scenario: Report import errors
- **WHEN** a CSV import has errors (unknown products, invalid numbers)
- **THEN** the system displays a clear error report listing each issue with row numbers

### Requirement: Generate Year-End Report
The system SHALL generate a detailed inventory report showing counted quantities, values, and variances.

#### Scenario: Generate report with all products
- **WHEN** a user requests the year-end report for 2024 count
- **THEN** the system generates a report showing each product's expected quantity, counted quantity, variance, and FIFO-calculated value

#### Scenario: Report includes lot breakdown
- **WHEN** a user views the detailed year-end report
- **THEN** the system shows which purchase lots contribute to each product's inventory value

#### Scenario: Calculate total inventory value
- **WHEN** the year-end report is generated
- **THEN** the system calculates total inventory value using FIFO costs applied to counted quantities

#### Scenario: Multi-year inventory value calculation
- **WHEN** product ID 10 has Lot A (2022, remainingQuantity 10 @ $1.00) and Lot B (2023, remainingQuantity 10 @ $2.00) and year-end 2023 count shows 20 total units (no consumption)
- **THEN** the system calculates inventory value as (10 × $1.00) + (10 × $2.00) = $30.00 in the report

### Requirement: Confirm Year-End Count
The system SHALL require user confirmation of accuracy before finalizing the year-end count.

#### Scenario: User confirms accurate count
- **WHEN** a user confirms the year-end count for 2024 as accurate
- **THEN** the system updates count status to "confirmed", records confirmation timestamp, and triggers backup process

#### Scenario: Prevent confirmation without all products counted
- **WHEN** a user attempts to confirm count with missing counted quantities
- **THEN** the system rejects confirmation with validation error listing uncounted products

#### Scenario: Update lot quantities on confirmation
- **WHEN** a user confirms the year-end count
- **THEN** the system updates all lot remainingQuantity values following FIFO order to match counted quantities

### Requirement: Lock Year After Confirmation
The system SHALL lock the year to prevent modifications after year-end count confirmation.

#### Scenario: Mark year as locked
- **WHEN** a year-end count for 2024 is confirmed
- **THEN** the system marks year 2024 as locked in the database

#### Scenario: Prevent new purchases in locked year
- **WHEN** a user attempts to create a purchase with date in locked year 2024
- **THEN** the system rejects the request with an error message

#### Scenario: Prevent editing purchases in locked year
- **WHEN** a user attempts to update or delete a purchase lot from locked year 2024
- **THEN** the system rejects the request with an error message

#### Scenario: Allow viewing locked year data
- **WHEN** a user views purchases or reports from locked year 2024
- **THEN** the system displays the data with a "locked" indicator
