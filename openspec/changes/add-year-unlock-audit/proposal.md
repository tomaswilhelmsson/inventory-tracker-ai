# Change: Year Unlock and Audit Trail Enhancements

## Why

The current system locks years after year-end count confirmation to prevent data modification, but provides no mechanism to correct errors or perform recounts. This creates operational challenges when:
- Data entry errors are discovered after year lock
- Physical recounts are needed due to discrepancies
- Auditors require adjustments to historical data
- Purchases need to be registered retroactively for unlocked years

Without unlock capability and audit trails, businesses must accept permanent errors or resort to manual database manipulation, both of which compromise data integrity and auditability.

## What Changes

- **Year unlock capability**: Allow unlocking the most recently locked year with mandatory reason and audit trail
- **Unlock audit log**: Track all unlock events with timestamp, reason (predefined + description), and create new revision
- **Multi-revision support**: Store all year-end count revisions to compare old vs new counts after unlock/recount cycles
- **Backward purchase registration**: Allow purchase registration in unlocked years even across year boundaries
- **Purchase editing in unlocked years**: Enable editing/deleting purchases when year is unlocked
- **Year-end count reminder**: Display persistent reminder when previous year count is pending
- **Revision-based count history**: Add revision tracking to YearEndCount to support multiple unlock/recount cycles

## Impact

- **Affected specs**: 
  - `year-end-count` - adds unlock, revision, and reminder requirements
  - `purchase-tracking` - modifies lock validation to check unlock status

- **Affected code**:
  - `backend/prisma/schema.prisma` - add YearUnlockAudit model, revision field to YearEndCount
  - `backend/src/services/yearEndCountService.ts` - unlock, revision, and reminder logic
  - `backend/src/services/purchaseService.ts` - update year lock validation
  - `backend/src/routes/yearEndCount.ts` - unlock and reminder endpoints
  - `frontend/src/views/YearEndCountView.vue` - unlock UI and revision display
  - `frontend/src/views/DashboardView.vue` - reminder banner
  - `frontend/src/App.vue` - global reminder check

- **Migration required**: Database schema changes for YearUnlockAudit table and YearEndCount.revision column

- **Breaking changes**: None - additive changes only, existing locked years remain valid
