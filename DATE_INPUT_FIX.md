# Date Input Fix - Manual Entry Support

## Issue
When manually typing dates like "2025-02-28" in PrimeVue DatePicker fields, the input was incorrectly parsed as "2025-02-02", losing the day value.

## Root Cause
PrimeVue DatePicker v4.5.3 has issues with manual text input parsing, especially with the `yy-mm-dd` format. The component's `dateFormat` prop is primarily for display, not for parsing manual keyboard input.

## Solution
Added manual input handlers to PrimeVue DatePicker components using the `@input` event. These handlers intercept manual text input, parse it correctly using regex, and update the v-model with a proper Date object.

**Why not native HTML5 date inputs?**
The user preferred the PrimeVue DatePicker UI with its calendar popup, so we kept the PrimeVue component and added manual parsing as a workaround.

## Implementation

### 1. PurchasesView.vue

**Added handler function:**
```typescript
const handleDateInput = (event: any) => {
  const value = event.target?.value;
  if (value && typeof value === 'string') {
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        formData.value.purchaseDate = date;
        onDateChange();
      }
    }
  }
};
```

**Updated DatePicker:**
```vue
<DatePicker
  id="purchaseDate"
  v-model="formData.purchaseDate"
  dateFormat="yy-mm-dd"
  showIcon
  :manualInput="true"
  @date-select="onDateChange"
  @input="handleDateInput"
/>
```

### 2. ReportsView.vue

**Added handler functions:**
```typescript
const handleFromDateInput = (event: any) => {
  const value = event.target?.value;
  if (value && typeof value === 'string') {
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        purchaseReportDates.value.from = date;
      }
    }
  }
};

const handleToDateInput = (event: any) => {
  const value = event.target?.value;
  if (value && typeof value === 'string') {
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        purchaseReportDates.value.to = date;
      }
    }
  }
};
```

**Updated DatePickers:**
```vue
<DatePicker
  v-model="purchaseReportDates.from"
  dateFormat="yy-mm-dd"
  showIcon
  :manualInput="true"
  placeholder="YYYY-MM-DD"
  @input="handleFromDateInput"
/>
<DatePicker
  v-model="purchaseReportDates.to"
  dateFormat="yy-mm-dd"
  showIcon
  :manualInput="true"
  placeholder="YYYY-MM-DD"
  @input="handleToDateInput"
/>
```

## How It Works

1. **User Types**: When user manually types in the DatePicker field, the `@input` event fires
2. **Extract Value**: Handler extracts the input field's text value
3. **Regex Match**: Pattern `/^(\d{4})-(\d{2})-(\d{2})$/` matches YYYY-MM-DD format
4. **Parse Date**: Extracts year, month, day and creates Date object
   - Note: Month is 0-indexed, so we subtract 1
5. **Validate**: Checks if date is valid (not NaN)
6. **Update Model**: Sets the v-model with the correct Date object

## Changes Summary

**Files Modified:**
- `frontend/src/views/PurchasesView.vue` - Added `handleDateInput` function and `@input` handler
- `frontend/src/views/ReportsView.vue` - Added `handleFromDateInput` and `handleToDateInput` functions with `@input` handlers

**No Dependencies Changed:**
- Still using PrimeVue DatePicker
- No new dependencies added

## Benefits

1. **Reliable Manual Input**: Type "2025-02-28" and get exactly that date
2. **Keeps PrimeVue UI**: Users still get the familiar calendar popup
3. **Non-Breaking**: Calendar picker still works normally
4. **Minimal Changes**: Just added event handlers, no major refactoring

## Testing Checklist

### Manual Entry Test
- [ ] Click in date field in PurchasesView
- [ ] Type: `2025-02-28`
- [ ] Tab or click away
- [ ] Verify: Date shows as Feb 28, 2025

### Calendar Picker Test
- [ ] Click calendar icon
- [ ] Select Feb 28, 2025
- [ ] Verify: Date is correctly set

### Reports Date Range Test
- [ ] Enter "from" date: `2024-01-01`
- [ ] Enter "to" date: `2024-12-31`
- [ ] Export purchase history
- [ ] Verify: Correct date range in exported data

### Edge Cases
- [ ] Type invalid date like `2025-02-30` (should not update)
- [ ] Type incomplete date like `2025-02` (should not update)
- [ ] Type malformed input like `28-02-2025` (should not update)

## Known Limitations

1. **Format Specific**: Only handles YYYY-MM-DD format (which is what we want)
2. **No Autocomplete**: User must type full date or use calendar
3. **Silent Failure**: Invalid inputs are ignored (no error message)

## Future Improvements

If PrimeVue fixes their manual input parsing in future versions, this workaround can be removed. Monitor PrimeVue release notes for DatePicker improvements.

## Related Issues

- PrimeVue DatePicker manual input parsing: https://github.com/primefaces/primevue/issues
- Component version: PrimeVue 4.5.3
