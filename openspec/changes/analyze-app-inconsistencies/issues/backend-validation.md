# Backend Validation Inconsistencies

## Summary
Backend validation has inconsistencies between int/float usage, missing validations, and mismatches with frontend/database expectations.

---

## VAL-001: Year-end count quantity validation rejects decimals

**Severity**: CRITICAL  
**Impact**: Users cannot enter decimal quantities (0.68, 7.6, etc.) in year-end counts via API, even though frontend supports it  
**Effort**: Trivial

**Current State:**
```typescript
// backend/src/routes/yearEndCount.ts:208
body('countedQuantity').isInt({ min: 0 }).withMessage('Counted quantity must be >= 0'),
```

**Inconsistency:**
- Frontend (YearEndCountView.vue:871): Accepts decimals with `minFractionDigits="0"` `maxFractionDigits="2"`
- Backend: Rejects decimals with `isInt()`
- Database schema: Uses `Float` type
- Frontend saves decimals using `parseFloat(quantity.toFixed(2))` (line 187)

This causes API rejection when users enter fractional quantities!

**Affected Files:**
- `backend/src/routes/yearEndCount.ts:208` - Validation rule
- `frontend/src/views/YearEndCountView.vue:871` - InputNumber allows decimals
- `frontend/src/views/YearEndCountView.vue:187` - Sends decimals to API

**Recommended Standard:**
```typescript
body('countedQuantity').isFloat({ min: 0 }).withMessage('Counted quantity must be >= 0'),
```

---

## VAL-002: Inconsistent ID parameter validation messages

**Severity**: Low  
**Impact**: Inconsistent error messages confuse debugging  
**Effort**: Trivial

**Current State:**
Different routes use different error messages for ID validation:
```typescript
// backend/src/routes/units.ts:34
param('id').isInt().withMessage('Invalid unit ID')

// backend/src/routes/suppliers.ts:43
param('id').isInt().withMessage('Invalid supplier ID')

// backend/src/routes/purchases.ts:63
param('id').isInt().withMessage('Invalid purchase lot ID')

// backend/src/routes/yearEndCount.ts:189
param('id').isInt().withMessage('Valid count ID is required')  // Different pattern!
```

**Inconsistency:**
Most use "Invalid X ID" but yearEndCount uses "Valid X ID is required". Inconsistent language patterns.

**Affected Files:**
- All route files with ID validation (8+ files)

**Recommended Standard:**
Standardize to: `"Invalid {entity} ID"` pattern everywhere
```typescript
param('id').isInt().withMessage('Invalid {entity} ID')
```

---

## VAL-003: Boolean validation inconsistent with .toBoolean() usage

**Severity**: Medium  
**Impact**: Some query booleans auto-convert, others don't - confusing  
**Effort**: Small

**Current State:**
```typescript
// backend/src/routes/suppliers.ts:23 - Has .toBoolean()
query('includeInactive').optional().isBoolean().toBoolean(),

// backend/src/routes/purchases.ts:40 - Has .toBoolean()
query('hasRemainingInventory').optional().isBoolean().toBoolean(),

// backend/src/routes/purchases.ts:174 - Missing .toBoolean()
body('shippingIncludesVAT').optional().isBoolean().withMessage('shippingIncludesVAT must be boolean'),

// backend/src/routes/purchases.ts:176 - Missing .toBoolean()
body('pricesIncludeVAT').optional().isBoolean().withMessage('pricesIncludeVAT must be boolean'),
```

**Inconsistency:**
Query parameters use `.toBoolean()` to convert string "true"/"false" to booleans, but body parameters don't. This means:
- Query params: Accept "true"/"false" strings
- Body params: Only accept actual boolean JSON values

**Affected Files:**
- `backend/src/routes/suppliers.ts:23`
- `backend/src/routes/purchases.ts:40,174,176`

**Recommended Standard:**
Body parameters should also use `.toBoolean()` for consistency:
```typescript
body('shippingIncludesVAT').optional().isBoolean().toBoolean(),
body('pricesIncludeVAT').optional().isBoolean().toBoolean(),
```

Or document the intentional difference (query strings need conversion, JSON bodies don't).

---

## VAL-004: Missing upper bound validation on year inputs

**Severity**: Medium  
**Impact**: Could accept year 9999 or negative years  
**Effort**: Trivial

**Current State:**
```typescript
// backend/src/routes/yearEndCount.ts:65
body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required')  // ✅ Good!

// backend/src/routes/yearEndCount.ts:94, 111, 128, 150, 167
param('year').isInt().withMessage('Valid year is required')  // ❌ No min/max!
```

**Inconsistency:**
POST endpoint validates year range (2000-2100), but GET/PUT/DELETE endpoints don't. Could accept absurd years like -500 or 999999.

**Affected Files:**
- `backend/src/routes/yearEndCount.ts:94,111,128,150,167`

**Recommended Standard:**
Apply consistent range to all year validations:
```typescript
param('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100')
```

---

## VAL-005: Missing string length validation on notes fields

**Severity**: Low  
**Impact**: Could accept extremely long strings, potential DoS  
**Effort**: Small

**Current State:**
```typescript
// backend/src/routes/purchases.ts:177 - Has length limit ✅
body('notes').optional().isString().trim().isLength({ max: 1000 })

// Other notes fields - No validation ❌
```

**Inconsistency:**
Only batch purchase notes field has length validation. Other entities (Supplier, Product, etc.) have `notes` fields in schema but no validation.

**Affected Files:**
- Supplier routes - `notes` field unvalidated
- Product routes - `description` field unvalidated  
- Year-end count unlock - `description` field has validation ✅ (line 170)

**Recommended Standard:**
All text fields should have max length:
```typescript
body('notes').optional().isString().trim().isLength({ max: 1000 })
body('description').optional().isString().trim().isLength({ max: 2000 })
```

---

## VAL-006: Inconsistent decimal precision validation

**Severity**: Medium  
**Impact**: Frontend allows 2 decimals, backend validation doesn't check precision  
**Effort**: Medium

**Current State:**
```typescript
// backend/src/routes/purchases.ts:83
body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0')
// ❌ No precision limit! Could accept 0.123456789
```

**Inconsistency:**
Frontend enforces 2 decimal places (`maxFractionDigits: 2`), but backend accepts any precision. Database stores as Float (up to ~15 significant digits).

Could lead to data precision mismatch:
- User enters: 7.60
- Frontend sends: 7.6
- Backend accepts: 7.123456 (if sent directly to API)
- Database stores: 7.123456

**Affected Files:**
- All routes with `isFloat()` validation
- Should match `parseFloat(value.toFixed(2))` pattern from frontend

**Recommended Standard:**
Add custom validator for decimal precision:
```typescript
body('quantity')
  .isFloat({ gt: 0 })
  .custom((value) => {
    const decimals = (value.toString().split('.')[1] || '').length;
    if (decimals > 2) {
      throw new Error('Maximum 2 decimal places allowed');
    }
    return true;
  })
```

Or round on backend:
```typescript
// In service layer
quantity = Math.round(quantity * 100) / 100;
```

---

## Summary Statistics

**Total Issues**: 6  
**Critical**: 1 (VAL-001 - Year-end count decimals)  
**High**: 0  
**Medium**: 3 (VAL-003, VAL-004, VAL-006)  
**Low**: 2 (VAL-002, VAL-005)

**Total Estimated Effort**: 1-2 days

## Architectural Recommendations

1. **Create validation constants** - Define max lengths, year ranges in one place
2. **Add custom validators** - Decimal precision, date ranges, etc.
3. **Validation documentation** - Document which validations apply to which fields
4. **Automated tests** - Test validation boundaries (min, max, precision)
5. **Frontend/backend alignment** - Ensure frontend can't send values backend rejects

## Immediate Actions Required

**CRITICAL**: Fix VAL-001 immediately - breaks year-end count functionality for decimal quantities.

```diff
- body('countedQuantity').isInt({ min: 0 }).withMessage('Counted quantity must be >= 0'),
+ body('countedQuantity').isFloat({ min: 0 }).withMessage('Counted quantity must be >= 0'),
```
