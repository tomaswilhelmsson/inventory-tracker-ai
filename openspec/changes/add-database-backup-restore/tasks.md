# Tasks: Add Database Backup and Restore

## Phase 1: Backend - Export Functionality (Parallelizable)

- [x] **1.1** Create `backupService.ts` service file
  - Add `exportDatabase()` method skeleton
  - Add TypeScript interfaces for backup format
  - Validates: File compiles without errors

- [x] **1.2** Implement database export logic in `backupService.exportDatabase()`
  - Query all tables using Prisma (units, suppliers, products, productSuppliers, purchaseBatches, purchaseLots, yearEndCounts, yearEndCountItems, lockedYears, yearUnlockAudits)
  - Serialize to JSON with metadata (version, exportedAt, schemaVersion)
  - Generate timestamped filename
  - Write to /tmp directory
  - Validates: Export generates valid JSON file with all tables

- [x] **1.3** Create `routes/backup.ts` API route file
  - Add POST `/api/backup/export` endpoint with auth middleware
  - Call `backupService.exportDatabase()`
  - Set response headers for file download
  - Return file as downloadable attachment
  - Validates: Endpoint returns 200 with JSON file

- [x] **1.4** Add file cleanup logic for exports
  - Delete temporary file after successful download
  - Handle cleanup on download interruption/error
  - Validates: No orphaned files remain in /tmp after export

- [x] **1.5** Register backup routes in main server
  - Import backup routes in `server.ts`
  - Mount at `/api/backup` path
  - Validates: Server starts without errors

## Phase 2: Backend - Import Functionality (Depends on 1.5)

- [x] **2.1** Implement backup validation in `backupService`
  - Add `validateBackup()` method
  - Check JSON structure
  - Validate version field
  - Validate required data tables present
  - Check schema version compatibility
  - Validates: Returns validation errors for malformed backups

- [x] **2.2** Implement database import logic in `backupService.importDatabase()`
  - Parse JSON backup file
  - Call validateBackup()
  - Start Prisma transaction
  - Delete existing data in reverse dependency order
  - Import new data in dependency order (units → suppliers → products → productSuppliers → purchaseBatches → purchaseLots → yearEndCounts → yearEndCountItems → lockedYears → yearUnlockAudits)
  - Commit transaction or rollback on error
  - Return import summary with record counts
  - Validates: Import succeeds for valid backup, rolls back on error

- [x] **2.3** Add POST `/api/backup/import` endpoint
  - Add multer middleware for file upload
  - Require authentication
  - Validate `confirm` parameter in request body
  - Call `backupService.importDatabase()`
  - Return success/error with import summary
  - Cleanup uploaded file after processing
  - Validates: Endpoint returns 200 with record counts on success

- [x] **2.4** Add error handling for import edge cases
  - Handle file too large (>100MB)
  - Handle malformed JSON
  - Handle missing required fields
  - Handle foreign key constraint violations
  - Handle unique constraint violations
  - Validates: All error cases return appropriate HTTP status and messages

## Phase 3: Backend Testing (Depends on 2.4)

- [ ] **3.1** Write unit tests for `backupService.exportDatabase()`
  - Test export with populated database
  - Test export with empty database
  - Test JSON structure validity
  - Test all tables included
  - Test users table excluded
  - Validates: Tests pass with >90% coverage

- [ ] **3.2** Write unit tests for `backupService.importDatabase()`
  - Test import with valid backup
  - Test import rolls back on constraint violation
  - Test validation rejects invalid JSON
  - Test validation rejects incompatible schema version
  - Test foreign key relationships preserved
  - Validates: Tests pass with >90% coverage

- [ ] **3.3** Write integration tests for `/api/backup/export`
  - Test authenticated export returns 200
  - Test unauthenticated export returns 401
  - Test file download headers correct
  - Validates: All export scenarios tested

- [ ] **3.4** Write integration tests for `/api/backup/import`
  - Test authenticated import returns 200
  - Test unauthenticated import returns 401
  - Test import without confirmation returns 400
  - Test import with invalid file returns 400
  - Test successful import replaces data
  - Validates: All import scenarios tested

## Phase 4: Frontend - Backup & Restore View (Depends on 2.3, Parallelizable with 3.*)

- [x] **4.1** Create `BackupRestoreView.vue` component file
  - Add component skeleton with template, script, style
  - Add basic layout structure (export section, import section)
  - Validates: Component renders without errors

- [x] **4.2** Implement export functionality in UI
  - Add "Download Backup" button
  - Add click handler to call `/api/backup/export` endpoint
  - Trigger browser file download
  - Add loading state during export
  - Add success/error toast notifications
  - Store export timestamp in localStorage
  - Display "Last export: timestamp" text
  - Validates: Clicking button downloads JSON file

- [x] **4.3** Implement import file selection
  - Add file input for selecting backup file
  - Validate file extension (.json only)
  - Validate file size (<100MB)
  - Display selected filename
  - Enable/disable import button based on selection
  - Validates: Only JSON files under 100MB can be selected

- [x] **4.4** Implement import confirmation dialog
  - Create confirmation dialog component with PrimeVue Dialog
  - Display warning message about data loss
  - Show backup filename and export timestamp
  - Add "I understand this cannot be undone" checkbox
  - Disable confirm button until checkbox checked
  - Add cancel button to close without importing
  - Validates: Dialog prevents accidental imports

- [x] **4.5** Implement import functionality
  - Add import handler to call `/api/backup/import` endpoint
  - Send file via multipart/form-data with confirm=true
  - Display loading spinner during import
  - Show import results summary on success
  - Show error message on failure
  - Clear file selection after import
  - Validates: Import updates UI with restored data

- [x] **4.6** Add explanatory text and styling
  - Add section headers and descriptions
  - Add warning icons and styling
  - Add usage hints
  - Style buttons and cards
  - Ensure responsive layout for mobile
  - Validates: UI is clear and user-friendly

## Phase 5: Frontend Integration (Depends on 4.6)

- [x] **5.1** Add Backup & Restore route to router
  - Add `/backup-restore` route in `frontend/src/router/index.ts`
  - Point to BackupRestoreView component
  - Require authentication
  - Validates: Route navigates to view

- [x] **5.2** Add Backup & Restore menu item to navigation
  - Add menu item in main navigation component
  - Link to `/backup-restore` route
  - Add icon (e.g., database/download icon)
  - Validates: Menu item visible and navigates correctly

- [x] **5.3** Add i18n translations for Backup & Restore view
  - Add English translations in `frontend/src/i18n/locales/en.json`
  - Add Swedish translations in `frontend/src/i18n/locales/sv.json`
  - Include all button labels, messages, warnings
  - Validates: UI displays translations correctly

## Phase 6: End-to-End Testing (Depends on 5.3)

- [ ] **6.1** Manual test: Export and download backup
  - Log in to application
  - Navigate to Backup & Restore
  - Click Download Backup
  - Verify file downloads with correct filename
  - Verify JSON is valid
  - Validates: Export workflow works end-to-end

- [ ] **6.2** Manual test: Import and restore backup
  - Export database
  - Modify some data in UI
  - Import previously exported file
  - Verify confirmation dialog appears
  - Confirm import
  - Verify data is restored to exported state
  - Validates: Import workflow works end-to-end

- [ ] **6.3** Manual test: Error handling
  - Test import with invalid JSON file
  - Test import with non-JSON file
  - Test import with oversized file
  - Test export when unauthenticated
  - Verify appropriate error messages shown
  - Validates: All error scenarios handled gracefully

- [ ] **6.4** Manual test: Data integrity after restore
  - Create products, suppliers, purchases
  - Create year-end count
  - Lock a year
  - Export database
  - Clear data and import backup
  - Verify all data restored correctly
  - Verify locked year still locked
  - Verify foreign key relationships intact
  - Validates: Data integrity maintained through export/import cycle

## Phase 7: Documentation and Deployment (Depends on 6.4)

- [ ] **7.1** Update user documentation
  - Add "Backup & Restore" section to user guide
  - Document export process
  - Document import process
  - Include screenshots
  - Add warning about data loss
  - Validates: Documentation is clear and complete

- [ ] **7.2** Update API documentation
  - Document `/api/backup/export` endpoint
  - Document `/api/backup/import` endpoint
  - Include request/response examples
  - Document JSON backup format
  - Validates: API docs are complete

- [ ] **7.3** Create backup best practices guide
  - Recommend export before year-end counts
  - Recommend export before major data changes
  - Explain use cases (testing, migration, recovery)
  - Document file storage recommendations
  - Validates: Best practices documented

- [ ] **7.4** Final integration testing
  - Run all backend tests
  - Run all frontend builds
  - Test on multiple browsers
  - Test on mobile devices
  - Validates: All tests pass, no regressions

## Dependencies

- Phase 2 requires Phase 1 complete (import needs export format defined)
- Phase 3 can run in parallel with Phase 4 (backend tests + frontend dev)
- Phase 4 requires Phase 2 complete (UI needs API endpoints)
- Phase 5 requires Phase 4 complete (integration needs view)
- Phase 6 requires Phase 5 complete (E2E needs full integration)
- Phase 7 requires Phase 6 complete (docs after validation)

## Estimated Effort

- Phase 1: 4 hours
- Phase 2: 6 hours
- Phase 3: 4 hours
- Phase 4: 6 hours
- Phase 5: 2 hours
- Phase 6: 3 hours
- Phase 7: 2 hours

**Total**: ~27 hours (~3-4 days for single developer)

## Rollback Plan

If critical issues discovered:
1. Remove Backup & Restore menu item from navigation (hides feature)
2. Disable `/api/backup/*` routes (returns 503 Service Unavailable)
3. Investigate and fix issues
4. Re-enable when ready
5. No database migration required (feature is additive)
