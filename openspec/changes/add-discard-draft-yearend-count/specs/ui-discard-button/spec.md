# Spec: UI Discard Button

## Capability
`ui-discard-button`

## Overview
This capability provides a user interface for discarding draft year-end counts, including a discard button, confirmation dialog, and appropriate feedback messages.

---

## ADDED Requirements

### Requirement: UI-001 - Discard Button Visibility
The year-end count view SHALL display a discard button only for draft counts.

#### Scenario: Show discard button for draft count
**Given** the user is viewing a year-end count with status 'draft'  
**When** the page renders  
**Then** a "Discard" button SHALL be visible  
**And** the button SHALL have a trash icon  
**And** the button SHALL have danger/warning styling

#### Scenario: Hide discard button for confirmed count
**Given** the user is viewing a year-end count with status 'confirmed'  
**When** the page renders  
**Then** the "Discard" button SHALL NOT be visible  
**And** only the year-end count data SHALL be displayed (read-only)

---

### Requirement: UI-002 - Confirmation Dialog
Clicking the discard button SHALL show a confirmation dialog.

#### Scenario: Show confirmation on discard click
**Given** the user is viewing a draft year-end count for year 2024  
**And** the count has 20 products  
**When** the user clicks the "Discard" button  
**Then** a confirmation dialog SHALL appear  
**And** the dialog SHALL display the year (2024)  
**And** the dialog SHALL display the product count (20)  
**And** the dialog SHALL warn that the action cannot be undone  
**And** the dialog SHALL have "Cancel" and "Discard" buttons

#### Scenario: Cancel discard action
**Given** the confirmation dialog is open  
**When** the user clicks "Cancel"  
**Then** the dialog SHALL close  
**And** the year-end count SHALL remain unchanged  
**And** the user SHALL remain on the count sheet page

#### Scenario: Confirm discard action
**Given** the confirmation dialog is open  
**When** the user clicks "Discard"  
**Then** a DELETE API request SHALL be sent to `/api/year-end-count/:id`  
**And** the dialog SHALL close  
**And** the system SHALL process the deletion

---

### Requirement: UI-003 - Success Feedback
Successfully discarding a count SHALL provide clear feedback and navigation.

#### Scenario: Show success message
**Given** the user confirms discard  
**When** the API request succeeds  
**Then** a success toast notification SHALL appear  
**And** the message SHALL confirm the count was discarded  
**And** the toast SHALL auto-dismiss after 3 seconds

#### Scenario: Redirect after successful discard
**Given** the user confirms discard  
**When** the API request succeeds  
**Then** the user SHALL be redirected to the year-end count selection page  
**And** the discarded count SHALL no longer appear in the list

---

### Requirement: UI-004 - Error Feedback
Failed discard attempts SHALL provide clear error messages.

#### Scenario: Show error for confirmed count
**Given** the user attempts to discard a count  
**When** the API returns 400 error (confirmed count)  
**Then** an error toast notification SHALL appear  
**And** the message SHALL explain confirmed counts cannot be deleted  
**And** the user SHALL remain on the count sheet page  
**And** the toast SHALL remain visible for 5 seconds

#### Scenario: Show generic error message
**Given** the user attempts to discard a count  
**When** the API returns any other error  
**Then** an error toast notification SHALL appear  
**And** the message SHALL indicate the discard failed  
**And** the server error message SHALL be displayed if available

---

### Requirement: UI-005 - Internationalization
All discard-related UI text SHALL be available in English and Swedish.

#### Scenario: English translations exist
**Given** the application language is English  
**When** viewing the discard functionality  
**Then** the following translation keys SHALL exist:
- `yearEndCount.discardCount`: "Discard"
- `yearEndCount.messages.discardConfirm`: Confirmation message with year and count placeholders
- `yearEndCount.messages.discardSuccess`: "Year-end count discarded successfully"
- `yearEndCount.messages.discardFailed`: "Failed to discard year-end count"

#### Scenario: Swedish translations exist
**Given** the application language is Swedish  
**When** viewing the discard functionality  
**Then** Swedish translations SHALL exist for all discard-related keys  
**And** the translations SHALL be culturally appropriate and accurate

---

### Requirement: UI-006 - Button Placement
The discard button SHALL be appropriately positioned in the UI.

#### Scenario: Button appears with other actions
**Given** the user is viewing a draft year-end count  
**When** the action buttons are rendered  
**Then** the "Discard" button SHALL appear in the actions section  
**And** the button SHALL be positioned before the "Confirm Count" button  
**And** the button SHALL be aligned with other action buttons (Export CSV, Export PDF)

---

## Cross-References
- Related to: `discard-draft-count` (backend discard functionality)
- Depends on: PrimeVue ConfirmDialog component
- Depends on: PrimeVue Toast component
- Depends on: Vue Router for navigation
