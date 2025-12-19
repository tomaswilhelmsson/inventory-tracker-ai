# Spec: UI Components for Unit Management

## Capability
`ui-components`

## Overview
This capability provides user interface components for managing units and integrating unit selection into product management.

---

## ADDED Requirements

### Requirement: UI-001 - Units Management View
The system SHALL provide a dedicated view for managing units.

#### Scenario: UnitsView component exists and is routed
**Given** the user is authenticated  
**When** navigating to `/units` route  
**Then** the UnitsView component SHALL render  
**And** the page title SHALL be "Units Management" or similar

#### Scenario: UnitsView displays list of units
**Given** units exist in the database  
**And** the user navigates to `/units`  
**When** the component mounts  
**Then** a DataTable SHALL display with columns:
- Unit Name
- Products Count (number of products using this unit)
- Actions (Edit, Delete buttons)

#### Scenario: UnitsView allows searching/filtering
**Given** the UnitsView is rendered with multiple units  
**When** the user types "kg" in the search input  
**Then** the DataTable SHALL filter to show only units containing "kg" in the name  
**And** other units SHALL be hidden

#### Scenario: UnitsView shows empty state
**Given** no units exist in the database  
**And** the user navigates to `/units`  
**When** the component loads  
**Then** an empty state message SHALL be displayed  
**And** the message SHALL indicate no units are available  
**And** the "Add Unit" button SHALL remain visible

---

### Requirement: UI-002 - Unit Create/Edit Dialog
The UnitsView SHALL provide a dialog for creating and editing units.

#### Scenario: Open create dialog
**Given** the UnitsView is rendered  
**When** the user clicks the "Add Unit" button  
**Then** a dialog SHALL open with title "Add Unit"  
**And** the dialog SHALL contain an input field for unit name  
**And** the dialog SHALL have "Cancel" and "Create" buttons

#### Scenario: Create unit via dialog
**Given** the create dialog is open  
**When** the user enters "cartons" in the name field  
**And** clicks the "Create" button  
**Then** a POST request SHALL be sent to `/api/units` with body `{"name": "cartons"}`  
**And** on success, the dialog SHALL close  
**And** a success toast notification SHALL appear  
**And** the unit list SHALL refresh to include the new unit

#### Scenario: Open edit dialog
**Given** a unit "kg" is displayed in the table  
**When** the user clicks the Edit button for "kg"  
**Then** a dialog SHALL open with title "Edit Unit"  
**And** the name input field SHALL be pre-filled with "kg"  
**And** the dialog SHALL have "Cancel" and "Update" buttons

#### Scenario: Update unit via dialog
**Given** the edit dialog is open for unit "kg" with ID 5  
**When** the user changes the name to "kilograms"  
**And** clicks the "Update" button  
**Then** a PUT request SHALL be sent to `/api/units/5` with body `{"name": "kilograms"}`  
**And** on success, the dialog SHALL close  
**And** a success toast notification SHALL appear  
**And** the unit list SHALL refresh showing "kilograms"

---

### Requirement: UI-003 - Unit Deletion with Protection
The UnitsView SHALL allow deletion of units with cascade protection warnings.

#### Scenario: Delete unused unit
**Given** a unit "test-unit" with 0 products is displayed  
**When** the user clicks the Delete button  
**Then** a confirmation dialog SHALL appear  
**And** the dialog SHALL ask "Are you sure you want to delete 'test-unit'?"  
**When** the user confirms  
**Then** a DELETE request SHALL be sent to `/api/units/{id}`  
**And** on success, a success toast SHALL appear  
**And** the unit SHALL be removed from the table

#### Scenario: Prevent deletion of unit in use
**Given** a unit "kg" with 8 products is displayed  
**When** the user clicks the Delete button  
**Then** a confirmation dialog SHALL appear  
**And** the dialog SHALL display a warning: "This unit is used by 8 products. You must reassign those products before deleting this unit."  
**And** the "Delete" button SHALL be disabled or the dialog SHALL only have a "Cancel" button  
**When** the user attempts to proceed with deletion  
**Then** the API SHALL return status 400  
**And** an error toast SHALL display the cascade protection message  
**And** the unit SHALL remain in the database

#### Scenario: Show product count in delete confirmation
**Given** a unit with 3 products is selected for deletion  
**When** the confirmation dialog appears  
**Then** the dialog SHALL display the product count  
**And** the message SHALL indicate the number of affected products

---

### Requirement: UI-004 - Error Handling in UnitsView
The UnitsView SHALL handle API errors gracefully.

#### Scenario: Handle duplicate unit name error
**Given** a unit "pieces" already exists  
**And** the create dialog is open  
**When** the user enters "pieces" and clicks Create  
**Then** the API SHALL return status 400  
**And** an error toast SHALL appear with message "Unit with this name already exists"  
**And** the dialog SHALL remain open  
**And** the input field SHALL be highlighted as invalid

#### Scenario: Handle network error on fetch
**Given** the UnitsView is loading  
**When** the API request to `/api/units` fails due to network error  
**Then** an error toast SHALL appear  
**And** the message SHALL indicate the failure to load units  
**And** an empty state or error state SHALL be displayed

#### Scenario: Display loading state
**Given** the UnitsView is mounted  
**When** the API request to fetch units is in progress  
**Then** a loading indicator SHALL be displayed  
**And** the DataTable SHALL show a loading skeleton or spinner

---

### Requirement: UI-005 - Navigation Menu Integration
The main navigation SHALL include a link to the Units management view.

#### Scenario: Units menu item is visible
**Given** the user is authenticated and viewing any page  
**When** inspecting the main navigation menu  
**Then** a "Units" menu item SHALL be visible  
**And** the menu item SHALL have an appropriate icon (e.g., "pi-tag")  
**And** the menu item SHALL be positioned logically (e.g., between Products and Purchases)

#### Scenario: Navigate to Units view
**Given** the user is on any authenticated page  
**When** the user clicks the "Units" menu item  
**Then** the browser SHALL navigate to `/units`  
**And** the UnitsView SHALL render  
**And** the Units menu item SHALL be highlighted as active

---

## MODIFIED Requirements

### Requirement: UI-006 - ProductsView Uses Dynamic Unit Selection
The ProductsView SHALL fetch units from the API instead of using hardcoded options.

#### Scenario: Fetch units for dropdown
**Given** the ProductsView is mounted  
**And** the create or edit product dialog is opened  
**When** the component initializes  
**Then** a GET request SHALL be sent to `/api/units`  
**And** the response SHALL populate the unit dropdown options

#### Scenario: Display units in product form
**Given** units are fetched from the API  
**And** the product create/edit dialog is open  
**When** the user clicks the unit dropdown  
**Then** the dropdown SHALL display all available units  
**And** each option SHALL show the unit name

#### Scenario: Save product with unitId
**Given** the product create dialog is open  
**And** the user selects unit "kg" (ID 5) from the dropdown  
**And** fills in other required fields  
**When** the user clicks "Create"  
**Then** a POST request SHALL be sent with `{"unitId": 5, ...}`  
**And** on success, the product SHALL be created with the selected unit

#### Scenario: Handle units loading state in ProductsView
**Given** the product create dialog is opened  
**When** the units are being fetched  
**Then** the unit dropdown SHALL show a loading indicator  
**And** the dropdown SHALL be disabled until units are loaded

---

## REMOVED Requirements

### Requirement: UI-007 - Remove Hardcoded Unit Options
ProductsView SHALL no longer use hardcoded unit arrays.

#### Scenario: No hardcoded unitOptions array
**Given** the ProductsView component code  
**When** inspecting the component's data or setup  
**Then** there SHALL NOT be a hardcoded array named `unitOptions`  
**And** all unit options SHALL be fetched from `/api/units`

---

## Cross-References
- Depends on: `unit-management` (API endpoints must exist)
- Depends on: `product-integration` (products must use unitId)
- Affects: All views displaying product information (InventoryView, PurchasesView, DashboardView, YearEndCountView, ReportsView)
