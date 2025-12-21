# Spec: Year-End Count Workflow Testing

## ADDED Requirements

### Requirement: Count Initiation Tests
**ID**: `YEC-TEST-001`  
**Priority**: High  
**Category**: Integration Testing

The year-end count initiation endpoint SHALL be tested for:
- Creating count with expected quantities from current inventory
- Rejecting counts for locked years
- Allowing multiple revisions after year unlock
- Calculating expected quantities correctly from purchase lots

#### Scenario: Initiate count creates items with correct expected quantities
**Given** a product has purchase lots with total remaining 50 units  
**When** POST /api/year-end-count is called with year 2024  
**Then** a year-end count is created with status "draft"  
**And** a count item is created for the product  
**And** the item's expectedQuantity is 50  
**And** countedQuantity is null  
**And** variance is null

#### Scenario: Cannot initiate count for locked year
**Given** year 2023 is locked  
**When** POST /api/year-end-count is called with year 2023  
**Then** the request fails with 400 status  
**And** the error message is "Cannot create count for locked year"  
**And** no count record is created

#### Scenario: Multiple revisions after unlock
**Given** year 2023 has a confirmed count (revision 1)  
**And** year 2023 is unlocked  
**When** POST /api/year-end-count is called with year 2023  
**Then** a new count is created with revision 2  
**And** the new count status is "draft"  
**And** the previous count (revision 1) remains unchanged

---

### Requirement: Count Update Tests
**ID**: `YEC-TEST-002`  
**Priority**: Critical  
**Category**: Integration Testing

The count item update endpoint SHALL be tested for:
- Updating counted quantity and calculating variance
- Calculating FIFO value correctly
- Rejecting updates to confirmed counts
- Handling partial updates (some items counted, others pending)

#### Scenario: Update count item calculates variance and value
**Given** a year-end count exists with expectedQuantity 100  
**And** the product has lots: 60 units @ $1.00, 50 units @ $1.50  
**When** PUT /api/year-end-count/:id/items/:productId is called with countedQuantity 80  
**Then** the item is updated with countedQuantity 80  
**And** variance is calculated as -20 (80 - 100)  
**And** value is calculated as $90.00 (60 × $1.00 + 20 × $1.50)  
**And** the response includes the updated item

#### Scenario: Cannot update confirmed count
**Given** a year-end count with status "confirmed"  
**When** PUT /api/year-end-count/:id/items/:productId is called  
**Then** the request fails with 400 status  
**And** the error message is "Cannot update confirmed count"  
**And** no database changes occur

#### Scenario: Partial count updates allowed
**Given** a count has 3 items (A, B, C)  
**When** only item A is updated with countedQuantity  
**Then** item A has variance and value calculated  
**And** items B and C remain with null countedQuantity  
**And** the count status remains "draft"

---

### Requirement: Count Confirmation Tests
**ID**: `YEC-TEST-003`  
**Priority**: Critical  
**Category**: Integration Testing

The count confirmation endpoint SHALL be tested for:
- Updating lot quantities using FIFO
- Locking year after confirmation
- Rejecting incomplete counts
- Creating immutable count records
- Calculating final report values

#### Scenario: Confirm count updates lot quantities via FIFO
**Given** a product has two lots:
  - Lot 1: 2022-01-01, quantity 50, remainingQuantity 50, unitCost $1.00
  - Lot 2: 2023-01-01, quantity 40, remainingQuantity 40, unitCost $1.20
**And** expectedQuantity is 90  
**And** countedQuantity is 60  
**When** POST /api/year-end-count/:id/confirm is called  
**Then** the count status is "confirmed"  
**And** Lot 1 remainingQuantity is 0 (fully consumed)  
**And** Lot 2 remainingQuantity is 10 (partially consumed)  
**And** the year is locked  
**And** confirmedAt timestamp is set

#### Scenario: Cannot confirm incomplete count
**Given** a count has 3 items  
**And** only 2 items have countedQuantity set  
**When** POST /api/year-end-count/:id/confirm is called  
**Then** the request fails with 400 status  
**And** the error message indicates incomplete count  
**And** no lot quantities are updated  
**And** the year is not locked

#### Scenario: Confirmed count is immutable
**Given** a count is confirmed  
**When** any update is attempted to count items  
**Then** all updates fail with appropriate errors  
**And** lot quantities remain unchanged  
**And** the count record cannot be modified

---

### Requirement: Year Unlock and Revision Tests
**ID**: `YEC-TEST-004`  
**Priority**: High  
**Category**: Integration Testing

The year unlock and revision workflow SHALL be tested for:
- Unlocking most recent locked year only
- Creating unlock audit record
- Allowing new count with incremented revision
- Preventing backward purchase registration after unlock

#### Scenario: Unlock most recent locked year
**Given** years 2022, 2023, and 2024 are locked  
**When** POST /api/year-end-count/2024/unlock is called with valid reason  
**Then** year 2024 is unlocked  
**And** an unlock audit record is created  
**And** the audit record has reasonCategory and description  
**And** years 2022 and 2023 remain locked

#### Scenario: Cannot unlock non-recent year
**Given** years 2022, 2023, and 2024 are locked  
**When** POST /api/year-end-count/2023/unlock is called  
**Then** the request fails with 400 status  
**And** the error message is "Can only unlock most recent locked year"  
**And** year 2023 remains locked

#### Scenario: Unlock history is retrievable
**Given** year 2023 was unlocked twice with reasons  
**When** GET /api/year-end-count/2023/unlock-history is called  
**Then** the response contains 2 unlock audit records  
**And** each record has unlockedAt timestamp  
**And** each record has reasonCategory and description  
**And** records are ordered by unlockedAt descending

---

### Requirement: Count Variance Calculation Tests
**ID**: `YEC-TEST-005`  
**Priority**: High  
**Category**: Unit Testing

The variance calculation logic SHALL be tested for:
- Exact match (variance = 0)
- Surplus (variance > 0)
- Shortage (variance < 0)
- Multiple products with mixed variances

#### Scenario: Exact match variance
**Given** a count item with expectedQuantity 100  
**When** countedQuantity is set to 100  
**Then** variance is calculated as 0  
**And** the variance status is "exact"

#### Scenario: Surplus variance
**Given** a count item with expectedQuantity 50  
**When** countedQuantity is set to 55  
**Then** variance is calculated as +5  
**And** the variance status is "surplus"

#### Scenario: Shortage variance
**Given** a count item with expectedQuantity 75  
**When** countedQuantity is set to 70  
**Then** variance is calculated as -5  
**And** the variance status is "shortage"

#### Scenario: Aggregate variance across products
**Given** a count has 3 items:
  - Item A: expected 100, counted 100 (variance 0)
  - Item B: expected 50, counted 55 (variance +5)
  - Item C: expected 75, counted 70 (variance -5)
**When** the count summary is calculated  
**Then** totalExpected is 225  
**And** totalCounted is 225  
**And** totalVariance is 0 (net variance)

---

## MODIFIED Requirements

None (new capability)

---

## REMOVED Requirements

None
