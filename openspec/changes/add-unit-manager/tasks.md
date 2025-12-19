# Tasks: Add Unit Manager

## Phase 1: Database & Backend Foundation

### 1.1 Database Schema
- [x] Add `Unit` model to Prisma schema
  - Fields: `id`, `name`, `createdAt`
  - Unique constraint on `name`
  - Validation: Create migration script
  - Test: Verify schema generation with `prisma generate`

### 1.2 Update Product Model
- [x] Change Product.unit from String to relation
  - Add `unitId Int` field
  - Add `unit Unit @relation(...)` relation
  - Add foreign key constraint with `onDelete: Restrict`
  - Validation: Generate migration, test cascade protection

### 1.3 Database Migration
- [x] Create and test migration script
  - Create units table
  - Seed default units (pieces, kg, g, liters, ml, m, m2, m3, boxes, pallets, rolls)
  - Migrate existing product.unit strings to unit references
  - Validation: Run migration on test database, verify data integrity

### 1.4 Unit Service
- [x] Create `backend/src/services/unitService.ts`
  - `getAll()`: Fetch all units with product count
  - `getById(id)`: Fetch single unit with related products
  - `create(data)`: Create new unit with name validation
  - `update(id, data)`: Update unit name
  - `delete(id)`: Delete unit with cascade check
  - Validation: Unit tests for each method

### 1.5 Unit Routes
- [x] Create `backend/src/routes/units.ts`
  - `GET /api/units`: List all units
  - `GET /api/units/:id`: Get unit by ID
  - `POST /api/units`: Create unit
  - `PUT /api/units/:id`: Update unit
  - `DELETE /api/units/:id`: Delete unit
  - Validation: Integration tests, Postman/curl testing

### 1.6 Register Unit Routes
- [x] Update `backend/src/server.ts` to include unit routes
  - Add `/api/units` route registration
  - Validation: Start server, test endpoint accessibility

## Phase 2: Frontend Implementation

### 2.1 Units View Component
- [x] Create `frontend/src/views/UnitsView.vue`
  - DataTable with columns: name, product count, actions
  - Search/filter functionality
  - Create/Edit dialog with name input
  - Delete confirmation with warning if unit in use
  - Empty state message
  - Validation: Component renders, all interactions work

### 2.2 API Service
- [x] Update `frontend/src/services/api.ts` (if needed)
  - Ensure axios instance configured for unit endpoints
  - Validation: API calls work from component

### 2.3 Router Configuration
- [x] Add Units route to `frontend/src/router/index.ts`
  - Path: `/units`
  - Name: `units`
  - Meta: `requiresAuth: true`
  - Validation: Navigation works

### 2.4 Navigation Menu
- [x] Update main navigation to include Units link
  - Add menu item between Products and Purchases
  - Icon: `pi-tag` or similar
  - Validation: Link appears, navigation works

### 2.5 Update ProductsView
- [x] Modify `frontend/src/views/ProductsView.vue`
  - Replace hardcoded `unitOptions` array with API fetch
  - Update product form to use `unitId` instead of `unit` string
  - Display unit name in product table
  - Handle loading state for units dropdown
  - Validation: Products CRUD continues to work

### 2.6 Update Other Views
- [x] Verify and update unit display in all views
  - `InventoryView.vue`: Ensure unit.name displays correctly (already done previously)
  - `PurchasesView.vue`: Ensure unit.name displays correctly (already done previously)
  - `YearEndCountView.vue`: Ensure unit.name displays correctly (already done previously)
  - `DashboardView.vue`: Ensure unit.name displays correctly (already done previously)
  - `ReportsView.vue`: Ensure unit.name displays correctly (if applicable)
  - Validation: All views show unit names correctly

## Phase 3: Testing & Validation

### 3.1 Backend Tests
- [ ] Unit tests for unitService
  - Test all CRUD operations
  - Test cascade protection
  - Test uniqueness constraint
  - Test error handling

### 3.2 Integration Tests
- [ ] Test API endpoints
  - Test all HTTP methods
  - Test authentication
  - Test validation errors
  - Test cascade scenarios

### 3.3 Frontend Tests
- [ ] Component tests for UnitsView
  - Test rendering
  - Test CRUD interactions
  - Test error states
  - Test empty states

### 3.4 End-to-End Testing
- [ ] Manual testing workflow
  - Create new unit
  - Assign unit to product
  - Attempt to delete unit in use (should fail)
  - Delete unused unit (should succeed)
  - Edit unit name
  - Verify unit displays in all views
  - Test year-end count with custom units

### 3.5 Migration Testing
- [x] Test database migration
  - Backup existing database
  - Run migration on copy
  - Verify all existing products mapped correctly
  - Verify no data loss
  - Test rollback if needed

## Phase 4: Documentation & Deployment

### 4.1 Update Seed Data
- [x] Update `backend/prisma/seed.ts`
  - Create default units
  - Update product creation to reference units
  - Validation: Fresh seed creates complete dataset

### 4.2 Documentation
- [ ] Update README or docs
  - Document unit management feature
  - Include screenshots if applicable
  - Note migration steps for existing deployments

### 4.3 Deployment Preparation
- [ ] Create deployment checklist
  - Database backup step
  - Migration execution order
  - Rollback plan
  - Validation queries

## Dependencies

- Task 1.2 depends on 1.1 (schema must exist before relations)
- Task 1.3 depends on 1.2 (migration needs final schema)
- Tasks 1.4-1.6 can be done in parallel after 1.3
- Phase 2 depends on Phase 1 completion
- Task 2.5 depends on 2.1 (Units API must exist)
- Phase 3 can run in parallel with late Phase 2 tasks
- Phase 4 wraps up after all testing

## Parallelizable Work

- Backend routes (1.5) and service (1.4) can be developed simultaneously
- Frontend components (2.1) and router (2.3) can be developed in parallel
- All view updates in 2.6 can be done in parallel
- Testing in Phase 3 can begin as soon as respective components are ready

## Estimated Effort

- Phase 1: 4-6 hours
- Phase 2: 6-8 hours
- Phase 3: 3-4 hours
- Phase 4: 1-2 hours
- **Total**: 14-20 hours
