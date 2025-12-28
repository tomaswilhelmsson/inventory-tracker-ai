# Tasks: Add Discard Draft Year-End Count

## Phase 1: Backend Implementation

### 1.1 Service Layer
- [ ] Add `deleteYearEndCount(countId)` method to yearEndCountService
  - Fetch count with item count
  - Validate status === 'draft'
  - Throw 404 if not found
  - Throw 400 if confirmed
  - Delete count (cascade handles items)
  - Return success message with deleted item count
  - Validation: Unit tests for all scenarios

### 1.2 Route Layer
- [ ] Add DELETE route to `backend/src/routes/yearEndCount.ts`
  - Path: `/:id`
  - Validation: `param('id').isInt()`
  - Call `yearEndCountService.deleteYearEndCount()`
  - Return JSON response
  - Validation: Integration tests with curl/Postman

### 1.3 Backend Testing
- [ ] Unit tests for `deleteYearEndCount()`
  - Test successful deletion of draft count
  - Test error for confirmed count
  - Test error for non-existent count
  - Test cascade delete of count items
  - Validation: All tests pass

- [ ] Integration tests for DELETE endpoint
  - Test 200 response for draft count
  - Test 400 response for confirmed count
  - Test 404 response for invalid ID
  - Test 401 response without authentication
  - Validation: All tests pass

## Phase 2: Frontend Implementation

### 2.1 Translations
- [ ] Add English translations to `frontend/src/i18n/locales/en.json`
  - `yearEndCount.discardCount`: "Discard"
  - `yearEndCount.messages.discardConfirm`: Confirmation message
  - `yearEndCount.messages.discardSuccess`: Success message
  - `yearEndCount.messages.discardFailed`: Error message
  - Validation: Translations render correctly

- [ ] Add Swedish translations to `frontend/src/i18n/locales/sv.json`
  - Same keys as English with Swedish translations
  - Validation: Translations render correctly in Swedish mode

### 2.2 YearEndCountView Updates
- [ ] Add discard button to actions section
  - Show only when `countSheet.status === 'draft'`
  - Icon: `pi pi-trash`
  - Severity: `danger`
  - Outlined style
  - Click handler: `confirmDiscard()`
  - Validation: Button appears for draft, hidden for confirmed

- [ ] Add `confirmDiscard()` function
  - Use `confirm.require()` with PrimeVue ConfirmDialog
  - Message includes year and product count
  - Accept handler calls `discardCount()`
  - Validation: Dialog appears with correct text

- [ ] Add `discardCount()` function
  - Call `api.delete(\`/year-end-count/${countSheet.value.id}\`)`
  - On success: Show success toast, redirect to `/year-end-count`
  - On error: Show error toast with server message
  - Validation: Function works end-to-end

### 2.3 Frontend Testing
- [ ] Component tests for YearEndCountView
  - Test discard button visibility (draft vs confirmed)
  - Test confirmation dialog appearance
  - Test successful discard flow
  - Test error handling
  - Validation: All component tests pass

## Phase 3: End-to-End Testing

### 3.1 Manual E2E Testing
- [ ] Test happy path
  - Initiate count for year 2025
  - Enter counts for 2-3 products
  - Click "Discard" button
  - Verify confirmation dialog shows year and count
  - Confirm discard
  - Verify success toast appears
  - Verify redirected to year selection page
  - Verify count no longer exists
  - Validation: Complete flow works

- [ ] Test cannot discard confirmed count
  - Use existing confirmed count
  - Verify no discard button appears
  - Validation: Confirmed counts protected

- [ ] Test cancel discard
  - Initiate draft count
  - Click "Discard"
  - Click "Cancel" in dialog
  - Verify count still exists
  - Verification: Cancel works correctly

- [ ] Test cascade delete
  - Initiate count with 10+ products
  - Discard count
  - Verify all count items deleted from database
  - Validation: No orphaned items remain

### 3.2 Error Scenario Testing
- [ ] Test API errors
  - Simulate 400 error (try to delete confirmed via direct API)
  - Verify error toast with appropriate message
  - Simulate network error
  - Verify generic error message
  - Validation: All errors handled gracefully

### 3.3 Translation Testing
- [ ] Test English language
  - Verify all discard UI text in English
  - Validation: All text correct

- [ ] Test Swedish language
  - Switch to Swedish
  - Verify all discard UI text in Swedish
  - Validation: All text correct

## Phase 4: Documentation & Cleanup

### 4.1 Update Documentation
- [ ] Update relevant documentation if needed
  - Note: Most functionality is self-explanatory via UI
  - Validation: Docs reflect new feature

### 4.2 Code Review Checklist
- [ ] Backend service has proper error handling
- [ ] Backend route has input validation
- [ ] Frontend button visibility logic is correct
- [ ] Confirmation dialog has clear messaging
- [ ] Success/error toasts provide good UX
- [ ] All translations are accurate
- [ ] Cascade delete works correctly
- [ ] Tests cover all scenarios
- [ ] No console errors or warnings
- [ ] Code follows existing patterns

## Dependencies

- Phase 2 depends on Phase 1 (backend must exist)
- Phase 3 depends on Phase 2 (frontend must exist)
- All tasks within a phase can be done in parallel

## Parallelizable Work

- Backend service (1.1) and route (1.2) can be developed simultaneously
- Translations (2.1) can be done before or after view updates (2.2)
- Testing (1.3, 2.3) can begin as soon as respective code is written

## Estimated Effort

- Phase 1: 2-3 hours (backend + tests)
- Phase 2: 2-3 hours (frontend + translations)
- Phase 3: 1-2 hours (E2E testing)
- Phase 4: 0.5-1 hour (documentation)
- **Total**: 5.5-9 hours

## Notes

- Leverage existing cascade delete (no migration needed)
- Follow existing patterns from yearEndCountService
- Reuse confirmation dialog pattern from other views
- Keep error messages user-friendly
- Ensure confirmed counts remain immutable
