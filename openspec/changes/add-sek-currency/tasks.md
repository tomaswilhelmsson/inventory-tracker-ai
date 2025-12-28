# Tasks: Add SEK Currency Support with Database-Backed Preferences

## Phase 1: Database Schema & Migration (2-3 hours)

### 1.1 Update Prisma Schema
- [ ] Update `backend/prisma/schema.prisma`
  - Add `preferredLanguage String @default("en")` to User model
  - Add `preferredCurrency String @default("USD")` to User model
  - Validation: Schema file has no syntax errors
  - Test: Run `npx prisma format` to validate

### 1.2 Create Database Migration
- [ ] Generate migration
  - Run `npx prisma migrate dev --name add_user_preferences`
  - Review migration SQL to ensure it adds columns with defaults
  - Validation: Migration file created in `prisma/migrations/`
  - Test: Apply migration to dev database

### 1.3 Test Migration Rollback
- [ ] Create rollback script (optional but recommended)
  - Document SQL to remove columns if needed
  - Test rollback in development database
  - Validation: Can safely roll back if needed
  - Test: Apply and rollback migration

## Phase 2: Backend API Endpoints (3-4 hours)

### 2.1 Update Auth Types
- [ ] Update `backend/src/routes/auth.ts` TypeScript interfaces
  - Add preferences to User response type
  - Create PreferencesDTO type
  - Validation: TypeScript compiles without errors
  - Test: Types are properly exported

### 2.2 Enhance GET `/auth/me` Endpoint
- [ ] Update existing `/auth/me` to include preferences
  - Return `preferences: { language, currency }` in response
  - Handle case where fields are null (default values)
  - Validation: Endpoint returns user with preferences
  - Test: Call endpoint, verify preferences in response

###2.3 Create PUT `/auth/preferences` Endpoint
- [ ] Add new endpoint in `backend/src/routes/auth.ts`
  - Accept `{ language?: string, currency?: string }` in body
  - Validate language is 'en' or 'sv'
  - Validate currency is 'USD' or 'SEK'
  - Update user preferences in database
  - Return updated preferences
  - Validation: Endpoint updates database
  - Test: Send PUT request, verify database updated

### 2.4 Add Input Validation
- [ ] Create validation middleware or use Zod
  - Validate preference values before saving
  - Return 400 error for invalid values
  - Validation: Invalid requests rejected
  - Test: Try invalid currency/language, verify 400 response

### 2.5 Update Login Response
- [ ] Modify login endpoint to include preferences
  - Return preferences along with token
  - Ensures preferences available immediately after login
  - Validation: Login response includes preferences
  - Test: Login and verify preferences in response

## Phase 3: Frontend Preferences Store (2-3 hours)

### 3.1 Create Preferences Pinia Store
- [ ] Create `frontend/src/stores/preferences.ts`
  - Define state: `language`, `currency`, `loading`
  - Add `loadPreferences()` action (calls GET /auth/me)
  - Add `updateLanguage(lang)` action (calls PUT /auth/preferences)
  - Add `updateCurrency(curr)` action (calls PUT /auth/preferences)
  - Validation: Store compiles without errors
  - Test: Import and use store in component

### 3.2 Initialize Preferences on Login
- [ ] Update auth store or App.vue
  - After successful login, call `preferencesStore.loadPreferences()`
  - Set i18n locale from loaded language
  - Handle loading state with spinner if needed
  - Validation: Preferences load after login
  - Test: Login and verify preferences loaded

### 3.3 Add localStorage Fallback
- [ ] Implement graceful degradation
  - If API fails, read from localStorage
  - If localStorage empty, use browser locale defaults
  - Save to localStorage when API succeeds (cache)
  - Validation: Works offline with localStorage
  - Test: Disconnect network, verify localStorage used

## Phase 4: Currency Selector Component (1-2 hours)

### 4.1 Create Currency Selector Component
- [ ] Create `frontend/src/components/CurrencySelector.vue`
  - Use PrimeVue Dropdown component
  - Options: `[{ code: 'USD', label: 'USD ($)' }, { code: 'SEK', label: 'SEK (kr)' }]`
  - Bind to `preferencesStore.currency`
  - Call `preferencesStore.updateCurrency()` on change
  - Show loading indicator during save
  - Add tooltip: "Currency preference synced across devices"
  - Validation: Component renders correctly
  - Test: Select currency, verify API called

### 4.2 Add Currency Selector to App Header
- [ ] Update `frontend/src/App.vue`
  - Import CurrencySelector
  - Add to header next to language selector
  - Position appropriately
  - Validation: Visible on all authenticated pages
  - Test: Accessible from any view

## Phase 5: Update Language Selector (1 hour)

### 5.1 Migrate Language Selector to Use API
- [ ] Update `frontend/src/components/LanguageSelector.vue`
  - Remove localStorage save logic
  - Call `preferencesStore.updateLanguage()` instead
  - Show loading indicator during save
  - Handle API errors gracefully
  - Validation: Language changes save to database
  - Test: Change language, verify database updated

### 5.2 Remove Language localStorage Logic
- [ ] Clean up old localStorage code for language
  - Remove `localStorage.setItem('user-locale')` calls
  - Remove `localStorage.getItem('user-locale')` reads (except as fallback)
  - Keep as fallback only in preferences store
  - Validation: No direct localStorage language access remains
  - Test: Language loads from API, not localStorage

## Phase 6: i18n Number Format Updates (1-2 hours)

### 6.1 Make i18n Currency Format Reactive
- [ ] Update `frontend/src/i18n/index.ts`
  - Import preferences store
  - Make currency in number formats react to store changes
  - Use `computed()` or watch to update currency
  - Ensure both 'en' and 'sv' locales use store currency
  - Validation: Currency format updates when store changes
  - Test: Change currency, verify `n(123, 'currency')` updates

### 6.2 Update Swedish Locale Number Formatting
- [ ] Ensure Swedish formatting correct
  - Space as thousands separator: "1 234,56"
  - Comma as decimal separator
  - "kr" suffix for SEK
  - Validation: Swedish numbers format correctly
  - Test: Switch to Swedish + SEK, verify "1 234,56 kr"

## Phase 7: Update Input Components (2-3 hours)

### 7.1 Update Multi-Item Purchase Dialog
- [ ] Update `frontend/src/components/MultiItemPurchaseDialog.vue`
  - Import preferences store
  - Computed property: `currentCurrency = preferencesStore.currency`
  - Update all InputNumber with `mode="currency"`:
    - Invoice total: `:currency="currentCurrency"`
    - Shipping cost: `:currency="currentCurrency"`
    - Unit cost inputs: `:currency="currentCurrency"`
    - Total cost inputs: `:currency="currentCurrency"`
  - Validation: Inputs show correct currency
  - Test: Change currency, verify inputs update

### 7.2 Update Purchases View
- [ ] Update `frontend/src/views/PurchasesView.vue`
  - Import preferences store
  - Update unit cost InputNumber to use `:currency="preferencesStore.currency"`
  - Validation: Input uses correct currency
  - Test: Enter purchase with both USD and SEK

### 7.3 Verify All Currency Displays Update
- [ ] Test all views with currency changes
  - Dashboard: Inventory value
  - Inventory: All monetary columns
  - Purchases: Cost columns
  - Year-End Count: Value columns
  - Reports: All financial displays
  - Validation: All use `n(value, 'currency')` from i18n
  - Test: Switch currency, verify all update reactively

## Phase 8: Testing & Validation (2-3 hours)

### 8.1 Backend API Testing
- [ ] Test preferences endpoints
  - Test GET /auth/me returns preferences
  - Test PUT /auth/preferences with valid data
  - Test PUT with invalid currency (should reject)
  - Test PUT with invalid language (should reject)
  - Test partial updates (only currency OR only language)
  - Validation: All endpoints work correctly
  - Test: Use Postman/curl to verify

### 8.2 Cross-Device Testing
- [ ] Test preference synchronization
  - Login on browser 1, set currency to SEK
  - Login on browser 2 (same user)
  - Verify browser 2 shows SEK
  - Change language on browser 2
  - Refresh browser 1, verify language updated
  - Validation: Preferences sync across sessions
  - Test: Multiple browsers/devices

### 8.3 Persistence Testing
- [ ] Verify database persistence
  - Set preferences, logout
  - Login again
  - Verify preferences restored
  - Check database directly to confirm values stored
  - Validation: Preferences persist after logout
  - Test: Login/logout cycles

### 8.4 Edge Case Testing
- [ ] Test edge cases
  - New user (no preferences set) - should get defaults
  - API failure - should fall back to localStorage
  - Network offline - should use cached values
  - Very large amounts in both currencies
  - Very small amounts (cents/öre)
  - Validation: Handles all edge cases gracefully
  - Test: Simulate various failure scenarios

### 8.5 Migration Testing
- [ ] Test database migration
  - Apply migration to test database
  - Verify existing users get default values
  - Verify no data loss
  - Test with production-like data volume
  - Validation: Migration is safe
  - Test: Run on copy of production data

## Phase 9: Documentation & Cleanup (1 hour)

### 9.1 Update API Documentation
- [ ] Document new endpoints
  - Document GET /auth/me (updated)
  - Document PUT /auth/preferences (new)
  - Include request/response examples
  - Document validation rules
  - Validation: API docs are complete
  - Test: Developer can use docs to call endpoints

### 9.2 Add Translation Keys
- [ ] Add i18n keys
  - `settings.currency`: "Currency"
  - `settings.currencyUSD`: "US Dollar ($)"
  - `settings.currencySEK`: "Swedish Krona (kr)"
  - `settings.currencyTooltip`: "Currency preference synced across devices"
  - `settings.preferencesUpdated`: "Preferences saved"
  - `settings.preferencesError`: "Failed to save preferences"
  - Validation: Keys in both en.json and sv.json
  - Test: All translations display

### 9.3 Clean Up Old Code
- [ ] Remove unused localStorage logic
  - Keep only as fallback in preferences store
  - Remove any hardcoded USD references
  - Update comments to reflect database storage
  - Validation: No dead code remains
  - Test: App works without issues

## Phase 10: Deployment Preparation (1 hour)

### 10.1 Create Migration Checklist
- [ ] Document deployment steps
  - Run migration on staging first
  - Verify no errors
  - Run migration on production
  - Monitor for errors
  - Validation: Clear deployment steps
  - Test: Run through checklist in staging

### 10.2 Create Rollback Plan
- [ ] Document rollback procedure
  - SQL to drop columns if needed
  - Steps to revert code changes
  - How to restore from backup if needed
  - Validation: Rollback plan is clear
  - Test: Practice rollback in dev

## Dependencies

- Phase 1 must complete before Phase 2 (database schema needed for API)
- Phase 2 must complete before Phase 3 (API needed for store)
- Phase 3 must complete before Phases 4, 5, 6 (store needed for components)
- Phase 7 depends on Phases 3 & 6 (store and formats ready)
- Phase 8 depends on all previous phases (full implementation needed)
- Phase 9 can run parallel with Phase 8
- Phase 10 can run parallel with Phase 9

## Parallelizable Work

- Phase 4 and Phase 5 can be done simultaneously (both use preferences store)
- Phase 6 can be done in parallel with Phase 5
- Phase 9 subtasks can be done in parallel

## Estimated Effort

- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 2-3 hours
- Phase 4: 1-2 hours
- Phase 5: 1 hour
- Phase 6: 1-2 hours
- Phase 7: 2-3 hours
- Phase 8: 2-3 hours
- Phase 9: 1 hour
- Phase 10: 1 hour
- **Total**: 16-24 hours (~2-3 days)

## Notes

- Currency and language are now user profile fields, not app settings
- Preferences sync automatically across all devices for same user
- localStorage serves as fallback for offline/API failure scenarios
- All database values remain numeric (no currency field in transactions)
- Migration is additive (no data modification, only new columns)
- Users can switch currency/language anytime without data loss
