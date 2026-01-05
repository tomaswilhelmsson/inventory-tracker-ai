# Finished Goods Reporting

## ADDED Requirements

### Requirement: Include Finished Goods Section in PDF Report
The system SHALL add a separate "Finished Goods Inventory" section to the year-end PDF report, appearing after raw materials and before the final summary.

#### Scenario: Generate PDF report with finished goods
**Given** a confirmed year-end count for 2024 with:
- Raw materials: 50 products, total value 65,359.31 kr
- Finished goods: 3 items, total value 26,250.00 kr  
**When** the user exports the PDF report  
**Then** the PDF includes sections in order:
1. Executive Summary (with combined totals)
2. Detailed Product Inventory (Raw Materials)
3. Finished Goods Inventory (NEW)
4. Final Summary (combined totals)  
**And** each section has clear headings  
**And** page numbers continue sequentially

#### Scenario: PDF report without finished goods
**Given** a year-end count with raw materials but no finished goods  
**When** the user exports the PDF report  
**Then** the finished goods section is omitted  
**And** the report only includes raw materials sections

---

### Requirement: Finished Goods Table Format
The system SHALL display finished goods in a table format with columns for product name, expected quantity, counted quantity, variance, material cost per unit, and total value.

#### Scenario: Finished goods table layout
**Given** a year-end count with finished goods:
- "Widget A": expected 100, counted 95, cost 150.00 kr
- "Widget B": expected 50, counted 60, cost 200.00 kr  
**When** the PDF is generated  
**Then** the finished goods table shows:
```
┌──────────────┬──────────┬─────────┬──────────┬──────────┬──────────┐
│ Product      │ Expected │ Counted │ Variance │ Unit Cost│ Value    │
├──────────────┼──────────┼─────────┼──────────┼──────────┼──────────┤
│ Widget A     │ 100      │ 95      │ -5       │ 150,00kr │14 250,00 │
│ Widget B     │ 50       │ 60      │ +10      │ 200,00kr │12 000,00 │
└──────────────┴──────────┴─────────┴──────────┴──────────┴──────────┘
```
**And** variance is color-coded (red for negative, green for positive)  
**And** currency formatting follows user's locale (Swedish/English)

---

### Requirement: Finished Goods Summary Totals
The system SHALL calculate and display summary totals for finished goods inventory.

#### Scenario: Display finished goods totals
**Given** a year-end count with finished goods totaling:
- Total expected: 150 units
- Total counted: 155 units
- Total variance: +5 units
- Total value: 26,250.00 kr  
**When** the finished goods section is rendered  
**Then** the section footer shows:
```
Finished Goods Summary:
- Total Expected Quantity: 150
- Total Counted Quantity: 155
- Total Variance: +5
- Total Finished Goods Value: 26 250,00 kr
```

---

### Requirement: Combined Inventory Value Summary
The system SHALL add a combined summary section showing total inventory value across both raw materials and finished goods.

#### Scenario: Combined inventory summary
**Given** a year-end count with:
- Raw materials total value: 65,359.31 kr
- Finished goods total value: 26,250.00 kr  
**When** the PDF final summary section is generated  
**Then** it displays:
```
┌─────────────────────────────────────────┬─────────────────┐
│ Total Inventory Value (All Categories) │                 │
├─────────────────────────────────────────┼─────────────────┤
│ Raw Materials                           │  65 359,31 kr   │
│ Finished Goods                          │  26 250,00 kr   │
├─────────────────────────────────────────┼─────────────────┤
│ TOTAL INVENTORY VALUE                   │  91 609,31 kr   │
└─────────────────────────────────────────┴─────────────────┘
```

#### Scenario: Combined summary with only raw materials
**Given** a year-end count with only raw materials (no finished goods)  
**When** the PDF final summary section is generated  
**Then** the finished goods row is omitted  
**And** only raw materials total is shown

---

### Requirement: Multi-Language Support for Finished Goods
The system SHALL support English and Swedish translations for all finished goods report elements.

#### Scenario: English PDF report with finished goods
**Given** the user's language is set to English  
**When** the PDF report is generated  
**Then** finished goods section uses English labels:
- "Finished Goods Inventory"
- "Unit Cost"
- "Total Finished Goods Value"
- "Total Inventory Value (All Categories)"

#### Scenario: Swedish PDF report with finished goods
**Given** the user's language is set to Swedish  
**When** the PDF report is generated  
**Then** finished goods section uses Swedish labels:
- "Färdigvaror Lager" or "Färdigvaror Inventering"
- "Styckpris"
- "Totalt värde färdigvaror"
- "Totalt lagervärde (alla kategorier)"

---

### Requirement: Finished Goods Section Pagination
The system SHALL properly paginate finished goods tables across multiple pages if needed.

#### Scenario: Finished goods span multiple pages
**Given** a year-end count with 50 finished goods  
**When** the PDF is generated  
**Then** the finished goods table automatically spans multiple pages  
**And** table headers repeat on each new page  
**And** page numbers continue sequentially  
**And** the section title appears only on the first page of finished goods

---

### Requirement: Include Finished Goods in Executive Summary
The system SHALL update the executive summary to include finished goods totals alongside raw materials.

#### Scenario: Executive summary with finished goods
**Given** a year-end count with:
- Raw materials: 82 products
- Finished goods: 5 products
- Combined total value: 91,609.31 kr  
**When** the PDF executive summary is generated  
**Then** it shows:
```
Executive Summary

Total Products: 82 (raw materials)
Total Finished Goods: 5
Total Items: 87

Total Inventory Value: 91 609,31 kr
  - Raw Materials: 65 359,31 kr
  - Finished Goods: 26 250,00 kr
```

---

### Requirement: Year-Over-Year Variance for Finished Goods
The system SHALL calculate and display year-over-year variance when comparing consecutive year-end counts.

#### Scenario: Compare finished goods across years
**Given** year 2024 count has "Widget A" value 14,250.00 kr  
**And** year 2025 count has "Widget A" value 17,150.00 kr  
**When** comparing years in the report  
**Then** the variance shows:
- Value change: +2,900.00 kr (+20.4%)
- Quantity change: displayed if available  
**And** variance is color-coded (green for increase)

---

### MODIFIED Requirements

### Requirement: Year-End Report Data Structure
The existing `generateYearEndReport` function SHALL be extended to include finished goods data.

#### Scenario: Report includes finished goods items
**Given** a year-end count with finished goods  
**When** `generateYearEndReport` is called  
**Then** the response includes:
```javascript
{
  year: 2024,
  status: "confirmed",
  confirmedAt: "2024-12-31",
  
  // Existing raw materials data
  totalExpected: 11626.05,
  totalCounted: 5772.69,
  totalVariance: -5853.36,
  totalValue: 65359.31,
  items: [...], // raw materials
  
  // NEW: Finished goods data
  finishedGoods: {
    totalExpected: 150,
    totalCounted: 155,
    totalVariance: 5,
    totalValue: 26250.00,
    items: [
      {
        finishedGoodId: 1,
        finishedGoodName: "Widget A",
        expectedQuantity: 100,
        countedQuantity: 95,
        variance: -5,
        materialCostPerUnit: 150.00,
        totalValue: 14250.00
      }
    ]
  },
  
  // NEW: Combined totals
  grandTotal: {
    totalValue: 91609.31,
    rawMaterialsValue: 65359.31,
    finishedGoodsValue: 26250.00
  }
}
```
