# Spec: UI Translation

## Capability
`ui-translation`

## Overview
This capability ensures all user-facing UI text throughout the application is translated and displayed in the active locale (English or Swedish).

---

## ADDED Requirements

### Requirement: UI-001 - Navigation Menu Translation
The navigation menu SHALL display all links and labels in the active locale.

#### Scenario: Display English navigation menu
**Given** the active locale is `'en'`  
**When** viewing the navigation menu  
**Then** the menu SHALL display in English:
- Dashboard
- Suppliers
- Products
- Units
- Purchases
- Inventory
- Year End Count
- Reports

#### Scenario: Display Swedish navigation menu
**Given** the active locale is `'sv'`  
**When** viewing the navigation menu  
**Then** the menu SHALL display in Swedish:
- Instrumentpanel (Dashboard)
- Leverantörer (Suppliers)
- Produkter (Products)
- Enheter (Units)
- Inköp (Purchases)
- Lager (Inventory)
- Årsbokslut (Year End Count)
- Rapporter (Reports)

---

### Requirement: UI-002 - Common UI Elements Translation
All common UI elements SHALL be translated across all views.

#### Scenario: Translate action buttons
**Given** the active locale is set  
**When** viewing any form or dialog  
**Then** common buttons SHALL be translated:
- Add → Lägg till (Swedish)
- Edit → Redigera (Swedish)
- Delete → Ta bort (Swedish)
- Save → Spara (Swedish)
- Cancel → Avbryt (Swedish)
- Search → Sök (Swedish)
- Filter → Filtrera (Swedish)

#### Scenario: Translate table headers
**Given** the active locale is `'sv'`  
**When** viewing data tables  
**Then** common table headers SHALL be translated:
- Name → Namn
- Created → Skapad
- Actions → Åtgärder
- Date → Datum
- Quantity → Antal
- Price → Pris

#### Scenario: Translate empty state messages
**Given** the active locale is `'sv'`  
**When** viewing an empty table or list  
**Then** the empty state message SHALL be translated:
- "No records found" → "Inga poster hittades"
- "No data available" → "Ingen data tillgänglig"

---

### Requirement: UI-003 - Login View Translation
The login view SHALL display all text in the active locale.

#### Scenario: Display English login form
**Given** the active locale is `'en'`  
**When** viewing the login page  
**Then** the login form SHALL display:
- Title: "Login"
- Username field: "Username"
- Password field: "Password"
- Submit button: "Login"

#### Scenario: Display Swedish login form
**Given** the active locale is `'sv'`  
**When** viewing the login page  
**Then** the login form SHALL display:
- Title: "Logga in"
- Username field: "Användarnamn"
- Password field: "Lösenord"
- Submit button: "Logga in"

#### Scenario: Translate login error messages
**Given** the active locale is `'sv'`  
**When** login fails due to invalid credentials  
**Then** the error message SHALL be "Inloggning misslyckades" (Login Failed)  
**And** the detail message SHALL be translated to Swedish

---

### Requirement: UI-004 - Dashboard View Translation
The dashboard view SHALL display all text in the active locale.

#### Scenario: Translate dashboard summary cards
**Given** the active locale is `'sv'`  
**When** viewing the dashboard  
**Then** summary card titles SHALL be translated:
- "Total Inventory Value" → "Totalt lagervärde"
- "Active Products" → "Aktiva produkter"
- "Suppliers" → "Leverantörer"
- "Recent Purchases" → "Senaste inköp"

#### Scenario: Translate dashboard chart labels
**Given** the active locale is `'sv'`  
**And** the dashboard includes charts or graphs  
**When** viewing chart elements  
**Then** axis labels and legends SHALL be translated to Swedish

---

### Requirement: UI-005 - Suppliers View Translation
The suppliers management view SHALL display all text in the active locale.

#### Scenario: Translate supplier form labels in Swedish
**Given** the active locale is `'sv'`  
**When** viewing the add/edit supplier dialog  
**Then** form labels SHALL be translated:
- "Supplier Name" → "Leverantörsnamn"
- "Contact Person" → "Kontaktperson"
- "Email Address" → "E-postadress"
- "Phone Number" → "Telefonnummer"
- "Street Address" → "Gatuadress"
- "City" → "Stad"
- "Country" → "Land"
- "Tax ID / VAT Number" → "Org.nr / Momsreg.nr"
- "Notes" → "Anteckningar"

#### Scenario: Translate supplier table columns
**Given** the active locale is `'sv'`  
**When** viewing the suppliers table  
**Then** column headers SHALL be translated:
- "Name" → "Namn"
- "Contact Person" → "Kontaktperson"
- "Email" → "E-post"
- "Phone" → "Telefon"
- "Products" → "Produkter"
- "Purchases" → "Inköp"

#### Scenario: Translate supplier deletion confirmation
**Given** the active locale is `'sv'`  
**When** attempting to delete a supplier  
**Then** the confirmation dialog SHALL display in Swedish:
- "Are you sure you want to delete?" → "Är du säker på att du vill ta bort?"
- "This action cannot be undone" → "Denna åtgärd kan inte ångras"

---

### Requirement: UI-006 - Products View Translation
The products management view SHALL display all text in the active locale.

#### Scenario: Translate product form fields
**Given** the active locale is `'sv'`  
**When** viewing the add/edit product dialog  
**Then** form labels SHALL be translated:
- "Product Name" → "Produktnamn"
- "Description" → "Beskrivning"
- "Unit" → "Enhet"
- "Supplier" → "Leverantör"

#### Scenario: Translate product table
**Given** the active locale is `'sv'`  
**When** viewing the products table  
**Then** the page title SHALL be "Produkthantering" (Product Management)  
**And** the "Add Product" button SHALL be "Lägg till produkt"

---

### Requirement: UI-007 - Units View Translation
The units management view SHALL display all text in the active locale.

#### Scenario: Translate unit names for display
**Given** the active locale is `'sv'`  
**When** viewing the units list  
**Then** unit names SHALL be translated:
- "pieces" → "stycken"
- "kg" → "kg" (unchanged)
- "g" → "g" (unchanged)
- "liters" → "liter"
- "meters" → "meter"

#### Scenario: Translate units form
**Given** the active locale is `'sv'`  
**When** viewing the add/edit unit dialog  
**Then** the form SHALL display:
- Title: "Lägg till enhet" (Add Unit) or "Redigera enhet" (Edit Unit)
- Field label: "Enhetsnamn" (Unit Name)

---

### Requirement: UI-008 - Purchases View Translation
The purchases tracking view SHALL display all text in the active locale.

#### Scenario: Translate purchase form fields
**Given** the active locale is `'sv'`  
**When** viewing the add/edit purchase dialog  
**Then** form labels SHALL be translated:
- "Purchase Date" → "Inköpsdatum"
- "Product" → "Produkt"
- "Supplier" → "Leverantör"
- "Quantity" → "Antal"
- "Unit Cost" → "Styckpris"
- "Total Cost" → "Totalkostnad"

#### Scenario: Translate purchase table columns
**Given** the active locale is `'sv'`  
**When** viewing the purchases table  
**Then** column headers SHALL be translated:
- "Purchase Date" → "Inköpsdatum"
- "Product" → "Produkt"
- "Supplier" → "Leverantör"
- "Quantity" → "Antal"
- "Remaining" → "Återstående"
- "Unit Cost" → "Styckpris"

#### Scenario: Translate year lock warning
**Given** the active locale is `'sv'`  
**And** a purchase year is locked  
**When** viewing the locked year indicator  
**Then** the warning SHALL display "År låst - kan inte redigeras" (Year locked - cannot edit)

---

### Requirement: UI-009 - Inventory View Translation
The inventory valuation view SHALL display all text in the active locale.

#### Scenario: Translate inventory summary cards
**Given** the active locale is `'sv'`  
**When** viewing the inventory summary  
**Then** summary labels SHALL be translated:
- "Total Products" → "Totalt produkter"
- "Total Inventory Value" → "Totalt lagervärde"
- "Total Units" → "Totalt enheter"

#### Scenario: Translate zero quantity filter
**Given** the active locale is `'sv'`  
**When** viewing the inventory filter options  
**Then** the checkbox SHALL display "Visa produkter med noll antal" (Show items with zero quantity)

---

### Requirement: UI-010 - Year-End Count View Translation
The year-end count view SHALL display all text in the active locale.

#### Scenario: Translate year-end workflow steps
**Given** the active locale is `'sv'`  
**When** viewing the year-end count process  
**Then** workflow labels SHALL be translated:
- "Initiate Count" → "Starta räkning"
- "Enter Counted Quantities" → "Ange räknade antal"
- "Expected Quantity" → "Förväntat antal"
- "Counted Quantity" → "Räknat antal"
- "Variance" → "Avvikelse"
- "Confirm Count" → "Bekräfta räkning"

#### Scenario: Translate count status
**Given** the active locale is `'sv'`  
**When** viewing year-end count status  
**Then** status values SHALL be translated:
- "Draft" → "Utkast"
- "Confirmed" → "Bekräftad"

---

### Requirement: UI-011 - Reports View Translation
The reports view SHALL display all text in the active locale.

#### Scenario: Translate report types
**Given** the active locale is `'sv'`  
**When** viewing available reports  
**Then** report names SHALL be translated appropriately to Swedish

---

### Requirement: UI-012 - Validation Error Messages Translation
All form validation error messages SHALL be displayed in the active locale.

#### Scenario: Translate required field error
**Given** the active locale is `'sv'`  
**When** submitting a form with an empty required field  
**Then** the error message SHALL be translated (e.g., "Detta fält är obligatoriskt" for "This field is required")

#### Scenario: Translate email validation error
**Given** the active locale is `'sv'`  
**When** entering an invalid email address  
**Then** the error SHALL display "Ange en giltig e-postadress" (Please enter a valid email address)

---

### Requirement: UI-013 - Toast Notification Translation
All toast notifications SHALL be displayed in the active locale.

#### Scenario: Translate success notifications
**Given** the active locale is `'sv'`  
**When** successfully creating a supplier  
**Then** the toast SHALL display:
- Summary: "Lyckades" (Success)
- Detail: "Leverantör skapades framgångsrikt" (Supplier created successfully)

#### Scenario: Translate error notifications
**Given** the active locale is `'sv'`  
**When** an error occurs during an operation  
**Then** the toast SHALL display:
- Summary: "Fel" (Error)
- Detail: Translated error message

---

### Requirement: UI-014 - Language Selector Component
A language selector component SHALL be available to allow users to switch locales.

#### Scenario: Display language selector in app header
**Given** the user is logged in  
**When** viewing any page  
**Then** a language selector SHALL be visible in the app header  
**And** the selector SHALL show the current active language  
**And** clicking the selector SHALL display language options: "English" and "Svenska"

#### Scenario: Select Swedish language
**Given** the language selector is displayed  
**And** the current locale is `'en'`  
**When** the user clicks on "Svenska"  
**Then** the locale SHALL change to `'sv'`  
**And** all UI text SHALL update immediately  
**And** localStorage SHALL save the preference

#### Scenario: Language selector shows current language
**Given** the active locale is `'sv'`  
**When** viewing the language selector  
**Then** it SHALL display "SV" or "Svenska" as the current selection  
**And** visual indicator (e.g., checkmark) SHALL show Swedish is active

---

## Cross-References
- Depends on: `i18n-infrastructure` (provides translation and formatting functions)
- Related to: `locale-persistence` (persists user's language choice)
- Integrates with: All view components (Dashboard, Suppliers, Products, Units, Purchases, Inventory, Year-End Count, Reports, Login)
