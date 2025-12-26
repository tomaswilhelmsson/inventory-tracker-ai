# VAT Purchase Entry Specification

## ADDED Requirements

### Requirement: VAT Toggle in Multi-Item Purchase Dialog

The multi-item purchase dialog MUST provide a "Prices Include VAT" toggle that controls how line item prices are interpreted.

#### Scenario: User enters purchase with VAT-inclusive line items (default mode)

**Given** the user opens the multi-item purchase dialog  
**And** the "Prices Include VAT" checkbox is CHECKED (default)  
**And** the VAT rate is set to 25%  
**When** the user enters:
- Invoice Total: $125.00
- Line Item 1: quantity=10, unitCost=$5.00
- Line Item 2: quantity=10, unitCost=$7.50  
**Then** the system calculates:
- Line Item 1 excl VAT: $4.00 per unit
- Line Item 2 excl VAT: $6.00 per unit
- Subtotal excl VAT: $100.00
- VAT amount: $25.00
- Total incl VAT: $125.00  
**And** validation passes (matches invoice total)  
**And** the purchase can be created

#### Scenario: User enters purchase with VAT-exclusive line items

**Given** the user opens the multi-item purchase dialog  
**And** the user UNCHECKS the "Prices Include VAT" checkbox  
**And** the VAT rate is set to 25%  
**When** the user enters:
- Invoice Total: $125.00 (grand total from invoice, incl VAT)
- Line Item 1: quantity=10, unitCost=$4.00 (excl VAT)
- Line Item 2: quantity=10, unitCost=$6.00 (excl VAT)  
**Then** the system calculates:
- Line Item 1 incl VAT: $5.00 per unit
- Line Item 2 incl VAT: $7.50 per unit
- Subtotal excl VAT: $100.00
- VAT amount: $25.00
- Total incl VAT: $125.00  
**And** validation passes (matches invoice total)  
**And** the purchase can be created

#### Scenario: Invoice total validation with VAT mismatch

**Given** the user has entered line items  
**And** the calculated total (incl VAT) is $125.00  
**When** the user enters invoice total: $120.00  
**Then** the system displays a warning:
  "Invoice total mismatch: Calculated $125.00 vs Entered $120.00 (Diff: $5.00)"  
**And** the warning is highlighted in yellow  
**And** the Create button remains enabled (user can proceed)

---

### Requirement: VAT Rate Configuration

The system MUST allow VAT rate to be configured and applied to purchases.

#### Scenario: Default VAT rate from configuration

**Given** the backend environment variable `VAT_RATE=0.25`  
**When** the user opens the multi-item purchase dialog  
**Then** the VAT rate field is pre-filled with "25%"  
**And** the user can override the rate for this specific purchase

#### Scenario: Custom VAT rate per purchase

**Given** the user is creating a multi-item purchase  
**When** the user changes the VAT rate to "20%"  
**And** enters line items  
**Then** all VAT calculations use the 20% rate  
**And** the custom rate is stored with the purchase batch

#### Scenario: Zero VAT purchase (VAT-exempt)

**Given** the user is creating a purchase  
**When** the user sets VAT rate to "0%"  
**And** enters line items  
**Then** unitCostExclVAT equals unitCostInclVAT  
**And** no VAT is calculated or added  
**And** the purchase is created successfully

---

### Requirement: Single-Item Purchase VAT Handling

Single-item purchase dialog MUST support the same VAT toggle as multi-item purchases.

#### Scenario: Create single purchase with VAT included

**Given** the user opens the single-item purchase dialog  
**And** the "Prices Include VAT" checkbox is CHECKED  
**And** VAT rate is 25%  
**When** the user enters:
- Product: Widget A
- Quantity: 10
- Unit Cost: $5.00 (incl VAT)  
**Then** the system calculates and displays:
- Unit Cost excl VAT: $4.00
- Total excl VAT: $40.00
- VAT: $10.00
- Total incl VAT: $50.00  
**And** clicking Create stores:
  - `vatRate = 0.25`
  - `unitCostExclVAT = 4.00`
  - `unitCostInclVAT = 5.00`
  - `pricesIncludeVAT = true`

#### Scenario: Create single purchase with VAT excluded

**Given** the user opens the single-item purchase dialog  
**And** the user UNCHECKS "Prices Include VAT"  
**And** VAT rate is 25%  
**When** the user enters:
- Product: Widget A
- Quantity: 10
- Unit Cost: $4.00 (excl VAT)  
**Then** the system calculates and displays:
- Unit Cost incl VAT: $5.00
- Total excl VAT: $40.00
- VAT: $10.00
- Total incl VAT: $50.00  
**And** clicking Create stores the same values as above

---

### Requirement: VAT Display in Purchase List

The purchase list MUST provide a toggle to display costs including or excluding VAT.

#### Scenario: Display purchases excluding VAT (default)

**Given** the user navigates to the Purchases page  
**And** the display toggle is set to "Excluding VAT"  
**When** viewing the purchase list  
**Then** the "Unit Cost" column shows `unitCostExclVAT`  
**And** the "Total Cost" column shows `quantity * unitCostExclVAT`  
**And** a small indicator shows "(Excl VAT)" next to cost columns

#### Scenario: Toggle to display purchases including VAT

**Given** the user is viewing the purchase list  
**When** the user clicks the display toggle to "Including VAT"  
**Then** the "Unit Cost" column shows `unitCostInclVAT`  
**And** the "Total Cost" column shows `quantity * unitCostInclVAT`  
**And** a small indicator shows "(Incl VAT)" next to cost columns  
**And** the toggle preference is saved to localStorage

#### Scenario: View VAT details in purchase tooltip

**Given** the user is viewing the purchase list  
**When** the user hovers over a purchase row  
**Then** a tooltip displays:
- Unit Cost excl VAT: $4.00
- VAT Rate: 25%
- Unit Cost incl VAT: $5.00
- Entry Mode: "Prices included VAT"

---

## MODIFIED Requirements

None. This is a new capability addition.

## REMOVED Requirements

None.
