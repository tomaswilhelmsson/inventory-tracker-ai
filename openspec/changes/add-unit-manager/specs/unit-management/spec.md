# Spec: Unit Management

## Capability
`unit-management`

## Overview
This capability enables users to create, read, update, and delete units of measure through a dedicated management interface and API.

---

## ADDED Requirements

### Requirement: UM-001 - Unit Data Model
The system SHALL maintain a persistent collection of units of measure.

#### Scenario: Database schema includes Unit table
**Given** the database schema is deployed  
**When** inspecting the database structure  
**Then** a `units` table SHALL exist with columns:
- `id` (integer, primary key, auto-increment)
- `name` (text, unique, not null)
- `createdAt` (datetime, not null, default current timestamp)

#### Scenario: Unit names must be unique
**Given** a unit with name "pieces" exists in the database  
**When** attempting to create another unit with name "pieces"  
**Then** the system SHALL reject the creation with a unique constraint error  
**And** return error message "Unit with this name already exists"

---

### Requirement: UM-002 - Unit CRUD API
The system SHALL provide RESTful API endpoints for managing units.

#### Scenario: List all units
**Given** units exist in the database  
**And** the user is authenticated  
**When** sending GET request to `/api/units`  
**Then** the response SHALL have status 200  
**And** the response body SHALL contain a JSON array of unit objects  
**And** each unit object SHALL include:
- `id` (number)
- `name` (string)
- `createdAt` (ISO 8601 datetime string)
- `_count.products` (number of products using this unit)

#### Scenario: Get unit by ID
**Given** a unit with ID 5 exists in the database  
**And** the user is authenticated  
**When** sending GET request to `/api/units/5`  
**Then** the response SHALL have status 200  
**And** the response body SHALL contain the unit object with ID 5  
**And** the response SHALL include related products array

#### Scenario: Create new unit
**Given** the user is authenticated  
**And** no unit with name "cartons" exists  
**When** sending POST request to `/api/units` with body `{"name": "cartons"}`  
**Then** the response SHALL have status 201  
**And** the response body SHALL contain the created unit object  
**And** the unit SHALL be persisted in the database

#### Scenario: Update unit name
**Given** a unit with ID 3 and name "kg" exists  
**And** the user is authenticated  
**When** sending PUT request to `/api/units/3` with body `{"name": "kilograms"}`  
**Then** the response SHALL have status 200  
**And** the unit name SHALL be updated to "kilograms" in the database  
**And** all products referencing this unit SHALL now display "kilograms"

#### Scenario: Delete unused unit
**Given** a unit with ID 7 exists  
**And** no products reference unit ID 7  
**And** the user is authenticated  
**When** sending DELETE request to `/api/units/7`  
**Then** the response SHALL have status 200  
**And** the unit SHALL be removed from the database  
**And** the response SHALL contain message "Unit deleted successfully"

#### Scenario: Prevent deletion of unit in use
**Given** a unit with ID 2 exists  
**And** 5 products reference unit ID 2  
**And** the user is authenticated  
**When** sending DELETE request to `/api/units/2`  
**Then** the response SHALL have status 400  
**And** the response body SHALL contain error message indicating the unit is in use  
**And** the error message SHALL include the count of products using the unit  
**And** the unit SHALL NOT be deleted from the database

---

### Requirement: UM-003 - Unit Service Layer
The system SHALL provide a service layer for unit business logic.

#### Scenario: Service validates unit name on create
**Given** the unitService is initialized  
**When** calling `unitService.create({ name: "" })`  
**Then** the service SHALL throw an error with message "Unit name is required"  
**And** no database insert SHALL occur

#### Scenario: Service checks cascade constraints on delete
**Given** a unit with ID 4 has 3 related products  
**When** calling `unitService.delete(4)`  
**Then** the service SHALL throw an error indicating cascade violation  
**And** the error message SHALL include product count  
**And** no database deletion SHALL occur

#### Scenario: Service returns product count with units
**Given** multiple units exist with varying product associations  
**When** calling `unitService.getAll()`  
**Then** the result SHALL include `_count.products` for each unit  
**And** the count SHALL accurately reflect the number of products using each unit

---

### Requirement: UM-004 - Authentication and Authorization
All unit management endpoints SHALL require authentication.

#### Scenario: Reject unauthenticated requests
**Given** the user is NOT authenticated  
**When** sending any request to `/api/units/*`  
**Then** the response SHALL have status 401  
**And** the response body SHALL contain error message "No token provided" or similar  
**And** no unit data SHALL be returned

---

## Cross-References
- Related to: `product-integration` (units are used by products)
- Related to: `ui-components` (frontend unit management interface)
