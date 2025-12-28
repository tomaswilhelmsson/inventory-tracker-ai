# Tasks: Support Multiple Suppliers per Product

## Phase 1: Database & Backend Foundation (Parallelizable)

- [ ] **1.1** Update Prisma schema with ProductSupplier model
  - Add ProductSupplier junction table definition
  - Add unique constraint on (productId, supplierId)
  - Add indexes for performance
  - Remove supplierId from Product model
  - Update Product and Supplier relations
  - Validates: Schema compiles without errors

- [ ] **1.2** Create database migration script
  - Write SQL to create product_suppliers table
  - Write data migration from Product.supplierId to ProductSupplier
  - Populate preferredUnitCost from recent purchases
  - Remove supplierId column from products table
  - Include rollback script
  - Validates: Test migration on copy of production database

- [ ] **1.3** Run migration and regenerate Prisma client
  - Execute `prisma migrate dev --name add_product_supplier_junction`
  - Run `prisma generate`
  - Validates: Prisma client types include ProductSupplier model

## Phase 2: Product Management API (Depends on 1.3)

- [ ] **2.1** Update ProductService for multi-supplier support
  - Modify `createProduct` to accept `supplierIds` array
  - Modify `updateProduct` to handle supplier associations
  - Add validation: minimum one supplier required
  - Update `getProduct` to include suppliers array
  - Validates: Unit tests pass for product CRUD with suppliers

- [ ] **2.2** Implement ProductSupplier management endpoints
  - Add PUT `/api/products/:id/suppliers` (add supplier)
  - Add PATCH `/api/products/:id/suppliers/:supplierId` (update price)
  - Add DELETE `/api/products/:id/suppliers/:supplierId` (remove supplier)
  - Add GET `/api/products/:id/suppliers/:supplierId/suggested-price`
  - Add validation: prevent removing last supplier
  - Validates: Integration tests cover all endpoints

- [ ] **2.3** Update product routes and controllers
  - Modify POST `/api/products` to use supplierIds
  - Modify PUT `/api/products/:id` to update suppliers
  - Update GET `/api/products` response format
  - Add error handling for invalid supplier IDs
  - Validates: API returns correct HTTP status codes

## Phase 3: Inventory & Purchase Enhancements (Depends on 2.3)

- [ ] **3.1** Add inventory grouping and filtering
  - Add `groupBy` query parameter to `/api/inventory/value`
  - Implement aggregated view (group by product)
  - Implement supplier-grouped view (group by product + supplier)
  - Add `supplierId` filter parameter
  - Optimize queries with proper joins
  - Validates: Performance tests show <300ms response time

- [ ] **3.2** Add suggested pricing service
  - Create function to get preferred cost from ProductSupplier
  - Fallback to most recent purchase price
  - Return null if no data available
  - Validates: Unit tests cover all pricing scenarios

## Phase 4: Frontend - Products View (Depends on 2.3)

- [ ] **4.1** Update ProductsView for multi-supplier display
  - Replace supplier dropdown with multi-select component
  - Display supplier count badge in product table
  - Show list of suppliers when badge clicked
  - Update product creation form to accept multiple suppliers
  - Update product edit form to manage supplier associations
  - Validates: Manual test creating product with 3 suppliers

- [ ] **4.2** Create supplier management dialog
  - Add UI to add/remove suppliers from product
  - Add input for preferred unit cost (optional)
  - Show validation errors (e.g., removing last supplier)
  - Validates: Can add supplier, set price, remove supplier

## Phase 5: Frontend - Purchase Workflow (Depends on 4.1)

- [ ] **5.1** Update purchase creation form with price suggestions
  - Keep supplier dropdown enabled (don't auto-fill)
  - Fetch suggested price when product+supplier selected
  - Display "Suggested price: $X" hint
  - Pre-fill unit cost with suggested price
  - Mark product's associated suppliers with badge
  - Validates: Suggested price appears for known combinations

- [ ] **5.2** Display purchase history in form
  - Show last purchase price from each supplier
  - Display dates of last purchases
  - Validates: History appears when creating purchase

## Phase 6: Frontend - Inventory Views (Depends on 3.1)

- [ ] **6.1** Implement inventory view toggle
  - Add radio buttons: "Aggregated" vs "Grouped by Supplier"
  - Default to aggregated view
  - Fetch appropriate data based on selection
  - Validates: Toggle switches between views

- [ ] **6.2** Implement supplier filter
  - Add supplier dropdown filter
  - Fetch filtered inventory when supplier selected
  - Clear filter option
  - Validates: Filter shows only selected supplier's stock

- [ ] **6.3** Style supplier-grouped view
  - Group product rows visually
  - Show product name only on first row
  - Indent supplier rows
  - Alternate row colors for readability
  - Validates: Visual grouping is clear and intuitive

## Phase 7: Data Migration & Import Script (Depends on 1.3)

- [ ] **7.1** Update legacy JSON import script
  - Add support for `supplierIds` array in product JSON
  - Detect old `supplierId` format and convert to array
  - Log deprecation warning for old format
  - Validate all supplier IDs exist before importing
  - Validates: Import works with both old and new JSON formats

- [ ] **7.2** Create data migration documentation
  - Document migration steps for production
  - Include rollback procedures
  - Add troubleshooting guide
  - Validates: Documentation reviewed by team

## Phase 8: Testing & Quality Assurance (Parallelizable after Phase 7)

- [ ] **8.1** Write comprehensive unit tests
  - ProductService with supplier associations
  - ProductSupplier CRUD operations
  - Suggested pricing logic
  - Inventory grouping logic
  - Validates: >80% code coverage for new code

- [ ] **8.2** Write integration tests
  - Product API with multiple suppliers
  - Purchase creation with price suggestions
  - Inventory filtering by supplier
  - Validates: All API endpoints tested

- [ ] **8.3** Write E2E tests
  - Create product with multiple suppliers
  - Add/remove suppliers from existing product
  - Create purchase with suggested pricing
  - Toggle inventory views
  - Filter inventory by supplier
  - Validates: Full user workflow tested

- [ ] **8.4** Perform data integrity validation
  - Verify all products have at least one supplier post-migration
  - Check no orphaned ProductSupplier records
  - Confirm FIFO calculations unchanged
  - Validate year-end count integrity
  - Validates: Data audit passes

## Phase 9: Documentation & Deployment (Depends on 8.4)

- [ ] **9.1** Update API documentation
  - Document new/modified endpoints
  - Update request/response examples
  - Add migration guide for API clients
  - Validates: API docs reviewed

- [ ] **9.2** Update user documentation
  - Add guide for managing multiple suppliers
  - Explain suggested pricing feature
  - Document inventory view options
  - Validates: User docs reviewed

- [ ] **9.3** Deploy to production
  - Create database backup
  - Run migration script
  - Deploy backend changes
  - Deploy frontend changes
  - Monitor for errors
  - Validates: Production deployment successful

- [ ] **9.4** Post-deployment verification
  - Verify existing products migrated correctly
  - Test adding new suppliers to products
  - Confirm suggested pricing works
  - Check inventory views function correctly
  - Validates: All critical paths tested in production

## Dependencies

- Phase 2 requires Phase 1 complete
- Phase 3 requires Phase 2 complete
- Phase 4 requires Phase 2 complete
- Phase 5 requires Phase 4 complete
- Phase 6 requires Phase 3 complete
- Phase 7 requires Phase 1 complete
- Phase 8 requires Phase 7 complete (can run tests in parallel)
- Phase 9 requires Phase 8 complete

## Estimated Effort

- Phase 1: 4 hours
- Phase 2: 6 hours
- Phase 3: 4 hours
- Phase 4: 6 hours
- Phase 5: 4 hours
- Phase 6: 6 hours
- Phase 7: 3 hours
- Phase 8: 8 hours
- Phase 9: 3 hours

**Total**: ~44 hours (~1 week for single developer)

## Rollback Plan

If critical issues discovered post-deployment:
1. Restore database from pre-migration backup
2. Revert backend to previous version
3. Revert frontend to previous version
4. Investigate issues and plan retry
