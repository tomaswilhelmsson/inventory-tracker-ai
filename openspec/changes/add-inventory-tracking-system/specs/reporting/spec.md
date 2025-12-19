# Reporting

## ADDED Requirements

### Requirement: Purchase History Report
The system SHALL generate purchase history reports showing all purchases for a given year plus past-year purchases with remaining inventory.

#### Scenario: Generate purchase report for current year
- **WHEN** a user requests purchase history for year 2024
- **THEN** the system returns all purchases from 2024 plus any purchases from previous years with remainingQuantity > 0

#### Scenario: Include lot details in purchase report
- **WHEN** a purchase history report is generated
- **THEN** each row shows purchase date, product name, supplier name, quantity, unit cost, remaining quantity, and lot value

#### Scenario: Filter purchase report by product
- **WHEN** a user filters purchase history by product ID 10
- **THEN** the system returns only purchases for that product

#### Scenario: Filter purchase report by supplier
- **WHEN** a user filters purchase history by supplier ID 5
- **THEN** the system returns only purchases from that supplier

#### Scenario: Sort purchase report by date
- **WHEN** a purchase history report is generated
- **THEN** the system orders results by purchase date ascending (oldest first)

### Requirement: Year-End Inventory Report
The system SHALL generate a frozen year-end inventory report after count confirmation.

#### Scenario: Generate year-end inventory report
- **WHEN** a user requests the year-end inventory report for confirmed 2024 count
- **THEN** the system returns a report showing each product's final quantity, FIFO value, and lot breakdown

#### Scenario: Report includes total inventory value
- **WHEN** the year-end inventory report is generated
- **THEN** the system calculates and displays total inventory value at bottom of report

#### Scenario: Report shows variance information
- **WHEN** the year-end inventory report is generated
- **THEN** the system includes expected vs counted quantities and variance for each product

#### Scenario: Frozen report unchanged after confirmation
- **WHEN** a user views year-end report for locked year 2023
- **THEN** the system returns the exact report from confirmation time, unchanged by subsequent purchases

### Requirement: Inventory Value Summary
The system SHALL provide current inventory value summary by product and supplier.

#### Scenario: Generate current inventory value by product
- **WHEN** a user requests inventory value summary
- **THEN** the system lists each product with current quantity and FIFO-calculated total value

#### Scenario: Generate inventory value by supplier
- **WHEN** a user requests inventory value grouped by supplier
- **THEN** the system shows total inventory quantity and value for each supplier's products

#### Scenario: Include zero-inventory products option
- **WHEN** a user requests inventory summary with zero-inventory flag enabled
- **THEN** the system includes products with zero remaining quantity showing $0.00 value

### Requirement: Export Reports
The system SHALL allow users to export reports to CSV and PDF formats.

#### Scenario: Export purchase history to CSV
- **WHEN** a user exports purchase history report to CSV
- **THEN** the system generates a CSV file with all report columns

#### Scenario: Export year-end report to PDF
- **WHEN** a user exports year-end inventory report to PDF
- **THEN** the system generates a formatted PDF with tables and totals

#### Scenario: Include report metadata in exports
- **WHEN** a report is exported
- **THEN** the file includes generation date, report type, and filter criteria in header

### Requirement: Report Data Accuracy
The system SHALL ensure reports reflect accurate FIFO calculations and current database state.

#### Scenario: Report uses latest lot data
- **WHEN** a user generates a current inventory report
- **THEN** the system queries current lot remainingQuantity values, not cached data

#### Scenario: FIFO order consistency across reports
- **WHEN** multiple reports are generated for same time period
- **THEN** the system applies consistent FIFO ordering (purchaseDate ascending) in all calculations
