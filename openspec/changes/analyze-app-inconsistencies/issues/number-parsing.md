# Number Parsing Inconsistencies

## Overview
Analysis of parseInt/parseFloat usage patterns across the codebase to identify missing radix parameters and inconsistent parsing patterns.

## Issues Found

### NUM-001: Missing Radix Parameter in parseInt (LOW)
**Severity**: LOW  
**Impact**: Potential parsing bugs with octal numbers  
**Effort**: Low (30 minutes)

**Description**:
Several `parseInt()` calls are missing the radix parameter. While modern browsers default to base 10, explicitly specifying the radix is a best practice to avoid unexpected behavior.

**Occurrences**:

1. **MultiItemPurchaseDialog.vue:734**
```typescript
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
```
Missing radix in all three `parseInt()` calls.

2. **PurchasesView.vue:822**
```typescript
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
```
Missing radix in all three `parseInt()` calls.

3. **ReportsView.vue:376 and 391**
```typescript
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
```
Missing radix in all six `parseInt()` calls (two occurrences).

**Good Example**:
```typescript
// PurchasesView.vue:670 - HAS radix parameter ✓
const batchId = parseInt(batchMatch[1], 10);
```

**Files Affected**:
- `frontend/src/components/MultiItemPurchaseDialog.vue:734`
- `frontend/src/views/PurchasesView.vue:822`
- `frontend/src/views/ReportsView.vue:376`
- `frontend/src/views/ReportsView.vue:391`

**Recommendation**:
Add radix parameter to all `parseInt()` calls:
```typescript
// BEFORE:
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

// AFTER:
const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
```

**Why This Matters**:
If a year/month/day string starts with "0" (e.g., "08"), older JavaScript engines could interpret it as octal, causing `parseInt("08")` to return `0` instead of `8`. Specifying base 10 prevents this.

**Priority**: LOW - Modern browsers handle this correctly, but it's a code quality issue.

---

### NUM-002: Inconsistent Decimal Parsing (MEDIUM)
**Severity**: MEDIUM  
**Impact**: Decimal number handling consistency  
**Effort**: Low (1 hour)

**Description**:
Different approaches are used for parsing decimal numbers across the codebase.

**Patterns Found**:

1. **parseFloat with toFixed** (YearEndCountView.vue:187)
```typescript
countedQuantity: parseFloat(quantity.toFixed(2))
```

2. **Number() constructor** (YearEndCountView.vue:174)
```typescript
const quantity = Number(item.countedQuantity);
```

3. **parseFloat with normalization** (useCurrency.ts:146)
```typescript
const normalized = value
  .toString()
  .replace(/\s/g, '') // Remove spaces
  .replace(',', '.'); // Convert comma to period

const parsed = parseFloat(normalized);
return isNaN(parsed) ? null : parsed;
```

**Issue**:
Three different approaches for decimal parsing without a clear pattern:
- `Number()` - Simple conversion, doesn't handle commas
- `parseFloat()` - Handles decimals but doesn't handle commas
- Custom normalization - Handles both commas and spaces

**Recommendation**:
Standardize on the `useCurrency` composable's `normalizeDecimalInput()` function for all user input:

```typescript
// In useCurrency.ts - already exists
const normalizeDecimalInput = (value: string | number): number | null => {
  if (typeof value === 'number') return value;
  
  const normalized = value
    .toString()
    .replace(/\s/g, '') // Remove spaces
    .replace(',', '.'); // Convert comma to period
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};
```

Usage in components:
```typescript
// INSTEAD OF:
const quantity = Number(item.countedQuantity);

// USE:
const { normalizeDecimalInput } = useCurrency();
const quantity = normalizeDecimalInput(item.countedQuantity) ?? 0;
```

**Priority**: MEDIUM - Affects decimal input consistency, especially important for SEK users who use commas.

---

### NUM-003: No Validation After Parsing (LOW)
**Severity**: LOW  
**Impact**: Data quality  
**Effort**: Low (1 hour)

**Description**:
After parsing numbers, there's often no check for `NaN` or invalid values.

**Example**:
```typescript
// MultiItemPurchaseDialog.vue:734
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
```

If `year`, `month`, or `day` contain non-numeric characters, `parseInt()` could return `NaN`, creating an invalid date.

**Recommendation**:
Add validation after parsing:
```typescript
const yearNum = parseInt(year, 10);
const monthNum = parseInt(month, 10);
const dayNum = parseInt(day, 10);

if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
  console.error('Invalid date format');
  return;
}

const date = new Date(yearNum, monthNum - 1, dayNum);
```

**Priority**: LOW - Input components already constrain input format, so parsing rarely fails.

---

## Summary
- **Total Issues**: 3
- **Critical**: 0
- **High**: 0
- **Medium**: 1 (NUM-002)
- **Low**: 2 (NUM-001, NUM-003)

## Recommended Actions
1. Add radix parameter to all `parseInt()` calls (NUM-001)
2. Standardize decimal parsing using `normalizeDecimalInput()` from useCurrency (NUM-002)
3. Add NaN validation after parseInt/parseFloat operations (NUM-003)

## ESLint Rule Recommendations
Consider adding these ESLint rules to prevent future issues:
```json
{
  "rules": {
    "radix": "error", // Require radix parameter in parseInt
    "no-restricted-globals": ["error", "isNaN", "isFinite"] // Prefer Number.isNaN
  }
}
```
