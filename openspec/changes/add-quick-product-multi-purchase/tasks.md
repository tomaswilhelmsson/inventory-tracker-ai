# Tasks: Add Quick Product Creation to Multi-Item Purchase Dialog

## Phase 1: Component Setup and State Management

### 1.1 Add State Variables
- [x] Add `quickProductDialogVisible` ref in MultiItemPurchaseDialog.vue
- [x] Add `quickProductForm` ref with name, supplierId, unitId fields
- [x] Add `quickProductRowIndex` ref to track which row triggered quick add
- [x] Add `savingQuickProduct` ref for loading state
- [x] Add `units` ref to store units data
- [x] Validation: State variables are properly typed and initialized

### 1.2 Add Data Loading
- [x] Add `loadUnits()` function to fetch units from /api/units
- [x] Call `loadUnits()` in component's onMounted hook
- [x] Add error handling for units loading failure
- [x] Validation: Units load successfully and populate dropdown

## Phase 2: UI Implementation

### 2.1 Add Quick Add Button
- [x] Locate product dropdown column template in MultiItemPurchaseDialog.vue
- [x] Wrap dropdown in flex container with gap
- [x] Add Button component with icon="pi pi-plus"
- [x] Add @click handler pointing to showQuickProductDialog(index)
- [x] Add v-tooltip.top with "Add Product" text
- [x] Style button to match quick add supplier button
- [x] Validation: Button appears next to each product dropdown, tooltip works

### 2.2 Add Quick Add Product Dialog
- [x] Add Dialog component after quick add supplier dialog in template
- [x] Set v-model:visible="quickProductDialogVisible"
- [x] Set header to $t('products.addProduct')
- [x] Set modal and width: 500px
- [x] Add form-container div inside dialog
- [x] Validation: Dialog opens and closes correctly

### 2.3 Add Form Fields
- [x] Add Product Name field (InputText, required, autofocus)
- [x] Add Supplier field (Dropdown, :options="suppliers", pre-filled)
- [x] Add Unit field (Dropdown, :options="units", required)
- [x] Add proper labels and placeholders for all fields
- [x] Add * indicators for required fields
- [x] Validation: All fields render and accept input

### 2.4 Add Dialog Footer
- [x] Add Cancel button with @click="closeQuickProductDialog"
- [x] Add Create button with @click="saveQuickProduct"
- [x] Add :loading="savingQuickProduct" to Create button
- [x] Style buttons consistently with other dialogs
- [x] Validation: Buttons work and show loading state

## Phase 3: Business Logic Implementation

### 3.1 Implement showQuickProductDialog Function
- [x] Create function accepting rowIndex parameter
- [x] Set quickProductRowIndex.value = rowIndex
- [x] Initialize quickProductForm with empty name and unitId
- [x] Pre-fill supplierId from formData.value.supplierId
- [x] Set quickProductDialogVisible.value = true
- [x] Validation: Dialog opens with supplier pre-filled when available

### 3.2 Implement saveQuickProduct Function
- [x] Add validation for required fields (name, supplierId, unitId)
- [x] Show error toast if validation fails
- [x] Set savingQuickProduct.value = true
- [x] Call api.post('/products', quickProductForm.value)
- [x] Handle success response
- [x] Handle error response
- [x] Set savingQuickProduct.value = false in finally block
- [x] Validation: Product creation API call works correctly

### 3.3 Handle Successful Product Creation
- [x] Show success toast with product name
- [x] Call loadProducts() to refresh product list
- [x] Auto-select new product: formData.value.items[quickProductRowIndex.value].productId = newProduct.id
- [x] Call closeQuickProductDialog()
- [x] Validation: New product appears in dropdown and is auto-selected

### 3.4 Handle Product Creation Errors
- [x] Catch API errors in try-catch
- [x] Display error message from API response if available
- [x] Show generic error toast if no specific message
- [x] Keep dialog open for user to correct
- [x] Don't reset form fields
- [x] Validation: Errors display clearly, dialog stays open

### 3.5 Implement closeQuickProductDialog Function
- [x] Set quickProductDialogVisible.value = false
- [x] Reset quickProductForm to initial state
- [x] Clear quickProductRowIndex.value
- [x] Validation: Dialog closes cleanly, state is reset

## Phase 4: Translations

### 4.1 Add English Translations
- [x] Add products.quickAdd.createSuccess to en.json
- [x] Add products.quickAdd.createFailed to en.json
- [x] Add products.quickAdd.requiredFields to en.json
- [x] Verify products.addProduct exists (reuse)
- [x] Verify products.form.* keys exist (reuse)
- [x] Validation: All English text displays correctly

### 4.2 Add Swedish Translations
- [x] Add products.quickAdd.createSuccess to sv.json
- [x] Add products.quickAdd.createFailed to sv.json
- [x] Add products.quickAdd.requiredFields to sv.json
- [x] Verify Swedish translations for reused keys
- [x] Validation: All Swedish text displays correctly when language is switched

## Phase 5: Testing and Validation

### 5.1 Manual Testing - Happy Path
- [x] Open multi-item purchase dialog
- [x] Select a supplier (e.g., "Happy Homes")
- [x] Click quick add product button
- [x] Verify supplier is pre-filled
- [x] Enter product name "Test Product"
- [x] Select a unit (e.g., "pieces")
- [x] Click Create
- [x] Verify success toast appears
- [x] Verify dialog closes
- [x] Verify "Test Product" appears in product dropdown
- [x] Verify "Test Product" is auto-selected in the row
- [x] Validation: Complete flow works end-to-end

### 5.2 Manual Testing - Validation
- [x] Try creating product with empty name → Verify error
- [x] Try creating product with empty supplier → Verify error
- [x] Try creating product with empty unit → Verify error
- [x] Try creating duplicate product name → Verify error toast
- [x] Validation: All validation errors display correctly

### 5.3 Manual Testing - Edge Cases
- [x] Open quick add without selecting supplier in main form → Verify supplier is empty
- [x] Create product from row 0 → Verify auto-selection in row 0
- [x] Create product from row 2 → Verify auto-selection in row 2, not row 0
- [x] Add multiple rows, quick add from each → Verify correct row selection
- [x] Click Cancel in dialog → Verify no product created, dialog closes
- [x] Open dialog, close it, open again → Verify form is reset
- [x] Validation: All edge cases handled correctly

### 5.4 Manual Testing - Translations
- [x] Test all UI elements in English
- [x] Switch to Swedish, test all UI elements
- [x] Verify success/error messages in both languages
- [x] Validation: All translations correct in both languages

### 5.5 Manual Testing - Integration
- [x] Create product, verify it appears in single purchase dialog
- [x] Create product, verify it appears in Products view
- [x] Verify supplier association in product details
- [x] Verify product can be used in subsequent purchases
- [x] Validation: New products integrate correctly with existing system

### 5.6 Regression Testing
- [x] Verify existing quick add supplier still works
- [x] Verify product dropdown filtering by supplier still works
- [x] Verify multi-item purchase submission still works
- [x] Verify getProductSupplierName() still shows correct supplier
- [x] Validation: No existing functionality broken

## Phase 6: Code Review and Cleanup

### 6.1 Code Quality
- [x] Review code for consistency with existing patterns
- [x] Ensure proper TypeScript typing
- [x] Remove any console.log statements
- [x] Add code comments where needed
- [x] Validation: Code passes linting, no type errors

### 6.2 Performance Check
- [x] Verify no unnecessary re-renders
- [x] Check that loadUnits() is called only once
- [x] Verify product list refresh is efficient
- [x] Validation: No performance issues

### 6.3 Accessibility
- [x] Verify button is keyboard accessible
- [x] Test tab order in dialog
- [x] Verify focus management (autofocus on name field)
- [x] Test with screen reader if possible
- [x] Validation: Meets basic accessibility standards

## Phase 7: Documentation

### 7.1 Update Change Documentation
- [x] Mark all tasks as completed in tasks.md
- [x] Update proposal.md with any deviations
- [x] Document any issues encountered and resolutions
- [x] Validation: Documentation is accurate and complete

## Dependencies

- Phase 2 depends on Phase 1 (need state before UI)
- Phase 3 depends on Phase 2 (need UI before logic)
- Phase 4 can be done in parallel with Phase 2-3
- Phase 5 depends on Phases 1-4 (need everything before testing)
- Phase 6-7 depend on Phase 5 (test before review)

## Parallelizable Work

- Translations (Phase 4) can be done while implementing UI/logic (Phases 2-3)
- Individual form fields (2.3) can be implemented in parallel
- English and Swedish translations (4.1, 4.2) can be done in parallel

## Estimated Effort

- Phase 1: 30 minutes (setup)
- Phase 2: 1 hour (UI)
- Phase 3: 1.5 hours (logic)
- Phase 4: 30 minutes (translations)
- Phase 5: 1 hour (testing)
- Phase 6: 30 minutes (review)
- Phase 7: 15 minutes (docs)
- **Total**: 5-6 hours

## Notes

- Reuse code patterns from existing quick add supplier implementation
- Reference PurchasesView.vue quick add product for guidance
- Ensure consistent styling with existing dialogs
- Test thoroughly in both English and Swedish
- Verify no regression in existing functionality
