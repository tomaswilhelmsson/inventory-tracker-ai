# Spec: FIFO Calculation Testing

## ADDED Requirements

### Requirement: Single-Lot FIFO Consumption Tests
**ID**: `FIFO-TEST-001`  
**Priority**: Critical  
**Category**: Unit Testing

The `consumeInventoryFIFO` function SHALL be tested for single-lot scenarios with:
- Exact consumption (target equals lot quantity)
- Partial consumption (target less than lot quantity)
- No consumption (target equals zero)
- Over-consumption (target exceeds lot quantity)

#### Scenario: Exact lot consumption depletes to zero
**Given** a product has one purchase lot with quantity 100  
**And** remainingQuantity is 100  
**When** consumeInventoryFIFO is called with targetQuantity 100  
**Then** the lot's remainingQuantity is updated to 100  
**And** no error is thrown

#### Scenario: Partial lot consumption
**Given** a product has one purchase lot with quantity 100  
**And** remainingQuantity is 100  
**When** consumeInventoryFIFO is called with targetQuantity 60  
**Then** the lot's remainingQuantity is updated to 60  
**And** the lot's original quantity remains 100  
**And** no error is thrown

#### Scenario: Zero consumption leaves lot unchanged
**Given** a product has one purchase lot with quantity 100  
**And** remainingQuantity is 100  
**When** consumeInventoryFIFO is called with targetQuantity 0  
**Then** the lot's remainingQuantity remains 0  
**And** no error is thrown

---

### Requirement: Multi-Lot FIFO Ordering Tests
**ID**: `FIFO-TEST-002`  
**Priority**: Critical  
**Category**: Unit Testing

The `consumeInventoryFIFO` function SHALL consume inventory from oldest lots first when multiple lots exist:
- Oldest lot consumed completely before newer lots
- Consumption spans multiple lots when needed
- Newest lots remain untouched if target met by older lots

#### Scenario: Oldest lot consumed first
**Given** a product has three purchase lots:
  - Lot 1: purchaseDate 2022-01-01, quantity 50, remainingQuantity 50
  - Lot 2: purchaseDate 2023-01-01, quantity 30, remainingQuantity 30
  - Lot 3: purchaseDate 2024-01-01, quantity 20, remainingQuantity 20
**When** consumeInventoryFIFO is called with targetQuantity 60  
**Then** Lot 1 remainingQuantity is 0 (fully consumed)  
**And** Lot 2 remainingQuantity is 0 (fully consumed)  
**And** Lot 3 remainingQuantity is 20 (untouched)

#### Scenario: Consumption spans multiple lots
**Given** a product has two purchase lots:
  - Lot 1: purchaseDate 2022-06-15, quantity 40, remainingQuantity 40
  - Lot 2: purchaseDate 2023-03-20, quantity 60, remainingQuantity 60
**When** consumeInventoryFIFO is called with targetQuantity 70  
**Then** Lot 1 remainingQuantity is 0 (fully consumed)  
**And** Lot 2 remainingQuantity is 30 (partially consumed)

#### Scenario: Newest lots remain when target met
**Given** a product has three purchase lots with total 100 units  
**When** consumeInventoryFIFO is called with targetQuantity 20  
**Then** only the oldest lot is affected  
**And** newer lots remain at full remainingQuantity

---

### Requirement: Edge Case Handling Tests
**ID**: `FIFO-TEST-003`  
**Priority**: High  
**Category**: Unit Testing

The `consumeInventoryFIFO` function SHALL handle edge cases correctly:
- Negative target quantity (reject with error)
- Target exceeding total available inventory (consume all)
- Empty inventory (no lots exist)

#### Scenario: Negative target quantity rejected
**Given** a product has purchase lots  
**When** consumeInventoryFIFO is called with targetQuantity -10  
**Then** an error is thrown with message "Target quantity cannot be negative"  
**And** no database changes occur

#### Scenario: Target exceeds available inventory
**Given** a product has total 50 units across all lots  
**When** consumeInventoryFIFO is called with targetQuantity 100  
**Then** all lots are consumed to 0 remainingQuantity  
**And** the function completes without error

#### Scenario: Empty inventory (no lots)
**Given** a product has no purchase lots  
**When** consumeInventoryFIFO is called with targetQuantity 10  
**Then** the function completes without error  
**And** no database changes occur

---

### Requirement: FIFO Value Calculation Tests
**ID**: `FIFO-TEST-004`  
**Priority**: Critical  
**Category**: Unit Testing

The system SHALL correctly calculate inventory value using FIFO cost accounting:
- Oldest lot unit costs applied first
- Multiple lot costs aggregated correctly
- Partial lot consumption uses correct unit cost

#### Scenario: Single-lot value calculation
**Given** a product has one lot with 50 units @ $2.00 each  
**When** inventory value is calculated for 30 units  
**Then** the value is $60.00 (30 × $2.00)

#### Scenario: Multi-lot value spans cost tiers
**Given** a product has three lots:
  - Lot 1: 20 units @ $1.00 (oldest)
  - Lot 2: 30 units @ $1.50
  - Lot 3: 50 units @ $2.00 (newest)
**When** inventory value is calculated for 70 units  
**Then** the value is $120.00
  - 20 units from Lot 1 @ $1.00 = $20
  - 30 units from Lot 2 @ $1.50 = $45
  - 20 units from Lot 3 @ $2.00 = $40

---

### Requirement: User-Specified Bolt Scenario Test
**ID**: `FIFO-TEST-005`  
**Priority**: Critical  
**Category**: E2E Testing

The system SHALL correctly handle the multi-year bolt scenario as specified:
- 2022: Purchase 10 bolts @ $1.00, use 2, leaving 8 bolts worth $8.00
- 2023: Purchase 5 bolts @ $1.50, use 2 more (total 11 remaining, value $13.50)
- 2024: Use 10 bolts, leaving 1 bolt worth $1.50
  - Purchase 1 (2022) should have 0 remaining
  - Purchase 2 (2023) should have 1 remaining

#### Scenario: Multi-year bolt consumption with correct lot depletion
**Given** a product "10mm Bolt" exists  
**And** in 2022-01-15, 10 bolts are purchased @ $1.00 each (Purchase 1)  
**When** year-end count 2022 records 8 bolts remaining  
**Then** Purchase 1 remainingQuantity is 8  
**And** total inventory value is $8.00  

**Given** in 2023-01-20, 5 bolts are purchased @ $1.50 each (Purchase 2)  
**When** year-end count 2023 records 11 bolts remaining  
**Then** Purchase 1 remainingQuantity is 6 (2 more consumed from oldest lot)  
**And** Purchase 2 remainingQuantity is 5 (untouched)  
**And** total inventory value is $13.50 ($6.00 + $7.50)  

**When** year-end count 2024 records 1 bolt remaining  
**Then** Purchase 1 remainingQuantity is 0 (6 bolts consumed, lot depleted)  
**And** Purchase 2 remainingQuantity is 1 (4 bolts consumed)  
**And** total inventory value is $1.50  
**And** FIFO ordering is validated (oldest lot depleted first)

---

## MODIFIED Requirements

None (new capability)

---

## REMOVED Requirements

None
