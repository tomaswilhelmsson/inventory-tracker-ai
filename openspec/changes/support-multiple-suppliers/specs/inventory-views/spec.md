# Spec: Inventory Views with Supplier Filtering

## Overview
Support both aggregated (by product) and detailed (by supplier-product) inventory views with filtering capabilities.

## ADDED Requirements

### Requirement: Aggregated Inventory View (Default)
The inventory view SHALL aggregate stock across all suppliers for each product.

#### Scenario: Display total inventory per product
**Given** "Laptop X" has 15 units from Supplier A and 8 units from Supplier B  
**When** viewing inventory in aggregated mode  
**Then** the display must show:
- Product: "Laptop X"
- Total Quantity: 23
- Average Unit Cost: (weighted average across all lots)
- Total Value: (sum of all lot values)

### Requirement: Supplier-Grouped Inventory View
Users SHALL be able to view inventory broken down by supplier.

#### Scenario: Toggle to supplier-grouped view
**Given** the inventory page is in aggregated mode  
**When** user clicks "Group by Supplier" toggle  
**Then** the view must change to show:
- Product | Supplier | Quantity | Avg Cost | Value
- Laptop X | Tech Corp | 15 | $1200 | $18,000
- Laptop X | Office Supply | 8 | $1250 | $10,000

#### Scenario: Maintain separate rows per supplier-product
**Given** inventory view is in supplier-grouped mode  
**When** the same product has stock from multiple suppliers  
**Then** each supplier-product combination must appear as a separate row

### Requirement: Filter Inventory by Supplier
Users SHALL be able to filter inventory to show only specific supplier's stock.

#### Scenario: Apply supplier filter
**Given** inventory contains products from multiple suppliers  
**When** user selects "Tech Corp" from supplier filter dropdown  
**Then** the view must show only:
- Products with stock from Tech Corp
- Quantities from Tech Corp only (not other suppliers)

#### Scenario: Clear supplier filter
**Given** a supplier filter is active  
**When** user clicks "Clear filter" or selects "All Suppliers"  
**Then** the view must show inventory from all suppliers

### Requirement: API Support for Grouping and Filtering
The backend SHALL support query parameters for inventory grouping.

#### Scenario: GET /api/inventory/value?groupBy=product (default)
**When** requesting inventory without groupBy parameter  
**Then** response must aggregate by product only

#### Scenario: GET /api/inventory/value?groupBy=supplier-product
**When** requesting with groupBy=supplier-product  
**Then** response must include separate records for each supplier-product combination  
**And** each record must include `supplierId` and `supplierName`

#### Scenario: GET /api/inventory/value?supplierId=5
**When** requesting with supplierId parameter  
**Then** response must include only lots from supplier 5  
**And** aggregate quantities for that supplier only

## UI Requirements

1. **Toggle Control**: Radio buttons or segmented control
   - [●] Aggregated by Product
   - [○] Grouped by Supplier

2. **Supplier Filter**: Dropdown positioned prominently
   - Default: "All Suppliers"
   - Options: List of all suppliers with inventory
   - Shows count of products per supplier

3. **Visual Distinction**: In supplier-grouped view
   - Group products visually (e.g., alternating row colors)
   - Show product name only on first row of group
   - Indent supplier rows

4. **Responsive Design**: Views must work on mobile/tablet
   - Collapsible supplier details on small screens
   - Filter accessible via menu on mobile

## Performance Requirements

1. **Query Efficiency**: Supplier-grouped view must use single SQL query with joins
2. **Response Time**: <300ms for 1000 inventory items
3. **Caching**: Consider caching aggregated values (refresh on inventory changes)
