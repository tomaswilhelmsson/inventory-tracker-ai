# Follow-Up Changes

Based on the inconsistency analysis, these focused changes should be created to address the findings.

---

## 1. fix-critical-validation-bugs

**Priority**: CRITICAL  
**Estimated Effort**: 4-6 hours  
**Dependencies**: None

### Scope
Fix validation bugs that break core functionality.

### Issues Addressed
- **VAL-001**: Year-end count decimal validation (CRITICAL)
- **VAL-004**: Missing year range validation (MEDIUM)
- **VAL-002**: Inconsistent validation messages (LOW)

### Changes
- `backend/src/routes/yearEndCount.ts:208` - Change `isInt` to `isFloat`
- `backend/src/routes/yearEndCount.ts:94,111,128,150,167` - Add year range `{ min: 2000, max: 2100 }`
- All route files - Standardize ID validation messages to "Invalid {entity} ID"

### Testing
- Test year-end count with decimal quantities (0.68, 7.6, 31.25)
- Test year endpoints with invalid years (-500, 999999)
- Verify error messages are consistent

---

## 2. fix-currency-selector

**Priority**: HIGH  
**Estimated Effort**: 1-2 days  
**Dependencies**: None

### Scope
Make currency selector functional by fixing i18n configuration.

### Issues Addressed
- **CURR-001**: Hardcoded USD in i18n (HIGH)
- **CURR-004**: Default currency hardcoded to USD (MEDIUM)
- **CURR-005**: Dead code in ProductsView (LOW)

### Changes
- `frontend/src/i18n/index.ts` - Make currency reactive to preferences store
- `frontend/src/stores/preferences.ts` - Locale-aware default currency
- `frontend/src/stores/auth.ts` - Use locale-aware default
- `frontend/src/views/ProductsView.vue:730` - Remove dead currency config

### Testing
- Switch currency from USD to SEK
- Verify all `{{ n(value, 'currency') }}` displays update
- Verify Swedish users default to SEK
- Test page refresh preserves currency choice

---

## 3. standardize-currency-inputs

**Priority**: MEDIUM  
**Estimated Effort**: 2-3 days  
**Dependencies**: fix-currency-selector (should be done first)

### Scope
Standardize InputNumber currency mode usage across all views.

### Issues Addressed
- **CURR-002**: Inconsistent InputNumber currency mode (MEDIUM)
- **CURR-003**: Mixed SEK symbol handling (MEDIUM)

### Changes
- Audit all InputNumber components for monetary values
- Apply consistent configuration:
  ```vue
  :mode="currency.inputNumberMode.value"
  :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
  :locale="currency.inputNumberLocale.value"
  :minFractionDigits="2"
  :maxFractionDigits="2"
  ```
- Affected views:
  - YearEndCountView
  - MultiItemPurchaseDialog (standardize all instances)
  - Any other views with monetary InputNumbers

### Decision Required
**SEK Symbol Strategy**: Choose one approach:
- **Option A**: Always use 'currency' mode (let Intl show "kr")
- **Option B**: Use 'decimal' mode + add "(SEK)" to all field labels
- **Recommendation**: Option A for consistency with USD

### Testing
- Test all forms with USD (should show $)
- Test all forms with SEK (should show kr or SEK consistently)
- Verify decimal precision (2 places)

---

## 4. improve-validation-patterns

**Priority**: MEDIUM  
**Estimated Effort**: 3-4 days  
**Dependencies**: fix-critical-validation-bugs (should be done first)

### Scope
Create shared validation helpers and apply consistently.

### Issues Addressed
- **VAL-003**: Boolean validation inconsistency (MEDIUM)
- **VAL-005**: Missing string length validation (LOW)
- **VAL-006**: No decimal precision limits (MEDIUM)

### Changes

**Phase 1: Create helpers**
- Create `backend/src/utils/validators.ts` with shared validators
- Define validation constants (max lengths, year ranges, etc.)

**Phase 2: Apply to routes**
- Replace inline validators with helpers in all routes
- Add `.toBoolean()` to body boolean validators
- Add length limits to all text fields (notes, description)
- Add decimal precision validation to quantity fields

**Phase 3: Testing**
- Create validation test suite
- Test boundaries for all validators
- Document validation rules

### Testing
- Test boolean body params with string "true"/"false"
- Test text fields with extremely long strings
- Test quantities with >2 decimal places

---

## 5. standardize-error-handling

**Priority**: MEDIUM  
**Estimated Effort**: 2-3 days  
**Dependencies**: None

### Scope
Standardize toast notifications and create error handling composable.

### Issues Addressed
- **ERR-001**: Inconsistent toast durations (LOW)
- **ERR-002**: Missing toast notifications (MEDIUM)

### Changes

**Phase 1: Create standards**
- Create `frontend/src/constants/toast.ts` with duration constants
- Create `frontend/src/composables/useApiError.ts` with error handler

**Phase 2: Apply systematically**
- Replace all `toast.add()` with duration constants
- Replace manual error handling with `useApiError` composable
- Audit all API calls for missing error toasts

**Phase 3: Update patterns**
- Success: 3000ms
- Warning: 5000ms
- Error: 4000ms
- Critical: 6000ms

### Testing
- Trigger various errors and verify duration/messages
- Verify all API failures show user feedback

---

## 6. continue-inconsistency-analysis

**Priority**: LOW  
**Estimated Effort**: 3-4 days  
**Dependencies**: None (can run in parallel)

### Scope
Complete the remaining analysis phases.

### Phases to Complete
- **Phase 2**: Manual code review
  - Frontend validation patterns
  - Number parsing patterns
  - Date handling patterns
  - i18n consistency
  
- **Phase 3**: Data model analysis
  - Schema consistency
  - Snapshot patterns
  - Audit trails
  
- **Phase 4**: Architecture review
  - Component patterns
  - State management
  - Service layer
  - Utilities
  
- **Phase 5**: User testing
  - Purchase workflows
  - Year-end count workflows
  - Inventory management
  - Master data management

### Deliverables
- Additional issue documents (10-15 more)
- Updated analysis report
- More follow-up change proposals

---

## Implementation Order

### Immediate (This Week)
1. **fix-critical-validation-bugs** - Fixes broken functionality
2. **fix-currency-selector** - Fixes misleading UI

### Short Term (Next 1-2 Weeks)
3. **standardize-currency-inputs** - Completes currency support
4. **improve-validation-patterns** - Prevents future issues
5. **standardize-error-handling** - Improves UX consistency

### Long Term (Next Month)
6. **continue-inconsistency-analysis** - Finds remaining issues
7. Additional changes based on Phase 2-5 findings

---

## Quick Wins (If Time Constrained)

If you can only fix a few things, do these in order:

1. **VAL-001** (5 minutes, CRITICAL)
   ```diff
   - body('countedQuantity').isInt({ min: 0 })
   + body('countedQuantity').isFloat({ min: 0 })
   ```

2. **VAL-004** (10 minutes, MEDIUM impact)
   - Add year range validation to 5 endpoints

3. **VAL-002** (15 minutes, LOW but easy)
   - Standardize validation error messages

4. **CURR-001** (1-2 hours, HIGH impact)
   - Make i18n currency reactive
   - Requires careful testing

**Total Quick Win Time**: 2-3 hours for 4 fixes

---

## Success Metrics

### For fix-critical-validation-bugs
- ✅ Year-end count accepts 0.68, 7.6, 31.25
- ✅ Year endpoints reject year -500 and 999999
- ✅ All validation errors use consistent format

### For fix-currency-selector
- ✅ Currency selector changes between USD and SEK
- ✅ All currency displays update immediately
- ✅ Swedish browser defaults to SEK
- ✅ Currency choice persists across sessions

### For standardize-currency-inputs
- ✅ All monetary inputs show currency symbol
- ✅ SEK displays consistently across all forms
- ✅ Decimal precision limited to 2 places

### For improve-validation-patterns
- ✅ Validation test suite passes
- ✅ No hardcoded validation in routes (uses helpers)
- ✅ All text fields have length limits
- ✅ Quantities reject >2 decimal precision

### For standardize-error-handling
- ✅ All toasts use TOAST_DURATIONS constants
- ✅ No hardcoded 3000/5000 in code
- ✅ All API errors show user feedback
- ✅ Error handling uses useApiError composable

---

## Maintenance

### After Implementation
1. Update documentation with new standards
2. Add linting rules to enforce patterns
3. Update onboarding guide for developers
4. Create validation/currency quick reference
5. Set up pre-commit hooks for consistency checks

### Ongoing
- Review PRs for consistency compliance
- Update standards as patterns evolve
- Regular consistency audits (quarterly?)
- Keep analysis documentation updated
