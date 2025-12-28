# Spec: Supplier Disable

## Capability
`supplier-disable`

## Overview
This capability enables users to disable and re-enable suppliers while preserving all historical data and relationships. Disabled suppliers are hidden from input fields and list views by default but can be viewed when explicitly requested.

---

## ADDED Requirements

### Requirement: SD-001 - Supplier Active Status Data Model
The system SHALL maintain an active status flag for each supplier.

#### Scenario: Database schema includes isActive field
**Given** the database schema is deployed  
**When** inspecting the suppliers table structure  
**Then** an `isActive` column SHALL exist with type boolean  
**And** the default value SHALL be `true`  
**And** an index SHALL exist on the `isActive` column

#### Scenario: Existing suppliers default to active
**Given** the database migration has been run  
**When** querying all existing suppliers  
**Then** all suppliers SHALL have `isActive = true`

---

### Requirement: SD-002 - Supplier Toggle Active API
The system SHALL provide an API endpoint to toggle the active status of a supplier.

#### Scenario: Toggle active supplier to disabled
**Given** a supplier with ID 3 exists with `isActive = true`  
**And** the user is authenticated  
**When** sending PATCH request to `/api/suppliers/3/toggle-active`  
**Then** the response SHALL have status 200  
**And** the response body SHALL contain the updated supplier with `isActive = false`  
**And** the supplier in the database SHALL have `isActive = false`

#### Scenario: Toggle disabled supplier to active
**Given** a supplier with ID 8 exists with `isActive = false`  
**And** the user is authenticated  
**When** sending PATCH request to `/api/suppliers/8/toggle-active`  
**Then** the response SHALL have status 200  
**And** the response body SHALL contain the updated supplier with `isActive = true`  
**And** the supplier in the database SHALL have `isActive = true`

#### Scenario: Toggle non-existent supplier
**Given** no supplier with ID 999 exists  
**And** the user is authenticated  
**When** sending PATCH request to `/api/suppliers/999/toggle-active`  
**Then** the response SHALL have status 404  
**And** the response SHALL contain error message "Supplier not found"

---

### Requirement: SD-003 - Supplier List Filtering by Active Status
The system SHALL filter suppliers by active status in list queries.

#### Scenario: List suppliers excludes disabled by default
**Given** 7 suppliers exist with `isActive = true`  
**And** 2 suppliers exist with `isActive = false`  
**And** the user is authenticated  
**When** sending GET request to `/api/suppliers`  
**Then** the response SHALL have status 200  
**And** the response SHALL contain exactly 7 suppliers  
**And** all returned suppliers SHALL have `isActive = true`

#### Scenario: List suppliers includes disabled when requested
**Given** 7 suppliers exist with `isActive = true`  
**And** 2 suppliers exist with `isActive = false`  
**And** the user is authenticated  
**When** sending GET request to `/api/suppliers?includeInactive=true`  
**Then** the response SHALL have status 200  
**And** the response SHALL contain exactly 9 suppliers  
**And** the response SHALL include both active and inactive suppliers

#### Scenario: Search filters respect active status
**Given** an active supplier with name "Active Corp"  
**And** a disabled supplier with name "Inactive Corp"  
**And** the user is authenticated  
**When** sending GET request to `/api/suppliers?search=Corp`  
**Then** the response SHALL contain only "Active Corp"  
**And** "Inactive Corp" SHALL NOT be in the response

#### Scenario: Search with includeInactive shows all matching
**Given** an active supplier with name "Active Corp"  
**And** a disabled supplier with name "Inactive Corp"  
**And** the user is authenticated  
**When** sending GET request to `/api/suppliers?search=Corp&includeInactive=true`  
**Then** the response SHALL contain both "Active Corp" and "Inactive Corp"

---

### Requirement: SD-004 - Historical Data Preservation
Disabled suppliers SHALL preserve all historical data and relationships.

#### Scenario: Disabled supplier retains purchase history
**Given** a supplier with ID 6 has 10 associated purchase lots  
**When** the supplier is disabled via PATCH `/api/suppliers/6/toggle-active`  
**Then** all 10 purchase lots SHALL remain in the database  
**And** the purchase lots SHALL continue to reference supplier ID 6  
**And** the purchase history SHALL remain queryable

#### Scenario: Disabled supplier retains product relationships
**Given** a supplier with ID 9 is associated with 5 products via ProductSupplier junction table  
**When** the supplier is disabled  
**Then** the ProductSupplier junction records SHALL remain in the database  
**And** the product relationships SHALL remain intact  
**And** products SHALL continue to reference the supplier

---

### Requirement: SD-005 - Product Association Rules
Disabling a supplier SHALL NOT automatically disable associated products.

#### Scenario: Products remain active when supplier is disabled
**Given** a supplier with ID 11 is associated with 3 active products  
**When** the supplier is disabled  
**Then** all 3 associated products SHALL remain with `isActive = true`  
**And** the products SHALL continue to function normally

---

### Requirement: SD-006 - Authentication
Supplier toggle active endpoint SHALL require authentication.

#### Scenario: Reject unauthenticated toggle request
**Given** the user is NOT authenticated  
**When** sending PATCH request to `/api/suppliers/3/toggle-active`  
**Then** the response SHALL have status 401  
**And** the response body SHALL contain an authentication error  
**And** the supplier active status SHALL NOT be changed

---

## Cross-References
- Related to: `product-disable` (similar functionality for products)
- Related to: `ui-filtering` (frontend filtering and display of disabled items)
