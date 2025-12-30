# Date Handling Inconsistencies

## Overview
Analysis of date handling patterns across the codebase to identify timezone issues and format inconsistencies.

## Issues Found

### DATE-001: Inconsistent Date Formatting (MEDIUM)
**Severity**: MEDIUM  
**Impact**: Timezone bugs, inconsistent date display  
**Effort**: Low (2-3 hours)

**Description**:
Multiple approaches to formatting dates exist across the codebase, some of which can cause timezone shifts.

**Patterns Found**:

1. **Manual YYYY-MM-DD formatting** (PurchasesView.vue:932)
```typescript
purchaseDate: `${formData.value.purchaseDate!.getFullYear()}-${String(formData.value.purchaseDate!.getMonth() + 1).padStart(2, '0')}-${String(formData.value.purchaseDate!.getDate()).padStart(2, '0')}`
```

2. **toISOString() with split** (ReportsView.vue:499, 534)
```typescript
downloadCSV(csv, `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`);
downloadCSV(csv, `purchase-history-${fromDate.toISOString().split('T')[0]}-to-${toDate.toISOString().split('T')[0]}.csv`);
```

3. **toLocaleString()** (YearEndCountView.vue:1091)
```typescript
{{ new Date(data.unlockedAt).toLocaleString() }}
```

4. **Dedicated formatter utility** (BackupRestoreView.vue:180)
```typescript
// utils/dateFormatter.ts:9
const dateObj = typeof date === 'string' ? new Date(date) : date;
return dateObj.toLocaleDateString(locale.value, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
```

**Issue**:
Four different date formatting approaches with different behaviors:
- **Manual formatting** - Preserves local timezone ✓ (lines 932, 886 comments confirm this)
- **toISOString()** - Always uses UTC, can shift dates ✗
- **toLocaleString()** - Locale-aware but inconsistent format
- **dateFormatter utility** - Locale-aware and consistent ✓

**Example Problem**:
```typescript
// If user's timezone is UTC+2 and date is 2024-01-15 00:30
const date = new Date('2024-01-15T00:30:00');

// Manual formatting (CORRECT):
`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
// → "2024-1-15"

// toISOString().split('T')[0] (WRONG - shifts to previous day in some timezones):
date.toISOString().split('T')[0]
// → "2024-01-14" (shifted to UTC which is 22:30 on Jan 14)
```

**Files Affected**:
- ✓ `frontend/src/views/PurchasesView.vue:932` - Manual format (GOOD)
- ✓ `frontend/src/components/MultiItemPurchaseDialog.vue:886` - Manual format (GOOD)
- ✗ `frontend/src/views/ReportsView.vue:499` - toISOString (BAD)
- ✗ `frontend/src/views/ReportsView.vue:534` - toISOString (BAD - 2 occurrences)
- ~ `frontend/src/views/YearEndCountView.vue:1091` - toLocaleString (OK for timestamps)
- ✓ `frontend/src/utils/dateFormatter.ts` - Proper utility (GOOD)

**Recommendation**:
1. Use the existing `dateFormatter.ts` utility for display formatting
2. For API payloads, use manual YYYY-MM-DD format (already done correctly)
3. Replace `toISOString().split('T')[0]` with manual format

```typescript
// Create a new helper in dateFormatter.ts:
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Then replace:
// BEFORE:
downloadCSV(csv, `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`);

// AFTER:
import { formatDateISO } from '@/utils/dateFormatter';
downloadCSV(csv, `inventory-valuation-${formatDateISO(new Date())}.csv`);
```

**Priority**: MEDIUM - Can cause timezone-related date bugs.

---

### DATE-002: Date Display Not i18n-Aware (LOW)
**Severity**: LOW  
**Impact**: User experience, inconsistent date formats  
**Effort**: Low (1-2 hours)

**Description**:
Some dates displayed to users don't respect the selected language/locale.

**Current Implementation**:
```typescript
// YearEndCountView.vue:1091
{{ new Date(data.unlockedAt).toLocaleString() }}
```

This uses the browser's locale, not the app's selected language.

**Files Affected**:
- `frontend/src/views/YearEndCountView.vue:1091`
- Other potential direct `new Date().toLocaleString()` calls

**Recommendation**:
Always use the `formatDate()` utility from `dateFormatter.ts` which respects the selected locale:

```typescript
// BEFORE:
{{ new Date(data.unlockedAt).toLocaleString() }}

// AFTER:
<script setup>
import { formatDate } from '@/utils/dateFormatter';
</script>

<template>
  {{ formatDate(data.unlockedAt) }}
</template>
```

**Priority**: LOW - Dates are generally understandable in any format.

---

### DATE-003: Inconsistent Date Parsing (MEDIUM)
**Severity**: MEDIUM  
**Impact**: Date parsing reliability  
**Effort**: Low (1 hour)

**Description**:
Date strings are parsed using regex and manual Date constructor in multiple places with identical code.

**Duplicate Code**:
```typescript
// MultiItemPurchaseDialog.vue:734
const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
if (dateMatch) {
  const [, year, month, day] = dateMatch;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (!isNaN(date.getTime())) {
    formData.value.purchaseDate = date;
  }
}

// PurchasesView.vue:822 - EXACT SAME CODE
const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
if (dateMatch) {
  const [, year, month, day] = dateMatch;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (!isNaN(date.getTime())) {
    formData.value.purchaseDate = date;
  }
}

// ReportsView.vue:376 - EXACT SAME CODE (twice: 376 and 391)
const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
if (dateMatch) {
  const [, year, month, day] = dateMatch;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  // ...
}
```

**Issue**:
Same date parsing logic duplicated in 4 places.

**Recommendation**:
Create a utility function in `dateFormatter.ts`:

```typescript
// Add to dateFormatter.ts:
export function parseDateString(value: string): Date | null {
  const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;
  
  const [, year, month, day] = dateMatch;
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  
  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
    return null;
  }
  
  const date = new Date(yearNum, monthNum - 1, dayNum);
  return isNaN(date.getTime()) ? null : date;
}
```

Then use it:
```typescript
// BEFORE:
const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
if (dateMatch) {
  const [, year, month, day] = dateMatch;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (!isNaN(date.getTime())) {
    formData.value.purchaseDate = date;
  }
}

// AFTER:
import { parseDateString } from '@/utils/dateFormatter';
const date = parseDateString(value);
if (date) {
  formData.value.purchaseDate = date;
}
```

**Priority**: MEDIUM - Code duplication and missing radix parameters.

---

## Summary
- **Total Issues**: 3
- **Critical**: 0
- **High**: 0
- **Medium**: 2 (DATE-001, DATE-003)
- **Low**: 1 (DATE-002)

## Recommended Actions
1. Create `formatDateISO()` helper in dateFormatter.ts (DATE-001)
2. Replace `toISOString().split('T')[0]` with `formatDateISO()` (DATE-001)
3. Create `parseDateString()` helper in dateFormatter.ts (DATE-003)
4. Replace duplicate date parsing code with helper (DATE-003)
5. Ensure all displayed dates use `formatDate()` utility (DATE-002)

## Comments from Code
Several comments in the code already acknowledge these issues:

```typescript
// PurchasesView.vue:931
// Format date preserving local date (not UTC) to avoid timezone shifts

// MultiItemPurchaseDialog.vue:886
// Format date preserving local date (not UTC) to avoid timezone shifts
```

This shows developers were aware of the timezone issue and worked around it with manual formatting. The recommendation is to standardize this approach with proper utilities.
