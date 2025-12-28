# Tasks: Add Disable Products and Suppliers

## Phase 1: Database & Backend Foundation

### 1.1 Database Schema
- [ ] Add `isActive` field to Product model in Prisma schema
  - Field: `isActive Boolean @default(true)`
  - Add index: `@@index([isActive])`
  - Validation: Generate migration with `npx prisma migrate dev`
  - Test: Verify schema generation with `npx prisma generate`

- [ ] Add `isActive` field to Supplier model in Prisma schema
  - Field: `isActive Boolean @default(true)`
  - Add index: `@@index([isActive])`
  - Validation: Same migration as Product
  - Test: Verify both fields added correctly

### 1.2 Database Migration
- [ ] Create and test migration script
  - Run `npx prisma migrate dev --name add_isactive_fields`
  - Verify both products and suppliers tables have `isActive` column
  - Verify default value is `true` for existing records
  - Validation: Query database to confirm all existing records have `isActive = true`

### 1.3 Product Service Updates
- [ ] Update `backend/src/services/productService.ts`
  - Modify `getAll()`: Add `includeInactive` parameter (default: false)
  - Add filtering logic: `where.isActive = filters?.includeInactive !== true ? true : undefined`
  - Add `toggleActive(id)` method to toggle `isActive` status
  - Validation: Unit tests for new parameter and method

### 1.4 Supplier Service Updates
- [ ] Update `backend/src/services/supplierService.ts`
  - Modify `getAll()`: Add `includeInactive` parameter (default: false)
  - Add filtering logic: `where.isActive = filters?.includeInactive !== true ? true : undefined`
  - Add `toggleActive(id)` method to toggle `isActive` status
  - Validation: Unit tests for new parameter and method

### 1.5 Product Routes Updates
- [ ] Update `backend/src/routes/products.ts`
  - Modify GET `/api/products`: Add `includeInactive` query parameter validation
  - Add PATCH `/api/products/:id/toggle-active` endpoint
  - Add request validation for toggle endpoint
  - Validation: Integration tests, curl/Postman testing

### 1.6 Supplier Routes Updates
- [ ] Update `backend/src/routes/suppliers.ts`
  - Modify GET `/api/suppliers`: Add `includeInactive` query parameter validation
  - Add PATCH `/api/suppliers/:id/toggle-active` endpoint
  - Add request validation for toggle endpoint
  - Validation: Integration tests, curl/Postman testing

### 1.7 Inventory Service Updates (Optional)
- [ ] Update `backend/src/services/inventoryService.ts`
  - Modify inventory summary to include disabled products with stock > 0
  - Add logic: `item.product.isActive || item.totalQuantity > 0`
  - Validation: Test with disabled products that have inventory

## Phase 2: Frontend Implementation

### 2.1 ProductsView Updates
- [ ] Update `frontend/src/views/ProductsView.vue`
  - Add `showDisabled` ref state variable (default: false)
  - Add toggle button in header ("Show Disabled" / "Hide Disabled")
  - Update `fetchProducts()` to include `includeInactive` query parameter
  - Add watch on `showDisabled` to refetch when toggled
  - Add visual indicator for disabled products (grayed text, strikethrough, tag)
  - Add `toggleActive()` method with confirmation dialog
  - Add Enable/Disable button in actions column
  - Validation: Component renders, all interactions work

### 2.2 SuppliersView Updates
- [ ] Update `frontend/src/views/SuppliersView.vue`
  - Add `showDisabled` ref state variable (default: false)
  - Add toggle button in header
  - Update `fetchSuppliers()` to include `includeInactive` query parameter
  - Add watch on `showDisabled` to refetch when toggled
  - Add visual indicator for disabled suppliers
  - Add `toggleActive()` method with confirmation dialog
  - Add Enable/Disable button in actions column
  - Validation: Component renders, all interactions work

### 2.3 PurchasesView Dropdown Filtering
- [ ] Update `frontend/src/views/PurchasesView.vue`
  - Update `fetchProducts()` to explicitly exclude inactive: `?includeInactive=false`
  - Update `fetchSuppliers()` to explicitly exclude inactive: `?includeInactive=false`
  - Validation: Verify disabled items don't appear in dropdowns

### 2.4 Multi-Item Purchase Dialog Filtering
- [ ] Update multi-item purchase dialog in PurchasesView
  - Ensure product dropdown filters out disabled products
  - Ensure supplier dropdown filters out disabled suppliers
  - Validation: Create multi-item purchase with active items only

### 2.5 Inventory View Updates
- [ ] Update `frontend/src/views/InventoryView.vue`
  - Add visual indicator if disabled product appears (has stock)
  - Optionally add toggle to show/hide disabled with zero stock
  - Validation: Disabled products with stock are visible

### 2.6 Internationalization (i18n)
- [ ] Add translations to `frontend/src/i18n/locales/en.json`
  - `common.showDisabled`: "Show Disabled"
  - `common.hideDisabled`: "Hide Disabled"
  - `common.disabled`: "Disabled"
  - `common.enable`: "Enable"
  - `common.disable`: "Disable"
  - `products.messages.disableSuccess`: "Product disabled successfully"
  - `products.messages.enableSuccess`: "Product enabled successfully"
  - `products.messages.disableConfirm`: "Are you sure you want to disable \"{name}\"?"
  - `products.messages.enableConfirm`: "Are you sure you want to enable \"{name}\"?"
  - Similar entries for suppliers
  
- [ ] Add translations to `frontend/src/i18n/locales/sv.json`
  - Swedish translations for all above keys
  - Validation: Test in Swedish language mode

### 2.7 Styling
- [ ] Add CSS styles for disabled items
  - `.disabled-item` class with grayed out text and/or strikethrough
  - Ensure Tag/Badge styling for "Disabled" label
  - Responsive header layout for toggle button
  - Validation: Visual review in browser

## Phase 3: Testing & Validation

### 3.1 Backend Unit Tests
- [ ] Test productService.getAll() filtering
  - Test default behavior (active only)
  - Test with `includeInactive: true` (all products)
  - Test with `includeInactive: false` (explicit active only)
  
- [ ] Test productService.toggleActive()
  - Test toggling active to inactive
  - Test toggling inactive to active
  - Test with non-existent product (should throw 404)
  
- [ ] Test supplierService.getAll() filtering
  - Similar tests as product service
  
- [ ] Test supplierService.toggleActive()
  - Similar tests as product service

### 3.2 Backend Integration Tests
- [ ] Test GET /api/products
  - Test default returns only active
  - Test `?includeInactive=true` returns all
  - Test `?includeInactive=false` returns only active
  - Test requires authentication
  
- [ ] Test PATCH /api/products/:id/toggle-active
  - Test successful toggle (both directions)
  - Test 404 for non-existent product
  - Test requires authentication
  
- [ ] Test GET /api/suppliers
  - Similar tests as products
  
- [ ] Test PATCH /api/suppliers/:id/toggle-active
  - Similar tests as products

### 3.3 Frontend Component Tests
- [ ] Test ProductsView
  - Test renders with toggle button
  - Test default shows only active products
  - Test toggle shows all products
  - Test visual indicators for disabled products
  - Test disable button shows confirmation
  - Test enable button shows confirmation
  
- [ ] Test SuppliersView
  - Similar tests as ProductsView
  
- [ ] Test PurchasesView dropdowns
  - Test product dropdown excludes disabled
  - Test supplier dropdown excludes disabled

### 3.4 End-to-End Testing
- [ ] Manual E2E workflow: Product disable/enable
  - Create active product
  - Verify appears in purchase dropdown
  - Disable product via ProductsView
  - Verify hidden from purchase dropdown
  - Verify visible in ProductsView with "Show Disabled"
  - Re-enable product
  - Verify appears in purchase dropdown again
  
- [ ] Manual E2E workflow: Supplier disable/enable
  - Similar workflow as product
  
- [ ] Manual E2E workflow: Historical data
  - Create product, create purchase with product
  - Disable product
  - Verify purchase history still shows product correctly
  - Verify inventory shows product if stock remains
  
- [ ] Manual E2E workflow: Search with disabled items
  - Create products with similar names (some active, some disabled)
  - Test search with toggle OFF (active only)
  - Test search with toggle ON (all)

### 3.5 Database Migration Testing
- [ ] Test migration on test database
  - Backup test database
  - Run migration
  - Verify all existing products have `isActive = true`
  - Verify all existing suppliers have `isActive = true`
  - Verify indexes created
  - Test rollback if needed

## Phase 4: Documentation & Deployment

### 4.1 Update Seed Data
- [ ] Update `backend/prisma/seed.ts` if needed
  - Ensure seed creates products/suppliers with `isActive = true`
  - Optionally add a few disabled items for testing
  - Validation: Fresh seed creates complete dataset

### 4.2 Update Error Messages
- [ ] Enhance delete error messages
  - Update product delete error to suggest disabling: "Cannot delete product with purchase history. Consider disabling instead."
  - Update supplier delete error similarly
  - Validation: Test delete attempts on items with history

### 4.3 API Documentation
- [ ] Document new query parameter
  - Add `includeInactive` to API documentation
  - Document default behavior (active only)
  - Document toggle endpoint
  
### 4.4 Deployment Preparation
- [ ] Create deployment checklist
  - Database backup step (critical!)
  - Migration execution: `npx prisma migrate deploy`
  - Backend deployment
  - Frontend deployment
  - Validation queries to confirm migration success
  - Rollback plan (restore backup, revert code)

## Dependencies

- Task 1.2 depends on 1.1 (schema must be defined before migration)
- Tasks 1.3-1.6 can be done in parallel after 1.2
- Phase 2 depends on Phase 1 completion (backend must be ready)
- Tasks 2.1-2.5 can be done in parallel
- Task 2.6 (i18n) should be done before final testing
- Phase 3 can run in parallel with late Phase 2 tasks
- Phase 4 wraps up after all testing

## Parallelizable Work

- Backend service updates (1.3, 1.4) and route updates (1.5, 1.6) can be developed simultaneously
- Frontend view updates (2.1, 2.2, 2.3, 2.4, 2.5) can be developed in parallel
- Unit tests (3.1) can be written alongside backend development
- Component tests (3.3) can be written alongside frontend development

## Estimated Effort

- Phase 1: 4-6 hours (database + backend)
- Phase 2: 6-8 hours (frontend UI + filtering)
- Phase 3: 4-5 hours (testing)
- Phase 4: 1-2 hours (documentation + deployment prep)
- **Total**: 15-21 hours

## Notes

- Keep backward compatibility: Default behavior is active-only (existing API consumers unaffected)
- No cascading behavior: Disabling supplier does not auto-disable products
- Historical data is sacred: All purchase history remains intact
- Visual feedback is important: Clear indicators when items are disabled
- Easy to reverse: Re-enabling should be simple and immediate
