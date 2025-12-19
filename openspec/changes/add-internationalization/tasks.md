# Tasks: Add Internationalization (i18n)

## Phase 1: Setup & Infrastructure

### 1.1 Install Dependencies
- [ ] Install `vue-i18n@9.x` package compatible with Vue 3
  - Command: `cd frontend && npm install vue-i18n@9`
  - Validation: Check package.json includes vue-i18n with correct version
  - Test: Import vue-i18n in a test file without errors

### 1.2 Create i18n Directory Structure
- [ ] Create directory structure for i18n files
  - Create `frontend/src/i18n/` directory
  - Create `frontend/src/i18n/locales/` directory
  - Validation: Verify directories exist with `ls` command

### 1.3 Create i18n Configuration File
- [ ] Create `frontend/src/i18n/index.ts`
  - Import `createI18n` from vue-i18n
  - Define number formats for en and sv
  - Define datetime formats for en and sv
  - Implement locale detection function (localStorage → browser → fallback to 'en')
  - Create and export i18n instance with initial config
  - Validation: TypeScript compiles without errors
  - Test: Import i18n in main.ts without errors

### 1.4 Implement Locale Persistence Utilities
- [ ] Create locale persistence utilities in `frontend/src/i18n/index.ts`
  - Function to save locale to localStorage (`saveLocale(locale: string)`)
  - Function to load locale from localStorage (`loadLocale(): string | null`)
  - Function to detect browser language (`detectBrowserLanguage(): string`)
  - Handle localStorage access errors gracefully
  - Validation: Unit test each utility function
  - Test: Verify error handling when localStorage disabled

### 1.5 Configure Vue I18n Plugin
- [ ] Update `frontend/src/main.ts` to register i18n plugin
  - Import i18n instance from `@/i18n`
  - Register with `app.use(i18n)`
  - Validation: App starts without errors
  - Test: Access `$t()` in a component

### 1.6 Configure HTML Lang Attribute
- [ ] Add watch for locale changes to update `<html lang="...">`
  - In i18n setup, add watcher on locale change
  - Update `document.documentElement.lang` when locale changes
  - Validation: Inspect HTML element in browser DevTools
  - Test: Switch language and verify lang attribute updates

## Phase 2: Translation Files Creation

### 2.1 Create English Translation File
- [ ] Create `frontend/src/i18n/locales/en.json`
  - Add common keys: `common`, `nav`, `actions`, `validation`
  - Add view-specific keys: `login`, `dashboard`, `suppliers`, `products`, `units`, `purchases`, `inventory`, `yearEndCount`, `reports`
  - Include all button labels, form labels, table headers, messages
  - Validation: JSON is valid (use JSON validator)
  - Test: Load translations in i18n config

### 2.2 Create Swedish Translation File
- [ ] Create `frontend/src/i18n/locales/sv.json`
  - Copy structure from en.json
  - Translate all values to Swedish
  - Ensure all keys match en.json exactly
  - Add comments where translation context is needed
  - Validation: JSON is valid and key structure matches en.json
  - Test: Load Swedish locale and verify translations display

### 2.3 Translation Content Audit
- [ ] Audit all views for hardcoded strings
  - Use `rg '"[A-Z]' frontend/src/views` to find English strings
  - List all unique strings in a spreadsheet/document
  - Map each string to a translation key
  - Validation: Checklist covers all views
  - Test: No hardcoded English strings remain (use grep)

## Phase 3: PrimeVue Locale Configuration

### 3.1 Import PrimeVue Locale Files
- [ ] Add PrimeVue locale imports to i18n config
  - Import `primeEn` from `'primevue/locale/en.json'`
  - Import `primeSv` from `'primevue/locale/sv.json'` (or Swedish equivalent)
  - Create locale map: `{ en: primeEn, sv: primeSv }`
  - Validation: Imports succeed without errors

### 3.2 Configure PrimeVue Locale Switching
- [ ] Add PrimeVue locale update on locale change
  - Use `usePrimeVue()` composable
  - Update `config.locale` when i18n locale changes
  - Validation: PrimeVue components display in selected language
  - Test: Switch locale and verify calendar, pagination, etc. update

## Phase 4: Language Selector Component

### 4.1 Create Language Selector Component
- [ ] Create `frontend/src/components/LanguageSelector.vue`
  - Use PrimeVue Dropdown component
  - Options: `[{ code: 'en', name: 'English' }, { code: 'sv', name: 'Svenska' }]`
  - Bind to current locale from `useI18n()`
  - Emit locale change event
  - Call `saveLocale()` and update i18n locale on selection
  - Validation: Component renders without errors
  - Test: Selecting language changes UI immediately

### 4.2 Add Language Selector to App Header
- [ ] Update `frontend/src/App.vue` to include language selector
  - Import LanguageSelector component
  - Add to app header/navigation bar
  - Position near user info or logout button
  - Validation: Selector visible on all authenticated pages
  - Test: Selector accessible from any view

## Phase 5: Component Translation - Common & Login

### 5.1 Translate Login View
- [ ] Update `frontend/src/views/LoginView.vue`
  - Replace "Login" title with `$t('login.title')`
  - Replace "Username" with `$t('login.username')`
  - Replace "Password" with `$t('login.password')`
  - Replace "Login" button with `$t('login.loginButton')`
  - Update toast messages with translation keys
  - Validation: Login page displays in both languages
  - Test: Login functionality works in both languages

### 5.2 Translate Navigation Menu
- [ ] Update `frontend/src/App.vue` (or navigation component)
  - Replace "Dashboard" with `$t('nav.dashboard')`
  - Replace "Suppliers" with `$t('nav.suppliers')`
  - Replace "Products" with `$t('nav.products')`
  - Replace "Units" with `$t('nav.units')`
  - Replace "Purchases" with `$t('nav.purchases')`
  - Replace "Inventory" with `$t('nav.inventory')`
  - Replace "Year End Count" with `$t('nav.yearEndCount')`
  - Replace "Reports" with `$t('nav.reports')`
  - Validation: All nav items display in selected language
  - Test: Navigate to each page and verify route still works

### 5.3 Translate Common Buttons and Actions
- [ ] Create mixin or composable for common action translations
  - Define reusable translations: Add, Edit, Delete, Save, Cancel, Search, etc.
  - Use in all views consistently
  - Validation: All buttons use translation keys
  - Test: Switch language and verify all buttons update

## Phase 6: Component Translation - Views (Part 1)

### 6.1 Translate Dashboard View
- [ ] Update `frontend/src/views/DashboardView.vue`
  - Replace page title with `$t('dashboard.title')`
  - Replace summary card titles with translation keys
  - Replace chart labels if applicable
  - Update empty state messages
  - Validation: Dashboard displays fully in both languages
  - Test: All dashboard functionality works in both languages

### 6.2 Translate Suppliers View
- [ ] Update `frontend/src/views/SuppliersView.vue`
  - Replace page title with `$t('suppliers.title')`
  - Replace "Add Supplier" button with `$t('suppliers.addButton')`
  - Replace table column headers with translation keys
  - Replace form labels with translation keys:
    - Supplier Name → `$t('suppliers.form.name')`
    - Contact Person → `$t('suppliers.form.contactPerson')`
    - Email → `$t('suppliers.form.email')`
    - Phone → `$t('suppliers.form.phone')`
    - Address → `$t('suppliers.form.address')`
    - City → `$t('suppliers.form.city')`
    - Country → `$t('suppliers.form.country')`
    - Tax ID → `$t('suppliers.form.taxId')`
    - Notes → `$t('suppliers.form.notes')`
  - Replace dialog titles (Add/Edit Supplier)
  - Replace validation error messages
  - Replace toast notifications
  - Replace confirmation dialogs
  - Validation: All supplier operations work in both languages
  - Test: Create, edit, delete supplier in Swedish

### 6.3 Translate Products View
- [ ] Update `frontend/src/views/ProductsView.vue`
  - Replace page title with `$t('products.title')`
  - Replace "Add Product" button
  - Replace table column headers
  - Replace form labels:
    - Product Name → `$t('products.form.name')`
    - Description → `$t('products.form.description')`
    - Unit → `$t('products.form.unit')`
    - Supplier → `$t('products.form.supplier')`
  - Replace dialog titles
  - Replace validation errors
  - Replace toast messages
  - Validation: Product CRUD works in both languages
  - Test: Create product with Swedish UI

## Phase 7: Component Translation - Views (Part 2)

### 7.1 Translate Units View
- [ ] Update `frontend/src/views/UnitsView.vue`
  - Replace page title with `$t('units.title')`
  - Replace "Add Unit" button
  - Replace table headers
  - Replace form label "Unit Name"
  - Translate unit names in display (pieces → stycken, liters → liter, etc.)
  - Replace validation errors
  - Replace cascade protection warning
  - Validation: Unit management works in Swedish
  - Test: Add/edit/delete units in Swedish

### 7.2 Translate Purchases View
- [ ] Update `frontend/src/views/PurchasesView.vue`
  - Replace page title with `$t('purchases.title')`
  - Replace "Add Purchase" button
  - Replace table column headers:
    - Purchase Date → `$t('purchases.table.date')`
    - Product → `$t('purchases.table.product')`
    - Supplier → `$t('purchases.table.supplier')`
    - Quantity → `$t('purchases.table.quantity')`
    - Remaining → `$t('purchases.table.remaining')`
    - Unit Cost → `$t('purchases.table.unitCost')`
    - Total Cost → `$t('purchases.table.totalCost')`
  - Replace form labels
  - Replace year filter label and options
  - Replace "LOCKED" tag text
  - Replace year lock warning message
  - Validation: Purchase tracking works in Swedish
  - Test: Create purchase with Swedish locale

### 7.3 Translate Inventory View
- [ ] Update `frontend/src/views/InventoryView.vue`
  - Replace page title with `$t('inventory.title')`
  - Replace summary card labels:
    - Total Products → `$t('inventory.summary.totalProducts')`
    - Total Value → `$t('inventory.summary.totalValue')`
    - Total Units → `$t('inventory.summary.totalUnits')`
  - Replace "Show items with zero quantity" checkbox
  - Replace table headers
  - Replace product detail modal labels
  - Validation: Inventory view displays in Swedish
  - Test: Filter and view inventory in Swedish

## Phase 8: Component Translation - Views (Part 3)

### 8.1 Translate Year-End Count View
- [ ] Update `frontend/src/views/YearEndCountView.vue`
  - Replace page title with `$t('yearEndCount.title')`
  - Replace workflow step labels:
    - Initiate Count → `$t('yearEndCount.steps.initiate')`
    - Enter Counted Quantities → `$t('yearEndCount.steps.enterCounts')`
    - Confirm Count → `$t('yearEndCount.steps.confirm')`
  - Replace table headers:
    - Expected Quantity → `$t('yearEndCount.table.expected')`
    - Counted Quantity → `$t('yearEndCount.table.counted')`
    - Variance → `$t('yearEndCount.table.variance')`
  - Replace status labels (Draft → Utkast, Confirmed → Bekräftad)
  - Replace all form labels
  - Replace confirmation warnings
  - Validation: Year-end count process works in Swedish
  - Test: Complete full year-end count in Swedish

### 8.2 Translate Reports View
- [ ] Update `frontend/src/views/ReportsView.vue`
  - Replace page title with `$t('reports.title')`
  - Replace report type labels
  - Replace filter labels
  - Replace table headers
  - Replace export button labels
  - Validation: Reports generate with Swedish labels
  - Test: Generate report in Swedish

## Phase 9: Number and Date Formatting

### 9.1 Apply Number Formatting
- [ ] Update all number displays to use `$n()` formatter
  - Find all instances of `.toLocaleString()` or hardcoded number formatting
  - Replace with `$n(value)` for integers
  - Replace with `$n(value, 'decimal')` for decimals
  - Replace with `$n(value, 'currency')` for currency
  - Validation: Numbers display with correct locale separators
  - Test: English shows 1,234.56 and Swedish shows 1 234,56

### 9.2 Apply Date Formatting
- [ ] Update all date displays to use `$d()` formatter
  - Find all instances of date formatting code
  - Replace with `$d(date, 'short')` for short dates
  - Replace with `$d(date, 'long')` for long dates
  - Validation: Dates display in locale format
  - Test: English shows MM/DD/YYYY and Swedish shows YYYY-MM-DD

## Phase 10: Validation & Error Messages

### 10.1 Translate Form Validation Errors
- [ ] Update validation error messages in all forms
  - Replace "required field" errors with `$t('validation.required')`
  - Replace "invalid email" with `$t('validation.invalidEmail')`
  - Replace "min/max" errors with translation keys
  - Validation: All validation errors display in selected language
  - Test: Trigger validation errors in Swedish

### 10.2 Translate Toast Notifications
- [ ] Update all toast notification calls
  - Replace `summary: 'Success'` with `summary: $t('common.success')`
  - Replace `detail` messages with translation keys
  - Update error toasts similarly
  - Validation: All toasts display in selected language
  - Test: Trigger success and error toasts in Swedish

### 10.3 Translate Confirmation Dialogs
- [ ] Update all confirmation dialog messages
  - Replace delete confirmation messages
  - Replace warning messages
  - Replace action confirmations
  - Validation: Dialogs display in selected language
  - Test: Delete operations show Swedish confirmations

## Phase 11: Testing & Quality Assurance

### 11.1 Translation Completeness Audit
- [ ] Verify all UI text is translated
  - Use browser extension or manual inspection
  - Check each view in Swedish locale
  - Look for any remaining English text
  - Update translation files as needed
  - Validation: No hardcoded English strings visible in Swedish mode
  - Test: Complete user journey in Swedish without seeing English

### 11.2 Missing Translation Key Detection
- [ ] Enable and check missing translation warnings
  - Set `missingWarn: true` in i18n dev config
  - Run app in Swedish mode
  - Navigate through all views
  - Check browser console for missing key warnings
  - Add any missing translations
  - Validation: No missing key warnings in console
  - Test: All keys resolve to translations

### 11.3 Cross-Browser Testing
- [ ] Test i18n functionality in multiple browsers
  - Test in Chrome (localStorage, locale detection)
  - Test in Firefox (localStorage, locale detection)
  - Test in Safari (localStorage, locale detection)
  - Validation: Language persists and displays correctly in all browsers
  - Test: Switch language and reload in each browser

### 11.4 Locale Detection Testing
- [ ] Test automatic locale detection
  - Clear localStorage
  - Set browser language to Swedish (`sv-SE`)
  - Load application
  - Verify Swedish is automatically selected
  - Repeat with English browser language
  - Validation: Correct locale detected from browser
  - Test: Manual locale selection overrides browser setting

### 11.5 Multi-Tab Synchronization
- [ ] Test locale synchronization across tabs
  - Open application in two browser tabs
  - Change language in Tab 1
  - Verify Tab 2 updates automatically (via storage event)
  - Validation: Both tabs show same language
  - Test: Change language back and forth

### 11.6 Performance Testing
- [ ] Measure performance impact of i18n
  - Measure initial page load time before and after
  - Check bundle size increase
  - Verify no noticeable delay in locale switching
  - Validation: Load time increase < 100ms
  - Test: Bundle size increase < 50KB

## Phase 12: Documentation & Deployment

### 12.1 Update Developer Documentation
- [ ] Document i18n implementation
  - Add i18n section to README or docs
  - Explain how to add new translation keys
  - Document translation file structure
  - Provide guidelines for new features
  - Validation: Documentation is clear and complete

### 12.2 Create Translation Guide
- [ ] Create guide for adding new translations
  - How to add a new key to en.json and sv.json
  - How to use `$t()`, `$n()`, `$d()` in components
  - Naming conventions for translation keys
  - How to handle pluralization if needed
  - Validation: Guide is easy to follow

### 12.3 Deployment Checklist
- [ ] Prepare for production deployment
  - Verify all translation files committed to git
  - Set i18n config for production mode (disable missingWarn)
  - Test production build with both locales
  - Verify localStorage works in production domain
  - Validation: Production build works correctly
  - Test: Deploy to staging and verify both languages

## Dependencies

- Task 1.3 depends on 1.1 (need vue-i18n installed)
- Task 1.5 depends on 1.3 (need i18n instance created)
- Phase 2 depends on Phase 1 (infrastructure must exist)
- Phase 3 depends on Phase 1 (i18n must be configured)
- Phase 4 depends on Phase 1 & 2 (need i18n and translations)
- Phases 5-8 depend on Phases 1-4 (infrastructure and selector ready)
- Phase 9 depends on Phase 1 (formatters configured)
- Phase 10 can run in parallel with Phases 5-8
- Phase 11 depends on all previous phases
- Phase 12 wraps up after Phase 11

## Parallelizable Work

- Translation file creation (2.1 and 2.2) can be done in parallel
- View component updates (Phases 6-8) can be done in parallel by different developers
- Number formatting (9.1) and date formatting (9.2) can be done in parallel
- Testing tasks in Phase 11 can be divided among team members

## Estimated Effort

- Phase 1: 2-3 hours
- Phase 2: 4-6 hours
- Phase 3: 1 hour
- Phase 4: 2 hours
- Phase 5: 2 hours
- Phase 6: 3-4 hours
- Phase 7: 3-4 hours
- Phase 8: 2-3 hours
- Phase 9: 2-3 hours
- Phase 10: 2-3 hours
- Phase 11: 3-4 hours
- Phase 12: 1-2 hours
- **Total**: 27-37 hours

## Notes

- Swedish translations should be reviewed by native speaker before production
- Consider using professional translation service for customer-facing deployment
- Unit names (pieces, kg, etc.) are translated for display but remain in original form in database
- Backend API error messages remain in English for this iteration
- Future enhancement: Add more languages by creating additional locale files
