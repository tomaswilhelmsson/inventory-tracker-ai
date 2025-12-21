# Year-End Count Specification Deltas

## ADDED Requirements

### Requirement: Unlock Year
The system SHALL allow unlocking the most recently locked year with mandatory reason and audit trail.

#### Scenario: Unlock most recent locked year
- **WHEN** a user unlocks year 2024 which is the most recently locked year
- **THEN** the system removes the year lock, creates an unlock audit record, and allows data modifications

#### Scenario: Require reason for unlock
- **WHEN** a user attempts to unlock a year without providing a reason category and description
- **THEN** the system rejects the request with a validation error

#### Scenario: Record unlock audit trail
- **WHEN** a user unlocks year 2024 with reason category "recount_required" and description "Discrepancies found in warehouse count"
- **THEN** the system creates an audit record with year, timestamp, reason category, and description

#### Scenario: Prevent unlocking non-recent year
- **WHEN** a user attempts to unlock year 2022 when year 2024 is the most recently locked year
- **THEN** the system rejects the request with error "Can only unlock most recently locked year"

#### Scenario: Allow unlock of only locked year
- **WHEN** a user attempts to unlock year 2024 and it is already unlocked
- **THEN** the system rejects the request with error "Year is not locked"

#### Scenario: Support unlock reason categories
- **WHEN** a user unlocks a year
- **THEN** the system offers predefined reason categories: "data_error", "recount_required", "audit_adjustment", "other"

### Requirement: Track Count Revisions
The system SHALL track multiple revisions of year-end counts to preserve history across unlock/recount cycles.

#### Scenario: Create count with revision 1
- **WHEN** a year-end count is initiated for year 2024 for the first time
- **THEN** the system creates the count record with revision set to 1

#### Scenario: Increment revision on recount after unlock
- **WHEN** year 2024 is unlocked (revision 1 exists) and a new count is initiated
- **THEN** the system creates a new count record with revision set to 2

#### Scenario: Preserve previous revision data
- **WHEN** a new revision is created for year 2024
- **THEN** the previous revision's count data (items, variances, values) remains unchanged in the database

#### Scenario: Query specific revision
- **WHEN** a user requests year-end count for year 2024 revision 1
- **THEN** the system returns the original count data from that revision

#### Scenario: Default to latest revision
- **WHEN** a user requests year-end count for year 2024 without specifying revision
- **THEN** the system returns the count with the highest revision number

### Requirement: Compare Count Revisions
The system SHALL allow comparing old and new count data across revisions.

#### Scenario: Display revision comparison
- **WHEN** a user requests comparison between year 2024 revision 1 and revision 2
- **THEN** the system displays side-by-side count data showing differences in counted quantities and variances

#### Scenario: Highlight count changes
- **WHEN** comparing revisions and product ID 10 had counted quantity 400 in revision 1 and 425 in revision 2
- **THEN** the system highlights this change with the difference (+25)

#### Scenario: List all revisions for a year
- **WHEN** a user views year 2024 count history
- **THEN** the system lists all revisions with their confirmation dates and statuses

### Requirement: Enable Data Modification After Unlock
The system SHALL allow purchase creation, editing, and deletion in unlocked years.

#### Scenario: Allow purchase creation in unlocked year
- **WHEN** year 2024 is unlocked and user creates a purchase dated 2024-06-15
- **THEN** the system creates the purchase lot successfully

#### Scenario: Allow purchase editing in unlocked year
- **WHEN** year 2024 is unlocked and user updates a purchase from that year
- **THEN** the system updates the purchase lot successfully

#### Scenario: Allow purchase deletion in unlocked year
- **WHEN** year 2024 is unlocked and user deletes an unused purchase from that year
- **THEN** the system deletes the purchase lot successfully

#### Scenario: Prevent modifications when year is re-locked
- **WHEN** year 2024 is unlocked, recounted, and re-confirmed (locked again)
- **THEN** the system prevents purchase creation, editing, and deletion for year 2024

### Requirement: Display Year-End Count Reminder
The system SHALL display a persistent reminder when previous year's count is pending.

#### Scenario: Show reminder when count pending
- **WHEN** purchases exist for year 2024 and no confirmed year-end count exists for 2024
- **THEN** the system displays a prominent reminder banner "Year-end count for 2024 is pending"

#### Scenario: Show reminder on app load
- **WHEN** a user logs in and year-end count is pending
- **THEN** the reminder banner appears immediately on the dashboard

#### Scenario: Hide reminder when count completed
- **WHEN** a user confirms the year-end count for the pending year
- **THEN** the reminder banner disappears

#### Scenario: Reminder persists across sessions
- **WHEN** a user dismisses or ignores the reminder and logs out
- **THEN** the reminder reappears on next login if count still pending

#### Scenario: Calculate pending year correctly
- **WHEN** the latest purchase is dated 2024 and the latest confirmed count is for 2023
- **THEN** the system identifies 2024 as the pending year for the reminder

### Requirement: Reconfirm After Unlock
The system SHALL require full recount and reconfirmation after year unlock.

#### Scenario: Require new count after unlock
- **WHEN** year 2024 is unlocked (revision 1 exists as confirmed)
- **THEN** the system requires initiating a new count (revision 2) before it can be confirmed again

#### Scenario: Update lot quantities on reconfirmation
- **WHEN** year 2024 revision 2 is confirmed
- **THEN** the system updates all lot remainingQuantity values using FIFO based on the new counted quantities

#### Scenario: Lock year on reconfirmation
- **WHEN** year 2024 revision 2 is confirmed
- **THEN** the system creates a new LockedYear record for 2024

### Requirement: Audit Trail Immutability
The system SHALL maintain an immutable audit trail of all unlock events.

#### Scenario: Prevent modification of unlock audit records
- **WHEN** an unlock audit record exists
- **THEN** the system does not provide any API to update or delete it

#### Scenario: Query unlock history
- **WHEN** a user requests unlock history for year 2024
- **THEN** the system returns all unlock audit records for that year in chronological order

#### Scenario: Display unlock reason in count view
- **WHEN** a user views a year-end count that was unlocked
- **THEN** the system displays the unlock reason and timestamp alongside the count data

## MODIFIED Requirements

### Requirement: Confirm Year-End Count
The system SHALL require user confirmation of accuracy before finalizing the year-end count and SHALL support multiple revisions.

#### Scenario: User confirms accurate count
- **WHEN** a user confirms the year-end count for 2024 as accurate
- **THEN** the system updates count status to "confirmed", records confirmation timestamp, sets the current revision as confirmed, and triggers backup process

#### Scenario: Prevent confirmation without all products counted
- **WHEN** a user attempts to confirm count with missing counted quantities
- **THEN** the system rejects confirmation with validation error listing uncounted products

#### Scenario: Update lot quantities on confirmation
- **WHEN** a user confirms the year-end count
- **THEN** the system updates all lot remainingQuantity values following FIFO order to match counted quantities

#### Scenario: Track revision on confirmation
- **WHEN** a user confirms year-end count revision 2 for year 2024
- **THEN** the system marks that specific revision as confirmed while preserving previous revisions

### Requirement: Lock Year After Confirmation
The system SHALL lock the year to prevent modifications after year-end count confirmation, and allow unlocking for corrections.

#### Scenario: Mark year as locked
- **WHEN** a year-end count for 2024 is confirmed
- **THEN** the system marks year 2024 as locked in the database

#### Scenario: Prevent new purchases in locked year
- **WHEN** a user attempts to create a purchase with date in locked year 2024
- **THEN** the system rejects the request with an error message

#### Scenario: Prevent editing purchases in locked year
- **WHEN** a user attempts to update or delete a purchase lot from locked year 2024
- **THEN** the system rejects the request with an error message

#### Scenario: Allow viewing locked year data
- **WHEN** a user views purchases or reports from locked year 2024
- **THEN** the system displays the data with a "locked" indicator

#### Scenario: Allow unlocking for corrections
- **WHEN** year 2024 is locked and is the most recently locked year
- **THEN** the system allows authorized unlock with mandatory reason
