# Design: Application Inconsistency Analysis

## Analysis Methodology

### 1. Automated Code Analysis
Use `ripgrep` and `jq` to identify patterns:
- Currency symbols and formatting calls
- Validation decorators (`isInt`, `isFloat`, `isBoolean`)
- Toast notification durations (`life:`)
- Error message patterns (`error.response?.data`)
- Number parsing (`parseInt`, `parseFloat`)
- Date formatting patterns

### 2. Manual Code Review
Review key files for:
- Component architecture patterns
- State management approaches
- Error boundary implementations
- User flow consistency

### 3. User Experience Walkthrough
Test all workflows to identify:
- Inconsistent error messages
- Confusing navigation
- Missing validations
- Unexpected behaviors

### 4. Database Schema Analysis
Compare:
- Schema definitions vs API types
- Validation rules vs database constraints
- Audit fields vs actual usage

## Analysis Categories

### Category 1: Currency and Number Formatting

**What to analyze:**
- All instances of `formatCurrency()` usage
- `useCurrency` composable configuration
- i18n number format definitions
- Currency selector component
- InputNumber component configurations
- Backend number validation rules

**Expected outcomes:**
- Identify USD vs SEK inconsistencies
- Document decimal precision rules
- Find locale mismatches
- Verify currency symbol placement

### Category 2: Validation Patterns

**What to analyze:**
- Backend route validators (express-validator)
- Frontend form validation (computed validations)
- Data type definitions (TypeScript interfaces)
- Database schema constraints
- API request/response contracts

**Expected outcomes:**
- List all `isInt` that should be `isFloat`
- Document min/max value inconsistencies
- Identify missing validations
- Find validation rule duplications

### Category 3: Error Handling

**What to analyze:**
- Toast notification configurations
- Error message extraction patterns
- Error boundary implementations
- API error response formats
- Console error logging

**Expected outcomes:**
- Standardize toast durations (3000 vs 5000 vs 2000)
- Unify error property access (`.error` vs `.message`)
- Document severity levels (error/warn/info/success)
- Identify missing error handling

### Category 4: User Experience Workflows

**What to analyze:**
- Dialog close behaviors
- Form reset patterns
- Navigation flows
- Loading states
- Success confirmations
- Data refresh patterns

**Expected outcomes:**
- Document inconsistent modal behaviors
- Identify confusing workflows
- Find missing loading indicators
- List unexpected navigation

### Category 5: Code Architecture

**What to analyze:**
- Component composition patterns
- State management usage (Pinia stores)
- Service layer organization
- Route handler structure
- Utility function locations

**Expected outcomes:**
- Document different approaches to same problems
- Identify code duplication
- Find missing abstractions
- Suggest architectural improvements

## Documentation Format

Each inconsistency will be documented as:

```markdown
### [CATEGORY]-[NUMBER]: [Brief Description]

**Severity**: Critical | High | Medium | Low
**Impact**: [Description of user/developer impact]

**Current State:**
- File: `path/to/file.ts:123`
- Pattern: [Code example or description]

**Inconsistency:**
[What differs from the standard or best practice]

**Recommended Standard:**
[What the consistent approach should be]

**Affected Files:**
- `file1.ts:line`
- `file2.vue:line`
- ...

**Related Issues:**
[Links to other related inconsistencies]
```

## Prioritization Criteria

**Critical (P0)**: Data integrity or security issues
- Example: Validation allowing invalid data into database
- Example: Currency calculations producing wrong results

**High (P1)**: Major UX problems or common workflows
- Example: Confusing error messages on main workflows
- Example: Inconsistent behavior in year-end count process

**Medium (P2)**: Minor UX issues or less common workflows
- Example: Inconsistent toast durations
- Example: Different modal close behaviors

**Low (P3)**: Code style or minor improvements
- Example: Different error property access patterns
- Example: Inconsistent variable naming

## Deliverables

1. **Analysis Report** (`analysis-report.md`)
   - Executive summary
   - Statistics (total issues by category/severity)
   - Prioritized issue list
   - Architectural recommendations

2. **Issue Catalog** (`issues/`)
   - Separate file per category
   - Detailed issue descriptions
   - Code references
   - Screenshots where applicable

3. **Recommendations** (`recommendations.md`)
   - Proposed standards for each category
   - Migration strategies
   - Tooling suggestions
   - Process improvements

## Tools and Scripts

### Analysis Scripts

```bash
# Find currency usage
rg -n "formatCurrency|currency|USD|SEK" --type ts --type vue

# Find validation patterns
rg -n "isInt|isFloat|isBoolean" --type ts

# Find toast durations
rg -n "life:\s*\d+" --type vue

# Find error patterns
rg -n "error\.response\?\.data" --type vue --type ts

# Check i18n key consistency
diff <(jq -r 'keys | .[]' en.json) <(jq -r 'keys | .[]' sv.json)
```

### Reporting Template

```typescript
interface Inconsistency {
  id: string;
  category: 'currency' | 'validation' | 'error' | 'ux' | 'architecture';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentState: CodeReference[];
  recommendation: string;
  affectedFiles: string[];
  impact: string;
  estimatedEffort: 'small' | 'medium' | 'large';
}

interface CodeReference {
  file: string;
  line: number;
  code: string;
}
```

## Success Metrics

- ✅ All 5 categories analyzed
- ✅ At least 80% of codebase reviewed
- ✅ All critical issues identified
- ✅ Recommendations actionable and specific
- ✅ Follow-up changes clearly scoped
