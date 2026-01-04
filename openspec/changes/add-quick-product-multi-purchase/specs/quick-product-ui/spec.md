# Spec: Quick Add Product in Multi-Item Purchase Dialog

**Capability**: `quick-product-ui`  
**Status**: Draft  
**Related**: None

## Overview

Add inline product creation capability to the Multi-Item Purchase Dialog component by implementing a quick add button next to the product dropdown and a modal dialog for creating products with minimal required fields.

---

## ADDED Requirements

### Requirement: Quick add product button in product dropdown column

Each product row in the multi-item purchase table MUST have a quick add button next to the product dropdown that allows users to create a new product without leaving the dialog.

#### Scenario: Button appears next to product dropdown

**Given** the multi-item purchase dialog is open  
**When** the user views the product column  
**Then** each row displays the product dropdown with a [+] button next to it  
**And** the button has a tooltip showing "Add Product"

#### Scenario: Button opens quick add dialog

**Given** a product row in the multi-item purchase table  
**When** the user clicks the [+] button next to the product dropdown  
**Then** the quick add product dialog opens  
**And** the dialog displays a form for creating a new product

#### Scenario: Button is accessible and styled consistently

**Given** the quick add product button  
**Then** it uses the same icon-based design as the quick add supplier button  
**And** it has proper hover states  
**And** it is keyboard accessible

---

### Requirement: Quick add product dialog with required fields

The quick add product dialog MUST allow users to create a product with minimal required fields: name, supplier, and unit.

#### Scenario: Dialog displays all required fields

**Given** the quick add product dialog is open  
**When** the user views the form  
**Then** the form displays a "Product Name" text input field marked as required  
**And** the form displays a "Supplier" dropdown marked as required  
**And** the form displays a "Unit" dropdown marked as required  
**And** the form displays "Cancel" and "Create" buttons

#### Scenario: Form validates required fields before submission

**Given** the quick add product dialog with empty fields  
**When** the user clicks "Create" without filling required fields  
**Then** the system displays validation errors for missing fields  
**And** the dialog remains open for correction  
**And** the form shows "Please fill in all required fields" message

#### Scenario: Form submits valid product data

**Given** the quick add product form with all required fields filled  
**When** the user clicks "Create"  
**Then** the system calls POST /api/products with name, supplierId, and unitId  
**And** the system shows a loading state on the Create button  
**And** the button is disabled during submission

#### Scenario: Successful product creation shows feedback

**Given** a valid product form submission  
**When** the API returns success  
**Then** the system displays a success toast "Product '{name}' created successfully"  
**And** the dialog closes automatically  
**And** the product list refreshes to include the new product

#### Scenario: Failed product creation shows error

**Given** a product form submission  
**When** the API returns an error (duplicate name, invalid data, etc.)  
**Then** the system displays an error toast with the error message  
**And** the dialog remains open for correction  
**And** the form fields retain their values

#### Scenario: User can cancel product creation

**Given** the quick add product dialog is open  
**When** the user clicks "Cancel"  
**Then** the dialog closes without creating a product  
**And** no API call is made  
**And** the form data is cleared

---

### Requirement: Supplier field pre-population from main form

The supplier field in the quick add product dialog MUST be pre-populated with the supplier selected in the main multi-item purchase form to streamline product creation.

#### Scenario: Supplier is pre-filled when one is selected

**Given** the user has selected "Happy Homes" as the supplier in the main form  
**When** the user opens the quick add product dialog  
**Then** the supplier dropdown is pre-filled with "Happy Homes"  
**And** the supplier field is still editable if needed

#### Scenario: Supplier field is empty when none is selected

**Given** no supplier is selected in the main form  
**When** the user opens the quick add product dialog  
**Then** the supplier dropdown is empty  
**And** the user must select a supplier to proceed

#### Scenario: Supplier list loads available suppliers

**Given** the quick add product dialog is open  
**When** the supplier dropdown is activated  
**Then** it displays all active suppliers from the system  
**And** the dropdown supports filtering/searching

---

### Requirement: Auto-selection of newly created product

After successfully creating a product, the system MUST automatically select it in the product dropdown of the row where quick add was triggered.

#### Scenario: New product is auto-selected in triggering row

**Given** the user clicked quick add from row 2 of the item table  
**When** the product is successfully created  
**Then** the product dropdown in row 2 is set to the newly created product  
**And** other rows are not affected  
**And** the user can immediately proceed to enter quantity and cost

#### Scenario: Product list is refreshed after creation

**Given** a product is successfully created via quick add  
**Then** the product list is refreshed to include the new product  
**And** the new product appears in all product dropdowns in the dialog  
**And** the dropdown is filtered by the selected supplier if applicable

---

### Requirement: Units data loading

The quick add product dialog requires units data to populate the unit dropdown. The component MUST load units when needed.

#### Scenario: Units are loaded when dialog component initializes

**Given** the MultiItemPurchaseDialog component mounts  
**Then** the system fetches units from GET /api/units  
**And** units are available for the quick add product dialog

#### Scenario: Unit dropdown displays available units

**Given** the quick add product dialog is open  
**Then** the unit dropdown displays all available units (e.g., "pieces", "kg", "liters")  
**And** the dropdown supports filtering/searching  
**And** the dropdown shows unit names clearly

---

### Requirement: Product-supplier association

Creating a product through quick add MUST establish the many-to-many relationship between the product and the selected supplier.

#### Scenario: Product is associated with selected supplier

**Given** the user creates a product with supplier "Happy Homes"  
**When** the product is created successfully  
**Then** the product has a ProductSupplier relationship with "Happy Homes"  
**And** the product can be selected in purchase entries for "Happy Homes"  
**And** the product appears in the filtered product list when "Happy Homes" is selected

---

### Requirement: Error handling and validation

The quick add product feature MUST handle all error cases gracefully and provide clear feedback to users.

#### Scenario: Duplicate product name error

**Given** a product named "Widget A" already exists  
**When** the user tries to create a product with the same name  
**Then** the system displays an error toast "Product with this name already exists"  
**And** the name field is highlighted  
**And** the dialog remains open

#### Scenario: Network error during creation

**Given** the user submits a valid product form  
**When** the network request fails  
**Then** the system displays an error toast "Failed to create product"  
**And** the dialog remains open  
**And** the Create button is re-enabled

#### Scenario: Invalid supplier or unit ID

**Given** the user submits a product with an invalid supplierId or unitId  
**When** the API returns a validation error  
**Then** the system displays the specific error message  
**And** the relevant field is highlighted  
**And** the dialog remains open for correction

---

### Requirement: Translation support

All UI text in the quick add product dialog MUST support both English and Swedish languages.

#### Scenario: English translations are displayed

**Given** the system language is set to English  
**When** the user opens the quick add product dialog  
**Then** the dialog title shows "Add Product"  
**And** field labels show "Product Name", "Supplier", "Unit"  
**And** buttons show "Cancel" and "Create"  
**And** success message shows "Product '{name}' created successfully"

#### Scenario: Swedish translations are displayed

**Given** the system language is set to Swedish  
**When** the user opens the quick add product dialog  
**Then** the dialog title shows "Lägg till produkt"  
**And** field labels show "Produktnamn", "Leverantör", "Enhet"  
**And** buttons show "Avbryt" and "Skapa"  
**And** success message shows "Produkt '{name}' skapades framgångsrikt"

---

### Requirement: Component state management

The MultiItemPurchaseDialog component MUST manage the state for the quick add product feature without interfering with existing functionality.

#### Scenario: Quick add state is isolated

**Given** the multi-item purchase dialog is open  
**When** the user opens and closes the quick add product dialog  
**Then** the main form data (supplier, items, costs) remains unchanged  
**And** the quick add form state is reset when closed  
**And** there are no memory leaks or stale references

#### Scenario: Multiple quick adds in same session

**Given** the user has created one product via quick add  
**When** the user opens quick add again from a different row  
**Then** the form is blank (except pre-filled supplier)  
**And** the previous product data is not retained  
**And** each quick add operates independently

---

## Implementation Notes

### Component Structure
- Add quick add button in product dropdown column template
- Add Dialog component for quick add product form
- Add state variables: `quickProductDialogVisible`, `quickProductForm`, `quickProductRowIndex`, `savingQuickProduct`
- Add functions: `showQuickProductDialog(rowIndex)`, `saveQuickProduct()`, `closeQuickProductDialog()`

### API Integration
- Use existing POST /api/products endpoint
- Request body: `{ name: string, supplierId: number, unitId: number }`
- Response includes full product object with suppliers array

### Styling
- Match existing quick add supplier button design
- Use PrimeVue Dialog with 500px width
- Form layout consistent with other dialogs
- Button tooltips for accessibility

### Dependencies
- PrimeVue Dialog, InputText, Dropdown, Button components
- Existing api service
- i18n for translations
- useToast for notifications
