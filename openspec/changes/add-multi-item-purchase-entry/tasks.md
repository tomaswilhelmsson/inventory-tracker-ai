# Implementation Tasks: Multi-Item Purchase Entry

## 1. Database Schema Changes
- [ ] 1.1 Create `PurchaseBatch` model in Prisma schema
- [ ] 1.2 Add `batchId` nullable column to `PurchaseLot` model
- [ ] 1.3 Add foreign key relationship from `PurchaseLot` to `PurchaseBatch`
- [ ] 1.4 Add index on `PurchaseLot.batchId`
- [ ] 1.5 Generate and test database migration
- [ ] 1.6 Update test database schema in `backend/tests/setup.ts`

## 2. Backend Service Layer
- [ ] 2.1 Create `createBatch()` method in `purchaseService.ts`
  - [ ] 2.1.1 Validate at least 1 line item exists
  - [ ] 2.1.2 Validate all products belong to same supplier
  - [ ] 2.1.3 Calculate unit cost from total cost (or vice versa) per item
  - [ ] 2.1.4 Calculate shipping allocation per item proportionally
  - [ ] 2.1.5 Validate invoice total matches sum of items + shipping (±$0.01)
  - [ ] 2.1.6 Validate purchase date not in locked year
  - [ ] 2.1.7 Create PurchaseBatch record in transaction
  - [ ] 2.1.8 Create all PurchaseLot records with batchId in same transaction
  - [ ] 2.1.9 Return batch and lots with complete snapshots
- [ ] 2.2 Create `getBatchById()` method to retrieve batch with all lots
- [ ] 2.3 Modify `getAll()` to optionally filter by `batchId`
- [ ] 2.4 Modify `getById()` to include batch info if lot is part of batch
- [ ] 2.5 Create helper function `calculateShippingAllocation()` for proportional distribution
- [ ] 2.6 Create helper function `validateInvoiceTotal()` with rounding tolerance

## 3. Backend API Routes
- [ ] 3.1 Create `POST /api/purchases/batch` endpoint
  - [ ] 3.1.1 Add express-validator validation rules for batch request
  - [ ] 3.1.2 Validate request body structure and required fields
  - [ ] 3.1.3 Call `createBatch()` service method
  - [ ] 3.1.4 Return 201 with batch and lots data
  - [ ] 3.1.5 Handle validation errors with detailed messages
- [ ] 3.2 Create `GET /api/purchases/batch/:id` endpoint to retrieve batch details
- [ ] 3.3 Modify `GET /api/purchases` to accept `?batchId=X` query parameter
- [ ] 3.4 Modify `GET /api/purchases/:id` response to include batch metadata if applicable

## 4. Backend Testing
- [ ] 4.1 Unit tests for `createBatch()` service
  - [ ] 4.1.1 Test successful batch creation with 3 items
  - [ ] 4.1.2 Test shipping allocation calculation (verify example: $5, $5, $10 items with $10 shipping)
  - [ ] 4.1.3 Test unit cost calculation from total cost
  - [ ] 4.1.4 Test total cost calculation from unit cost
  - [ ] 4.1.5 Test invoice total validation success (exact match)
  - [ ] 4.1.6 Test invoice total validation success (within $0.01 tolerance)
  - [ ] 4.1.7 Test invoice total validation failure (mismatch > $0.01)
  - [ ] 4.1.8 Test rejection when products from different suppliers
  - [ ] 4.1.9 Test rejection for locked year
  - [ ] 4.1.10 Test rejection with 0 line items
  - [ ] 4.1.11 Test transaction rollback on error
- [ ] 4.2 Integration tests for `POST /api/purchases/batch`
  - [ ] 4.2.1 Test valid batch creation returns 201 with correct structure
  - [ ] 4.2.2 Test invalid request returns 400 with validation errors
  - [ ] 4.2.3 Test all lots created have correct batchId
  - [ ] 4.2.4 Test snapshots preserved correctly
- [ ] 4.3 Test backward compatibility (single-item purchases still work with batchId=NULL)

## 5. Frontend Multi-Item Purchase Component
- [ ] 5.1 Create `MultiItemPurchaseDialog.vue` component
  - [ ] 5.1.1 Create dialog layout with header and form sections
  - [ ] 5.1.2 Add supplier dropdown (required, shared across items)
  - [ ] 5.1.3 Add purchase date picker (required, shared across items)
  - [ ] 5.1.4 Add verification number input (optional text field)
  - [ ] 5.1.5 Add shipping cost input (number field, default $0.00)
  - [ ] 5.1.6 Add invoice total input (number field, validates against calculated)
- [ ] 5.2 Create line items editable DataTable
  - [ ] 5.2.1 Product column (dropdown with filter/search)
  - [ ] 5.2.2 Quantity column (number input, min 1)
  - [ ] 5.2.3 Unit Cost column (currency input, auto-calc if total provided)
  - [ ] 5.2.4 Total Cost column (currency input, auto-calc if unit cost provided)
  - [ ] 5.2.5 Shipping Allocation column (read-only, calculated)
  - [ ] 5.2.6 Final Unit Cost column (read-only, calculated with shipping)
  - [ ] 5.2.7 Actions column (delete row button)
  - [ ] 5.2.8 Footer row showing subtotal, shipping, grand total
- [ ] 5.3 Implement table row management
  - [ ] 5.3.1 "Add Item" button to insert new row
  - [ ] 5.3.2 Delete row functionality (minimum 1 row enforced)
  - [ ] 5.3.3 Initialize with 1 empty row on dialog open
- [ ] 5.4 Implement cost calculation logic
  - [ ] 5.4.1 When unit cost changes → calculate total cost = unit cost × quantity
  - [ ] 5.4.2 When total cost changes → calculate unit cost = total cost / quantity
  - [ ] 5.4.3 Make opposite field read-only based on which was entered
  - [ ] 5.4.4 Calculate shipping allocation per row based on proportional formula
  - [ ] 5.4.5 Calculate final unit cost = unit cost + (shipping allocation / quantity)
- [ ] 5.5 Implement real-time validation
  - [ ] 5.5.1 Calculate expected invoice total = sum(line items total cost) + shipping
  - [ ] 5.5.2 Compare entered invoice total vs expected (within $0.01 tolerance)
  - [ ] 5.5.3 Display green checkmark if match, red X if mismatch
  - [ ] 5.5.4 Show difference amount if mismatch exists
  - [ ] 5.5.5 Disable submit button if validation fails
  - [ ] 5.5.6 Validate all products are from same supplier
- [ ] 5.6 Implement form submission
  - [ ] 5.6.1 Gather batch-level data and line items array
  - [ ] 5.6.2 Call `POST /api/purchases/batch` endpoint
  - [ ] 5.6.3 Handle success: show toast, close dialog, refresh purchase list
  - [ ] 5.6.4 Handle errors: display validation messages inline

## 6. Frontend Integration
- [ ] 6.1 Add "Add Multi-Item Purchase" button to `PurchasesView.vue`
  - [ ] 6.1.1 Position next to existing "Add Purchase" button
  - [ ] 6.1.2 Use distinct icon (e.g., pi-list or pi-table)
  - [ ] 6.1.3 Open `MultiItemPurchaseDialog` on click
- [ ] 6.2 Modify purchases list to display batch indicator
  - [ ] 6.2.1 Add "Batch" column showing batch ID or "-" if single
  - [ ] 6.2.2 Add badge/tag for lots that are part of a batch
  - [ ] 6.2.3 Make batch ID clickable to filter by batch
- [ ] 6.3 Modify purchase detail view to show batch context
  - [ ] 6.3.1 Display "Part of Invoice #ABC123" badge if batchId exists
  - [ ] 6.3.2 Add link to view all lots in same batch
- [ ] 6.4 Add batch filtering to purchases list
  - [ ] 6.4.1 Add filter dropdown "Show: All | Batch Purchases | Single Purchases"
  - [ ] 6.4.2 Update API call with batchId filter when selected

## 7. Internationalization (i18n)
- [ ] 7.1 Add English translations in `frontend/src/i18n/locales/en.json`
  - [ ] 7.1.1 Multi-item dialog title and labels
  - [ ] 7.1.2 Table column headers (Product, Quantity, Unit Cost, Total Cost, etc.)
  - [ ] 7.1.3 Validation messages (invoice mismatch, supplier mismatch, etc.)
  - [ ] 7.1.4 Button labels (Add Item, Remove, Submit, Cancel)
  - [ ] 7.1.5 Tooltips and help text
- [ ] 7.2 Add Swedish translations in `frontend/src/i18n/locales/sv.json`
  - [ ] 7.2.1 Mirror all English keys with Swedish translations

## 8. Documentation
- [ ] 8.1 Update user guide with multi-item purchase workflow
  - [ ] 8.1.1 Add section explaining when to use batch vs single-item
  - [ ] 8.1.2 Document shipping allocation formula with example
  - [ ] 8.1.3 Explain invoice total validation
- [ ] 8.2 Add API documentation for new endpoints
  - [ ] 8.2.1 Document `POST /api/purchases/batch` request/response schema
  - [ ] 8.2.2 Document query parameters for batch filtering
- [ ] 8.3 Add inline code comments explaining shipping calculation algorithm

## 9. Edge Cases and Polish
- [ ] 9.1 Handle keyboard navigation in line items table (Tab, Enter to add row)
- [ ] 9.2 Add loading state during batch submission
- [ ] 9.3 Add confirmation dialog if user tries to close with unsaved changes
- [ ] 9.4 Display helpful tooltips on shipping allocation column
- [ ] 9.5 Format currency consistently (2 decimal places)
- [ ] 9.6 Handle product dropdown loading states
- [ ] 9.7 Auto-populate supplier when first product selected
- [ ] 9.8 Add year lock warning banner if date in locked year

## 10. End-to-End Testing
- [ ] 10.1 Manual test: Create batch with 3 items, verify lots created correctly
- [ ] 10.2 Manual test: Verify shipping allocation matches formula
- [ ] 10.3 Manual test: Test invoice total validation (match, mismatch, tolerance)
- [ ] 10.4 Manual test: Verify single-item flow unchanged
- [ ] 10.5 Manual test: Test batch filtering in purchases list
- [ ] 10.6 Manual test: Test year lock prevents batch creation
- [ ] 10.7 Performance test: Create batch with 50 items (ensure reasonable speed)
- [ ] 10.8 Regression test: Verify existing FIFO calculations unaffected

## Summary
**Total Tasks**: 98
**Database**: 6 tasks
**Backend**: 28 tasks
**Frontend**: 48 tasks
**i18n**: 9 tasks
**Documentation**: 3 tasks
**Testing/QA**: 10 tasks
