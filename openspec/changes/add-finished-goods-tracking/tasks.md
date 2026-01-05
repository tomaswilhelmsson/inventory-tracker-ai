# Tasks: Add Finished Goods Tracking

## Phase 1: Database Schema & Models (Foundation)

### Task 1.1: Create Database Schema
- [ ] Add `FinishedGood` model to Prisma schema
  - Fields: id, name, description, unitId, materialCost, isActive, createdAt
  - Unique constraint on name
  - Foreign key to Unit
  - Indexes on isActive and unitId
- [ ] Add `FinishedGoodsCountItem` model to Prisma schema
  - Fields: id, yearEndCountId, finishedGoodId, expectedQuantity, countedQuantity, variance, materialCostPerUnit, totalValue, createdAt
  - Foreign keys to YearEndCount (cascade) and FinishedGood (restrict)
  - Unique constraint on (yearEndCountId, finishedGoodId)
  - Index on yearEndCountId
- [ ] Generate Prisma migration
- [ ] Test migration on development database
- [ ] Verify indexes are created correctly

**Validation**: Run `npx prisma migrate dev` successfully, check schema with database client

**Dependencies**: None

---

## Phase 2: Backend - Finished Good Management

### Task 2.1: Create Finished Good Service
- [ ] Create `backend/src/services/finishedGoodService.ts`
- [ ] Implement CRUD operations:
  - `create(name, description, unitId, materialCost)`
  - `getAll(filters)` - support isActive filter
  - `getById(id)`
  - `update(id, data)`
  - `updateMaterialCost(id, cost)`
  - `delete(id)` - with cascade check
- [ ] Add validation logic:
  - Name uniqueness
  - Material cost >= 0
  - Unit exists
  - Prevent delete if used in counts

**Validation**: Unit tests for all CRUD operations, error cases

**Dependencies**: Task 1.1

---

### Task 2.2: Create Finished Good API Routes
- [ ] Create `backend/src/routes/finishedGoods.ts`
- [ ] Implement endpoints:
  - `GET /api/finished-goods` - list with filters
  - `GET /api/finished-goods/:id` - get by ID
  - `POST /api/finished-goods` - create
  - `PUT /api/finished-goods/:id` - update
  - `DELETE /api/finished-goods/:id` - delete
  - `PATCH /api/finished-goods/:id/cost` - update cost only
- [ ] Add request validation (express-validator)
- [ ] Add authentication middleware
- [ ] Register routes in server.ts

**Validation**: API integration tests, Postman/curl testing

**Dependencies**: Task 2.1

---

## Phase 3: Backend - Year-End Count Integration

### Task 3.1: Extend Year-End Count Service for Finished Goods
- [ ] Modify `initiateYearEndCount()` to include finished goods:
  - Fetch all active finished goods
  - Create FinishedGoodsCountItem for each
  - Set expectedQuantity from previous year or 0
  - Snapshot materialCostPerUnit from current FinishedGood
- [ ] Create `updateFinishedGoodCountItem(countId, finishedGoodId, countedQuantity)`:
  - Calculate variance (counted - expected)
  - Calculate totalValue (counted × materialCostPerUnit)
  - Update count item
- [ ] Create `calculateFinishedGoodsVariances(countId)`:
  - Aggregate expected, counted, variance, value
  - Count uncounted items
- [ ] Modify `confirmYearEndCount()` to validate finished goods counted
- [ ] Modify `refreshExpectedQuantities()` to handle finished goods

**Validation**: Unit tests for each function, integration tests for workflow

**Dependencies**: Task 2.1, Task 1.1

---

### Task 3.2: Add Finished Goods API Endpoints to Year-End Count
- [ ] Add endpoint: `PUT /api/year-end-count/:id/finished-goods/:finishedGoodId`
  - Update counted quantity
  - Recalculate variance and value
- [ ] Add endpoint: `GET /api/year-end-count/:id/finished-goods-variances`
  - Return summary statistics
- [ ] Modify `GET /api/year-end-count/:id/sheet` to include finished goods items
- [ ] Update validation to require all finished goods counted before confirmation

**Validation**: API integration tests, manual testing with Postman

**Dependencies**: Task 3.1

---

## Phase 4: Backend - PDF Report Enhancement

### Task 4.1: Extend Report Data Generation
- [ ] Modify `generateYearEndReport()` in yearEndCountService:
  - Include finishedGoods object with items array
  - Calculate finished goods totals
  - Calculate grandTotal combining raw materials and finished goods
- [ ] Add finished goods to report data structure:
  ```javascript
  {
    finishedGoods: {
      totalExpected, totalCounted, totalVariance, totalValue,
      items: [{ finishedGoodId, finishedGoodName, ... }]
    },
    grandTotal: { totalValue, rawMaterialsValue, finishedGoodsValue }
  }
  ```

**Validation**: Check report JSON output includes finished goods

**Dependencies**: Task 3.1

---

### Task 4.2: Add Finished Goods Section to PDF
- [ ] Update PDF translations (English & Swedish) in exportService:
  - "Finished Goods Inventory" / "Färdigvaror Inventering"
  - "Unit Cost" / "Styckpris"
  - "Total Finished Goods Value" / "Totalt värde färdigvaror"
- [ ] Add finished goods table after raw materials section:
  - Table headers: Product, Expected, Counted, Variance, Unit Cost, Value
  - Format numbers and currency
  - Color-code variance
  - Handle pagination
- [ ] Add finished goods summary totals after table
- [ ] Add combined totals section (raw materials + finished goods)
- [ ] Update executive summary to include finished goods counts

**Validation**: Generate PDF with finished goods, verify formatting and totals

**Dependencies**: Task 4.1

---

## Phase 5: Frontend - Finished Goods Management UI

### Task 5.1: Create Finished Goods View
- [ ] Create `frontend/src/views/FinishedGoodsView.vue`
- [ ] Implement features:
  - List all finished goods (DataTable with search/filter)
  - Create new finished good dialog
  - Edit finished good dialog
  - Delete with confirmation
  - Active/Inactive toggle
  - Display unit name
  - Format material cost as currency
- [ ] Add form validation:
  - Required fields
  - Unique name
  - Non-negative cost
- [ ] Add success/error toast notifications

**Validation**: Manual UI testing, create/edit/delete operations

**Dependencies**: Task 2.2

---

### Task 5.2: Add Finished Goods to Navigation
- [ ] Add "Finished Goods" menu item to navigation
- [ ] Add route in router configuration
- [ ] Add icon for finished goods menu item
- [ ] Position between "Products" and "Inventory" or similar

**Validation**: Click menu item and verify navigation

**Dependencies**: Task 5.1

---

## Phase 6: Frontend - Year-End Count Integration

### Task 6.1: Add Finished Goods Section to Year-End Count View
- [ ] Modify `YearEndCountView.vue`:
  - Add second Card component for finished goods
  - Create finished goods DataTable (similar to raw materials)
  - Add separate progress tracking for finished goods
  - Update overall progress to combine both sections
  - Add section headers: "Raw Materials" and "Finished Goods"
- [ ] Implement finished goods table columns:
  - Product name
  - Expected quantity
  - Actual count (InputNumber)
  - Variance (Tag with color)
  - Material cost per unit
  - Total value
- [ ] Add auto-save on blur for counted quantities
- [ ] Calculate and display finished goods totals

**Validation**: Manual testing of count entry, verify calculations

**Dependencies**: Task 3.2, Task 5.1

---

### Task 6.2: Update Year-End Count Summary Section
- [ ] Add finished goods summary Card:
  - Total expected
  - Total counted
  - Total variance
  - Total value
- [ ] Add combined totals Card:
  - Raw materials value
  - Finished goods value
  - Grand total
- [ ] Update progress bar to show both sections
- [ ] Update validation to check finished goods counted

**Validation**: View summary with both raw materials and finished goods

**Dependencies**: Task 6.1

---

## Phase 7: Localization & Polish

### Task 7.1: Add Translations
- [ ] Add English translations to `frontend/src/i18n/locales/en.json`:
  - Finished goods management labels
  - Year-end count finished goods section
  - PDF report labels
  - Error messages
  - Success messages
- [ ] Add Swedish translations to `frontend/src/i18n/locales/sv.json`:
  - All corresponding translations
- [ ] Update PDF translations in backend exportService

**Validation**: Switch language and verify all labels translate

**Dependencies**: All frontend tasks

---

### Task 7.2: Add Help Text and Tooltips
- [ ] Add tooltips for finished goods management:
  - Material cost explanation
  - Expected vs counted quantities
  - Variance calculation
- [ ] Add info messages:
  - Empty state for no finished goods
  - First-time year-end count with finished goods
- [ ] Add confirmation dialogs:
  - Delete finished good
  - Cannot delete (used in count)

**Validation**: Hover tooltips, verify messages appear

**Dependencies**: Task 7.1

---

## Phase 8: Testing & Documentation

### Task 8.1: Integration Testing
- [ ] Test complete workflow:
  1. Create finished goods
  2. Initiate year-end count
  3. Enter counts for both raw materials and finished goods
  4. Verify calculations
  5. Confirm count
  6. Generate PDF report
  7. Initiate next year's count (verify carry-forward)
- [ ] Test edge cases:
  - No finished goods
  - Only finished goods
  - Delete/inactive finished goods
  - Material cost changes between years
- [ ] Test PDF export in both languages
- [ ] Test refresh expected quantities with finished goods

**Validation**: All workflows complete successfully

**Dependencies**: All implementation tasks

---

### Task 8.2: Update Documentation
- [ ] Update README if needed
- [ ] Add API documentation for new endpoints
- [ ] Document finished goods workflow in user guide (if exists)
- [ ] Add database schema diagram with new tables
- [ ] Document migration process

**Validation**: Documentation reviewed and accurate

**Dependencies**: Task 8.1

---

## Phase 9: Deployment Preparation

### Task 9.1: Database Migration Script
- [ ] Create production migration checklist
- [ ] Test migration on copy of production database
- [ ] Prepare rollback plan
- [ ] Document backup requirements

**Validation**: Migration runs successfully on test data

**Dependencies**: Task 1.1

---

### Task 9.2: Final Testing & Release
- [ ] Run all automated tests
- [ ] Perform manual UAT (User Acceptance Testing)
- [ ] Create release notes
- [ ] Tag release in git
- [ ] Deploy to production

**Validation**: Production deployment successful, no critical bugs

**Dependencies**: Task 8.1, Task 8.2, Task 9.1

---

## Parallelizable Work

These tasks can be worked on in parallel:
- **Phase 2** (Backend Finished Good Management) + **Phase 5** (Frontend Finished Goods UI)
  - Backend API and Frontend UI can be developed simultaneously
- **Task 7.1** (Translations) can start once UI components are defined
- **Task 8.2** (Documentation) can be written alongside implementation

## Critical Path

The critical path through the tasks is:
1. Task 1.1 (Database Schema) - MUST be first
2. Task 2.1 → Task 2.2 (Backend Services & API)
3. Task 3.1 → Task 3.2 (Year-End Integration Backend)
4. Task 4.1 → Task 4.2 (PDF Report)
5. Task 6.1 → Task 6.2 (Year-End UI)
6. Task 8.1 (Integration Testing)
7. Task 9.2 (Deployment)

## Estimated Effort

- **Phase 1** (Database): 2-4 hours
- **Phase 2** (Backend Finished Goods): 6-8 hours
- **Phase 3** (Backend Year-End Integration): 8-10 hours
- **Phase 4** (PDF Report): 4-6 hours
- **Phase 5** (Frontend Management UI): 6-8 hours
- **Phase 6** (Frontend Year-End UI): 8-10 hours
- **Phase 7** (Localization): 2-4 hours
- **Phase 8** (Testing & Docs): 4-6 hours
- **Phase 9** (Deployment): 2-4 hours

**Total Estimated Effort**: 42-60 hours
