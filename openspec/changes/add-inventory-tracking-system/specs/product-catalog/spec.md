# Product Catalog

## ADDED Requirements

### Requirement: Create Product
The system SHALL allow users to create new product records linked to a supplier.

#### Scenario: Create product with valid data
- **WHEN** a user submits product name "Widget A", description "Standard widget", and supplier ID 5
- **THEN** the system creates a product record with unique ID and timestamp

#### Scenario: Reject product without supplier
- **WHEN** a user attempts to create a product without specifying a supplier
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject product with invalid supplier
- **WHEN** a user attempts to create a product with non-existent supplier ID 999
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject duplicate product name
- **WHEN** a user attempts to create a product with a name that already exists
- **THEN** the system rejects the request with a validation error

### Requirement: Update Product
The system SHALL allow users to update product information including supplier assignment.

#### Scenario: Update product description
- **WHEN** a user updates product ID 10's description to "Premium widget"
- **THEN** the system updates the product record

#### Scenario: Change product supplier
- **WHEN** a user changes product ID 10's supplier from ID 5 to ID 7
- **THEN** the system updates the supplier association

#### Scenario: Update product name
- **WHEN** a user updates product ID 10's name to "Widget B"
- **THEN** the system updates the name if no duplicate exists

### Requirement: List Products
The system SHALL provide a list of all products with supplier information and filtering.

#### Scenario: Retrieve all products with supplier names
- **WHEN** a user requests the product list
- **THEN** the system returns all products with supplier details ordered by product name

#### Scenario: Filter products by supplier
- **WHEN** a user filters products by supplier ID 5
- **THEN** the system returns only products from that supplier

#### Scenario: Search products by name
- **WHEN** a user searches for products with name containing "Widget"
- **THEN** the system returns only matching products

### Requirement: Delete Product
The system SHALL allow deletion of products that have no purchase history.

#### Scenario: Delete unused product
- **WHEN** a user deletes product ID 10 with no purchase history
- **THEN** the system removes the product record

#### Scenario: Prevent deletion of product with purchases
- **WHEN** a user attempts to delete product ID 10 that has purchase lots
- **THEN** the system rejects the deletion with an error message

### Requirement: View Product Details
The system SHALL display product details including current inventory and purchase history.

#### Scenario: View product with current inventory
- **WHEN** a user views product ID 10
- **THEN** the system displays product info, current total inventory quantity, and total value

#### Scenario: View product purchase history
- **WHEN** a user views product ID 10
- **THEN** the system displays all purchase lots for this product ordered by purchase date
