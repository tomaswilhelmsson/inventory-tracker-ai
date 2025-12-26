# Implementation Tasks: Add VAT Handling

## Phase 1: Foundation & Configuration (2 tasks)

### 1.1 Add VAT Configuration
- [ ] Add `DEFAULT_VAT_RATE` to backend `.env.example` (e.g., 0.25 for 25%)
- [ ] Add `VAT_RATE` to `backend/src/utils/config.ts`
- [ ] Validate VAT rate is between 0 and 1
- [ ] Add environment variable documentation

**Validation**: Server starts with valid VAT_RATE config, rejects invalid values

### 1.2 Database Schema Migration
- [ ] Add columns to `PurchaseLot` table:
  - `vatRate Float @default(0)` - VAT rate used (e.g., 0.25 for 25%)
  - `unitCostInclVAT Float?` - Unit cost including VAT (nullable for backward compat)
  - `unitCostExclVAT Float` - Unit cost excluding VAT (rename existing `unitCost`)
- [ ] Add columns to `PurchaseBatch` table:
  - `vatRate Float @default(0)` - VAT rate for entire batch
  - `invoiceTotalInclVAT Float` - Total from invoice (including VAT)
  - `invoiceTotalExclVAT Float` - Calculated total excluding VAT
  - `pricesIncludeVAT Boolean @default(true)` - Entry mode toggle
- [ ] Create Prisma migration
- [ ] Update `backend/tests/setup.ts` with new schema
- [ ] Write migration script to populate `unitCostExclVAT` from existing `unitCost`

**Validation**: `npx prisma migrate dev`, all tests pass, data integrity maintained

**Dependencies**: None (can run in parallel with 1.1)

---

## Phase 2: Backend Services (4 tasks)

### 2.1 VAT Calculation Utilities
- [ ] Create `backend/src/utils/vatCalculations.ts`:
  - `calculateExclVAT(inclVAT: number, vatRate: number): number`
  - `calculateInclVAT(exclVAT: number, vatRate: number): number`
  - `validateVATTotal(items: {qty, unitCost}[], shipping, expectedTotal, tolerance): boolean`
- [ ] Add unit tests for VAT calculations
- [ ] Handle rounding to 2 decimal places

**Validation**: Unit tests pass with various VAT rates and edge cases

**Dependencies**: 1.2 (schema)

### 2.2 Update Purchase Service (Single-Item)
- [ ] Update `purchaseService.create()`:
  - Accept `vatRate`, `pricesIncludeVAT` parameters
  - Calculate and store both `unitCostInclVAT` and `unitCostExclVAT`
  - Use VAT-exclusive cost for FIFO `unitCost` field
- [ ] Update `purchaseService.getAll()` to return VAT fields
- [ ] Update `purchaseService.getById()` to return VAT fields
- [ ] Add validation for VAT rate (0-1 range)
- [ ] Update existing tests

**Validation**: Existing purchase tests pass, new VAT scenarios covered

**Dependencies**: 2.1 (VAT utilities)

### 2.3 Update Purchase Batch Service (Multi-Item)
- [ ] Update `purchaseService.createBatch()`:
  - Accept `vatRate`, `pricesIncludeVAT` at batch level
  - Calculate line items based on `pricesIncludeVAT` toggle
  - Validate invoice total (incl VAT) matches calculated total
  - Store both inclusive and exclusive amounts
  - Apply shipping allocation to VAT-exclusive amounts
- [ ] Update batch retrieval to include VAT fields
- [ ] Update validation logic for invoice total matching
- [ ] Add comprehensive unit tests for both modes

**Validation**: Batch purchase tests pass in both "include VAT" and "exclude VAT" modes

**Dependencies**: 2.1 (VAT utilities), 2.2 (single-item updated)

### 2.4 Update Year-End Count Service
- [ ] Verify FIFO calculations use `unitCostExclVAT`
- [ ] Update inventory valuation to use VAT-exclusive amounts
- [ ] Update year-end reports to show VAT-exclusive values
- [ ] Add VAT summary section to reports (total VAT paid per product)
- [ ] Add tests confirming VAT-exclusive accounting

**Validation**: Year-end count calculations match expected VAT-exclusive totals

**Dependencies**: 2.2 (purchase service updated)

---

## Phase 3: Frontend UI (5 tasks)

### 3.1 Add i18n Translations
- [ ] Add VAT-related keys to `frontend/src/i18n/locales/en.json`:
  - `purchases.form.vatRate`
  - `purchases.form.pricesIncludeVAT`
  - `purchases.form.pricesIncludeVATHint`
  - `purchases.multiItem.vatSettings`
  - `purchases.multiItem.vatSummary`
  - `purchases.display.inclVAT` / `purchases.display.exclVAT`
- [ ] Add Swedish translations to `sv.json`

**Validation**: All new translation keys exist in both languages

**Dependencies**: None (can run in parallel)

### 3.2 Update Single-Item Purchase Dialog
- [ ] Add "Prices Include VAT" checkbox to `PurchasesView.vue`
- [ ] Add VAT rate input (default from config, allow override)
- [ ] Show real-time VAT-exclusive calculation when checkbox checked
- [ ] Update API call to send VAT parameters
- [ ] Add help text explaining the toggle
- [ ] Update purchase list to show VAT amounts (optional column)

**Validation**: Can create purchases in both modes, correct amounts stored

**Dependencies**: 2.2 (backend service), 3.1 (translations)

### 3.3 Update Multi-Item Purchase Dialog
- [ ] Add "Prices Include VAT" toggle to `MultiItemPurchaseDialog.vue`
  - Position above invoice total field
  - Default to CHECKED (prices include VAT)
- [ ] Add VAT rate input (batch-level)
- [ ] Update invoice total validation:
  - If checked: validate incl-VAT line items + shipping = invoice total
  - If unchecked: calculate VAT, validate calculated incl-VAT = invoice total
- [ ] Show VAT breakdown in summary section:
  - Subtotal (excl VAT)
  - VAT amount
  - Shipping
  - Total (incl VAT)
- [ ] Update line item columns to show both incl/excl VAT
- [ ] Update API call to send `vatRate` and `pricesIncludeVAT`

**Validation**: Multi-item purchases work in both modes with correct validation

**Dependencies**: 2.3 (backend batch service), 3.1 (translations)

### 3.4 Add VAT Display Toggle to Purchase List
- [ ] Add filter/toggle to show costs "Including VAT" or "Excluding VAT"
- [ ] Default to "Excluding VAT" (matches year-end reports)
- [ ] Update DataTable columns to display selected view
- [ ] Show VAT rate in purchase detail tooltip

**Validation**: Purchase list correctly displays both views

**Dependencies**: 3.2, 3.3 (purchase dialogs updated)

### 3.5 Update Reports View
- [ ] Ensure year-end reports display VAT-exclusive values
- [ ] Add optional VAT summary section showing:
  - Total purchases (excl VAT)
  - Total VAT paid
  - Total purchases (incl VAT)
- [ ] Group by VAT rate if multiple rates used

**Validation**: Reports show accurate VAT-exclusive accounting

**Dependencies**: 2.4 (backend reports updated)

---

## Phase 4: Data Migration & Testing (3 tasks)

### 4.1 Create Migration Script for Existing Data
- [ ] Create `backend/scripts/migrate-vat-data.ts`:
  - Read all existing `PurchaseLot` records
  - Set `vatRate = 0` (or configurable default)
  - Copy `unitCost` to `unitCostExclVAT`
  - Calculate `unitCostInclVAT = unitCostExclVAT * (1 + vatRate)`
  - Update records in batches
- [ ] Add verification queries
- [ ] Create rollback script (optional safety measure)
- [ ] Document migration process in README

**Validation**: Migration script runs successfully on test database, all records updated

**Dependencies**: 1.2 (schema migration)

### 4.2 End-to-End Testing
- [ ] Test single-item purchase with VAT included
- [ ] Test single-item purchase with VAT excluded
- [ ] Test multi-item batch with VAT included
- [ ] Test multi-item batch with VAT excluded
- [ ] Test invoice total validation with VAT mismatch
- [ ] Test year-end count with VAT-exclusive calculations
- [ ] Test purchase list display toggle
- [ ] Test data migration on production-like dataset

**Validation**: All workflows function correctly, no regressions

**Dependencies**: All Phase 3 tasks complete

### 4.3 Documentation
- [ ] Update `FEATURE_COMPLETE.md` with VAT handling
- [ ] Add VAT configuration to `QUICK_START.md`
- [ ] Document VAT calculation formulas
- [ ] Add user guide for "Prices Include VAT" toggle
- [ ] Document migration process for existing systems

**Validation**: Documentation is clear and complete

**Dependencies**: All implementation complete

---

## Summary

- **Total Tasks**: 14
- **Parallelizable**: Tasks 1.1, 1.2, 3.1 can start immediately
- **Critical Path**: 1.2 → 2.1 → 2.2 → 2.3 → 3.3 → 4.2
- **Estimated Effort**: 6 development days
- **Risk Areas**: 
  - VAT calculation rounding
  - Invoice total validation tolerance
  - User confusion with toggle
  - Data migration for large datasets

## Testing Checklist

- [ ] Unit tests for VAT calculations
- [ ] Integration tests for purchase creation (both modes)
- [ ] E2E tests for multi-item purchase workflow
- [ ] Migration script validation
- [ ] Year-end report accuracy
- [ ] Backward compatibility (0% VAT for old data)
- [ ] Edge cases: 0% VAT, 100% VAT, rounding issues
