# Spec: Currency Selection and Display with Database Persistence

## Overview

Add support for Swedish Krona (SEK) currency alongside the existing US Dollar (USD), and store user language and currency preferences in the database for cross-device synchronization.

## ADDED Requirements

### Requirement: User Preferences Database Storage
The system SHALL store user language and currency preferences in the database.

#### Scenario: User model includes preference fields
- GIVEN the database schema
- WHEN the User table is queried
- THEN it includes a `preferredLanguage` column with default value 'en'
- AND it includes a `preferredCurrency` column with default value 'USD'
- AND both fields are of type String

#### Scenario: New user gets default preferences
- GIVEN a new user is created
- WHEN the user record is inserted
- THEN `preferredLanguage` is set to 'en'
- AND `preferredCurrency` is set to 'USD'

#### Scenario: Existing users receive default preferences after migration
- GIVEN the database contains existing users
- WHEN the migration adding preference fields runs
- THEN all existing users receive `preferredLanguage = 'en'`
- AND all existing users receive `preferredCurrency = 'USD'`
- AND no user data is lost

### Requirement: Preferences API Endpoint - GET
The system SHALL provide an endpoint to retrieve user preferences.

#### Scenario: User retrieves their preferences
- GIVEN an authenticated user
- WHEN calling GET /auth/me
- THEN the response includes user information
- AND includes a `preferences` object with `language` and `currency` fields
- AND the values match what is stored in the database

### Requirement: Preferences API Endpoint - PUT
The system SHALL provide an endpoint to update user preferences.

#### Scenario: User updates currency preference
- GIVEN an authenticated user
- WHEN calling PUT /auth/preferences with `{ "currency": "SEK" }`
- THEN the user's preferredCurrency is updated to 'SEK' in the database
- AND the response returns the updated preferences
- AND the response status is 200 OK

#### Scenario: User updates language preference
- GIVEN an authenticated user
- WHEN calling PUT /auth/preferences with `{ "language": "sv" }`
- THEN the user's preferredLanguage is updated to 'sv' in the database
- AND the response returns the updated preferences

#### Scenario: User updates both preferences at once
- GIVEN an authenticated user
- WHEN calling PUT /auth/preferences with `{ "language": "sv", "currency": "SEK" }`
- THEN both preferredLanguage and preferredCurrency are updated
- AND the response returns both updated values

#### Scenario: Invalid currency value rejected
- GIVEN an authenticated user
- WHEN calling PUT /auth/preferences with `{ "currency": "EUR" }`
- THEN the request is rejected with 400 Bad Request
- AND the error message indicates valid values are 'USD' or 'SEK'
- AND the database is not updated

#### Scenario: Invalid language value rejected
- GIVEN an authenticated user
- WHEN calling PUT /auth/preferences with `{ "language": "de" }`
- THEN the request is rejected with 400 Bad Request
- AND the error message indicates valid values are 'en' or 'sv'
- AND the database is not updated

### Requirement: Preference Synchronization Across Devices
User preferences SHALL be synchronized across all devices and browsers for the same user.

#### Scenario: Preferences sync across devices
- GIVEN a user logs in on Device A
- AND sets currency to SEK
- WHEN the same user logs in on Device B
- THEN Device B loads with currency set to SEK
- AND both devices show the same currency

#### Scenario: Preference changes propagate
- GIVEN a user is logged in on Device A and Device B
- WHEN the user changes language to Swedish on Device A
- AND refreshes or navigates on Device B
- THEN Device B loads preferences from database
- AND Device B now displays in Swedish

### Requirement: Currency Selection
The system SHALL allow users to select between USD and SEK as their preferred currency for all monetary displays and inputs.

#### Scenario: User selects SEK currency
- GIVEN a user is viewing the application with USD selected
- WHEN the user opens the currency selector dropdown
- AND selects "SEK (kr)" from the options
- THEN all monetary amounts immediately display with "kr" suffix
- AND all currency input fields switch to SEK mode
- AND the selection is saved to the database via API call
- AND the currency selector shows "SEK" as active

#### Scenario: User selects USD currency  
- GIVEN a user is viewing the application with SEK selected
- WHEN the user opens the currency selector dropdown
- AND selects "USD ($)" from the options
- THEN all monetary amounts immediately display with "$" prefix
- AND all currency input fields switch to USD mode
- AND the selection is saved to the database via API call
- AND the currency selector shows "USD" as active

### Requirement: Currency Persistence
The user's currency selection SHALL persist across browser sessions and devices by storing in the database.

#### Scenario: Currency preference persists after logout/login
- GIVEN a user has selected SEK as their currency
- WHEN the user logs out
- AND logs back in (on same or different device)
- THEN the application loads with SEK currency active
- AND all amounts display in SEK format
- AND the currency selector shows SEK as selected

#### Scenario: Currency preference loads from database on login
- GIVEN a user's preferredCurrency in database is 'SEK'
- WHEN the user logs in
- THEN the frontend loads preferences from the API
- AND sets currency to SEK
- AND all monetary displays use SEK

### Requirement: Language Preference Database Storage
The user's language selection SHALL be stored in the database instead of localStorage.

#### Scenario: Language selection saves to database
- GIVEN an authenticated user
- WHEN the user selects Swedish from the language selector
- THEN PUT /auth/preferences is called with `{ "language": "sv" }`
- AND the database is updated
- AND localStorage is not the primary storage (only fallback)

#### Scenario: Language preference loads from database on login
- GIVEN a user's preferredLanguage in database is 'sv'
- WHEN the user logs in
- THEN the frontend loads preferences from the API
- AND sets i18n locale to 'sv'
- AND the application displays in Swedish

### Requirement: Graceful Fallback
The system SHALL fall back to localStorage if the preferences API is unavailable.

#### Scenario: API failure falls back to localStorage
- GIVEN the preferences API endpoint is unavailable
- WHEN the user tries to load preferences
- THEN the system reads from localStorage as fallback
- AND displays a warning that preferences are not synced
- AND the application continues to function

#### Scenario: Offline mode uses cached preferences
- GIVEN the user has no network connection
- WHEN the application loads
- THEN cached preferences from localStorage are used
- AND the application functions normally
- AND preferences sync when connection is restored

### Requirement: Swedish Number Formatting
When SEK is selected, the system SHALL format numbers using Swedish conventions.

#### Scenario: SEK amounts use Swedish formatting
- GIVEN the user has selected SEK currency
- WHEN displaying an amount of 1234.56
- THEN the system shows "1 234,56 kr" (space thousands separator, comma decimal)
- AND when displaying 1000000
- THEN the system shows "1 000 000,00 kr"

### Requirement: USD Number Formatting
When USD is selected, the system SHALL format numbers using US conventions.

#### Scenario: USD amounts use US formatting
- GIVEN the user has selected USD currency
- WHEN displaying an amount of 1234.56
- THEN the system shows "$1,234.56" (comma thousands separator, period decimal)
- AND when displaying 1000000
- THEN the system shows "$1,000,000.00"

### Requirement: Currency Input Fields
All currency input fields SHALL accept numbers in the format matching the selected currency.

#### Scenario: User enters amount in SEK format
- GIVEN the user has selected SEK currency
- WHEN the user enters "1 234,56" in a currency input field
- THEN the system parses it as 1234.56
- AND stores the numeric value 1234.56
- AND displays "1 234,56 kr" when the field loses focus

#### Scenario: User enters amount in USD format
- GIVEN the user has selected USD currency
- WHEN the user enters "1,234.56" in a currency input field
- THEN the system parses it as 1234.56
- AND stores the numeric value 1234.56
- AND displays "$1,234.56" when the field loses focus

### Requirement: Display-Only Currency
Currency selection SHALL be display-only; no automatic conversion of stored values SHALL occur.

#### Scenario: Switching currency does not convert values
- GIVEN the user has a purchase with unitCost of 100 stored
- WHEN the currency is USD
- THEN the purchase displays as "$100.00"
- AND when the user switches currency to SEK
- THEN the purchase displays as "100,00 kr"
- AND the stored value remains 100 (unchanged)

#### Scenario: User warning about display-only nature
- GIVEN the user hovers over or clicks the currency selector
- WHEN a tooltip or help text is shown
- THEN it states "Currency preference synced across devices"
- AND "Display format only - values unchanged"

### Requirement: Currency Selector Availability
The currency selector SHALL be accessible from all authenticated pages.

#### Scenario: Currency selector in application header
- GIVEN the user is logged in
- WHEN viewing any page (Dashboard, Inventory, Purchases, etc.)
- THEN the currency selector is visible in the application header
- AND the user can change currency without navigating away

## MODIFIED Requirements

None - this is a new feature addition.

## REMOVED Requirements

None.
