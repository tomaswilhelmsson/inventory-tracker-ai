# Spec: i18n Infrastructure

## Capability
`i18n-infrastructure`

## Overview
This capability provides the foundational internationalization infrastructure including Vue I18n configuration, locale detection, preference persistence, and language switching functionality.

---

## ADDED Requirements

### Requirement: I18N-001 - Vue I18n Integration
The system SHALL integrate Vue I18n library for internationalization support.

#### Scenario: Vue I18n plugin installed and configured
**Given** the frontend application is initialized  
**When** the app starts  
**Then** Vue I18n SHALL be registered as a Vue plugin  
**And** the i18n instance SHALL be available via `useI18n()` composable in all components  
**And** translation functions `$t()`, `$n()`, and `$d()` SHALL be globally available

#### Scenario: Supported locales configured
**Given** the i18n configuration is loaded  
**When** checking available locales  
**Then** the system SHALL support exactly two locales: `'en'` and `'sv'`  
**And** English SHALL be set as the fallback locale  
**And** both locale message files SHALL be loaded successfully

---

### Requirement: I18N-002 - Translation File Structure
The system SHALL maintain translation files in JSON format for each supported locale.

#### Scenario: English translation file exists
**Given** the project structure is initialized  
**When** inspecting `frontend/src/i18n/locales/`  
**Then** a file `en.json` SHALL exist  
**And** the file SHALL contain valid JSON  
**And** the JSON SHALL have top-level keys organized by feature (e.g., `common`, `nav`, `suppliers`, `products`)

#### Scenario: Swedish translation file exists
**Given** the project structure is initialized  
**When** inspecting `frontend/src/i18n/locales/`  
**Then** a file `sv.json` SHALL exist  
**And** the file SHALL contain valid JSON  
**And** the JSON SHALL have the same key structure as `en.json`  
**And** all values SHALL be in Swedish language

#### Scenario: Translation keys are consistently structured
**Given** both translation files exist  
**When** comparing `en.json` and `sv.json`  
**Then** both files SHALL have identical key paths  
**And** nested keys SHALL use camelCase naming convention  
**And** keys SHALL be grouped by feature or view (e.g., `suppliers.title`, `suppliers.form.nameLabel`)

---

### Requirement: I18N-003 - Locale Detection
The system SHALL automatically detect and apply the appropriate locale on application startup.

#### Scenario: Use saved locale preference
**Given** localStorage contains key `'user-locale'` with value `'sv'`  
**When** the application initializes  
**Then** the active locale SHALL be set to `'sv'`  
**And** Swedish translations SHALL be displayed  
**And** no browser language detection SHALL occur

#### Scenario: Detect browser language when no preference saved
**Given** localStorage does NOT contain key `'user-locale'`  
**And** browser `navigator.language` is `'sv-SE'`  
**When** the application initializes  
**Then** the system SHALL extract language code `'sv'` from `'sv-SE'`  
**And** the active locale SHALL be set to `'sv'`  
**And** Swedish translations SHALL be displayed

#### Scenario: Fall back to English for unsupported language
**Given** localStorage does NOT contain key `'user-locale'`  
**And** browser `navigator.language` is `'fr-FR'`  
**When** the application initializes  
**Then** the active locale SHALL be set to `'en'` (fallback)  
**And** English translations SHALL be displayed

#### Scenario: Handle missing browser language gracefully
**Given** localStorage does NOT contain key `'user-locale'`  
**And** browser does NOT provide `navigator.language`  
**When** the application initializes  
**Then** the active locale SHALL be set to `'en'` (fallback)  
**And** no errors SHALL be thrown

---

### Requirement: I18N-004 - Locale Persistence
The system SHALL persist user's language preference across browser sessions.

#### Scenario: Save locale to localStorage on selection
**Given** the user is using the application  
**When** the user selects locale `'sv'` via language selector  
**Then** localStorage SHALL be updated with key `'user-locale'` and value `'sv'`  
**And** the change SHALL persist after browser refresh  
**And** the change SHALL persist after browser close and reopen

#### Scenario: Load persisted locale on next visit
**Given** localStorage contains `'user-locale': 'sv'` from previous session  
**When** the user returns to the application in a new browser session  
**Then** the application SHALL load with locale `'sv'`  
**And** Swedish translations SHALL be displayed immediately  
**And** no language switch animation or flash SHALL occur

---

### Requirement: I18N-005 - Dynamic Locale Switching
The system SHALL allow users to change the active locale at runtime without page reload.

#### Scenario: Switch from English to Swedish
**Given** the application is running with locale `'en'`  
**When** the user selects locale `'sv'` from language selector  
**Then** all visible UI text SHALL immediately update to Swedish  
**And** the change SHALL apply to all currently rendered components  
**And** number and date formats SHALL update to Swedish conventions  
**And** localStorage SHALL be updated to `'sv'`  
**And** the page SHALL NOT reload

#### Scenario: Switch from Swedish to English
**Given** the application is running with locale `'sv'`  
**When** the user selects locale `'en'` from language selector  
**Then** all visible UI text SHALL immediately update to English  
**And** the change SHALL apply to all currently rendered components  
**And** number and date formats SHALL update to English conventions  
**And** localStorage SHALL be updated to `'en'`  
**And** the page SHALL NOT reload

---

### Requirement: I18N-006 - Number Formatting
The system SHALL format numbers according to the active locale's conventions.

#### Scenario: Format decimal numbers in English
**Given** the active locale is `'en'`  
**When** displaying number `1234.56` using `$n(1234.56, 'decimal')`  
**Then** the output SHALL be `'1,234.56'` (US number format)  
**And** the thousands separator SHALL be a comma  
**And** the decimal separator SHALL be a period

#### Scenario: Format decimal numbers in Swedish
**Given** the active locale is `'sv'`  
**When** displaying number `1234.56` using `$n(1234.56, 'decimal')`  
**Then** the output SHALL be `'1 234,56'` (Swedish number format)  
**And** the thousands separator SHALL be a space  
**And** the decimal separator SHALL be a comma

#### Scenario: Format currency in English
**Given** the active locale is `'en'`  
**When** displaying amount `1234.56` using `$n(1234.56, 'currency')`  
**Then** the output SHALL be `'$1,234.56'` or `'USD 1,234.56'`  
**And** the currency symbol SHALL appear appropriately positioned

#### Scenario: Format currency in Swedish
**Given** the active locale is `'sv'`  
**When** displaying amount `1234.56` using `$n(1234.56, 'currency')`  
**Then** the output SHALL be `'1 234,56 USD'` or Swedish-formatted equivalent  
**And** the formatting SHALL follow Swedish conventions

---

### Requirement: I18N-007 - Date Formatting
The system SHALL format dates according to the active locale's conventions.

#### Scenario: Format short date in English
**Given** the active locale is `'en'`  
**When** displaying date `2025-12-19` using `$d(date, 'short')`  
**Then** the output SHALL be in format `'12/19/2025'` or similar US format  
**And** the month SHALL appear before the day

#### Scenario: Format short date in Swedish
**Given** the active locale is `'sv'`  
**When** displaying date `2025-12-19` using `$d(date, 'short')`  
**Then** the output SHALL be in format `'2025-12-19'` (ISO 8601)  
**And** the year SHALL appear first

#### Scenario: Format long date in English
**Given** the active locale is `'en'`  
**When** displaying date `2025-12-19` using `$d(date, 'long')`  
**Then** the output SHALL be in format `'December 19, 2025'` or similar  
**And** the month SHALL be spelled out in English

#### Scenario: Format long date in Swedish
**Given** the active locale is `'sv'`  
**When** displaying date `2025-12-19` using `$d(date, 'long')`  
**Then** the output SHALL be in format `'19 december 2025'` or similar  
**And** the month SHALL be spelled out in Swedish

---

### Requirement: I18N-008 - Missing Translation Handling
The system SHALL handle missing translation keys gracefully.

#### Scenario: Log warning for missing key in development
**Given** the application is running in development mode  
**And** the active locale is `'sv'`  
**When** a component attempts to translate key `'nonexistent.key'`  
**Then** a warning SHALL be logged to browser console  
**And** the warning SHALL include the missing key path  
**And** the fallback English translation SHALL be displayed if available  
**And** if no fallback exists, the key path SHALL be displayed

#### Scenario: Fail silently for missing key in production
**Given** the application is running in production mode  
**And** the active locale is `'sv'`  
**When** a component attempts to translate key `'nonexistent.key'`  
**Then** no warning SHALL be logged to browser console  
**And** the fallback English translation SHALL be displayed if available  
**And** if no fallback exists, the key path SHALL be displayed

---

### Requirement: I18N-009 - HTML Lang Attribute
The system SHALL update the HTML document's language attribute to match active locale.

#### Scenario: Set lang attribute on locale change to Swedish
**Given** the application is running  
**When** the user switches locale to `'sv'`  
**Then** the `<html>` element's `lang` attribute SHALL be set to `'sv'`  
**And** screen readers SHALL announce content in Swedish

#### Scenario: Set lang attribute on locale change to English
**Given** the application is running  
**When** the user switches locale to `'en'`  
**Then** the `<html>` element's `lang` attribute SHALL be set to `'en'`  
**And** screen readers SHALL announce content in English

---

## Cross-References
- Related to: `ui-translation` (uses i18n infrastructure to display translated UI)
- Related to: `locale-persistence` (persists locale preference)
- Integrates with: Vue 3 Composition API
- Integrates with: PrimeVue component library
