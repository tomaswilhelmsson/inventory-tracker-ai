# VAT Reporting Specification

## ADDED Requirements

### Requirement: Year-End Reports Use VAT-Exclusive Values

Year-end count reports and inventory valuation MUST use VAT-exclusive amounts for accurate cost accounting.

#### Scenario: Calculate inventory value excluding VAT

**Given** the following purchase lots exist:
- Lot 1: quantity=10, unitCostExclVAT=$4.00, unitCostInclVAT=$5.00, remainingQty=10
- Lot 2: quantity=20, unitCostExclVAT=$6.00, unitCostInclVAT=$7.50, remainingQty=15  
**When** calculating total inventory value  
**Then** the system uses VAT-exclusive amounts:
  - Lot 1 value: 10 × $4.00 = $40.00
  - Lot 2 value: 15 × $6.00 = $90.00
  - Total: $130.00 (excluding VAT)  
**And** VAT-inclusive amounts are NOT used for accounting totals

#### Scenario: FIFO consumption uses VAT-exclusive costs

**Given** a product has the following lots (ordered by date):
- Lot A: qty=5, unitCostExclVAT=$4.00, remainingQty=5
- Lot B: qty=10, unitCostExclVAT=$5.00, remainingQty=10  
**When** performing year-end count showing 8 units remaining  
**Then** FIFO depletes oldest first:
  - Lot A fully consumed: -5 units
  - Lot B partially consumed: -2 units (8 remaining total)  
**And** cost calculation uses VAT-exclusive values:
  - Remaining value: (0 × $4.00) + (8 × $5.00) = $40.00

---

### Requirement: VAT Summary in Reports

Reports SHOULD include an optional VAT summary section showing total VAT paid.

#### Scenario: Display VAT summary for year-end report

**Given** year-end count is completed for 2024  
**And** purchases included:
- Total VAT-exclusive: $10,000
- Total VAT paid: $2,500 (25% rate)
- Total VAT-inclusive: $12,500  
**When** generating the year-end report  
**Then** an optional "VAT Summary" section displays:
```
VAT Summary for 2024:
  Total Purchases (Excl VAT): $10,000.00
  Total VAT Paid:              $2,500.00
  Total Purchases (Incl VAT): $12,500.00
  Average VAT Rate:            25.0%
```

#### Scenario: Group VAT summary by VAT rate

**Given** purchases with multiple VAT rates:
- 20 purchases at 25% VAT
- 5 purchases at 12% VAT
- 2 purchases at 0% VAT (exempt)  
**When** generating VAT summary  
**Then** the report groups by VAT rate:
```
VAT Breakdown:
  25% VAT: $8,000 (excl) → $2,000 VAT → $10,000 (incl)
  12% VAT: $1,000 (excl) → $120 VAT → $1,120 (incl)
  0% VAT:  $1,000 (excl) → $0 VAT → $1,000 (incl)
  ──────────────────────────────────────────────────
  Total:   $10,000 (excl) → $2,120 VAT → $12,120 (incl)
```

---

### Requirement: Backward Compatibility for Existing Data

The system MUST handle purchases created before VAT feature was implemented.

#### Scenario: Display legacy purchases without VAT data

**Given** a purchase exists from before VAT feature:
- `unitCost = 5.00` (legacy field)
- `vatRate = NULL` or not set
- `unitCostExclVAT = NULL`  
**When** viewing the purchase  
**Then** the system treats it as:
  - `vatRate = 0` (no VAT)
  - `unitCostExclVAT = 5.00`
  - `unitCostInclVAT = 5.00`  
**And** displays correctly in all views

#### Scenario: Migrate legacy data with default VAT

**Given** 1000 legacy purchases without VAT data  
**And** organization's default VAT rate is 25%  
**When** running the migration script with `DEFAULT_VAT_RATE=0`  
**Then** all legacy purchases are updated:
  - `vatRate = 0`
  - `unitCostExclVAT = <original unitCost>`
  - `unitCostInclVAT = <original unitCost>`
  - `pricesIncludeVAT = true` (default)  
**And** no data is lost  
**And** FIFO calculations remain accurate

---

### Requirement: Data Integrity After Migration

Database migration MUST preserve data integrity and FIFO calculation accuracy.

#### Scenario: Verify FIFO calculations unchanged after migration

**Given** existing purchases with known FIFO calculations  
**And** inventory values before migration: $50,000  
**When** VAT migration is performed  
**And** FIFO calculations are re-run  
**Then** inventory values after migration: $50,000  
**And** no lot quantities are modified  
**And** `unitCostExclVAT` equals original `unitCost` for 0% VAT

#### Scenario: Rollback migration if validation fails

**Given** a migration is in progress  
**When** validation detects data inconsistency  
**Then** the migration is automatically rolled back  
**And** original data is restored  
**And** error details are logged for investigation

---

## MODIFIED Requirements

### Requirement: Purchase List Display (Enhanced)

**Original**: Purchase list displays unit cost and total cost.

**Modified**: Purchase list displays costs with VAT toggle, defaulting to VAT-exclusive view for consistency with accounting reports.

#### Scenario: Default display shows VAT-exclusive costs

**Given** a user navigates to Purchases page for the first time  
**When** the page loads  
**Then** the display toggle defaults to "Excluding VAT"  
**And** all cost columns show VAT-exclusive amounts  
**And** this aligns with year-end report values

---

## REMOVED Requirements

None. All existing functionality is preserved with VAT as an additive feature.
