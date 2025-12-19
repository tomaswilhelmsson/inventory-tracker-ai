# Proposal: Add Internationalization (i18n)

## Change ID
`add-internationalization`

## Status
Draft

## Author
System

## Date
2025-12-19

## Problem Statement

The inventory tracking system currently has all user-facing text hardcoded in English throughout the frontend application. This creates several limitations:

1. **Language barrier**: Non-English speaking users cannot effectively use the system
2. **Market limitation**: Cannot deploy to Swedish-speaking markets or other locales
3. **Poor user experience**: Users must work in a language that may not be their preference
4. **No locale awareness**: Numbers, dates, and currency formats are not localized
5. **Maintenance burden**: Text changes require code modifications across multiple files

## Proposed Solution

Add comprehensive internationalization (i18n) support to the frontend application with:
- **Two initial languages**: English (en) and Swedish (sv)
- **Automatic locale detection**: Default to browser language preference
- **User preference**: Persistent language selection stored in localStorage
- **Complete coverage**: All UI text, labels, messages, and validation errors
- **Locale formatting**: Numbers, dates, and currency display according to selected locale
- **Vue I18n integration**: Industry-standard i18n library for Vue 3

## User Stories

1. As a Swedish user, I want the application to automatically display in Swedish when I first visit so I can understand the interface immediately
2. As a multilingual user, I want to switch between English and Swedish at any time so I can choose my preferred language
3. As a user, I want my language preference to persist across sessions so I don't have to reselect it every time
4. As an English user in Sweden, I want to override automatic Swedish detection and use English permanently
5. As a user, I want dates and numbers formatted according to my selected language's conventions for clarity

## Scope

### In Scope
- Install and configure Vue I18n for Vue 3
- Create translation files for English (en.json) and Swedish (sv.json)
- Translate all user-facing text in:
  - Navigation menu
  - All view components (Dashboard, Suppliers, Products, Units, Purchases, Inventory, Year-End Count, Reports, Login)
  - Form labels and placeholders
  - Button labels
  - Error messages and validation messages
  - Toast notifications
  - Confirmation dialogs
  - Table headers and empty states
- Add language selector component in navigation header
- Detect browser language on first visit
- Store language preference in localStorage
- Format numbers using locale conventions
- Format dates using locale conventions
- Currency formatting (USD with locale-appropriate separators)

### Out of Scope
- Backend API internationalization (error messages remain in English)
- Database content translation (product names, supplier names remain as entered)
- Right-to-left (RTL) language support
- Language-specific routing (no /en/ or /sv/ URL prefixes)
- Translation management UI (translations managed via JSON files)
- Pluralization rules beyond basic forms
- Additional languages beyond English and Swedish in this iteration
- Time zone handling (separate from locale formatting)
- Locale-specific business logic or validation rules

## Dependencies

- Vue I18n (vue-i18n) - Official i18n library for Vue 3
- Existing Vue 3 + Composition API architecture
- PrimeVue UI components (may need locale configuration)
- Browser localStorage API for preference persistence

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Incomplete translation coverage causes mixed languages | High | Create comprehensive audit checklist, use vue-i18n's missing key warnings in dev mode |
| Performance impact from loading translations | Low | Translations are small JSON files (~5-10KB each), loaded once at startup |
| PrimeVue components use English labels | Medium | Configure PrimeVue locale or override component labels via i18n |
| Date/number formatting inconsistencies | Medium | Use i18n's built-in formatters consistently, test with both locales |
| Users accidentally select wrong language | Low | Make language selector prominent and easy to change |
| Translation quality for Swedish | Medium | Use professional translation or native speaker review for production |

## Success Criteria

1. Application defaults to Swedish for Swedish browser locale, English otherwise
2. Users can switch languages via UI selector
3. Language preference persists across browser sessions
4. All visible UI text is translated (no hardcoded English strings remain)
5. Numbers display with locale-appropriate separators (1,000.00 vs 1 000,00)
6. Dates display in locale format (MM/DD/YYYY vs YYYY-MM-DD)
7. No performance degradation or noticeable load time increase
8. All existing functionality works identically in both languages
9. Missing translation keys are logged in development mode

## Technical Approach

### Vue I18n Setup
- Install `vue-i18n@9.x` (compatible with Vue 3)
- Create `frontend/src/i18n/index.ts` for i18n configuration
- Create `frontend/src/i18n/locales/en.json` for English translations
- Create `frontend/src/i18n/locales/sv.json` for Swedish translations
- Initialize i18n plugin in `main.ts`

### Translation Structure
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "suppliers": "Suppliers",
    "products": "Products",
    ...
  },
  "common": {
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel",
    ...
  },
  "suppliers": {
    "title": "Supplier Management",
    "addSupplier": "Add Supplier",
    ...
  }
}
```

### Locale Detection Logic
1. Check localStorage for saved preference
2. If no preference, detect browser language (`navigator.language`)
3. Match against supported locales (en, sv)
4. Default to English if no match
5. Save selection to localStorage on any manual change

### Component Updates
- Replace hardcoded strings with `$t('key.path')` calls
- Use `v-t="'key.path'"` directive for simple text nodes
- Format numbers with `$n(value)` or `$n(value, 'currency')`
- Format dates with `$d(date)` or `$d(date, 'short')`

### Language Selector Component
- Dropdown in app header next to logout
- Show current language (flag icon optional)
- List available languages
- Update i18n locale and localStorage on selection

## Open Questions

1. Should we include language flags/icons in the selector?
   - **Recommendation**: Use text labels only (clearer for accessibility)

2. What date format should Swedish use?
   - **Recommendation**: ISO 8601 (YYYY-MM-DD) for Swedish, MM/DD/YYYY for English

3. Should we translate validation error messages from backend?
   - **Recommendation**: No, keep backend English for this iteration

4. Should we provide translation context/comments for translators?
   - **Recommendation**: Yes, add comments in JSON for ambiguous keys

5. How should we handle units of measure (pieces, kg, etc.)?
   - **Recommendation**: Translate unit names in UI, but store original in DB

## Implementation Notes

- Use composition API's `useI18n()` for accessing i18n in components
- Leverage vue-i18n's TypeScript support for type-safe translation keys
- Use locale-specific number/date formats defined in i18n config
- Test with browser language set to Swedish to verify auto-detection
- Create helper utilities for common formatting tasks
- Consider lazy-loading locale files if bundle size becomes an issue (likely not needed for 2 languages)

## Estimated Effort

- Phase 1 (Setup & Infrastructure): 2-3 hours
- Phase 2 (Translation Files): 4-6 hours
- Phase 3 (Component Updates): 8-12 hours
- Phase 4 (Testing & Refinement): 3-4 hours
- **Total**: 17-25 hours
