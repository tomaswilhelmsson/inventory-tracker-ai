# Recommendations: Application Consistency Standards

This document provides recommended standards for addressing the inconsistencies found in the analysis.

---

## 1. Currency and Number Formatting Standards

### Standard 1.1: Reactive Currency Configuration

**Problem**: i18n hardcodes USD, breaking currency selector functionality

**Recommended Implementation**:
```typescript
// frontend/src/i18n/index.ts
import { computed } from 'vue';
import { usePreferencesStore } from '@/stores/preferences';

export default createI18n({
  // ...
  numberFormats: {
    'en-US': {
      currency: {
        style: 'currency',
        currency: computed(() => usePreferencesStore().currency),
        notation: 'standard',
      },
    },
    'sv-SE': {
      currency: {
        style: 'currency',
        currency: computed(() => usePreferencesStore().currency),
        notation: 'standard',
      },
    },
  },
});
```

### Standard 1.2: Consistent InputNumber Configuration

**Pattern**: All monetary input fields should use this configuration

```vue
<template>
  <InputNumber
    v-model="amount"
    :mode="currency.inputNumberMode.value"
    :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
    :locale="currency.inputNumberLocale.value"
    :minFractionDigits="2"
    :maxFractionDigits="2"
  />
</template>

<script setup lang="ts">
import { useCurrency } from '@/composables/useCurrency';
const currency = useCurrency();
</script>
```

### Standard 1.3: Locale-Aware Currency Defaults

**Problem**: Swedish users default to USD

**Solution**:
```typescript
// frontend/src/stores/preferences.ts
const getDefaultCurrency = (): Currency => {
  const savedLocale = localStorage.getItem('preferredLanguage');
  const browserLocale = navigator.language || navigator.languages[0];
  const locale = savedLocale || browserLocale;
  
  if (locale.startsWith('sv')) return 'SEK';
  if (locale.startsWith('no')) return 'NOK';
  if (locale.startsWith('dk')) return 'DKK';
  return 'USD'; // Fallback
};

const currency = ref<Currency>(
  (localStorage.getItem('preferredCurrency') as Currency) || getDefaultCurrency()
);
```

---

## 2. Backend Validation Standards

### Standard 2.1: Decimal Quantity Validation

**Pattern**: All quantity fields accept decimals with 2-digit precision

```typescript
// Backend validation
body('quantity')
  .isFloat({ gt: 0 })
  .withMessage('Quantity must be greater than 0')
  .custom((value) => {
    // Optional: Enforce max 2 decimal places
    const decimals = (value.toString().split('.')[1] || '').length;
    if (decimals > 2) {
      throw new Error('Maximum 2 decimal places allowed');
    }
    return true;
  })

// Service layer (ensure precision)
quantity = Math.round(quantity * 100) / 100;
```

```vue
<!-- Frontend input -->
<InputNumber
  v-model="quantity"
  :min="0.01"
  :minFractionDigits="0"
  :maxFractionDigits="2"
/>
```

### Standard 2.2: Validation Error Messages

**Pattern**: Consistent, descriptive error messages

```typescript
// ID validation
param('id').isInt().withMessage('Invalid {entity} ID')

// Required fields
body('name').notEmpty().withMessage('{Field} is required')

// Range validation
body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100')

// Type validation
body('quantity').isFloat().withMessage('{Field} must be a number')
```

### Standard 2.3: Shared Validation Helpers

**Create**: `backend/src/utils/validators.ts`

```typescript
import { param, body, query } from 'express-validator';

export const validators = {
  // ID parameters
  id: (entity: string = 'entity') => 
    param('id').isInt().withMessage(`Invalid ${entity} ID`),
  
  // Year validation
  year: (field: 'param' | 'body' | 'query' = 'param') => 
    (field === 'param' ? param : field === 'body' ? body : query)('year')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100'),
  
  // Decimal quantity
  quantity: (field: string = 'quantity') =>
    body(field)
      .isFloat({ gt: 0 })
      .withMessage(`${field} must be greater than 0`),
  
  // Boolean with conversion
  boolean: (field: string, location: 'body' | 'query' = 'body') =>
    (location === 'body' ? body : query)(field)
      .optional()
      .isBoolean()
      .toBoolean(),
};

// Usage:
router.get('/:id', [validators.id('purchase')], ...)
router.post('/', [validators.year('body'), validators.quantity()], ...)
```

---

## 3. Error Handling and Toast Standards

### Standard 3.1: Toast Duration by Severity

```typescript
// frontend/src/constants/toast.ts
export const TOAST_DURATIONS = {
  SUCCESS: 3000,      // 3s - Quick confirmation
  INFO: 3000,         // 3s - General information
  WARNING: 5000,      // 5s - Important warnings
  ERROR: 4000,        // 4s - Errors need more reading time
  CRITICAL: 6000,     // 6s - Critical failures
} as const;

export const TOAST_CONFIG = {
  success: { severity: 'success', life: TOAST_DURATIONS.SUCCESS },
  info: { severity: 'info', life: TOAST_DURATIONS.INFO },
  warning: { severity: 'warn', life: TOAST_DURATIONS.WARNING },
  error: { severity: 'error', life: TOAST_DURATIONS.ERROR },
  critical: { severity: 'error', life: TOAST_DURATIONS.CRITICAL },
} as const;
```

### Standard 3.2: Error Handler Composable

```typescript
// frontend/src/composables/useApiError.ts
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import { TOAST_CONFIG } from '@/constants/toast';

export function useApiError() {
  const toast = useToast();
  const { t } = useI18n();
  
  const handleApiError = (error: any, fallbackKey: string) => {
    const detail = error.response?.data?.error 
      || error.response?.data?.message 
      || t(fallbackKey);
    
    toast.add({
      ...TOAST_CONFIG.error,
      summary: t('common.error'),
      detail,
    });
    
    // Log to console for debugging
    console.error('[API Error]', {
      endpoint: error.config?.url,
      status: error.response?.status,
      message: detail,
      error,
    });
  };
  
  const showSuccess = (messageKey: string) => {
    toast.add({
      ...TOAST_CONFIG.success,
      summary: t('common.success'),
      detail: t(messageKey),
    });
  };
  
  const showWarning = (messageKey: string) => {
    toast.add({
      ...TOAST_CONFIG.warning,
      summary: t('common.warning'),
      detail: t(messageKey),
    });
  };
  
  return {
    handleApiError,
    showSuccess,
    showWarning,
  };
}

// Usage:
const { handleApiError, showSuccess } = useApiError();

try {
  await api.post('/purchases', data);
  showSuccess('purchases.messages.createSuccess');
} catch (error) {
  handleApiError(error, 'purchases.messages.createFailed');
}
```

### Standard 3.3: Consistent Error Property Access

**Pattern**: Always use this chain for API errors

```typescript
// Backend returns errors as:
// { error: string } or { message: string }

// Frontend extraction:
const errorMessage = error.response?.data?.error 
  || error.response?.data?.message 
  || fallbackMessage;
```

---

## 4. Code Organization Standards

### Standard 4.1: Composable Organization

```
frontend/src/composables/
├── useCurrency.ts       # Currency formatting
├── useApiError.ts       # Error handling
├── useFormValidation.ts # Form validation helpers
└── useDialog.ts         # Dialog state management
```

### Standard 4.2: Constants Organization

```
frontend/src/constants/
├── toast.ts            # Toast durations and configs
├── validation.ts       # Validation rules and messages
├── currency.ts         # Currency codes and formats
└── routes.ts           # Route paths
```

### Standard 4.3: Utility Organization

```
backend/src/utils/
├── validators.ts       # Shared validation helpers
├── vatCalculations.ts  # VAT calculations
├── config.ts           # Configuration
└── prisma.ts           # Database client
```

---

## 5. Testing Standards

### Standard 5.1: Validation Tests

**Pattern**: Test all validation boundaries

```typescript
// backend/tests/validation.test.ts
describe('Purchase Validation', () => {
  it('should accept decimal quantities', async () => {
    const response = await request(app)
      .post('/api/purchases')
      .send({ quantity: 7.6, ...otherFields });
    expect(response.status).toBe(201);
  });
  
  it('should reject quantities with >2 decimals', async () => {
    const response = await request(app)
      .post('/api/purchases')
      .send({ quantity: 7.123, ...otherFields });
    expect(response.status).toBe(400);
  });
  
  it('should reject negative quantities', async () => {
    const response = await request(app)
      .post('/api/purchases')
      .send({ quantity: -5, ...otherFields });
    expect(response.status).toBe(400);
  });
});
```

### Standard 5.2: Currency Switching Tests

```typescript
// frontend/tests/currency.test.ts
describe('Currency Switching', () => {
  it('should update all displays when currency changes', async () => {
    const { getByText } = render(DashboardView);
    
    // Initial state (USD)
    expect(getByText(/\$100.00/)).toBeInTheDocument();
    
    // Switch to SEK
    preferencesStore.currency = 'SEK';
    await nextTick();
    
    // Verify update
    expect(getByText(/100,00 kr/)).toBeInTheDocument();
  });
});
```

---

## 6. Documentation Standards

### Standard 6.1: Validation Documentation

**Create**: `docs/validation-guide.md`

Document:
- Which fields accept decimals
- Max/min values for each field type
- Required vs optional fields
- Validation error message meanings

### Standard 6.2: Currency Configuration Guide

**Create**: `docs/currency-guide.md`

Document:
- How to add new currencies
- Where currency config lives
- How InputNumber currency mode works
- Testing currency changes

---

## 7. Migration Strategies

### Strategy 7.1: Fix Critical Issues First

**Week 1**: Critical fixes
- VAL-001: Year-end count decimal validation
- CURR-001: Reactive i18n currency

**Week 2**: High-priority standardization
- Create validation helpers
- Create error handler composable
- Standardize toast durations

**Week 3**: Systematic refactoring
- Apply validation helpers to all routes
- Replace manual error handling with composable
- Apply standard toast configs

### Strategy 7.2: Gradual Refactoring

**Principle**: Don't break working code

1. Create new standards (helpers, composables, constants)
2. Apply to NEW code immediately
3. Refactor OLD code incrementally:
   - One view at a time
   - Test after each refactor
   - Track progress in migration checklist

### Strategy 7.3: Automated Linting

**Create**: `.eslintrc-consistency.json`

```json
{
  "rules": {
    "no-magic-numbers": ["warn", { 
      "ignore": [0, 1, 2, 10, 100],
      "ignoreArrayIndexes": true
    }],
    "max-len": ["warn", { "code": 120 }],
  }
}
```

Add custom rules for:
- Toast duration constants (no hardcoded 3000/5000)
- Validation message format
- Error property access pattern

---

## 8. Tooling Recommendations

### Tool 8.1: Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
npm run lint

# Check for hardcoded currency
if git diff --cached | grep -i "currency.*'USD'" | grep -v "// allow-usd"; then
  echo "⚠️  Found hardcoded USD currency. Use preferences store instead."
  exit 1
fi

# Check for hardcoded toast durations
if git diff --cached | grep "life: [0-9]" | grep -v "TOAST_DURATIONS"; then
  echo "⚠️  Found hardcoded toast duration. Use TOAST_DURATIONS constant."
  exit 1
fi
```

### Tool 8.2: Validation Test Generator

```typescript
// scripts/generate-validation-tests.ts
// Auto-generate validation tests from route validators
```

---

## Summary

Implementing these standards will:
- ✅ Eliminate critical validation mismatches
- ✅ Fix broken currency selector
- ✅ Standardize error handling
- ✅ Improve code maintainability
- ✅ Reduce future inconsistencies
- ✅ Improve developer experience

**Estimated Total Effort**: 2-3 weeks for full implementation

**Priority Order**:
1. Critical fixes (VAL-001, CURR-001) - 1-2 days
2. Create shared utilities - 2-3 days
3. Systematic refactoring - 1-2 weeks
4. Testing and documentation - 2-3 days
