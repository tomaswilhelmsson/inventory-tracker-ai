# Spec: Discard Draft Year-End Count

## Capability
`discard-draft-count`

## Overview
This capability enables users to delete draft year-end counts that have not been confirmed. It provides a clean way to remove mistakes or abandoned counts while ensuring confirmed counts remain immutable for audit trail purposes.

---

## ADDED Requirements

### Requirement: DD-001 - Delete Draft Count Service
The system SHALL provide a service method to delete draft year-end counts.

#### Scenario: Successfully delete draft count
**Given** a year-end count with ID 5 exists with status 'draft'  
**And** the count has 10 associated count items  
**When** calling `deleteYearEndCount(5)`  
**Then** the year-end count SHALL be deleted from the database  
**And** all 10 associated count items SHALL be automatically deleted (cascade)  
**And** the method SHALL return a success message with the count of deleted items

#### Scenario: Prevent deletion of confirmed count
**Given** a year-end count with ID 8 exists with status 'confirmed'  
**When** calling `deleteYearEndCount(8)`  
**Then** the method SHALL throw an error with status 400  
**And** the error message SHALL indicate confirmed counts cannot be deleted  
**And** the year-end count SHALL remain in the database unchanged

#### Scenario: Handle non-existent count
**Given** no year-end count with ID 999 exists  
**When** calling `deleteYearEndCount(999)`  
**Then** the method SHALL throw an error with status 404  
**And** the error message SHALL indicate the count was not found

---

### Requirement: DD-002 - Delete Draft Count API
The system SHALL provide a REST API endpoint to delete draft year-end counts.

#### Scenario: DELETE endpoint deletes draft count
**Given** a draft year-end count with ID 12 exists  
**And** the user is authenticated  
**When** sending DELETE request to `/api/year-end-count/12`  
**Then** the response SHALL have status 200  
**And** the response body SHALL contain a success message  
**And** the response body SHALL include the number of deleted items  
**And** the count SHALL be removed from the database

#### Scenario: DELETE endpoint rejects confirmed count
**Given** a confirmed year-end count with ID 15 exists  
**And** the user is authenticated  
**When** sending DELETE request to `/api/year-end-count/15`  
**Then** the response SHALL have status 400  
**And** the response body SHALL contain an error message about immutable confirmed counts  
**And** the count SHALL remain in the database

#### Scenario: DELETE endpoint validates ID parameter
**Given** the user is authenticated  
**When** sending DELETE request to `/api/year-end-count/abc` (invalid ID)  
**Then** the response SHALL have status 400  
**And** the response body SHALL contain a validation error message

#### Scenario: DELETE endpoint requires authentication
**Given** a draft year-end count with ID 20 exists  
**And** the user is NOT authenticated  
**When** sending DELETE request to `/api/year-end-count/20`  
**Then** the response SHALL have status 401  
**And** the count SHALL remain in the database

---

### Requirement: DD-003 - Cascade Delete Integrity
Deleting a year-end count SHALL automatically delete all associated count items.

#### Scenario: Cascade deletes all count items
**Given** a draft year-end count with ID 25 exists  
**And** the count has 15 associated YearEndCountItem records  
**When** the year-end count is deleted  
**Then** all 15 YearEndCountItem records SHALL be automatically deleted  
**And** no orphaned count items SHALL remain in the database

#### Scenario: Cascade delete uses existing schema
**Given** the database schema is deployed  
**When** inspecting the YearEndCountItem model  
**Then** the yearEndCount relation SHALL have `onDelete: Cascade` configured  
**And** no additional migration SHALL be required for cascade delete functionality

---

### Requirement: DD-004 - Data Validation
The system SHALL validate year-end count status before allowing deletion.

#### Scenario: Only draft counts can be deleted
**Given** multiple year-end counts exist  
**And** some have status 'draft' and others have status 'confirmed'  
**When** attempting to delete any count  
**Then** the system SHALL allow deletion only if status is 'draft'  
**And** the system SHALL reject deletion if status is 'confirmed'

---

## Cross-References
- Related to: `ui-discard-button` (frontend discard button functionality)
- Depends on: Existing year-end count system
- Depends on: Database cascade delete configuration
