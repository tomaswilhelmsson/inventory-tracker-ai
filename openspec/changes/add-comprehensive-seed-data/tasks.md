# Implementation Tasks

## 1. Supplier and Product Expansion

- [x] 1.1 Add 6 new suppliers with realistic contact information
  - Global Parts Ltd
  - TechComponents Inc
  - Industrial Supply Co
  - Premium Hardware
  - BulkMaterials Corp
  - FastShip Logistics
- [x] 1.2 Add 15 new products across diverse categories
  - Electronic components (2-3 products)
  - Raw materials (3-4 products)
  - Hardware items (3-4 products)
  - Industrial parts (2-3 products)
  - Packaging materials (2-3 products)
  - Precision instruments (1-2 products)
- [x] 1.3 Ensure products use variety of existing units (pieces, kg, m2, boxes, rolls, etc.)

## 2. Helper Functions

- [x] 2.1 Create `generateProductSnapshot()` helper function
  - Accept product and unit data
  - Return consistent JSON structure
- [x] 2.2 Create `generateSupplierSnapshot()` helper function
  - Accept supplier data
  - Return consistent JSON structure
- [x] 2.3 Create `calculateFIFORemaining()` helper function (optional)
  - Help calculate remaining quantities after consumption
  - Document FIFO logic

## 3. Purchase Lot Generation - Year 2022

- [x] 3.1 Create 15-20 purchase lots dated throughout 2022
  - Spread across quarters (Q1-Q4)
  - Cover 80% of products
  - Realistic quantities and base costs
- [x] 3.2 Set remainingQuantity assuming year-end count consumption
- [x] 3.3 Include productSnapshot and supplierSnapshot for each lot
- [x] 3.4 Add comments explaining consumption pattern

## 4. Year-End Count 2022

- [x] 4.1 Create YearEndCount record for 2022 (revision 1)
  - Status: confirmed
  - ConfirmedAt: 2023-01-15
- [x] 4.2 Create YearEndCountItem records for all products with inventory
  - ExpectedQuantity: Sum of remainingQuantity before count
  - CountedQuantity: Realistic counts with small variances
  - Variance: calculated (counted - expected)
  - Value: FIFO cost calculation
- [x] 4.3 Create LockedYear record for 2022
  - LockedAt: 2023-01-15

## 5. Purchase Lot Generation - Year 2023

- [x] 5.1 Create 20-25 purchase lots dated throughout 2023
  - Include all products
  - Costs +5% from 2022 baseline
  - Increased quantities showing business growth
- [x] 5.2 Set remainingQuantity based on both 2022 and 2023 count consumption
- [x] 5.3 Include snapshots for all lots
- [x] 5.4 Document FIFO consumption through year 2023

## 6. Year-End Count 2023 - Revision 1 (Original)

- [x] 6.1 Create YearEndCount record for 2023 revision 1
  - Status: confirmed
  - ConfirmedAt: 2024-01-10
  - Revision: 1
- [x] 6.2 Create YearEndCountItem records with initial counts
  - Include small variances
- [x] 6.3 Temporarily create LockedYear for 2023 (will be unlocked)

## 7. Year Unlock Audit for 2023

- [x] 7.1 Create YearUnlockAudit record
  - Year: 2023
  - UnlockedAt: 2024-02-15
  - ReasonCategory: "data_error"
  - Description: "Inventory discrepancy found during audit - recount required"
- [x] 7.2 Delete temporary LockedYear for 2023 (simulating unlock)

## 8. Year-End Count 2023 - Revision 2 (Recount)

- [x] 8.1 Create YearEndCount record for 2023 revision 2
  - Status: confirmed
  - ConfirmedAt: 2024-02-20
  - Revision: 2
- [x] 8.2 Create YearEndCountItem records with corrected counts
  - Different variances from revision 1
  - Demonstrate correction of errors
- [x] 8.3 Recreate LockedYear for 2023 (relocked after recount)
  - LockedAt: 2024-02-20

## 9. Purchase Lot Generation - Year 2024

- [x] 9.1 Create 25-30 purchase lots dated throughout 2024
  - Full product coverage
  - Costs +7% from 2023
  - Peak business activity
- [x] 9.2 Set remainingQuantity based on 2024 count consumption
- [x] 9.3 Include snapshots for all lots
- [x] 9.4 Document consumption patterns

## 10. Year-End Count 2024

- [x] 10.1 Create YearEndCount record for 2024 (revision 1)
  - Status: confirmed
  - ConfirmedAt: 2025-01-08
  - Revision: 1
- [x] 10.2 Create YearEndCountItem records
  - Diverse variance scenarios:
    - 40% exact matches (variance = 0)
    - 50% small variances (±5%)
    - 10% large variances (±10-20%)
  - Realistic value calculations
- [x] 10.3 Create LockedYear record for 2024
  - LockedAt: 2025-01-08

## 11. Purchase Lot Generation - Year 2025 (Current)

- [x] 11.1 Create 10-15 purchase lots dated January 2025
  - All products should have at least 1 purchase
  - Costs +3% from 2024
  - Set remainingQuantity = quantity (no count yet)
- [x] 11.2 Include snapshots for all lots
- [x] 11.3 Ensure no YearEndCount for 2025 (triggers reminder)

## 12. Verification and Testing

- [x] 12.1 Add console logging for each data section
  - Log counts: suppliers, products, purchase lots, counts
- [x] 12.2 Verify FIFO accuracy manually for 2-3 products
  - Calculate expected remaining quantities
  - Confirm matches seed data
- [x] 12.3 Run seed script and verify database state
  - Check all tables populated correctly
  - Verify year counts and locked years
- [x] 12.4 Test application with seeded data
  - Dashboard shows correct inventory value
  - Purchases view shows all lots
  - Year-end count view shows history
  - Reminder banner appears for 2025
- [x] 12.5 Verify unlock history displays for year 2023

## 13. Documentation

- [x] 13.1 Add comprehensive comments to seed.ts explaining data structure
- [x] 13.2 Document FIFO calculation examples
- [ ] 13.3 Add README section about seed data contents
- [ ] 13.4 Document how to reset and re-seed database

## Dependencies

- Tasks 2.x (helpers) should be completed before 3.x (purchase lots)
- Tasks 3.x-11.x must be completed sequentially (chronological data)
- Task 12.x (verification) must be completed after all data generation
- Task 13.x (documentation) can be done in parallel with implementation

## Parallel Work Opportunities

- None - data must be generated chronologically for consistency
- Documentation (13.x) can be written while implementing
