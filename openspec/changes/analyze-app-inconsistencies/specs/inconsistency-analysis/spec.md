# Capability: Application Inconsistency Analysis

## Overview

Systematically analyze the inventory tracking application to identify, document, and prioritize inconsistencies across currency handling, validation patterns, error handling, user experience workflows, and code architecture.

## ADDED Requirements

### Requirement: The analysis SHALL comprehensively document currency and number formatting inconsistencies

The analysis SHALL identify all inconsistencies in how currency values and numbers are formatted, validated, and displayed throughout the application.

#### Scenario: Identifying currency format inconsistencies

**Given** the application uses both USD and SEK currencies
**When** analyzing all currency formatting code
**Then** the analysis must document:
- All `formatCurrency()` usage locations
- i18n number format configurations for each locale
- Currency symbol placement variations (prefix vs suffix)
- Decimal precision rules per currency
- InputNumber component currency mode settings

**And** inconsistencies must be documented with:
- File path and line number
- Current behavior
- Recommended standard approach
- Severity level (critical/high/medium/low)

#### Scenario: Identifying decimal number handling inconsistencies

**Given** the application handles decimal quantities (0.68 liters, 7.6 m², etc.)
**When** analyzing number validation and parsing
**Then** the analysis must document:
- Backend validators using `isInt` where `isFloat` is needed
- Frontend InputNumber components missing `minFractionDigits`/`maxFractionDigits`
- Inconsistent use of `parseInt` vs `parseFloat`
- Missing radix parameters on `parseInt` calls
- Decimal precision mismatches between frontend and backend

### Requirement: The analysis SHALL document validation pattern inconsistencies across frontend and backend

The analysis SHALL identify inconsistencies in data validation rules between frontend forms, backend API validators, and database constraints.

#### Scenario: Finding backend validation inconsistencies

**Given** the application validates user input on the backend
**When** analyzing all express-validator usage in routes
**Then** the analysis must document:
- Routes using `isInt` for fields that accept decimals
- Inconsistent min/max value constraints
- Missing required field validations
- Duplicate validation logic across routes

**And** must compare with:
- Database schema constraints (Prisma schema)
- TypeScript type definitions
- Frontend validation rules

#### Scenario: Finding frontend validation gaps

**Given** the application validates forms on the frontend
**When** analyzing all form components
**Then** the analysis must document:
- Forms lacking client-side validation
- Inconsistent validation error messages
- Missing validation for edge cases (empty, null, negative)
- Computed validation patterns that differ across components

### Requirement: The analysis SHALL identify error handling and notification pattern inconsistencies

The analysis SHALL identify inconsistencies in how errors are presented to users through toast notifications and error messages.

#### Scenario: Standardizing toast notification durations

**Given** the application uses PrimeVue toast notifications
**When** analyzing all `toast.add()` calls
**Then** the analysis must document:
- All unique `life` duration values used (3000, 5000, 2000, etc.)
- Context of each duration (success, error, warning, info)
- Inconsistent durations for similar operations

**And** must recommend:
- Standard duration per severity level
- Exceptions requiring longer/shorter durations

#### Scenario: Unifying error message extraction

**Given** the application catches API errors and displays them
**When** analyzing error handling in catch blocks
**Then** the analysis must document:
- Variations in error property access (`error.response?.data?.error` vs `.message`)
- Inconsistent fallback messages
- Missing error handling in API calls
- Different console.error usage patterns

### Requirement: The analysis SHALL document user experience workflow inconsistencies

The analysis SHALL identify inconsistencies in user workflows that cause confusion or unexpected behavior.

#### Scenario: Standardizing dialog behaviors

**Given** the application uses multiple dialogs and modals
**When** analyzing all Dialog component usage
**Then** the analysis must document:
- Inconsistent Escape key handling
- Different backdrop click behaviors
- Various dialog close timing (before vs after data refresh)
- Missing loading states during async operations

**And** must test:
- Purchase entry dialogs
- Year-end count modals
- Product/supplier quick-add dialogs
- Confirmation dialogs

#### Scenario: Improving form submission workflows

**Given** users submit forms throughout the application
**When** analyzing form submission handlers
**Then** the analysis must document:
- Inconsistent data refresh patterns (before vs after close)
- Missing success confirmations
- Variable loading indicator implementations
- Different form reset patterns

### Requirement: The analysis SHALL identify code architecture and pattern inconsistencies

The analysis SHALL identify inconsistencies in code organization, component patterns, and architectural approaches.

#### Scenario: Finding component pattern inconsistencies

**Given** the application uses Vue 3 Composition API
**When** analyzing component structure
**Then** the analysis must document:
- Different approaches to similar problems
- Duplicate logic that could be extracted to composables
- Inconsistent prop/emit patterns
- Variable component organization (template-first vs script-first)

#### Scenario: Identifying state management patterns

**Given** the application uses Pinia for state management
**When** analyzing store usage
**Then** the analysis must document:
- Inconsistent state initialization
- Duplicate data in multiple stores
- Missing computed properties
- Direct state mutation vs actions

### Requirement: The analysis deliverables SHALL be actionable and well-prioritized

The analysis output SHALL enable immediate action on fixing inconsistencies through clear documentation and prioritization.

#### Scenario: Creating comprehensive issue catalog

**Given** the analysis identifies multiple inconsistencies
**When** documenting each issue
**Then** each issue must include:
- Unique ID (CATEGORY-NUMBER format)
- Severity level (critical/high/medium/low)
- Impact description (user/developer/data)
- Current state with code references
- Recommended standard approach
- List of all affected files with line numbers
- Estimated effort to fix (small/medium/large)

#### Scenario: Prioritizing issues by impact

**Given** the analysis produces a list of issues
**When** creating the analysis report
**Then** the report must include:
- Executive summary with key findings
- Statistics (total issues by category and severity)
- Prioritized issue list (critical → low)
- Quick wins (high impact, low effort)
- Architectural recommendations
- Suggested follow-up changes

#### Scenario: Providing actionable recommendations

**Given** the analysis identifies patterns to standardize
**When** writing recommendations
**Then** recommendations must specify:
- Proposed standard for each category
- Migration strategy from current to standard
- Code examples showing before/after
- Tooling suggestions (linters, formatters, validators)
- Process improvements to prevent future inconsistencies

## Acceptance Criteria

- [ ] Analysis covers all 5 main categories (currency, validation, error handling, UX, architecture)
- [ ] At least 80% of codebase reviewed (measured by file count)
- [ ] Each inconsistency has 3+ specific code examples
- [ ] All critical and high-severity issues identified
- [ ] Recommendations are specific and include code examples
- [ ] Follow-up changes are well-scoped and estimable
- [ ] Documentation is clear enough for any developer to understand
