# Spec: UI Filtering for Disabled Items

## Capability
`ui-filtering`

## Overview
This capability provides frontend user interface functionality to filter, display, and manage disabled products and suppliers. It includes toggle controls, visual indicators, and dropdown filtering.

---

## ADDED Requirements

### Requirement: UF-001 - List View Toggle Control
Product and supplier list views SHALL provide a toggle to show or hide disabled items.

#### Scenario: Products view has show disabled toggle
**Given** the user is on the Products view  
**When** the page loads  
**Then** a toggle button labeled "Show Disabled" or similar SHALL be visible  
**And** the toggle SHALL be in the OFF state by default  
**And** only active products SHALL be displayed in the table

#### Scenario: Toggle shows disabled products
**Given** the user is on the Products view  
**And** 5 active products and 3 disabled products exist  
**And** the toggle is OFF  
**When** the user clicks the "Show Disabled" toggle  
**Then** the toggle label SHALL change to "Hide Disabled" or similar  
**And** the table SHALL refresh to show all 8 products  
**And** disabled products SHALL have a visual indicator

#### Scenario: Toggle hides disabled products
**Given** the user is on the Products view  
**And** the toggle is ON showing all products  
**When** the user clicks the "Hide Disabled" toggle  
**Then** the table SHALL refresh to show only active products  
**And** disabled products SHALL be removed from the display

#### Scenario: Suppliers view has show disabled toggle
**Given** the user is on the Suppliers view  
**When** the page loads  
**Then** a toggle button labeled "Show Disabled" or similar SHALL be visible  
**And** the toggle SHALL function identically to the Products view toggle

---

### Requirement: UF-002 - Visual Indicators for Disabled Items
Disabled items SHALL have clear visual indicators when displayed.

#### Scenario: Disabled product has visual styling
**Given** the user is viewing all products (toggle ON)  
**And** a disabled product named "Old Widget" is in the list  
**When** the table renders  
**Then** the product name SHALL be styled differently (e.g., grayed out, strikethrough)  
**And** a "Disabled" tag or badge SHALL be displayed next to the product name

#### Scenario: Disabled supplier has visual styling
**Given** the user is viewing all suppliers (toggle ON)  
**And** a disabled supplier named "Defunct Corp" is in the list  
**When** the table renders  
**Then** the supplier name SHALL be styled differently  
**And** a "Disabled" tag or badge SHALL be displayed next to the supplier name

---

### Requirement: UF-003 - Enable/Disable Action Buttons
Product and supplier list views SHALL provide action buttons to enable or disable items.

#### Scenario: Active product shows disable button
**Given** an active product is displayed in the table  
**When** viewing the actions column  
**Then** a "Disable" button SHALL be visible  
**And** the button SHALL have appropriate styling (e.g., warning severity)

#### Scenario: Disabled product shows enable button
**Given** a disabled product is displayed in the table  
**When** viewing the actions column  
**Then** an "Enable" button SHALL be visible  
**And** the button SHALL have appropriate styling (e.g., success severity)

#### Scenario: Disable button shows confirmation dialog
**Given** an active product exists  
**When** the user clicks the "Disable" button  
**Then** a confirmation dialog SHALL appear  
**And** the dialog SHALL display the product name  
**And** the dialog SHALL show the count of existing purchases (if any)  
**And** the dialog SHALL have "Cancel" and "Disable" options

#### Scenario: Enable button shows confirmation dialog
**Given** a disabled product exists  
**When** the user clicks the "Enable" button  
**Then** a confirmation dialog SHALL appear  
**And** the dialog SHALL display the product name  
**And** the dialog SHALL have "Cancel" and "Enable" options

---

### Requirement: UF-004 - Dropdown Filtering
Dropdowns for selecting products and suppliers SHALL exclude disabled items by default.

#### Scenario: Purchase form product dropdown excludes disabled
**Given** the user is on the Purchases view creating a new purchase  
**And** 10 active products and 3 disabled products exist in the database  
**When** the product dropdown is opened  
**Then** only the 10 active products SHALL be available for selection  
**And** the 3 disabled products SHALL NOT appear in the dropdown

#### Scenario: Purchase form supplier dropdown excludes disabled
**Given** the user is on the Purchases view creating a new purchase  
**And** 5 active suppliers and 2 disabled suppliers exist in the database  
**When** the supplier dropdown is opened  
**Then** only the 5 active suppliers SHALL be available for selection  
**And** the 2 disabled suppliers SHALL NOT appear in the dropdown

#### Scenario: Product form supplier multi-select excludes disabled
**Given** the user is editing a product  
**And** the product has a multi-select for suppliers  
**And** 8 active suppliers and 4 disabled suppliers exist  
**When** the multi-select dropdown is opened  
**Then** only the 8 active suppliers SHALL be available for selection

---

### Requirement: UF-005 - Success and Error Feedback
The UI SHALL provide clear feedback when enabling or disabling items.

#### Scenario: Successful disable shows success toast
**Given** the user confirms disabling a product  
**When** the API request completes successfully  
**Then** a success toast notification SHALL appear  
**And** the message SHALL confirm "Product disabled successfully" or similar  
**And** the table SHALL refresh to reflect the change

#### Scenario: Successful enable shows success toast
**Given** the user confirms enabling a product  
**When** the API request completes successfully  
**Then** a success toast notification SHALL appear  
**And** the message SHALL confirm "Product enabled successfully" or similar  
**And** the table SHALL refresh to reflect the change

#### Scenario: Failed toggle shows error toast
**Given** the user attempts to disable a product  
**When** the API request fails  
**Then** an error toast notification SHALL appear  
**And** the message SHALL display the error details  
**And** the product status SHALL remain unchanged in the UI

---

### Requirement: UF-006 - Toggle State Persistence
The show/hide disabled toggle state SHALL persist during the user's session.

#### Scenario: Toggle state persists when navigating away and back
**Given** the user is on the Products view  
**And** the "Show Disabled" toggle is ON  
**When** the user navigates to another view (e.g., Purchases)  
**And** then navigates back to the Products view  
**Then** the toggle SHALL still be ON  
**And** disabled products SHALL be displayed

**Note**: This can be implemented using component state (no need for persistent storage across browser sessions).

---

### Requirement: UF-007 - Historical Data Display
Disabled items SHALL display correctly in historical views and reports.

#### Scenario: Purchase history shows disabled product name
**Given** a purchase exists for a product that is now disabled  
**When** viewing the purchase in the Purchases list  
**Then** the product name SHALL be displayed correctly  
**And** the product SHALL optionally be marked as disabled if shown

#### Scenario: Inventory view shows disabled product with stock
**Given** a disabled product has remaining inventory quantity > 0  
**When** viewing the Inventory view  
**Then** the product SHALL appear in the list  
**And** the product SHALL be marked as disabled with visual indicator

---

## Cross-References
- Related to: `product-disable` (backend product disable functionality)
- Related to: `supplier-disable` (backend supplier disable functionality)
