# Spec: Purchase Workflow with Multi-Supplier Support

## Overview
Update purchase creation workflow to support selecting any supplier for a product, with supplier-specific price suggestions.

## MODIFIED Requirements

### Requirement: Purchase Creation Supports Any Supplier
Users SHALL be able to select any supplier when creating a purchase, not restricted to product's associated suppliers.

#### Scenario: Create purchase with any supplier
**Given** product "Laptop X" is associated with suppliers 5 and 8  
**When** creating a purchase with supplier 12 (not associated)  
**Then** the system must allow the purchase  
**And** create PurchaseLot with supplierId=12

**Rationale**: Real-world scenarios may require purchasing from non-standard suppliers (e.g., urgent need, special discount).

### Requirement: Display Price Suggestions
The UI SHALL show suggested pricing when a product-supplier combination exists.

#### Scenario: Show preferred cost in purchase form
**Given** product 1 has preferredUnitCost=1200 for supplier 5  
**When** user selects product 1 and supplier 5  
**Then** the form must display "Suggested price: 1200.00"  
**And** pre-fill the unit cost field with 1200.00

#### Scenario: Show recent purchase price as fallback
**Given** product 1 has no preferred cost for supplier 5  
**And** last purchase from supplier 5 was 1180.00  
**When** user selects product 1 and supplier 5  
**Then** the form must display "Recent price: 1180.00"  
**And** pre-fill the unit cost field with 1180.00

#### Scenario: No suggestion for unknown combinations
**Given** no pricing data exists for product 1 and supplier 12  
**When** user selects this combination  
**Then** the form must show no price suggestion  
**And** unit cost field remains empty (manual entry required)

### Requirement: Purchase History Context
The UI SHALL show relevant purchase history to guide supplier selection.

#### Scenario: Display recent purchases by supplier
**Given** product "Laptop X" has been purchased from multiple suppliers  
**When** user opens the purchase form for "Laptop X"  
**Then** the system must show a summary:
- "Last purchased from Tech Corp (Supplier 5) at $1200 on 2024-01-15"
- "Last purchased from Office Supply (Supplier 8) at $1250 on 2024-02-10"

## ADDED Requirements

### Requirement: Highlight Product's Associated Suppliers
The UI SHALL visually distinguish between associated and non-associated suppliers.

#### Scenario: Mark associated suppliers in dropdown
**Given** product 1 is associated with suppliers 5 and 8  
**When** viewing the supplier dropdown  
**Then** suppliers 5 and 8 must be marked with a badge "(Associated)"  
**And** appear at the top of the list

## No Breaking Changes

- Existing purchase API remains unchanged (already accepts any supplierId)
- PurchaseLot schema unchanged
- FIFO calculations unaffected
