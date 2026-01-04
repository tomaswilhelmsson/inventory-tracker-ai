# UI Decimal Precision Update

## Overview
Updated the frontend UI to display all quantity values with decimal precision (up to 2 decimal places) instead of forcing integer display. This ensures the UI accurately reflects the actual inventory counts stored in the database.

## Changes Made

### 1. Added New Number Format (`src/i18n/index.ts`)
Added a `quantity` number format for both English and Swedish locales:
```typescript
quantity: {
  style: 'decimal' as const,
  minimumFractionDigits: 0,  // Don't force decimals for whole numbers
  maximumFractionDigits: 2,  // Show up to 2 decimal places
}
```

This format:
- Shows whole numbers without decimals (e.g., 10)
- Shows decimal numbers with up to 2 places (e.g., 10.5, 10.25)
- Automatically rounds to 2 decimal places if needed

### 2. Updated View Files

#### DashboardView.vue
- ✅ Total inventory quantity
- ✅ Product quantities

#### InventoryView.vue
- ✅ Total units summary
- ✅ Total quantity per product
- ✅ Lot quantities
- ✅ Remaining quantities
- ✅ Lots dialog displays

#### PurchasesView.vue
- ✅ Purchase quantities
- ✅ Remaining quantities

#### YearEndCountView.vue
- ✅ Total expected quantities
- ✅ Total counted quantities
- ✅ Total variance
- ✅ Expected quantities per product
- ✅ Counted quantities per product
- ✅ Variance per product
- ✅ **Removed `Math.floor()` constraint** - now allows decimal input for counted quantities

#### ReportsView.vue
- ✅ Inventory report quantities
- ✅ Current inventory levels
- ✅ Year-end count expected/counted quantities
- ✅ Total units in reports

### 3. Year-End Count Input Change
**Before:**
```typescript
countedQuantity: Math.floor(quantity), // Ensure integer
```

**After:**
```typescript
countedQuantity: parseFloat(quantity.toFixed(2)), // Allow decimal quantities
```

This change allows users to enter decimal values when counting inventory (e.g., 7.3 meters of wire, 2.5 liters of paint).

## Display Examples

### Before (Integer Only)
- 7 m² (when actual is 7.6 m²)
- 0 liters (when actual is 0.4 liters)
- 31 sheets (when actual is 31.25 sheets)

### After (Decimal Precision)
- 7.6 m²
- 0.4 liters
- 31.25 sheets

## Number Formats Reference

| Format | Use Case | Example Input | Example Output (en) |
|--------|----------|---------------|---------------------|
| `integer` | Item counts (number of products, rows) | 5 | 5 |
| `quantity` | Inventory quantities | 7.6 | 7.6 |
| `quantity` | Inventory quantities | 10 | 10 |
| `decimal` | Fixed 2 decimals (prices, percentages) | 19.9 | 19.90 |
| `currency` | Money values | 1234.5 | $1,234.50 |

## Testing Recommendations

1. **Dashboard**: Verify total inventory shows decimals
2. **Inventory View**: Check that quantities like 7.6 m², 0.4 liters display correctly
3. **Purchases**: Verify purchase and remaining quantities show decimals
4. **Year-End Count**: 
   - Enter decimal values (e.g., 7.3) and verify they're accepted
   - Check variance calculations work with decimals
5. **Reports**: Verify all quantity columns show appropriate precision

## Notes

- Whole numbers still display without decimals (10, not 10.00)
- This maintains clean display while supporting precision
- All monetary values remain at 2 decimal places
- Item counts (like "5 products") remain as integers
