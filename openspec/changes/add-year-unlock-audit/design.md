# Design: Year Unlock and Audit Trail

## Context

The inventory system currently implements a hard lock on years after year-end count confirmation to maintain data integrity. However, real-world operations require the ability to correct errors and perform recounts while maintaining full auditability. This design enables controlled unlock operations with complete audit trails.

**Constraints:**
- Must preserve all historical count data (no deletion)
- Audit trail must be immutable and complete
- Only the most recently locked year can be unlocked (prevents cascading temporal changes)
- FIFO calculations must remain accurate across unlock/relock cycles
- Simple authentication model (no user roles) but need audit trail

**Stakeholders:**
- Accountants: Need to correct errors and perform recounts
- Auditors: Require complete history of all changes and reasons
- System administrators: Need clear unlock/lock workflow

## Goals / Non-Goals

**Goals:**
- Enable unlocking most recently locked year with mandatory justification
- Track complete audit trail of unlock events (when, why)
- Support multiple unlock/recount cycles with revision tracking
- Preserve all count history for comparison (old vs new)
- Allow backward purchase registration in unlocked years
- Remind users about pending year-end counts

**Non-Goals:**
- Multi-year unlock (only most recent year)
- User-based permissions (track event but not user)
- Automatic unlock/lock workflows
- Soft-delete or archive of old counts (keep everything)
- Unlock of arbitrary historical years

## Decisions

### Decision 1: Revision-Based Count Versioning
**Choice:** Add `revision` integer field to `YearEndCount` table, increment on unlock, create new count record on reconfirmation.

**Why:** 
- Simplest way to track multiple count cycles for same year
- Enables easy comparison between revisions
- Preserves complete history without complex archival
- Clear semantic: revision 1 = original count, revision 2 = first recount, etc.

**Alternatives considered:**
- Separate archive table: More complex, harder to query
- Soft-delete flag: Loses historical context, complicates queries
- Versioned tables with triggers: Overkill for this use case

### Decision 2: YearUnlockAudit as Separate Table
**Choice:** Create dedicated `YearUnlockAudit` table with columns: `year`, `unlockedAt`, `reason`, `reasonCategory`, `description`.

**Why:**
- Clear separation of concerns (unlock events vs counts)
- Immutable audit log (append-only)
- Easy to query unlock history
- Supports compliance requirements

**Reason categories:**
- `data_error` - Correction of data entry mistakes
- `recount_required` - Physical recount needed due to discrepancies
- `audit_adjustment` - Changes requested by auditors
- `other` - Free-form description required

### Decision 3: Year Lock State in LockedYear Table
**Choice:** Keep existing `LockedYear` table, remove row on unlock, re-create on reconfirmation.

**Why:**
- Simple boolean state (locked = row exists, unlocked = row absent)
- Existing code already checks this table
- Minimal changes to `purchaseService.isYearLocked()`

**Alternatives considered:**
- Add `isUnlocked` boolean: Complicates logic, three-state (no row, locked, unlocked)
- Status enum: More complex queries, harder to understand

### Decision 4: Unlock Restriction to Most Recent Year
**Choice:** Only allow unlocking the year with `MAX(year)` in `LockedYear` table.

**Why:**
- Prevents cascading temporal changes (changing 2022 affects 2023, 2024...)
- Simpler mental model for users
- Reduces risk of FIFO calculation errors
- If older year needs correction, unlock and recount sequentially

**Implementation:**
```typescript
const mostRecentLockedYear = await prisma.lockedYear.findFirst({
  orderBy: { year: 'desc' }
});
if (yearToUnlock !== mostRecentLockedYear.year) {
  throw new AppError(400, 'Can only unlock most recently locked year');
}
```

### Decision 5: Backward Purchase Registration
**Choice:** Allow purchase registration in any year that is not locked (including past years).

**Why:**
- Current validation only checks `isYearLocked(year)` - already correct
- Supports retroactive purchase entry when discovered
- Year lock provides sufficient control

**No changes needed:** Existing code already supports this, just needs clarification in specs.

### Decision 6: Count Reminder Logic
**Choice:** Display banner when `MAX(purchaseYear) > MAX(confirmedCountYear)`.

**Why:**
- Simple logic: if purchases exist for years without confirmed counts, remind user
- Checks on app load and dashboard view
- Non-intrusive banner (not blocking modal)

**Implementation:**
```typescript
// Pseudo-code
const latestPurchaseYear = await prisma.purchaseLot.findFirst({
  orderBy: { year: 'desc' },
  select: { year: true }
});

const latestConfirmedCount = await prisma.yearEndCount.findFirst({
  where: { status: 'confirmed' },
  orderBy: { year: 'desc' }
});

const needsCount = !latestConfirmedCount || 
  latestPurchaseYear.year > latestConfirmedCount.year;
```

## Data Model Changes

### New Table: YearUnlockAudit
```prisma
model YearUnlockAudit {
  id              Int      @id @default(autoincrement())
  year            Int
  unlockedAt      DateTime @default(now())
  reasonCategory  String   // data_error | recount_required | audit_adjustment | other
  description     String   // Free-form explanation
  
  @@map("year_unlock_audits")
}
```

### Modified Table: YearEndCount
```prisma
model YearEndCount {
  // ... existing fields ...
  revision        Int      @default(1)  // NEW: Tracks unlock/recount cycles
  
  // Composite unique constraint
  @@unique([year, revision])
}
```

**Note:** Remove `@unique` from `year` field alone, replace with composite `@@unique([year, revision])`.

## Workflow: Unlock and Recount

1. **User unlocks year 2024** (currently locked, revision 1 exists):
   - System validates: 2024 is most recently locked year
   - System prompts for reason category + description
   - System creates `YearUnlockAudit` record
   - System deletes `LockedYear` row for 2024
   - Year 2024 now unlocked, purchases editable

2. **User edits purchases** in 2024:
   - `purchaseService.isYearLocked(2024)` returns `false`
   - Purchases can be created, updated, deleted

3. **User initiates new year-end count** for 2024:
   - System checks if count exists: YES (revision 1)
   - System allows new count, increments to revision 2
   - OR: System creates new count with revision auto-incremented

4. **User confirms recount** (revision 2):
   - System updates lot quantities via FIFO
   - System creates new `LockedYear` row for 2024
   - System updates `YearEndCount.status = 'confirmed'` for revision 2
   - Revision 1 remains in database for comparison

## Risks / Trade-offs

**Risk:** Users unlock year and forget to recount
- **Mitigation:** Reminder banner persists until count confirmed
- **Mitigation:** Dashboard shows unlocked years prominently

**Risk:** FIFO calculations incorrect after unlock/edit/recount
- **Mitigation:** Use same FIFO logic as original count
- **Mitigation:** Add validation tests for unlock scenarios

**Risk:** Audit trail incomplete (missing "who")
- **Mitigation:** Simple auth model has single user, acceptable
- **Future:** Add userId field when multi-user auth implemented

**Trade-off:** Multiple revisions increase database size
- **Acceptable:** Year-end counts are small (one row per product per year)
- **Acceptable:** Full history is critical for compliance

**Trade-off:** Only most recent year unlock limits flexibility
- **Acceptable:** Sequential unlock/recount pattern is safer
- **Workaround:** Unlock and recount years in reverse chronological order if needed

## Migration Plan

### Database Migration
1. Add `revision` column to `year_end_counts` table (default 1)
2. Update unique constraint from `year` to composite `(year, revision)`
3. Create `year_unlock_audits` table
4. **No data migration needed** - existing counts get revision=1 by default

### Rollback Plan
If issues arise:
1. Revert migration (drop `year_unlock_audits`, remove `revision` column)
2. Restore `year` unique constraint on `year_end_counts`
3. Any unlocked years remain unlocked (admin manual relock if needed)

## Open Questions

1. Should year unlock trigger a database backup (like count confirmation does)?
   - **Decision:** Not in initial version, but consider for future enhancement
   
2. Should old revisions be deletable by admin?
   - **Decision:** No - audit trail must be immutable

3. Should we limit number of unlock cycles (e.g., max 5 revisions)?
   - **Decision:** No limit initially, monitor in production

4. Should reminder be dismissable (hide for X days)?
   - **Decision:** No - persistent until count completed (ensures accountability)
