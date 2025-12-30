# Frontend Validation Inconsistencies

## Overview
Analysis of form validation patterns across frontend Vue components to identify inconsistencies.

## Issues Found

### FVAL-001: Inconsistent Validation Pattern (MEDIUM)
**Severity**: MEDIUM  
**Impact**: Code maintainability, potential for validation bugs  
**Effort**: Medium (4-6 hours)

**Description**:
Frontend validation is implemented with inline validation functions in each view, rather than a centralized validation system. This creates duplication and inconsistency.

**Current Implementation**:
Each view implements its own `validateForm()` function:

```typescript
// PurchasesView.vue:890
const validateForm = (): boolean => {
  formErrors.value = {};
  
  if (!formData.value.productId) {
    formErrors.value.productId = t('validation.required');
  }
  
  if (!formData.value.supplierId) {
    formErrors.value.supplierId = t('validation.required');
  }
  
  if (!formData.value.purchaseDate) {
    formErrors.value.purchaseDate = t('validation.required');
  }
  
  if (!formData.value.quantity || formData.value.quantity <= 0) {
    formErrors.value.quantity = t('validation.quantityPositive');
  }
  
  if (formData.value.unitCost === null || formData.value.unitCost < 0) {
    formErrors.value.unitCost = t('validation.unitCostNonNegative');
  }
  
  return Object.keys(formErrors.value).length === 0;
};

// ProductsView.vue:568
const validateForm = (): boolean => {
  formErrors.value = {};
  
  if (!formData.value.name.trim()) {
    formErrors.value.name = t('validation.required');
  }
  
  if (!formData.value.unitId) {
    formErrors.value.unitId = t('validation.required');
  }
  
  if (!formData.value.supplierIds || formData.value.supplierIds.length === 0) {
    formErrors.value.supplierIds = t('validation.required');
  }
  
  return Object.keys(formErrors.value).length === 0;
};

// UnitsView.vue:214
const validateForm = (): boolean => {
  formErrors.value = {};
  
  if (!formData.value.name.trim()) {
    formErrors.value.name = t('validation.required');
  }
  
  return Object.keys(formErrors.value).length === 0;
};

// SuppliersView.vue:387
const validateForm = (): boolean => {
  formErrors.value = {};
  
  if (!formData.value.name.trim()) {
    formErrors.value.name = t('validation.required');
  }
  
  return Object.keys(formErrors.value).length === 0;
};
```

**Files Affected**:
- `frontend/src/views/PurchasesView.vue:890`
- `frontend/src/views/ProductsView.vue:568`
- `frontend/src/views/UnitsView.vue:214`
- `frontend/src/views/SuppliersView.vue:387`

**Recommendation**:
Create a centralized validation composable:
```typescript
// frontend/src/composables/useValidation.ts
export function useValidation() {
  const { t } = useI18n();
  
  const required = (value: any, fieldName?: string) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return fieldName 
        ? t('validation.requiredField', { field: fieldName })
        : t('validation.required');
    }
    return null;
  };
  
  const minValue = (value: number, min: number) => {
    if (value < min) {
      return t('validation.minValue', { min });
    }
    return null;
  };
  
  const positive = (value: number) => {
    if (value <= 0) {
      return t('validation.quantityPositive');
    }
    return null;
  };
  
  const nonNegative = (value: number) => {
    if (value < 0) {
      return t('validation.unitCostNonNegative');
    }
    return null;
  };
  
  const validate = (rules: Record<string, Array<() => string | null>>) => {
    const errors: Record<string, string> = {};
    
    for (const [field, validators] of Object.entries(rules)) {
      for (const validator of validators) {
        const error = validator();
        if (error) {
          errors[field] = error;
          break;
        }
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  return {
    required,
    minValue,
    positive,
    nonNegative,
    validate
  };
}
```

**Priority**: MEDIUM - Not breaking functionality but impacts code maintainability.

---

### FVAL-002: No Client-Side Number Validation (LOW)
**Severity**: LOW  
**Impact**: User experience  
**Effort**: Low (2-3 hours)

**Description**:
Numeric inputs (quantity, unitCost) don't have client-side type checking before validation.

**Current Implementation**:
```typescript
// PurchasesView.vue:905
if (!formData.value.quantity || formData.value.quantity <= 0) {
  formErrors.value.quantity = t('validation.quantityPositive');
}
```

**Issue**:
No validation that `quantity` is actually a number. User could type "abc" and it would just fail the `<= 0` check.

**Recommendation**:
Add type validation:
```typescript
if (!formData.value.quantity || typeof formData.value.quantity !== 'number' || isNaN(formData.value.quantity) || formData.value.quantity <= 0) {
  formErrors.value.quantity = t('validation.quantityPositive');
}
```

Or better yet, use the centralized validation with a `number` validator.

**Priority**: LOW - PrimeVue InputNumber components already handle this at the UI level.

---

### FVAL-003: Email Validation Missing (LOW)
**Severity**: LOW  
**Impact**: Data quality  
**Effort**: Low (1 hour)

**Description**:
Supplier email field has no frontend validation, despite having a backend email validator.

**Files Affected**:
- `frontend/src/views/SuppliersView.vue:387` - No email validation
- `backend/src/routes/suppliers.ts:88` - Has `.isEmail()` validation

**Recommendation**:
Add email validation to frontend:
```typescript
const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// In validateForm():
if (formData.value.email && !validateEmail(formData.value.email)) {
  formErrors.value.email = t('validation.invalidEmail');
}
```

**Priority**: LOW - Optional field, backend already validates.

---

## Summary
- **Total Issues**: 3
- **Critical**: 0
- **High**: 0
- **Medium**: 1 (FVAL-001)
- **Low**: 2 (FVAL-002, FVAL-003)

## Recommended Actions
1. Create centralized validation composable (FVAL-001)
2. Refactor all view validation to use composable
3. Add number type checking to validation
4. Add email validation to supplier form
