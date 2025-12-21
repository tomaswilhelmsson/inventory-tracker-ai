# Design: Comprehensive Seed Data

## Context

The seed script creates initial database state for development and testing. Currently it provides minimal data that doesn't fully exercise the system's capabilities, particularly the year-end count workflow with multiple years, locked years, and unlock/revision scenarios.

**Goal:** Create realistic, comprehensive test data that demonstrates the full inventory lifecycle from 2022 through 2025, including year-end counts, locked years, and audit trails.

## Data Structure Plan

### Suppliers (8 total)
- **Existing:** Acme Corp, Widget Warehouse
- **New additions:**
  - Global Parts Ltd (international supplier)
  - TechComponents Inc (electronics)
  - Industrial Supply Co (industrial materials)
  - Premium Hardware (high-end parts)
  - BulkMaterials Corp (raw materials)
  - FastShip Logistics (quick delivery supplier)

### Products (18 total)
- **Existing:** Bolt 10mm, Widget Standard, Gasket Ring A
- **New additions** across different units and categories:
  - Electronic components (pieces)
  - Raw materials (kg, tons)
  - Hardware items (pieces, boxes)
  - Industrial parts (m2, m3)
  - Packaging materials (rolls, pallets)
  - Precision instruments (pieces)

### Multi-Year Timeline (2022-2025)

#### Year 2022
- **Purchases:** 15-20 purchase lots across multiple products
- **Year-end count:** Confirmed on 2023-01-15
  - All products counted
  - Small variances (-5% to +3%)
  - FIFO adjustment applied
- **Status:** Locked

#### Year 2023
- **Purchases:** 20-25 purchase lots with increased activity
- **Year-end count - Original (Revision 1):** Confirmed on 2024-01-10
  - Status: Confirmed
- **Unlock audit:** Unlocked on 2024-02-15 for "data_error" - found inventory discrepancy
- **Year-end count - Recount (Revision 2):** Confirmed on 2024-02-20
  - Corrected counts
  - Different variances from revision 1
- **Status:** Locked (after revision 2)

#### Year 2024
- **Purchases:** 25-30 purchase lots with full product range
- **Year-end count:** Confirmed on 2025-01-08
  - All products counted
  - Various variance scenarios (surplus, shortage, exact)
- **Status:** Locked

#### Year 2025 (Current)
- **Purchases:** 10-15 purchase lots (January - current)
- **Year-end count:** None (should trigger reminder)
- **Status:** Open

### FIFO Consumption Logic

For realistic data, remaining quantities must follow FIFO:

1. **Calculate total consumption** per product through year-end counts
2. **Apply FIFO rule**: Consume from oldest lots first
3. **Remaining quantities**:
   - 2022 lots: Mostly or fully consumed (oldest)
   - 2023 lots: Partially consumed
   - 2024 lots: Mostly intact
   - 2025 lots: Untouched (no count yet)

### Snapshot Data

All purchase lots must include:
- **productSnapshot**: JSON with product details at purchase time
- **supplierSnapshot**: JSON with supplier details at purchase time

This ensures historical data integrity even if products/suppliers are modified.

## Implementation Strategy

### Phase 1: Suppliers and Products
1. Create 6 additional suppliers with realistic details
2. Create 15 additional products with varied units and suppliers
3. All using upsert to avoid duplicates

### Phase 2: Purchase Lots (2022-2025)
1. Generate purchases chronologically
2. Calculate expected consumption patterns
3. Set remainingQuantity based on FIFO and year-end count results
4. Include product and supplier snapshots

### Phase 3: Year-End Counts
1. **2022 count:** Simple confirmed count with minor variances
2. **2023 count revision 1:** Initial count
3. **2023 count revision 2:** Recount after unlock
4. **2024 count:** Latest confirmed count
5. All counts include YearEndCountItem records for each product

### Phase 4: Year Lock and Audit
1. Create LockedYear records for 2022, 2023, 2024
2. Create YearUnlockAudit record for 2023 unlock event

## Data Realism Guidelines

### Purchase Patterns
- **Quantity ranges:** 50-2000 units depending on product type
- **Cost variation:** ±10% year-over-year due to inflation/market
- **Purchase frequency:** 2-5 purchases per product per year
- **Seasonal patterns:** More purchases in Q1/Q4 for some products

### Year-End Count Variances
- **Exact matches:** 40% of products (no variance)
- **Small variances:** 50% of products (±5%)
- **Large variances:** 10% of products (±10-20%) - shrinkage, theft, errors

### Cost Progression
- 2022: Base costs
- 2023: +5% average (inflation)
- 2024: +7% average (continued inflation)
- 2025: +3% average (stabilizing)

## Validation

### FIFO Accuracy
For each product, verify:
```
Total Consumed = Sum of all counted quantities across years
Remaining Qty = Original purchases - Total Consumed (FIFO order)
```

### Year-End Count Consistency
- All products with inventory must appear in count
- Variances must equal (counted - expected)
- Values must reflect FIFO costs

### Locked Year Integrity
- Locked years must have confirmed counts
- Most recent locked year matches latest confirmed count year

## Risks and Mitigations

**Risk:** FIFO calculations too complex to manually verify
- **Mitigation:** Create helper functions to calculate expected remainingQuantity
- **Mitigation:** Add comments explaining each lot's consumption

**Risk:** Seed script becomes too slow
- **Mitigation:** Use createMany for bulk inserts where possible
- **Mitigation:** Target ~100-150 total purchase lots (reasonable for testing)

**Risk:** Snapshot JSON structure inconsistencies
- **Mitigation:** Use consistent helper function for creating snapshots
- **Mitigation:** Validate snapshot structure matches current schema

## Success Criteria

Seed script produces:
1. ✅ 8 suppliers with complete contact information
2. ✅ 18 products across diverse units and categories
3. ✅ 80-120 purchase lots spanning 2022-2025
4. ✅ 3 confirmed year-end counts (2022, 2023 rev 2, 2024)
5. ✅ 1 year with multiple revisions (2023: rev 1 and rev 2)
6. ✅ 3 locked years (2022, 2023, 2024)
7. ✅ 1 unlock audit record for 2023
8. ✅ 2025 purchases without count (triggers reminder)
9. ✅ All FIFO calculations accurate and verifiable
10. ✅ All product/supplier snapshots properly formatted
