# VAT Calculations Specification

## ADDED Requirements

### Requirement: VAT Calculation Utilities

The system MUST provide accurate VAT calculation utilities for converting between VAT-inclusive and VAT-exclusive amounts.

#### Scenario: Calculate VAT-exclusive amount from VAT-inclusive amount

**Given** a VAT-inclusive amount of $125.00  
**And** a VAT rate of 25% (0.25)  
**When** calculating the VAT-exclusive amount  
**Then** the result is $100.00  
**And** the calculation uses the formula: `inclVAT / (1 + vatRate)`  
**And** the result is rounded to 2 decimal places

#### Scenario: Calculate VAT-inclusive amount from VAT-exclusive amount

**Given** a VAT-exclusive amount of $100.00  
**And** a VAT rate of 25% (0.25)  
**When** calculating the VAT-inclusive amount  
**Then** the result is $125.00  
**And** the calculation uses the formula: `exclVAT * (1 + vatRate)`  
**And** the result is rounded to 2 decimal places

#### Scenario: Calculate VAT amount

**Given** a VAT-exclusive amount of $100.00  
**And** a VAT rate of 25% (0.25)  
**When** calculating the VAT amount  
**Then** the result is $25.00  
**And** the calculation uses the formula: `exclVAT * vatRate`  
**And** the result is rounded to 2 decimal places

#### Scenario: Handle rounding edge cases

**Given** a VAT-inclusive amount of $10.01  
**And** a VAT rate of 25% (0.25)  
**When** calculating the VAT-exclusive amount  
**Then** the result is $8.01 (rounded from $8.008)  
**And** when converting back to VAT-inclusive: $10.01  
**And** no cumulative rounding errors occur

---

### Requirement: Shipping Allocation with VAT

The system MUST correctly allocate shipping costs to line items when VAT is involved.

#### Scenario: Allocate shipping proportionally to VAT-exclusive line items

**Given** a multi-item purchase with:
- Line Item 1: $40.00 excl VAT
- Line Item 2: $60.00 excl VAT
- Shipping cost: $10.00
- VAT rate: 25%  
**When** calculating final unit costs  
**Then** shipping is allocated proportionally:
- Item 1 shipping: ($40 / $100) * $10 = $4.00
- Item 2 shipping: ($60 / $100) * $10 = $6.00  
**And** final costs excluding VAT:
- Item 1: $40 + $4 = $44.00
- Item 2: $60 + $6 = $66.00  
**And** final costs including VAT:
- Item 1: $44 * 1.25 = $55.00
- Item 2: $66 * 1.25 = $82.50  
**And** total: $55 + $82.50 = $137.50 = ($110 excl VAT * 1.25)

#### Scenario: Zero shipping cost

**Given** a multi-item purchase with shipping cost: $0.00  
**When** calculating final unit costs  
**Then** no shipping is allocated to any line item  
**And** final unit costs equal original line item costs

---

### Requirement: Invoice Total Validation with VAT

The system MUST validate that entered invoice total matches calculated total within acceptable tolerance.

#### Scenario: Invoice total matches calculated total

**Given** a multi-item purchase with:
- Calculated subtotal excl VAT: $100.00
- Shipping: $10.00
- VAT rate: 25%
- Calculated total incl VAT: ($100 + $10) * 1.25 = $137.50  
**When** the user enters invoice total: $137.50  
**Then** validation passes  
**And** no warning is displayed

#### Scenario: Invoice total differs within tolerance

**Given** calculated total incl VAT: $137.50  
**When** the user enters invoice total: $137.51  
**And** the difference is $0.01 (within $0.01 tolerance)  
**Then** validation passes  
**And** no warning is displayed

#### Scenario: Invoice total differs beyond tolerance

**Given** calculated total incl VAT: $137.50  
**When** the user enters invoice total: $138.00  
**And** the difference is $0.50 (exceeds $0.01 tolerance)  
**Then** validation shows warning:
  "Invoice total mismatch: Calculated $137.50 vs Entered $138.00 (Diff: $0.50)"  
**And** the warning does NOT block submission  
**And** user can proceed to create the purchase

---

### Requirement: Data Storage for VAT

The system MUST store both VAT-inclusive and VAT-exclusive amounts for complete audit trail.

#### Scenario: Store purchase with VAT data

**Given** a purchase is created with VAT rate 25%  
**And** user entered unit cost $5.00 (incl VAT)  
**When** the purchase is saved  
**Then** the database stores:
- `vatRate = 0.25`
- `unitCostExclVAT = 4.00`
- `unitCostInclVAT = 5.00`
- `pricesIncludeVAT = true`  
**And** all four fields are retrievable via API

#### Scenario: Retrieve purchase and display original invoice amounts

**Given** a purchase exists with stored VAT data  
**When** the purchase is retrieved via API  
**Then** the response includes:
- `vatRate`
- `unitCostExclVAT`
- `unitCostInclVAT`
- `pricesIncludeVAT`  
**And** the UI can display the purchase as it was originally entered

---

## MODIFIED Requirements

None. This is a new capability addition.

## REMOVED Requirements

None.
