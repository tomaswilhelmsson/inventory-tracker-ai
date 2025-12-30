# Tasks: Application Inconsistency Analysis

## Phase 1: Automated Pattern Analysis (Day 1)

- [ ] **CURR-001**: Analyze currency formatting patterns
  - Run search for all `formatCurrency` usage
  - Document USD vs SEK configurations
  - Identify i18n number format inconsistencies
  - Check InputNumber currency mode settings
  - **Output**: `issues/currency-formatting.md`

- [ ] **VAL-001**: Analyze backend validation patterns
  - Search all route validators (`isInt`, `isFloat`, `isBoolean`)
  - Document inconsistent decimal handling
  - Find missing validations
  - Compare min/max value constraints
  - **Output**: `issues/backend-validation.md`

- [ ] **VAL-002**: Analyze frontend validation patterns
  - Review form validation logic across all views
  - Document computed validation patterns
  - Find missing client-side validations
  - **Output**: `issues/frontend-validation.md`

- [ ] **ERR-001**: Analyze toast notification patterns
  - Search for all `toast.add` calls
  - Document duration variations (`life:` values)
  - Identify severity usage patterns
  - Check for missing toasts on errors
  - **Output**: `issues/toast-notifications.md`

- [ ] **ERR-002**: Analyze error message patterns
  - Search error property access patterns
  - Document `error.response?.data?.error` vs `.message`
  - Find inconsistent error handling
  - Check console.error usage
  - **Output**: `issues/error-handling.md`

## Phase 2: Manual Code Review (Days 2-3)

- [ ] **NUM-001**: Review number parsing patterns
  - Search all `parseInt` and `parseFloat` usage
  - Document radix parameter usage
  - Find potential NaN handling issues
  - Check decimal precision handling
  - **Output**: `issues/number-parsing.md`

- [ ] **DATE-001**: Review date handling patterns
  - Search date formatting approaches
  - Document timezone handling
  - Find inconsistent date inputs
  - Check date validation patterns
  - **Output**: `issues/date-handling.md`

- [ ] **I18N-001**: Analyze internationalization consistency
  - Compare en.json vs sv.json key structures
  - Find missing translations
  - Document inconsistent key naming
  - Check for hardcoded strings
  - **Output**: `issues/i18n-consistency.md`

- [ ] **UX-001**: Review dialog and modal behaviors
  - Document close button behaviors
  - Check Escape key handling
  - Review backdrop click behaviors
  - Find inconsistent modal patterns
  - **Output**: `issues/dialog-patterns.md`

- [ ] **UX-002**: Review form submission workflows
  - Document data refresh patterns
  - Check loading state implementations
  - Review success message timing
  - Find dialog close timing issues
  - **Output**: `issues/form-workflows.md`

- [ ] **UX-003**: Review navigation patterns
  - Document router usage patterns
  - Check breadcrumb implementations
  - Review back button behaviors
  - Find confusing navigation flows
  - **Output**: `issues/navigation.md`

## Phase 3: Data Model Analysis (Day 3)

- [ ] **DATA-001**: Review database schema consistency
  - Compare Prisma schema to TypeScript types
  - Document field type mismatches
  - Check constraint consistency
  - Review index coverage
  - **Output**: `issues/schema-consistency.md`

- [ ] **DATA-002**: Analyze snapshot data patterns
  - Review product/supplier snapshot usage
  - Document snapshot refresh patterns
  - Find inconsistent snapshot fields
  - Check snapshot validation
  - **Output**: `issues/snapshot-patterns.md`

- [ ] **DATA-003**: Review audit trail patterns
  - Document timestamp field usage
  - Check createdAt/updatedAt consistency
  - Review soft delete patterns (isActive)
  - Find missing audit fields
  - **Output**: `issues/audit-trails.md`

## Phase 4: Architecture Review (Day 4)

- [ ] **ARCH-001**: Review component patterns
  - Document composable usage patterns
  - Check component composition approaches
  - Find duplicate component logic
  - Review prop/emit patterns
  - **Output**: `issues/component-architecture.md`

- [ ] **ARCH-002**: Review state management
  - Document Pinia store patterns
  - Check computed property usage
  - Review reactivity patterns
  - Find state duplication
  - **Output**: `issues/state-management.md`

- [ ] **ARCH-003**: Review service layer patterns
  - Document API service organization
  - Check business logic location
  - Review error propagation
  - Find service duplication
  - **Output**: `issues/service-layer.md`

- [ ] **ARCH-004**: Review utility patterns
  - Document utility function locations
  - Check for function duplication
  - Review naming conventions
  - Find missing abstractions
  - **Output**: `issues/utilities.md`

## Phase 5: User Testing & Workflow Analysis (Day 5)

- [ ] **UXT-001**: Test purchase workflows
  - Single purchase entry
  - Multi-item purchase entry
  - Purchase editing
  - Purchase deletion
  - **Output**: `issues/purchase-workflow.md`

- [ ] **UXT-002**: Test year-end count workflows
  - Count initiation
  - Count entry (keyboard navigation)
  - CSV import/export
  - Count confirmation
  - Count unlock
  - **Output**: `issues/yearend-workflow.md`

- [ ] **UXT-003**: Test inventory management workflows
  - Inventory viewing
  - FIFO lot viewing
  - Filtering and searching
  - Report generation
  - **Output**: `issues/inventory-workflow.md`

- [ ] **UXT-004**: Test product/supplier management
  - Adding new products/suppliers
  - Editing existing records
  - Deactivation workflows
  - Quick-add from dialogs
  - **Output**: `issues/master-data-workflow.md`

## Phase 6: Documentation & Recommendations (Day 6)

- [ ] **DOC-001**: Create analysis summary
  - Count total issues by category
  - Create severity distribution chart
  - Highlight critical issues
  - **Output**: `analysis-report.md`

- [ ] **DOC-002**: Prioritize issues
  - Apply severity criteria
  - Consider implementation effort
  - Group related issues
  - Create prioritized backlog
  - **Output**: Updated `analysis-report.md`

- [ ] **DOC-003**: Write recommendations
  - Propose standards for each category
  - Suggest tooling improvements
  - Document migration strategies
  - Propose process changes
  - **Output**: `recommendations.md`

- [ ] **DOC-004**: Create follow-up change proposals
  - Identify logical groupings
  - Draft change-id names
  - Estimate effort per change
  - **Output**: `follow-up-changes.md`

## Validation Checklist

- [ ] All 5 main categories analyzed
- [ ] At least 3 code examples per issue
- [ ] Every issue has severity assigned
- [ ] Recommendations are specific and actionable
- [ ] Follow-up changes are well-scoped
- [ ] Documentation reviewed for clarity

## Deliverables

1. `issues/` directory with 15+ issue documents
2. `analysis-report.md` with executive summary
3. `recommendations.md` with standards and guidelines
4. `follow-up-changes.md` with next steps
