# Spec: Product Integration with Units

## Capability
`product-integration`

## Overview
This capability integrates the Unit entity with the Product model, migrating from hardcoded string units to database-backed unit references.

---

## MODIFIED Requirements

### Requirement: PI-001 - Product-Unit Relationship
The Product model SHALL reference Unit via foreign key relationship instead of storing unit as a string.

#### Scenario: Product schema includes unitId foreign key
**Given** the database schema is deployed  
**When** inspecting the `products` table structure  
**Then** the table SHALL have a `unitId` column (integer, not null)  
**And** a foreign key constraint SHALL exist referencing `units(id)`  
**And** the constraint SHALL use `onDelete: Restrict` to prevent deletion of units in use

#### Scenario: Product-unit relation is enforced
**Given** a product exists with unitId 5  
**And** unit with ID 5 exists  
**When** attempting to delete unit with ID 5  
**Then** the database SHALL reject the deletion with foreign key constraint violation  
**And** the product SHALL remain associated with unit ID 5

---

### Requirement: PI-002 - Product API Returns Unit Details
Product API endpoints SHALL include unit information in responses.

#### Scenario: GET /api/products includes unit name
**Given** products exist in the database with associated units  
**And** the user is authenticated  
**When** sending GET request to `/api/products`  
**Then** each product object in the response SHALL include a `unit` property  
**And** the `unit` property SHALL be an object with at minimum:
- `id` (number)
- `name` (string)

#### Scenario: GET /api/products/:id includes unit details
**Given** a product with ID 10 exists and references unit "kg"  
**And** the user is authenticated  
**When** sending GET request to `/api/products/10`  
**Then** the response SHALL include `unit.id` and `unit.name`  
**And** `unit.name` SHALL equal "kg"

---

### Requirement: PI-003 - Product Creation Requires Valid Unit
Creating or updating products SHALL validate that the specified unit exists.

#### Scenario: Create product with valid unitId
**Given** a unit with ID 3 exists  
**And** the user is authenticated  
**When** sending POST request to `/api/products` with `{"name": "Widget", "unitId": 3, ...}`  
**Then** the product SHALL be created successfully  
**And** the product SHALL reference unit ID 3

#### Scenario: Reject product with non-existent unitId
**Given** no unit with ID 999 exists  
**And** the user is authenticated  
**When** sending POST request to `/api/products` with `{"name": "Widget", "unitId": 999, ...}`  
**Then** the response SHALL have status 400  
**And** the error message SHALL indicate invalid unit reference  
**And** no product SHALL be created

#### Scenario: Update product unitId
**Given** a product with ID 8 currently references unit ID 1  
**And** a unit with ID 2 exists  
**And** the user is authenticated  
**When** sending PUT request to `/api/products/8` with `{"unitId": 2}`  
**Then** the product SHALL be updated to reference unit ID 2  
**And** subsequent GET requests SHALL show the new unit

---

## REMOVED Requirements

### Requirement: PI-004 - Remove String-Based Unit Field
The Product model SHALL no longer support string-based unit storage.

#### Scenario: Product schema does not include string unit column
**Given** the database schema migration is complete  
**When** inspecting the `products` table structure  
**Then** the table SHALL NOT have a column named `unit` of type String/Text  
**And** only the `unitId` integer column SHALL exist for unit reference

---

## ADDED Requirements

### Requirement: PI-005 - Data Migration for Existing Products
Existing products with string-based units SHALL be migrated to unit references.

#### Scenario: Migration creates default units
**Given** the database contains products with various string units ("pieces", "kg", "liters")  
**When** the migration script executes  
**Then** unit records SHALL be created for each unique unit string  
**And** the units table SHALL contain at minimum: pieces, kg, g, tons, liters, ml, m, m2, m3, boxes, pallets, rolls

#### Scenario: Migration maps products to unit references
**Given** a product exists with string unit "kg"  
**And** the migration has created a unit record with name "kg" and ID 5  
**When** the migration script executes  
**Then** the product SHALL be updated to have `unitId = 5`  
**And** the old string `unit` value SHALL be removed  
**And** querying the product SHALL return `unit.name = "kg"`

#### Scenario: Migration handles missing or null units
**Given** a product exists with null or empty unit string  
**When** the migration script executes  
**Then** the product SHALL be assigned to a default unit (e.g., "pieces")  
**And** no products SHALL have null unitId after migration

---

## Cross-References
- Depends on: `unit-management` (unit CRUD must exist before products can reference units)
- Related to: `ui-components` (ProductsView must fetch units for dropdown)
