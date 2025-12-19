# Supplier Management

## ADDED Requirements

### Requirement: Create Supplier
The system SHALL allow users to create new supplier records with name and contact information.

#### Scenario: Create supplier with valid data
- **WHEN** a user submits supplier name "Acme Corp" and contact info "contact@acme.com"
- **THEN** the system creates a supplier record with unique ID and timestamp

#### Scenario: Reject duplicate supplier name
- **WHEN** a user attempts to create a supplier with a name that already exists
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject empty supplier name
- **WHEN** a user submits a supplier with an empty name
- **THEN** the system rejects the request with a validation error

### Requirement: Update Supplier
The system SHALL allow users to update existing supplier information.

#### Scenario: Update supplier contact information
- **WHEN** a user updates supplier ID 123's contact info to "newemail@acme.com"
- **THEN** the system updates the supplier record and preserves the creation timestamp

#### Scenario: Update supplier name
- **WHEN** a user updates supplier ID 123's name to "Acme Corporation"
- **THEN** the system updates the supplier name if no duplicate exists

### Requirement: List Suppliers
The system SHALL provide a list of all suppliers with pagination support.

#### Scenario: Retrieve all suppliers
- **WHEN** a user requests the supplier list
- **THEN** the system returns all suppliers ordered by name

#### Scenario: Search suppliers by name
- **WHEN** a user searches for suppliers with name containing "Acme"
- **THEN** the system returns only matching suppliers

### Requirement: Delete Supplier
The system SHALL allow deletion of suppliers that have no associated products or purchases.

#### Scenario: Delete unused supplier
- **WHEN** a user deletes supplier ID 123 with no associated products
- **THEN** the system removes the supplier record

#### Scenario: Prevent deletion of supplier with products
- **WHEN** a user attempts to delete supplier ID 123 that has associated products
- **THEN** the system rejects the deletion with an error message

#### Scenario: Prevent deletion of supplier with purchases
- **WHEN** a user attempts to delete supplier ID 123 that has purchase history
- **THEN** the system rejects the deletion with an error message

### Requirement: View Supplier Details
The system SHALL display supplier details including associated products and purchase history.

#### Scenario: View supplier with products
- **WHEN** a user views supplier ID 123
- **THEN** the system displays supplier info and a list of associated products

#### Scenario: View supplier purchase statistics
- **WHEN** a user views supplier ID 123
- **THEN** the system displays total purchases count and total value from this supplier
