# Currency Formatting Inconsistencies

## Summary
The application has incomplete and inconsistent currency support, with hardcoded USD defaults and mixed SEK handling patterns.

---

## CURR-001: Hardcoded USD currency in i18n configuration

**Severity**: High  
**Impact**: Currency selector doesn't fully work; i18n always formats as USD  
**Effort**: Small

**Current State:**
```typescript
// frontend/src/i18n/index.ts:52
currency: {
  style: 'currency' as const,
  currency: 'USD',  // ❌ Hardcoded!
  notation: 'standard' as const,
}
```

**Inconsistency:**
The i18n number format configuration hardcodes `USD` instead of reading from preferences store. This means the `CurrencySelector` component appears to work but i18n formatting ignores the selection.

**Affected Files:**
- `frontend/src/i18n/index.ts:52` (English locale)
- `frontend/src/i18n/index.ts:74` (Swedish locale)

**Recommended Standard:**
Make i18n currency reactive to preferences:
```typescript
import { usePreferencesStore } from '@/stores/preferences';

const preferencesStore = usePreferencesStore();

currency: {
  style: 'currency' as const,
  currency: computed(() => preferencesStore.currency),
  notation: 'standard' as const,
}
```

---

## CURR-002: Inconsistent InputNumber currency mode usage

**Severity**: Medium  
**Impact**: Some forms show currency symbols, others don't  
**Effort**: Small

**Current State:**
Only PurchasesView uses the reactive currency mode:
```vue
<!-- frontend/src/views/PurchasesView.vue:317 -->
<InputNumber
  :mode="currency.inputNumberMode.value"
  :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
  :locale="currency.inputNumberLocale.value"
/>
```

**Inconsistency:**
Most other views with InputNumber components don't use the currency mode at all. They show plain decimal numbers without currency context.

**Affected Files:**
- `frontend/src/views/PurchasesView.vue:317` - ✅ Uses currency mode
- `frontend/src/views/YearEndCountView.vue` - ❌ Missing currency mode
- `frontend/src/components/MultiItemPurchaseDialog.vue` - ❌ Mixed usage

**Recommended Standard:**
All InputNumber components for monetary values should use:
```vue
<InputNumber
  v-model="amount"
  :mode="currency.inputNumberMode.value"
  :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
  :locale="currency.inputNumberLocale.value"
  :minFractionDigits="2"
/>
```

---

## CURR-003: Mixed currency symbol handling for SEK

**Severity**: Medium  
**Impact**: Confusing UX - sometimes shows "kr", sometimes "SEK", sometimes nothing  
**Effort**: Medium

**Current State:**
```typescript
// frontend/src/composables/useCurrency.ts:18
const currencySymbol = computed(() => {
  return preferencesStore.currency === 'USD' ? '$' : 'kr';
});

// frontend/src/composables/useCurrency.ts:33
const inputNumberMode = computed(() => {
  return preferencesStore.currency === 'SEK' ? 'decimal' : 'currency';
});

// frontend/src/composables/useCurrency.ts:38
const currencySuffix = computed(() => {
  return preferencesStore.currency === 'SEK' ? ' (SEK)' : '';
});
```

**Inconsistency:**
For SEK, the app uses 'decimal' mode to avoid currency symbols in inputs, but this means:
- Display: Uses `kr` suffix via Intl.NumberFormat
- Inputs: Shows plain decimals (no symbol)
- Labels: Should have "(SEK)" suffix but not consistently applied

**Affected Files:**
- `frontend/src/composables/useCurrency.ts:18,33,38`
- All views using InputNumber for currency

**Recommended Standard:**
**Option A**: Always use 'currency' mode and let Intl handle symbols  
**Option B**: Consistently apply `currencySuffix` to all monetary field labels when in SEK mode

Decision needed: Should SEK inputs show "kr" symbol or stay decimal?

---

## CURR-004: Default currency hardcoded to USD

**Severity**: Medium  
**Impact**: Swedish users default to USD instead of SEK  
**Effort**: Small

**Current State:**
```typescript
// frontend/src/stores/preferences.ts:16
const currency = ref<Currency>((localStorage.getItem('preferredCurrency') as Currency) || 'USD');

// frontend/src/stores/auth.ts:25
preferencesStore.currency = response.data.user.preferences.currency || 'USD';

// frontend/src/stores/preferences.ts:116
currency.value = 'USD';
```

**Inconsistency:**
Multiple hardcoded USD defaults throughout the app. Should respect browser locale or system language preference.

**Affected Files:**
- `frontend/src/stores/preferences.ts:16` - Initial state
- `frontend/src/stores/preferences.ts:116` - Reset state  
- `frontend/src/stores/auth.ts:25` - Login default

**Recommended Standard:**
Default currency based on locale:
```typescript
const getDefaultCurrency = (): Currency => {
  const locale = localStorage.getItem('preferredLanguage') || navigator.language;
  return locale.startsWith('sv') ? 'SEK' : 'USD';
};

const currency = ref<Currency>(
  (localStorage.getItem('preferredCurrency') as Currency) || getDefaultCurrency()
);
```

---

## CURR-005: ProductsView has orphaned currency configuration

**Severity**: Low  
**Impact**: Dead code / potential confusion  
**Effort**: Trivial

**Current State:**
```vue
<!-- frontend/src/views/ProductsView.vue:730 -->
currency: 'USD',
```

**Inconsistency:**
ProductsView has a hardcoded currency configuration that appears unused (no InputNumber with currency mode in that view).

**Affected Files:**
- `frontend/src/views/ProductsView.vue:730`

**Recommended Standard:**
Remove dead code or use it properly if needed.

---

## Summary Statistics

**Total Issues**: 5  
**Critical**: 0  
**High**: 1 (CURR-001)  
**Medium**: 3 (CURR-002, CURR-003, CURR-004)  
**Low**: 1 (CURR-005)

**Total Estimated Effort**: 2-3 days to fully standardize currency handling

## Architectural Recommendations

1. **Make i18n reactive to preferences** - Critical for currency selector to work
2. **Choose one SEK input strategy** - Either always use currency mode or always use decimal+labels
3. **Locale-aware defaults** - Don't hardcode USD for Swedish users
4. **Centralize currency configuration** - Single source of truth in preferences store
5. **Document the currency strategy** - Make it clear which approach to use where
