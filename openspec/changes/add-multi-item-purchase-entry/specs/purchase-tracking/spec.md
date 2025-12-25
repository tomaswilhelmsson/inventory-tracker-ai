# Purchase Tracking Specification

## ADDED Requirements

### Requirement: Multi-Item Purchase Batch Entry
The system SHALL allow users to create multiple purchase lots from a single invoice/delivery in one transaction.

#### Scenario: Create batch with multiple products
- **GIVEN** a user has an invoice with 3 different products from the same supplier
- **WHEN** the user enters batch details (supplier, date, verification number) and adds 3 line items with product, quantity, and costs
- **THEN** the system creates 3 separate purchase lots linked to a single purchase batch
- **AND** all lots share the same purchase date, supplier, and verification number
- **AND** each lot has a reference to the batch ID

#### Scenario: Add and remove line items in batch entry form
- **GIVEN** a user is creating a multi-item purchase
- **WHEN** the user clicks "Add Item" button
- **THEN** a new empty row is added to the line items table
- **AND** the user can select product, enter quantity and cost
- **WHEN** the user clicks delete icon on a row
- **THEN** that line item is removed
- **AND** at least 1 line item must remain (cannot delete last row)

#### Scenario: Prevent batch creation with mismatched totals
- **GIVEN** a user enters line items totaling $100 and shipping of $10
- **WHEN** the user submits the batch without entering an invoice total
- **THEN** the system auto-calculates invoice total as $110
- **WHEN** the user manually enters invoice total as $120 (mismatch)
- **THEN** the system prevents submission
- **AND** displays validation error "Invoice total must equal line items ($100) + shipping ($10) = $110"

### Requirement: Automatic Unit Cost Calculation
The system SHALL support reverse calculation of unit cost from total cost when quantity is known.

#### Scenario: Calculate unit cost from total cost
- **GIVEN** a user enters a line item for screws sold in bulk packages
- **WHEN** the user enters quantity as 500 and total cost as $75.00
- **AND** leaves unit cost field empty
- **THEN** the system automatically calculates unit cost as $0.15 ($75 / 500)
- **AND** displays the calculated unit cost in the form

#### Scenario: Calculate total cost from unit cost
- **GIVEN** a user enters a line item with known unit pricing
- **WHEN** the user enters unit cost as $2.50 and quantity as 100
- **AND** leaves total cost field empty
- **THEN** the system automatically calculates total cost as $250.00 ($2.50 × 100)
- **AND** displays the calculated total cost in the form

#### Scenario: Prevent entry of both unit cost and total cost
- **GIVEN** a user is entering a line item
- **WHEN** the user enters a unit cost value
- **THEN** the total cost field becomes read-only (displays calculated value)
- **WHEN** the user clears unit cost and enters total cost
- **THEN** the unit cost field becomes read-only (displays calculated value)

### Requirement: Proportional Shipping Cost Distribution
The system SHALL distribute shipping costs across line items proportionally based on their subtotal (unit cost × quantity).

#### Scenario: Distribute shipping across items with different values
- **GIVEN** a batch with the following line items:
  - Item A: 1 unit @ $5.00 = $5.00
  - Item B: 1 unit @ $5.00 = $5.00  
  - Item C: 1 unit @ $10.00 = $10.00
- **AND** shipping cost is $10.00
- **WHEN** the batch is created
- **THEN** Item A receives ($5/$20) × $10 = $2.50 shipping → final unit cost $7.50
- **AND** Item B receives ($5/$20) × $10 = $2.50 shipping → final unit cost $7.50
- **AND** Item C receives ($10/$20) × $10 = $5.00 shipping → final unit cost $15.00
- **AND** each lot's unit cost includes its proportional shipping allocation

#### Scenario: Display shipping allocation breakdown
- **GIVEN** a user is entering a multi-item purchase with shipping cost
- **WHEN** the form displays line items with calculated shipping per item
- **THEN** each row shows: Original Unit Cost, Shipping Allocation, Final Unit Cost
- **AND** a tooltip explains the proportional allocation formula

#### Scenario: Handle zero shipping cost
- **GIVEN** a batch with shipping cost of $0.00
- **WHEN** the batch is created
- **THEN** no shipping allocation is applied
- **AND** final unit cost equals original unit cost for all items

### Requirement: Invoice Total Validation
The system SHALL enforce that the sum of line item subtotals plus shipping equals the invoice total within $0.01 tolerance.

#### Scenario: Accept invoice with matching total
- **GIVEN** line items totaling $99.99 and shipping of $10.00
- **WHEN** user enters invoice total as $109.99
- **THEN** validation passes (exact match)
- **AND** submit button is enabled

#### Scenario: Accept invoice within rounding tolerance
- **GIVEN** line items totaling $33.33 (calculated from 3 items @ $11.11 each) and shipping of $5.00
- **WHEN** user enters invoice total as $38.33
- **THEN** validation passes (within $0.01 tolerance)
- **AND** submit button is enabled

#### Scenario: Reject invoice with total mismatch
- **GIVEN** line items totaling $100.00 and shipping of $15.00
- **WHEN** user enters invoice total as $120.00
- **THEN** validation fails (difference of $5.00)
- **AND** submit button is disabled
- **AND** error message displays "Total mismatch: Expected $115.00, got $120.00"

#### Scenario: Real-time validation feedback
- **GIVEN** a user is entering batch details
- **WHEN** the user modifies any line item cost or quantity
- **THEN** the system immediately recalculates expected invoice total
- **AND** displays visual indicator (green checkmark or red X) next to invoice total field
- **AND** shows live difference amount if mismatch exists

### Requirement: Purchase Batch Tracking
The system SHALL maintain a record of purchase batches linking related lots from the same invoice.

#### Scenario: Create purchase batch record
- **GIVEN** a user submits a multi-item purchase
- **WHEN** validation passes and lots are created
- **THEN** a PurchaseBatch record is created with:
  - Supplier ID
  - Purchase date
  - Verification number (invoice number)
  - Invoice total amount
  - Shipping cost
  - Creation timestamp
- **AND** all created lots reference this batch ID

#### Scenario: Query lots by batch
- **GIVEN** multiple purchase batches exist in the system
- **WHEN** a user requests lots for batch ID 42
- **THEN** the system returns all lots with batchId = 42
- **AND** includes batch metadata (invoice total, shipping, verification number)

#### Scenario: Display batch info on lot details
- **GIVEN** a purchase lot that is part of a batch
- **WHEN** the user views lot details
- **THEN** the system displays a badge "Part of Invoice #ABC123"
- **AND** provides a link to view all lots in that batch

#### Scenario: Handle single-item purchases
- **GIVEN** a user creates a purchase using the existing single-item flow
- **WHEN** the lot is created
- **THEN** batchId is NULL (not part of a batch)
- **AND** the lot functions identically to historical single-item purchases

### Requirement: Batch Entry User Interface
The system SHALL provide a table-based interface for entering multiple line items efficiently.

#### Scenario: Open multi-item purchase form
- **GIVEN** a user is on the Purchases page
- **WHEN** the user clicks "Add Multi-Item Purchase" button
- **THEN** a dialog opens with batch entry form containing:
  - Supplier dropdown (required)
  - Purchase date picker (required)
  - Verification/invoice number field (optional)
  - Shipping cost field (default $0.00)
  - Line items table with 1 empty row
  - Invoice total field
  - Summary section showing calculated totals

#### Scenario: Navigate line items table with keyboard
- **GIVEN** a user is entering line items in the table
- **WHEN** the user presses Tab key
- **THEN** focus moves to next cell in the row
- **WHEN** the user presses Tab on the last cell
- **THEN** focus moves to first cell of next row
- **WHEN** the user presses Enter on the last row
- **THEN** a new row is automatically added

#### Scenario: Display live calculation summary
- **GIVEN** a user has entered 3 line items with costs
- **WHEN** the form displays summary section
- **THEN** it shows:
  - Line Items Subtotal: $XXX.XX
  - Shipping Cost: $XX.XX
  - Invoice Total: $XXX.XX
  - Status: ✓ Totals Match or ✗ Mismatch ($X.XX difference)

#### Scenario: Supplier validation across line items
- **GIVEN** a user selects Product A with Supplier X
- **WHEN** the user adds another line item and selects Product B with Supplier Y
- **THEN** the system displays validation warning "All products must be from the same supplier"
- **AND** disables submit button until corrected

### Requirement: Backward Compatibility with Single-Item Flow
The system SHALL maintain existing single-item purchase functionality unchanged.

#### Scenario: Create single-item purchase using legacy flow
- **GIVEN** a user clicks "Add Purchase" button (existing functionality)
- **WHEN** the single-item dialog opens
- **THEN** the form contains only fields for one product
- **AND** no batch ID is assigned when created
- **AND** behavior is identical to pre-enhancement functionality

#### Scenario: Both flows coexist on Purchases page
- **GIVEN** a user is on the Purchases page
- **THEN** two action buttons are visible:
  - "Add Purchase" (single-item, existing)
  - "Add Multi-Item Purchase" (batch entry, new)
- **AND** users can choose appropriate workflow for their scenario

### Requirement: Batch Immutability After Creation
The system SHALL prevent editing batch-level metadata after lots are created.

#### Scenario: Attempt to edit batch metadata
- **GIVEN** a purchase batch has been created with 5 lots
- **WHEN** a user attempts to modify batch invoice total or shipping cost
- **THEN** the system returns error "Cannot modify batch after creation"
- **AND** suggests editing individual lots if adjustments needed

#### Scenario: Edit individual lot within a batch
- **GIVEN** a lot is part of a batch
- **WHEN** the user edits the lot's quantity or unit cost
- **THEN** only that specific lot is updated
- **AND** batch metadata remains unchanged
- **AND** lot's unit cost no longer reflects original shipping allocation (expected behavior)

#### Scenario: Delete unused batch
- **GIVEN** a batch with 3 lots, all unused (remainingQuantity = quantity)
- **WHEN** the user deletes all 3 lots individually
- **THEN** the orphaned batch record remains in database
- **AND** has no active lots associated with it
- **AND** can be identified in batch list as "No active lots"

### Requirement: Year Lock Enforcement for Batch Purchases
The system SHALL prevent batch creation for locked years, consistent with single-item purchases.

#### Scenario: Attempt batch purchase in locked year
- **GIVEN** year 2023 is locked
- **WHEN** a user attempts to create a batch with purchaseDate in 2023
- **THEN** the system returns error "Cannot create purchase for locked year 2023"
- **AND** no lots or batch record are created

#### Scenario: Display year lock warning during batch entry
- **GIVEN** a user is entering a batch
- **WHEN** the user selects a purchase date in a locked year
- **THEN** a warning banner displays "⚠ Year 2023 is locked - purchases cannot be created"
- **AND** submit button is disabled
