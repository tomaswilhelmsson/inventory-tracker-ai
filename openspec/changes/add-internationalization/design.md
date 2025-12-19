# Design: Internationalization (i18n)

## Context

The inventory tracking system is a Vue 3 application using PrimeVue components, Pinia for state management, and TypeScript. All user-facing text is currently hardcoded in English. This design covers the addition of internationalization support for Swedish and English languages with automatic locale detection and user preference persistence.

## Goals / Non-Goals

### Goals
- Enable Swedish and English language support across all UI components
- Automatically detect and apply browser language preference on first visit
- Allow users to manually select and persist language preference
- Format numbers, dates, and currency according to selected locale
- Provide a maintainable translation structure for future language additions
- Maintain current performance characteristics (no noticeable slowdown)

### Non-Goals
- Backend API message translation (remains English)
- Database content translation (user-entered data)
- Additional languages beyond English and Swedish
- Dynamic locale switching for third-party libraries (e.g., charts, if any)
- Translation management UI or CMS integration
- Server-side rendering (SSR) considerations

## Decisions

### Decision 1: Vue I18n Library Selection
**Choice**: Use `vue-i18n@9.x` (official i18n solution for Vue 3)

**Rationale**:
- Official Vue.js ecosystem library with excellent Vue 3 + Composition API support
- Industry standard with proven track record (~7M weekly downloads)
- Built-in support for locale formatting (numbers, dates, currency)
- TypeScript support for type-safe translation keys
- Tree-shakeable for optimal bundle size
- Active maintenance and community support

**Alternatives considered**:
- **i18next**: More generic, heavier, requires additional adapters for Vue
- **Custom solution**: Reinventing the wheel, lacks formatting utilities
- **Inline translation objects**: Not maintainable at scale, no tooling support

### Decision 2: Translation File Format
**Choice**: JSON files with nested key structure

**Structure**:
```
frontend/src/i18n/
├── index.ts              # i18n configuration and setup
├── locales/
│   ├── en.json           # English translations
│   └── sv.json           # Swedish translations
```

**Key organization**:
```json
{
  "common": { ... },      // Shared UI elements
  "nav": { ... },         // Navigation menu
  "dashboard": { ... },   // Dashboard view
  "suppliers": { ... },   // Suppliers view
  // ... one object per major view/feature
}
```

**Rationale**:
- JSON is human-readable and widely supported by translation tools
- Nested structure provides context and prevents key collisions
- Separation by feature/view makes maintenance easier
- Simple git diff tracking for translation changes

**Alternatives considered**:
- **YAML**: More readable but requires parser, less universal
- **TypeScript objects**: Type-safe but harder for non-developers to translate
- **Flat keys** (e.g., `suppliers_addButton`): Less maintainable, harder to understand context

### Decision 3: Locale Detection Strategy
**Choice**: localStorage → browser language → fallback to English

**Implementation flow**:
1. Check `localStorage.getItem('user-locale')`
2. If not found, check `navigator.language` or `navigator.languages[0]`
3. Extract language code (e.g., `sv-SE` → `sv`)
4. If language code in `['en', 'sv']`, use it
5. Otherwise, default to `'en'`
6. Save to `localStorage.setItem('user-locale', selectedLocale)`

**Rationale**:
- Respects user's explicit preference (localStorage) as highest priority
- Provides good default experience using browser language
- Graceful fallback ensures app always has a working language
- Simple, client-side only (no server dependency)

**Alternatives considered**:
- **Server-side detection**: Unnecessary complexity for SPA
- **IP-based geolocation**: Privacy concerns, unreliable
- **Always default to English**: Poor UX for Swedish users

### Decision 4: PrimeVue Locale Configuration
**Choice**: Import and apply PrimeVue locale files dynamically based on selected language

**Implementation**:
```typescript
import { usePrimeVue } from 'primevue/config';
import primeEn from 'primevue/locale/en.json';
import primeSv from 'primevue/locale/sv.json';

const primeLocales = { en: primeEn, sv: primeSv };

// On locale change:
const primevue = usePrimeVue();
primevue.config.locale = primeLocales[newLocale];
```

**Rationale**:
- PrimeVue components have built-in text (e.g., "No records found", calendar month names)
- Using PrimeVue's locale system ensures consistent translation
- Dynamic switching allows runtime language changes

**Alternatives considered**:
- **Override all PrimeVue text via i18n**: Duplicates effort, fragile to PrimeVue updates
- **Ignore PrimeVue text**: Creates mixed-language UI (unacceptable UX)

### Decision 5: Number and Date Formatting
**Choice**: Use vue-i18n's built-in `$n()` and `$d()` formatters with locale-specific configs

**Configuration**:
```typescript
const numberFormats = {
  en: {
    currency: { style: 'currency', currency: 'USD' },
    decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  },
  sv: {
    currency: { style: 'currency', currency: 'USD' }, // Still USD but Swedish formatting
    decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  }
};

const datetimeFormats = {
  en: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' }, // MM/DD/YYYY
    long: { year: 'numeric', month: 'long', day: 'numeric' }
  },
  sv: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' }, // YYYY-MM-DD
    long: { year: 'numeric', month: 'long', day: 'numeric' }
  }
};
```

**Rationale**:
- Consistent formatting across entire application
- Leverages browser's `Intl.NumberFormat` and `Intl.DateTimeFormat`
- Automatically handles locale-specific separators and conventions
- Easy to add more format variants (long, short, etc.)

**Alternatives considered**:
- **Custom formatting functions**: Reinvents wheel, error-prone
- **Third-party library** (e.g., date-fns): Extra dependency, integration overhead

### Decision 6: Language Selector UI Placement
**Choice**: Dropdown in app header/navigation bar, next to user info or logout button

**Design**:
- Small dropdown showing current language code (`EN` / `SV`)
- On click, shows both language options
- Icon: Globe icon (🌐) or language code text
- Position: Top-right corner of app header

**Rationale**:
- Globally accessible from any page
- Common pattern (users expect language selector in header)
- Minimal space usage
- Clear visual indicator of current language

**Alternatives considered**:
- **User settings page**: Too hidden, requires navigation
- **Footer**: Easy to miss, not standard pattern
- **Modal on first visit**: Intrusive, annoying for repeat users

### Decision 7: Translation Key Naming Convention
**Choice**: Nested camelCase keys grouped by feature

**Pattern**: `{feature}.{component}.{element}`

**Examples**:
```json
{
  "suppliers": {
    "title": "Supplier Management",
    "form": {
      "nameLabel": "Supplier Name",
      "emailLabel": "Email Address"
    },
    "actions": {
      "addButton": "Add Supplier",
      "editButton": "Edit"
    }
  }
}
```

**Rationale**:
- Clear context from key path
- Easy autocomplete in TypeScript
- Prevents key collisions
- Matches Vue/JavaScript conventions

**Alternatives considered**:
- **Flat snake_case**: `supplier_form_name_label` - harder to navigate
- **Underscore nesting**: `supplier_form.name.label` - mixing conventions
- **All lowercase**: Harder to read, less JavaScript-idiomatic

## Risks / Trade-offs

### Risk: Incomplete Translation Coverage
**Impact**: Users see mixed languages (English + Swedish)
**Mitigation**: 
- Enable vue-i18n's `missingWarn` in development mode
- Create checklist audit of all views/components
- Use `rg` to search for hardcoded strings before finalization
- Add CI check to fail if missing translation keys detected

### Risk: Translation Quality for Swedish
**Impact**: Poor translations confuse Swedish users or sound unprofessional
**Mitigation**:
- Use Google Translate / DeepL for initial draft
- Flag for native Swedish speaker review before production
- Include comments in JSON for context-dependent translations
- Accept feedback channel for translation improvements

### Risk: Bundle Size Increase
**Impact**: Slower initial load time
**Mitigation**:
- Translation files are small (~5-10KB per language)
- vue-i18n is tree-shakeable (~20KB gzipped)
- Load only selected locale (don't bundle all locales)
- Monitor bundle size with webpack-bundle-analyzer

### Trade-off: Maintenance Overhead
**Impact**: New features require translation in both languages
**Mitigation**:
- Document i18n requirement in contribution guidelines
- Add translation to definition of done for new features
- Keep translation structure organized and documented
- Consider translation management tool if team grows

## Migration Plan

### Phase 1: Setup (Non-Breaking)
1. Install vue-i18n package
2. Create i18n configuration files (empty translations initially)
3. Initialize i18n plugin in main.ts
4. Add language selector component (non-functional initially)
5. **Validation**: App continues to work, no visible changes

### Phase 2: Translation Infrastructure
1. Populate English translation file with all current text
2. Add Swedish translations (can be incomplete initially)
3. Create locale detection and persistence utilities
4. Configure PrimeVue locale switching
5. **Validation**: Language selector changes displayed language

### Phase 3: Component Migration (Incremental, View by View)
1. Start with LoginView (smallest)
2. Migrate common components (buttons, dialogs)
3. Migrate each view in order: Dashboard → Suppliers → Products → Units → Purchases → Inventory → Year-End Count → Reports
4. Update form validation messages
5. Update toast notifications
6. **Validation**: Each view fully functional in both languages before moving to next

### Phase 4: Formatting & Polish
1. Apply number formatting to all numeric displays
2. Apply date formatting to all date displays
3. Fix any alignment or layout issues from longer translations
4. Final audit for missing keys
5. **Validation**: Both languages look professional and complete

### Rollback Plan
- If critical bugs discovered, temporarily disable language selector and force English
- Revert to commit before i18n changes if necessary
- Translation files are additive (don't break existing code)

## Open Questions

1. **Q**: Should we translate unit names (pieces, kg, liters)?
   **A**: Yes, translate in UI for display only. Database stores original values.

2. **Q**: How to handle dynamically generated messages (e.g., "5 products use this unit")?
   **A**: Use vue-i18n's pluralization: `$t('errors.unitInUse', { count: 5 })`

3. **Q**: Should we persist locale in user account (backend)?
   **A**: Not in v1. localStorage is sufficient. Consider for v2 if multi-device support needed.

4. **Q**: What about accessibility (screen readers)?
   **A**: HTML `lang` attribute should update with locale change. Add to implementation tasks.

5. **Q**: Should API error messages be translated?
   **A**: Not in v1. Complex to implement and English is acceptable for technical errors initially.

## Implementation Checklist Reference

See `tasks.md` for detailed implementation steps. Key milestones:
- [ ] vue-i18n installed and configured
- [ ] Translation files created (en.json, sv.json)
- [ ] Locale detection working
- [ ] Language selector functional
- [ ] All views translated
- [ ] Number/date formatting applied
- [ ] PrimeVue locale configured
- [ ] Missing key warnings resolved
- [ ] Both languages tested end-to-end
