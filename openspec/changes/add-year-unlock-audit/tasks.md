# Implementation Tasks

## 1. Database Schema Changes
- [x] 1.1 Create migration file for schema changes
- [x] 1.2 Add `revision` field to `YearEndCount` model (default: 1)
- [x] 1.3 Update unique constraint on `YearEndCount` from `year` to composite `@@unique([year, revision])`
- [x] 1.4 Create `YearUnlockAudit` model with fields: id, year, unlockedAt, reasonCategory, description
- [x] 1.5 Run migration on development database
- [x] 1.6 Verify migration with sample data (create count, unlock, recount)

## 2. Backend Service Layer - Year Unlock

- [x] 2.1 Add `unlockYear()` method to `yearEndCountService.ts`
  - Validate year is locked
  - Validate year is most recently locked
  - Accept reason category and description
  - Create `YearUnlockAudit` record
  - Delete `LockedYear` record
- [x] 2.2 Add `getUnlockHistory()` method to fetch unlock audit records for a year
- [x] 2.3 Add `getMostRecentLockedYear()` helper method
- [x] 2.4 Add validation for reason categories: data_error, recount_required, audit_adjustment, other

## 3. Backend Service Layer - Count Revisions

- [x] 3.1 Update `initiateYearEndCount()` to handle revisions
  - Check if count exists for year
  - If exists and unlocked, increment revision
  - If exists and locked, reject with error
- [x] 3.2 Update `getByYear()` to accept optional revision parameter
  - Default to latest revision if not specified
  - Return specific revision if specified
- [x] 3.3 Add `getAllRevisions()` method to list all revisions for a year
- [x] 3.4 Add `compareRevisions()` method to compare two revisions side-by-side
- [x] 3.5 Update `confirmYearEndCount()` to work with revision field

## 4. Backend Service Layer - Count Reminder

- [x] 4.1 Add `checkPendingCount()` method to `yearEndCountService.ts`
  - Query latest purchase year
  - Query latest confirmed count year
  - Return pending year if purchase year > count year
- [x] 4.2 Optimize query with caching (cache for 5 minutes)

## 5. Backend Routes

- [x] 5.1 Add `POST /api/year-end-count/:year/unlock` endpoint
  - Accept reasonCategory and description in request body
  - Call `unlockYear()` service method
- [x] 5.2 Add `GET /api/year-end-count/:year/unlock-history` endpoint
- [x] 5.3 Add `GET /api/year-end-count/:year/revisions` endpoint to list all revisions
- [x] 5.4 Add `GET /api/year-end-count/:year/compare` endpoint with query params `revision1` and `revision2`
- [x] 5.5 Update `GET /api/year-end-count/:year` to accept optional `revision` query parameter
- [x] 5.6 Add `GET /api/year-end-count/pending-reminder` endpoint
- [x] 5.7 Update existing count endpoints to handle revision field

## 6. Frontend - Unlock UI

- [x] 6.1 Add "Unlock Year" button to `YearEndCountView.vue` (visible only for locked, most recent year)
- [x] 6.2 Create unlock confirmation modal component
  - Dropdown for reason category
  - Text area for description
  - Warning about data modification implications
- [x] 6.3 Call unlock API on confirmation
- [x] 6.4 Show success message and refresh count data
- [x] 6.5 Display unlock history in count view (collapsible section)

## 7. Frontend - Revision Management

- [x] 7.1 Add revision selector to `YearEndCountView.vue` (dropdown showing all revisions)
- [x] 7.2 Display current revision number prominently
- [x] 7.3 Create revision comparison view component
  - Side-by-side table showing old vs new counts
  - Highlight differences
  - Calculate total variance between revisions
- [x] 7.4 Add "Compare Revisions" button and modal
- [x] 7.5 Update count display to show revision metadata (confirmation date, status)

## 8. Frontend - Count Reminder

- [x] 8.1 Create `CountReminderBanner.vue` component
  - Display pending year message
  - Link to initiate count
  - Prominent styling (warning color)
- [x] 8.2 Add reminder check to `DashboardView.vue`
  - Call pending reminder API on mount
  - Display banner if count pending
- [x] 8.3 Add reminder check to `App.vue` global layout
  - Show banner at top of all pages
  - Persist until count confirmed
- [x] 8.4 Add auto-refresh of reminder state after count confirmation

## 9. Frontend - Purchase Views

- [x] 9.1 Update `PurchasesView.vue` to show unlock status
  - Display badge "Unlocked" for unlocked years
  - Display badge "Locked" for locked years
- [x] 9.2 Enable/disable edit/delete buttons based on lock status
- [x] 9.3 Show informative message when attempting to edit locked year purchase

## 10. Testing

- [ ] 10.1 Write unit tests for `unlockYear()` service method
  - Test validation: year not locked
  - Test validation: not most recent year
  - Test validation: missing reason
  - Test successful unlock
- [ ] 10.2 Write unit tests for revision handling
  - Test revision increment
  - Test revision query
  - Test revision comparison
- [ ] 10.3 Write integration tests for unlock workflow
  - Lock year → unlock → edit purchase → recount → relock
  - Verify FIFO calculations remain accurate
- [ ] 10.4 Write E2E tests for reminder banner
  - Verify display when count pending
  - Verify hide when count confirmed
- [ ] 10.5 Test backward purchase registration across year boundaries

## 11. Documentation

- [ ] 11.1 Update API documentation with new endpoints
- [ ] 11.2 Add user guide section for year unlock process
- [ ] 11.3 Document reason categories and when to use each
- [ ] 11.4 Add troubleshooting guide for unlock/recount scenarios
- [ ] 11.5 Update database schema documentation

## 12. Migration and Deployment

- [ ] 12.1 Create rollback migration script
- [ ] 12.2 Test migration on staging database
- [ ] 12.3 Backup production database before deployment
- [ ] 12.4 Run migration on production
- [ ] 12.5 Verify existing counts have revision=1
- [ ] 12.6 Monitor for errors in first 24 hours

## Dependencies

- Task 2.x requires 1.x completion (schema must exist)
- Task 3.x requires 1.x completion (revision field must exist)
- Task 5.x requires 2.x and 3.x completion (routes depend on services)
- Task 6.x and 7.x require 5.x completion (frontend depends on API)
- Task 10.x can run in parallel with other tasks
- Task 12.x must be last (deployment after all implementation)

## Parallel Work Opportunities

- Tasks 2.x and 3.x can be worked in parallel (different service methods)
- Tasks 6.x and 7.x can be worked in parallel (different UI components)
- Task 8.x (reminder) can be worked independently after Task 4.x and 5.6
- Task 9.x can be worked independently after Task 5.1
- Task 10.x can begin as soon as corresponding implementation tasks complete
