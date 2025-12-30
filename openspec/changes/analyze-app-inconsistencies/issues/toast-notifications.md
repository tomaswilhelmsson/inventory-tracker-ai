# Toast Notification Inconsistencies

## Summary
Toast notifications use inconsistent durations (3000ms vs 5000ms vs 2000ms) without clear patterns based on severity or importance.

---

## ERR-001: Inconsistent toast notification durations

**Severity**: Low  
**Impact**: User experience inconsistency - sometimes messages disappear too fast/slow  
**Effort**: Trivial

**Current State:**
Distribution of toast durations across the application:
- **3000ms (3 seconds)**: 74 instances (70%)
- **5000ms (5 seconds)**: 31 instances (29%)
- **2000ms (2 seconds)**: 1 instance (1%)

**Inconsistency:**
No clear pattern for when to use 3000ms vs 5000ms:

**Examples of 3000ms usage:**
- Success: "Purchase created successfully" ✅
- Error: "Failed to load purchases" ❌ (should be longer?)
- Warning: "All products must be from the same supplier" ❌ (important warning - too short?)

**Examples of 5000ms usage:**
- Warning: "Cannot delete supplier with existing purchases" ✅ (important)
- Warning: "Cannot delete unit with products using it" ✅ (important)
- Error: "Failed to create batch purchase" (varies - sometimes 3000ms, sometimes 5000ms)

**Affected Files:**
- 74 instances across all views and components

**Recommended Standard:**
Standardize durations by severity and importance:

```typescript
const TOAST_DURATIONS = {
  SUCCESS: 3000,      // Quick confirmation
  ERROR: 4000,        // Slightly longer to read error details
  WARNING: 5000,      // Important warnings need more time
  INFO: 3000,         // General information
  CRITICAL_ERROR: 6000, // Critical failures need maximum visibility
};

// Usage:
toast.add({
  severity: 'error',
  summary: t('common.error'),
  detail: error.message,
  life: TOAST_DURATIONS.ERROR,
});
```

**Severity-based recommendations:**
- Success: 3000ms (users don't need to dwell on success)
- Info: 3000ms (informational only)
- Warning: 5000ms (users should read and understand)
- Error: 4000-5000ms (depends on complexity of error message)
- Critical errors: 6000ms+ or require manual dismiss

---

## ERR-002: Missing toast notifications on some errors

**Severity**: Medium  
**Impact**: Silent failures - users don't know operation failed  
**Effort**: Small

**Current State:**
Some API calls lack error handling toasts in catch blocks.

**Examples found:**
```typescript
// Some views have comprehensive error handling
catch (error: any) {
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error.response?.data?.error || t('fallback.message'),
    life: 3000,
  });
}

// Others might be missing (needs thorough review)
```

**Recommendation:**
Audit all API calls and ensure every catch block shows user feedback.

---

## Summary Statistics

**Total Toast Notifications**: 106  
**Duration Distribution**:
- 3000ms: 74 (70%)
- 5000ms: 31 (29%)
- 2000ms: 1 (1%)

**Severity Distribution**:
- Error: 57 (54%)
- Success: 33 (31%)
- Warning: 16 (15%)
- Info: 0 (0%)

**Total Estimated Effort**: 2-4 hours to standardize all durations

## Architectural Recommendations

1. **Create toast constants** - Centralize duration values
2. **Create toast helper** - Wrapper function for consistent usage
3. **Add info severity** - Use for non-critical notifications
4. **Document when to use each severity** - Clear guidelines
5. **Consider toast queueing** - Prevent toast spam on multiple errors
