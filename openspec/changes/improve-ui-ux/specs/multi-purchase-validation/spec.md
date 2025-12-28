# Spec: Multi-Item Purchase Dialog Visual Validation

## Overview

Enhance the multi-item purchase dialog with color-coded visual feedback to help users identify invoice total mismatches, incomplete line items, and validation errors instantly.

## ADDED Requirements

### Requirement: Invoice Total Mismatch Indicator
When the calculated total does not match the entered invoice total, the system SHALL display a prominent visual warning.

#### Scenario: User enters invoice total that doesn't match calculated total
- GIVEN a user has added 3 line items totaling $1,234.56
- WHEN the user enters invoice total of $1,200.00
- THEN the total row displays with orange background (`--orange-50`)
- AND the total row displays with 2px orange border (`--orange-500`)
- AND a warning message appears below showing:
  - Entered amount: $1,200.00
  - Calculated amount: $1,234.56
  - Difference: $34.56
- AND the warning message includes an exclamation triangle icon

#### Scenario: User corrects invoice total mismatch
- GIVEN the invoice total mismatch warning is displayed
- WHEN the user adjusts line item costs OR invoice total to match
- AND the difference is within $0.01 tolerance (for rounding)
- THEN the orange background and border disappear
- AND the warning message is removed
- AND the total row returns to normal styling

### Requirement: Line Item Completion Status
Each line item row SHALL display a visual indicator of its completion status based on required data.

**Completion States**:
- Complete: Product selected, quantity entered, cost entered (unitCost OR totalCost)
- Partial: Some but not all required fields entered
- Empty: No data entered yet

#### Scenario: User adds complete line item
- GIVEN a user adds a new line item
- WHEN the user selects product, enters quantity, and enters unit cost
- THEN the row displays 4px green left border
- AND the row displays light green background gradient (left fade)
- AND a checkmark icon appears in the first column

#### Scenario: User has partially entered line item
- GIVEN a user adds a new line item
- WHEN the user selects product but hasn't entered quantity or cost
- THEN the row displays 4px yellow left border
- AND the row displays light yellow background

#### Scenario: Empty line item row
- GIVEN a user clicks "Add Item" button
- WHEN a new row is added with no data
- THEN the row displays with 60% opacity
- AND no colored border is shown

### Requirement: Field-Level Validation Feedback
Individual input fields SHALL display visual validation states in real-time.

#### Scenario: Required field left empty on blur
- GIVEN a user is filling out the multi-purchase form
- WHEN a required field (e.g., supplier) loses focus and is empty
- THEN the field displays with red border (`--red-500`)
- AND a red error icon appears next to the field
- AND an error message displays below the field

#### Scenario: Field becomes valid after correction
- GIVEN a field displaying a validation error
- WHEN the user enters valid data
- AND the field loses focus
- THEN the red border is removed
- AND the error icon and message disappear
- AND optionally a green checkmark appears (for key required fields)
