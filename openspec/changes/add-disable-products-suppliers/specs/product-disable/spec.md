# Spec: Product Disable

## Capability
`product-disable`

## Overview
This capability enables users to disable and re-enable products while preserving all historical data and relationships. Disabled products are hidden from input fields and list views by default but can be viewed when explicitly requested.

---

## ADDED Requirements

### Requirement: PD-001 - Product Active Status Data Model
The system SHALL maintain an active status flag for each product.

#### Scenario: Database schema includes isActive field
**Given** the database schema is deployed  
**When** inspecting the products table structure  
**Then** an `isActive` column SHALL exist with type boolean  
**And** the default value SHALL be `true`  
**And** an index SHALL exist on the `isActive` column

#### Scenario: Existing products default to active
**Given** the database migration has been run  
**When** querying all existing products  
**Then** all products SHALL have `isActive = true`

---

### Requirement: PD-002 - Product Toggle Active API
The system SHALL provide an API endpoint to toggle the active status of a product.

#### Scenario: Toggle active product to disabled
**Given** a product with ID 5 exists with `isActive = true`  
**And** the user is authenticated  
**When** sending PATCH request to `/api/products/5/toggle-active`  
**Then** the response SHALL have status 200  
**And** the response body SHALL contain the updated product with `isActive = false`  
**And** the product in the database SHALL have `isActive = false`

#### Scenario: Toggle disabled product to active
**Given** a product with ID 7 exists with `isActive = false`  
**And** the user is authenticated  
**When** sending PATCH request to `/api/products/7/toggle-active`  
**Then** the response SHALL have status 200  
**And** the response body SHALL contain the updated product with `isActive = true`  
**And** the product in the database SHALL have `isActive = true`

#### Scenario: Toggle non-existent product
**Given** no product with ID 999 exists  
**And** the user is authenticated  
**When** sending PATCH request to `/api/products/999/toggle-active`  
**Then** the response SHALL have status 404  
**And** the response SHALL contain error message "Product not found"

---

### Requirement: PD-003 - Product List Filtering by Active Status
The system SHALL filter products by active status in list queries.

#### Scenario: List products excludes disabled by default
**Given** 5 products exist with `isActive = true`  
**And** 3 products exist with `isActive = false`  
**And** the user is authenticated  
**When** sending GET request to `/api/products`  
**Then** the response SHALL have status 200  
**And** the response SHALL contain exactly 5 products  
**And** all returned products SHALL have `isActive = true`

#### Scenario: List products includes disabled when requested
**Given** 5 products exist with `isActive = true`  
**And** 3 products exist with `isActive = false`  
**And** the user is authenticated  
**When** sending GET request to `/api/products?includeInactive=true`  
**Then** the response SHALL have status 200  
**And** the response SHALL contain exactly 8 products  
**And** the response SHALL include both active and inactive products

#### Scenario: Search filters respect active status
**Given** an active product with name "Active Widget"  
**And** a disabled product with name "Disabled Widget"  
**And** the user is authenticated  
**When** sending GET request to `/api/products?search=Widget`  
**Then** the response SHALL contain only "Active Widget"  
**And** "Disabled Widget" SHALL NOT be in the response

#### Scenario: Search with includeInactive shows all matching
**Given** an active product with name "Active Widget"  
**And** a disabled product with name "Disabled Widget"  
**And** the user is authenticated  
**When** sending GET request to `/api/products?search=Widget&includeInactive=true`  
**Then** the response SHALL contain both "Active Widget" and "Disabled Widget"

---

### Requirement: PD-004 - Historical Data Preservation
Disabled products SHALL preserve all historical data and relationships.

#### Scenario: Disabled product retains purchase history
**Given** a product with ID 10 has 5 associated purchase lots  
**When** the product is disabled via PATCH `/api/products/10/toggle-active`  
**Then** all 5 purchase lots SHALL remain in the database  
**And** the purchase lots SHALL continue to reference product ID 10  
**And** the purchase history SHALL remain queryable

#### Scenario: Disabled product retains supplier relationships
**Given** a product with ID 12 has 2 associated suppliers  
**When** the product is disabled  
**Then** the ProductSupplier junction records SHALL remain in the database  
**And** the supplier relationships SHALL remain intact

---

### Requirement: PD-005 - Inventory Visibility Rules
Disabled products with remaining inventory SHALL be visible in inventory views.

#### Scenario: Disabled product with zero inventory hidden from inventory
**Given** a disabled product with ID 15  
**And** the product has `remainingQuantity = 0` in all purchase lots  
**When** querying the inventory summary  
**Then** the product SHALL NOT appear in the inventory list

#### Scenario: Disabled product with remaining inventory shown
**Given** a disabled product with ID 18  
**And** the product has `remainingQuantity = 50` in purchase lots  
**When** querying the inventory summary  
**Then** the product SHALL appear in the inventory list  
**And** the product SHALL be marked as disabled in the response

---

### Requirement: PD-006 - Authentication
Product toggle active endpoint SHALL require authentication.

#### Scenario: Reject unauthenticated toggle request
**Given** the user is NOT authenticated  
**When** sending PATCH request to `/api/products/5/toggle-active`  
**Then** the response SHALL have status 401  
**And** the response body SHALL contain an authentication error  
**And** the product active status SHALL NOT be changed

---

## Cross-References
- Related to: `supplier-disable` (similar functionality for suppliers)
- Related to: `ui-filtering` (frontend filtering and display of disabled items)
