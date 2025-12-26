# Add VAT Handling to Purchase Entry

## Problem Statement

Currently, the purchase entry system does not distinguish between VAT-inclusive and VAT-exclusive amounts. All purchases store a single `unitCost` value without any VAT information. This creates several issues:

1. **Accounting Accuracy**: Year-end reports need to show values excluding VAT for accurate cost accounting and financial reporting
2. **Mixed Invoice Types**: Some invoices show line items excluding VAT with a separate VAT line, while others show VAT-inclusive prices
3. **Data Entry Confusion**: Users must manually calculate VAT adjustments before entering data, leading to errors
4. **Audit Trail**: No way to verify original invoice amounts or reconstruct VAT calculations

The legacy system had a `price_excluding_vat` field, indicating this is a known business requirement that was lost in the current implementation.

## Proposed Solution

Implement comprehensive VAT handling with a user-friendly toggle system:

### User Experience
- **Default Mode**: "Prices Include VAT" (checkbox checked by default)
  - Invoice total entered is VAT-inclusive
  - Line item prices entered are VAT-inclusive
  - System calculates and stores VAT-exclusive amounts automatically
  
- **Alternative Mode**: "Prices Exclude VAT" (checkbox unchecked)
  - Invoice total entered is VAT-inclusive (grand total from invoice)
  - Line item prices entered are VAT-exclusive
  - System adds VAT to line items, validates against invoice total

### Data Model
- Store both VAT-inclusive and VAT-exclusive amounts
- Capture VAT rate used for each purchase/batch
- All FIFO calculations and year-end reports use VAT-exclusive amounts
- Preserve original invoice amounts for audit purposes

### Calculation Flow
```
IF "Prices Include VAT" is CHECKED:
  User enters: invoiceTotal (incl VAT), lineItems (incl VAT)
  System calculates: 
    - unitCostExclVAT = unitCostInclVAT / (1 + vatRate)
    - Validates: sum(lineItems incl VAT) + shipping ≈ invoiceTotal

IF "Prices Include VAT" is UNCHECKED:
  User enters: invoiceTotal (incl VAT), lineItems (excl VAT)
  System calculates:
    - unitCostInclVAT = unitCostExclVAT * (1 + vatRate)
    - Validates: sum(lineItems incl VAT) + shipping ≈ invoiceTotal
```

## Scope

### In Scope
1. Add VAT fields to database schema (PurchaseLot, PurchaseBatch)
2. Update single-item purchase dialog with VAT handling
3. Update multi-item purchase dialog with VAT toggle and calculations
4. Store both VAT-inclusive and VAT-exclusive amounts
5. Configure default VAT rate (application-level setting)
6. Update year-end reports to use VAT-exclusive amounts
7. Update inventory valuation to use VAT-exclusive amounts
8. Add VAT display toggle to purchase list view
9. Migration for existing data (assume 0% VAT or configurable default)

### Out of Scope
1. Multiple VAT rates per transaction (use single VAT rate per batch/purchase)
2. Complex VAT rules (reverse charge, exempt items, etc.)
3. VAT return filing or compliance reporting
4. Per-product VAT rates (use batch-level VAT rate)
5. Historical VAT rate changes (manual entry only)

## Success Criteria

1. **Data Entry**: Users can enter invoices in either "prices include VAT" or "prices exclude VAT" mode
2. **Validation**: System validates invoice total matches calculated total (±$0.01 tolerance)
3. **Accuracy**: Year-end reports show accurate VAT-exclusive values
4. **Audit Trail**: Original invoice amounts (VAT-inclusive) are preserved
5. **Migration**: Existing purchases are migrated with sensible VAT defaults
6. **Backward Compatibility**: All existing FIFO calculations continue to work correctly

## Risks and Mitigations

### Risk: Data Migration Complexity
**Impact**: Existing purchases have no VAT information
**Mitigation**: 
- Provide migration script with configurable default VAT rate
- Allow manual review/correction after migration
- Maintain backward compatibility by treating missing VAT as 0%

### Risk: User Confusion
**Impact**: Toggle between inclusive/exclusive pricing may confuse users
**Mitigation**:
- Clear labeling and help text
- Default to "inclusive" mode (most common)
- Visual feedback showing calculated values in real-time

### Risk: Rounding Errors
**Impact**: VAT calculations may not exactly match invoice totals due to rounding
**Mitigation**:
- Use $0.01 tolerance for validation
- Display rounding differences to user
- Allow override if difference is within tolerance

## Dependencies

- Requires database migration (add new columns)
- Impacts all purchase entry workflows
- Changes year-end count calculations
- May require user training on new VAT toggle

## Timeline Estimate

- **Design & Spec**: 1 day (this proposal)
- **Database Schema**: 0.5 day (migration + testing)
- **Backend Services**: 1 day (VAT calculations, validation)
- **Frontend UI**: 1.5 days (single-item + multi-item dialogs)
- **Reports Update**: 0.5 day (year-end reports)
- **Testing**: 1 day (unit + integration tests)
- **Migration Script**: 0.5 day (existing data)
- **Total**: ~6 days

## Open Questions

1. What is the default VAT rate? (e.g., 25% for Sweden, 20% for UK, etc.)
2. Should VAT rate be configurable per purchase, or application-wide setting?
3. For existing data migration, should we assume 0% VAT or prompt user for default rate?
4. Should the "Prices Include VAT" toggle default to checked or unchecked?
5. Should we display VAT amounts in the purchase list, or only in detail view?

**Recommendation**: Start with application-wide VAT rate setting (configurable in backend .env), default "include VAT" toggle to CHECKED, migrate existing data with 0% VAT, display VAT in detail views only.
