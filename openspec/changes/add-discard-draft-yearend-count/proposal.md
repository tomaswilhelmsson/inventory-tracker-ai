# Proposal: Add Discard Draft Year-End Count

## Change ID
`add-discard-draft-yearend-count`

## Status
Draft

## Author
AI Assistant

## Date
2025-12-28

## Problem Statement

Currently, when a user initiates a year-end count for a specific year, they cannot discard or cancel it if they made a mistake or want to start over. The only option is to continue with the count or leave it incomplete indefinitely. This creates several issues:

1. **No way to clean up mistakes**: If a user accidentally initiates a count for the wrong year, they cannot remove it
2. **Cluttered UI**: Abandoned draft counts remain in the system indefinitely
3. **Unclear workflow**: Users don't have a clear way to "start over" if they make errors during counting
4. **Database bloat**: Incomplete draft counts accumulate without a cleanup mechanism

## Proposed Solution

Add a "Discard" button that allows users to delete draft year-end counts that have not been confirmed. This provides a clean way to:
- Remove accidentally created counts
- Start over if mistakes were made during data entry
- Keep the system clean by removing abandoned drafts

The discard functionality will:
- Only work on draft counts (status = 'draft')
- Be blocked for confirmed counts to preserve audit trail
- Use the existing cascade delete in the database schema to automatically clean up related count items
- Require user confirmation before deletion

## User Stories

1. As a warehouse manager, I want to discard a year-end count I accidentally started for the wrong year
2. As an inventory clerk, I want to start over if I made multiple mistakes during counting without having to work around the existing draft
3. As a system admin, I want to clean up old abandoned draft counts that users never completed

## Scope

### In Scope
- Backend API endpoint to delete draft year-end counts (DELETE /api/year-end-count/:id)
- Validation to prevent deletion of confirmed counts
- Frontend "Discard" button in YearEndCountView for draft counts
- Confirmation dialog before discarding
- Success/error toast notifications
- i18n translations (English and Swedish)

### Out of Scope
- Deleting confirmed counts (must preserve audit trail)
- Soft delete / archive functionality (hard delete is sufficient for drafts)
- Bulk deletion of multiple draft counts
- Automatic cleanup of old draft counts
- Undo functionality after discard

## Dependencies

- Existing year-end count system
- Database cascade delete already configured (YearEndCountItem has onDelete: Cascade)
- User authentication middleware

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| User accidentally discards count with data | Medium | Require confirmation dialog with clear warning |
| Deleting confirmed counts destroys audit trail | High | Backend validation prevents deletion of confirmed counts |
| Database integrity issues | Low | Existing cascade delete handles cleanup automatically |
| Confusion about when to discard vs confirm | Low | Clear UI labeling and tooltips |

## Success Criteria

1. Users can discard draft year-end counts via UI
2. Confirmed counts cannot be deleted (backend blocks with error)
3. Cascade delete properly removes all related count items
4. Confirmation dialog prevents accidental deletion
5. UI updates immediately after successful discard
6. All existing functionality (initiate, count, confirm) continues to work

## Open Questions

1. Should we show the number of items in the confirmation dialog?
   - **Recommendation**: Yes - "This will delete the count with X products. Are you sure?"

2. Should we log discard actions in an audit trail?
   - **Recommendation**: Not in v1 - draft counts are not financially significant

3. What should happen if the user is viewing a count sheet when it's discarded?
   - **Recommendation**: Redirect to year selection page after successful discard

## Implementation Notes

- Use existing Prisma cascade delete (`onDelete: Cascade` already configured)
- Backend service method: `deleteYearEndCount(countId)`
- Validation: Check `status === 'draft'` before allowing deletion
- Frontend: Show discard button only when viewing a draft count
- Use PrimeVue ConfirmDialog for confirmation UI
