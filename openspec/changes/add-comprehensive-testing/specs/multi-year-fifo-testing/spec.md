# Spec: Multi-Year FIFO Scenario Testing

## ADDED Requirements

### Requirement: Cross-Year Inventory Carry-Forward Tests
**ID**: `MULTI-FIFO-001`  
**Priority**: Critical  
**Category**: E2E Testing

The system SHALL correctly handle inventory that spans multiple years with purchases and consumption cycles:
- Purchases in year N remain available in year N+1
- Year-end counts consume inventory following FIFO across year boundaries
- Lot remainingQuantity values are accurate after multi-year operations
- Inventory valuation uses correct unit costs from original purchase lots

#### Scenario: Three-year inventory cycle with FIFO consumption
**Given** in 2022, Product A has the following purchases:
  - Jan 2022: 100 units @ $5.00
  - Jun 2022: 50 units @ $5.50
**And** year-end count 2022 records 120 units remaining  
**Then** lot quantities after 2022 count:
  - Jan 2022 lot: 70 remainingQuantity (30 consumed)
  - Jun 2022 lot: 50 remainingQuantity (0 consumed)
**And** total inventory value is $875.00 ($350 + $525)

**Given** in 2023, Product A has the following purchase:
  - Mar 2023: 80 units @ $6.00
**And** year-end count 2023 records 150 units remaining  
**Then** lot quantities after 2023 count:
  - Jan 2022 lot: 20 remainingQuantity (50 more consumed from oldest)
  - Jun 2022 lot: 50 remainingQuantity (0 consumed)
  - Mar 2023 lot: 80 remainingQuantity (0 consumed)
**And** total inventory value is $955.00 ($100 + $275 + $480)

**Given** in 2024, no purchases occur  
**And** year-end count 2024 records 60 units remaining  
**Then** lot quantities after 2024 count:
  - Jan 2022 lot: 0 remainingQuantity (fully depleted)
  - Jun 2022 lot: 0 remainingQuantity (fully depleted)
  - Mar 2023 lot: 60 remainingQuantity (20 consumed)
**And** total inventory value is $360.00 (60 × $6.00)

---

### Requirement: Multiple Products Multi-Year Tests
**ID**: `MULTI-FIFO-002`  
**Priority**: High  
**Category**: E2E Testing

The system SHALL correctly handle multiple products each with independent FIFO calculations across years:
- Each product's lots are consumed independently
- Year-end counts affect only their respective products
- FIFO ordering is maintained per product, not globally

#### Scenario: Two products with different consumption patterns
**Given** Product A and Product B exist  
**And** in 2022:
  - Product A: Purchase 100 @ $1.00
  - Product B: Purchase 200 @ $2.00
**And** year-end count 2022:
  - Product A: 80 remaining
  - Product B: 200 remaining

**When** in 2023:
  - Product A: Purchase 50 @ $1.20
  - Product B: No purchases
**And** year-end count 2023:
  - Product A: 100 remaining
  - Product B: 150 remaining

**Then** Product A lots:
  - 2022 lot: 50 remainingQuantity
  - 2023 lot: 50 remainingQuantity
**And** Product B lots:
  - 2022 lot: 150 remainingQuantity
**And** Product A value: $110.00 ($50 + $60)
**And** Product B value: $300.00

---

### Requirement: Year Boundary Edge Cases
**ID**: `MULTI-FIFO-003`  
**Priority**: Medium  
**Category**: E2E Testing

The system SHALL handle edge cases at year boundaries:
- Purchases on Dec 31 vs. Jan 1 are treated as different years
- Year-end counts correctly include purchases up to Dec 31
- FIFO ordering respects exact dates, not just years

#### Scenario: Year-boundary purchase ordering
**Given** a product has purchases:
  - Dec 31, 2022: 50 units @ $1.00
  - Jan 1, 2023: 50 units @ $1.10
**When** year-end count 2023 records 60 units remaining  
**Then** the 2022 lot has 10 remainingQuantity  
**And** the 2023 lot has 50 remainingQuantity  
**And** inventory value is $65.00 ($10 + $55)  
**And** FIFO consumed the Dec 31 purchase first

---

### Requirement: User-Specified Bolt Scenario (Full Validation)
**ID**: `MULTI-FIFO-004`  
**Priority**: Critical  
**Category**: E2E Testing

The system SHALL pass the complete user-specified bolt scenario as an end-to-end test validating all FIFO calculations, lot updates, and inventory valuation across three years.

#### Scenario: Complete bolt scenario with all assertions
**Given** a product "10mm Bolt" is created with supplier and unit  
**And** a user is authenticated

**When** the following actions occur in sequence:

1. **2022 Operations**:
   - POST /api/purchases with { productId, quantity: 10, unitCost: 1.00, purchaseDate: '2022-01-15' }
   - POST /api/year-end-count with { year: 2022 }
   - PUT /api/year-end-count/:id/items/:productId with { countedQuantity: 8 }
   - POST /api/year-end-count/:id/confirm

2. **2023 Operations**:
   - POST /api/purchases with { productId, quantity: 5, unitCost: 1.50, purchaseDate: '2023-01-20' }
   - POST /api/year-end-count with { year: 2023 }
   - PUT /api/year-end-count/:id/items/:productId with { countedQuantity: 11 }
   - POST /api/year-end-count/:id/confirm

3. **2024 Operations**:
   - POST /api/year-end-count with { year: 2024 }
   - PUT /api/year-end-count/:id/items/:productId with { countedQuantity: 1 }
   - POST /api/year-end-count/:id/confirm

**Then** the following assertions MUST pass:

**After 2022 count**:
- GET /api/purchases shows Purchase 1 with remainingQuantity: 8
- GET /api/inventory shows total value: $8.00

**After 2023 count**:
- GET /api/purchases shows:
  - Purchase 1 (2022): remainingQuantity: 6
  - Purchase 2 (2023): remainingQuantity: 5
- GET /api/inventory shows total value: $13.50
- Value calculation: (6 × $1.00) + (5 × $1.50) = $6.00 + $7.50 = $13.50

**After 2024 count**:
- GET /api/purchases shows:
  - Purchase 1 (2022): remainingQuantity: 0 (CRITICAL: fully consumed)
  - Purchase 2 (2023): remainingQuantity: 1 (CRITICAL: 4 units consumed)
- GET /api/inventory shows total value: $1.50
- Value calculation: (1 × $1.50) = $1.50
- FIFO validation: Oldest lot (Purchase 1) depleted before newer lot (Purchase 2)

**And** all three years are locked  
**And** year-end count records are immutable  
**And** inventory value accuracy is within $0.01

---

### Requirement: Data Integrity Across Year-End Counts
**ID**: `MULTI-FIFO-005`  
**Priority**: High  
**Category**: E2E Testing

The system SHALL maintain data integrity across multiple year-end count cycles:
- Sum of all lot remainingQuantity equals total inventory
- Inventory value calculated from lots matches expected FIFO value
- No phantom inventory appears or disappears
- Locked year data remains unchanged

#### Scenario: Inventory consistency check across years
**Given** a complete multi-year scenario has been executed  
**When** the system calculates:
  - Sum of remainingQuantity for all lots
  - FIFO value from lots
  - Expected quantities in year-end counts
**Then** total remainingQuantity equals latest year-end countedQuantity  
**And** FIFO value from lots matches year-end count value  
**And** no lots have negative remainingQuantity  
**And** no lots have remainingQuantity > original quantity  
**And** locked years cannot be modified

---

## MODIFIED Requirements

None (new capability)

---

## REMOVED Requirements

None
