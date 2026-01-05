# Year-End Finished Goods Counting

## ADDED Requirements

### Requirement: Include Finished Goods in Year-End Count Initiation
The system SHALL automatically include all active finished goods when initiating a year-end count, using expected quantities from the previous year's count or zero for first-time counts.

#### Scenario: Initiate first year-end count with finished goods
**Given** 3 active finished goods exist in the system  
**And** no previous year-end count exists  
**When** the user initiates a year-end count for 2024  
**Then** the count includes 3 finished goods count items  
**And** each finished good has expectedQuantity of 0  
**And** each finished good has materialCostPerUnit equal to the current finished good materialCost  
**And** each finished good has countedQuantity null (not yet counted)

#### Scenario: Initiate subsequent year-end count with finished goods
**Given** year 2024 count is confirmed with:
- "Widget A": counted 100 pieces
- "Widget B": counted 50 pieces  
**And** "Widget A" material cost updated from 150.00 to 175.00  
**When** the user initiates year 2025 count  
**Then** the 2025 count includes:
- "Widget A": expectedQuantity 100, materialCostPerUnit 175.00
- "Widget B": expectedQuantity 50, materialCostPerUnit (current value)

#### Scenario: New finished good added between years
**Given** year 2024 count is confirmed  
**And** a new finished good "Widget C" is created after 2024 confirmation  
**When** the user initiates year 2025 count  
**Then** the count includes "Widget C" with expectedQuantity 0  
**And** "Widget C" uses current materialCostPerUnit

---

### Requirement: Update Finished Good Counted Quantity
The system SHALL allow users to enter actual counted quantities for finished goods and automatically calculate variance and total value.

#### Scenario: Enter counted quantity for finished good
**Given** a year-end count with finished good "Widget A":
- expectedQuantity: 100
- materialCostPerUnit: 150.00
- countedQuantity: null  
**When** the user enters countedQuantity 95  
**Then** the system calculates:
- variance: -5 (95 - 100)
- totalValue: 14,250.00 (95 × 150.00)  
**And** the count item is saved with these values

#### Scenario: Update counted quantity multiple times (draft mode)
**Given** a draft year-end count with finished good "Widget A"  
**And** countedQuantity is already 95  
**When** the user updates countedQuantity to 98  
**Then** the system recalculates:
- variance: -2 (98 - 100)
- totalValue: 14,700.00 (98 × 150.00)

#### Scenario: Cannot update confirmed count
**Given** a confirmed year-end count with finished good "Widget A"  
**When** the user attempts to update countedQuantity  
**Then** the system returns an error "Cannot update confirmed year-end count"  
**And** the counted quantity remains unchanged

---

### Requirement: Calculate Finished Goods Variance Summary
The system SHALL calculate total variance and total value for all finished goods in a year-end count.

#### Scenario: Calculate variance summary for multiple finished goods
**Given** a year-end count with finished goods:
- "Widget A": expected 100, counted 95, materialCost 150.00
- "Widget B": expected 50, counted 60, materialCost 200.00
- "Widget C": expected 20, not counted yet  
**When** the user requests variance summary  
**Then** the system returns:
- totalFinishedGoods: 3
- countedFinishedGoods: 2
- totalExpectedQuantity: 170 (100 + 50 + 20)
- totalCountedQuantity: 155 (95 + 60 + 0)
- totalVariance: 5 (counted - expected for counted items)
- totalValue: 26,250.00 (14,250 + 12,000)
- uncountedItems: 1 (Widget C)

#### Scenario: Variance summary with all items counted
**Given** a year-end count with all finished goods counted  
**When** the user requests variance summary  
**Then** uncountedItems is 0  
**And** totalCountedQuantity equals sum of all counted quantities

---

### Requirement: Confirm Year-End Count with Finished Goods
The system SHALL include finished goods in the confirmation process and prevent modification after confirmation.

#### Scenario: Confirm count with uncounted finished goods
**Given** a year-end count with 2 finished goods  
**And** only 1 finished good has been counted  
**When** the user attempts to confirm the count  
**Then** the system returns an error "Cannot confirm count. 1 finished goods not counted: Widget B"  
**And** the count remains in draft status

#### Scenario: Successfully confirm count with all finished goods counted
**Given** a year-end count with all raw materials counted  
**And** all finished goods counted  
**When** the user confirms the count  
**Then** the count status changes to "confirmed"  
**And** all finished goods count items become immutable  
**And** the year is locked

#### Scenario: Finished goods carry forward to next year
**Given** year 2024 count is confirmed with:
- "Widget A": counted 95
- "Widget B": counted 60  
**When** year 2025 count is initiated  
**Then** the expected quantities are:
- "Widget A": 95
- "Widget B": 60

---

### Requirement: Refresh Expected Quantities for Finished Goods
The system SHALL allow refreshing expected quantities if finished goods are added or material costs change, while preserving already-entered counted quantities.

#### Scenario: Refresh after adding new finished good
**Given** a draft year-end count for 2025  
**And** "Widget A" has been counted with quantity 100  
**And** a new finished good "Widget C" is created  
**When** the user refreshes expected quantities  
**Then** "Widget A" retains countedQuantity 100 and recalculates value with current cost  
**And** "Widget C" is added with expectedQuantity 0 and countedQuantity null

#### Scenario: Refresh after material cost change
**Given** a draft year-end count for 2025  
**And** "Widget A" has countedQuantity 100 with materialCostPerUnit 150.00  
**And** "Widget A" materialCost is updated to 175.00 in the master record  
**When** the user refreshes expected quantities  
**Then** "Widget A" materialCostPerUnit updates to 175.00  
**And** totalValue recalculates to 17,500.00 (100 × 175.00)  
**And** countedQuantity remains 100

---

### Requirement: Prevent Deletion of Finished Goods in Active Counts
The system SHALL prevent deletion of finished goods that are referenced in any year-end count.

#### Scenario: Attempt to delete finished good in draft count
**Given** a draft year-end count includes "Widget A"  
**When** the user attempts to delete "Widget A"  
**Then** the system returns an error "Cannot delete finished good referenced in year-end counts"  
**And** "Widget A" is not deleted

#### Scenario: Attempt to delete finished good in confirmed count
**Given** a confirmed year-end count includes "Widget A"  
**When** the user attempts to delete "Widget A"  
**Then** the system returns an error "Cannot delete finished good referenced in year-end counts"  
**And** the system suggests marking it as inactive

---

### Requirement: Separate Raw Materials and Finished Goods in Count Interface
The system SHALL display raw materials and finished goods in separate sections of the year-end count interface.

#### Scenario: View year-end count with both raw materials and finished goods
**Given** a year-end count with:
- 50 raw material products
- 3 finished goods  
**When** the user views the count sheet  
**Then** the interface shows two sections:
- "Raw Materials Inventory" with 50 items
- "Finished Goods Inventory" with 3 items  
**And** each section has its own totals:
- Raw materials: total expected, counted, variance, value
- Finished goods: total expected, counted, variance, value  
**And** a grand total combines both sections

#### Scenario: Progress tracking includes finished goods
**Given** a year-end count with 50 raw materials and 3 finished goods  
**And** 45 raw materials counted, 2 finished goods counted  
**When** the user views progress  
**Then** the system shows:
- Raw materials: 45 / 50 counted (90%)
- Finished goods: 2 / 3 counted (67%)
- Overall: 47 / 53 counted (89%)
