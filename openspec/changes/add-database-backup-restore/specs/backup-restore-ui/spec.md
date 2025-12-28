# Spec: Backup & Restore UI

## ADDED Requirements

### Requirement: User can export database via web interface

The application must provide a user interface element that allows authenticated users to download a complete database backup with a single click.

#### Scenario: User clicks export button and downloads backup file

**Given** the user is logged into the web interface  
**And** navigates to the Backup & Restore view  
**When** the user clicks the "Download Backup" button  
**Then** the browser initiates a file download  
**And** the downloaded file is named `inventory-backup-YYYY-MM-DD-HHmmss.json`  
**And** the file contains valid JSON with complete database export  
**And** a success toast notification appears with message "Database backup downloaded successfully"

#### Scenario: User sees loading indicator during export

**Given** the user clicks the "Download Backup" button  
**When** the export request is processing  
**Then** the button shows a loading spinner  
**And** the button is disabled to prevent duplicate requests  
**And** the button text changes to "Exporting..."  
**When** the export completes  
**Then** the button returns to normal state  
**And** the loading spinner disappears

#### Scenario: User sees error message when export fails

**Given** the user clicks the "Download Backup" button  
**When** the export request fails (network error or server error)  
**Then** an error toast notification appears  
**And** the notification includes message "Failed to export database"  
**And** the button returns to enabled state  
**And** no file download occurs

### Requirement: User can import database via web interface with confirmation

The application must provide a file upload interface with explicit confirmation dialog to prevent accidental data loss.

#### Scenario: User selects backup file for import

**Given** the user is on the Backup & Restore view  
**When** the user clicks "Choose File" button  
**And** selects a JSON backup file from their computer  
**Then** the selected filename appears next to the button  
**And** the "Import" button becomes enabled  
**And** file size is displayed if under 100MB

#### Scenario: User sees confirmation dialog before import

**Given** the user has selected a valid backup file  
**When** the user clicks the "Import" button  
**Then** a confirmation dialog appears  
**And** the dialog displays warning text "This will permanently delete all current data"  
**And** the dialog shows the backup filename  
**And** the dialog shows the backup export timestamp  
**And** the dialog includes checkbox "I understand this cannot be undone"  
**And** the confirm button is disabled until checkbox is checked

#### Scenario: User confirms and completes import successfully

**Given** the confirmation dialog is displayed  
**And** the user checks the "I understand" checkbox  
**When** the user clicks "Restore Database" button  
**Then** the dialog shows a loading spinner  
**And** the import request is sent to the server  
**When** the import succeeds  
**Then** a success toast notification appears with message "Database restored successfully"  
**And** the dialog closes  
**And** the page shows the imported data counts  
**And** the user can see the restored data immediately

#### Scenario: User cancels import from confirmation dialog

**Given** the confirmation dialog is displayed  
**When** the user clicks "Cancel" button  
**Then** the dialog closes  
**And** no import request is sent  
**And** existing data remains unchanged  
**And** the file selection is cleared

### Requirement: UI displays helpful information and guidance

The Backup & Restore view must provide clear instructions and feedback to help users understand the feature.

#### Scenario: User sees explanatory text for export feature

**Given** the user views the Backup & Restore page  
**Then** the export section displays header "Export Database"  
**And** displays description "Download a complete backup of your database as a JSON file"  
**And** displays usage hint "Use this before testing changes or major operations"

#### Scenario: User sees explanatory text for import feature

**Given** the user views the Backup & Restore page  
**Then** the import section displays header "Import Database"  
**And** displays warning "⚠️ Warning: This will replace all current data"  
**And** displays usage hint "Only import backup files created by this system"

#### Scenario: User sees last export timestamp

**Given** the user has previously exported the database  
**And** the export timestamp is stored in browser localStorage  
**Then** the page displays "Last export: YYYY-MM-DD HH:mm:ss"  
**When** the user exports again  
**Then** the timestamp updates to the new export time

### Requirement: UI validates file selection before import

The interface must validate uploaded files before allowing import to prevent errors.

#### Scenario: User selects non-JSON file

**Given** the user clicks "Choose File"  
**When** the user selects a file with extension other than .json  
**Then** an error message appears "Please select a JSON file"  
**And** the "Import" button remains disabled  
**And** the file selection is cleared

#### Scenario: User selects file exceeding size limit

**Given** the user selects a file larger than 100MB  
**Then** an error message appears "File too large (max 100MB)"  
**And** the "Import" button remains disabled  
**And** the file selection is cleared

### Requirement: UI shows import progress and results

The interface must provide feedback during the import process and display results afterward.

#### Scenario: User sees progress indicator during import

**Given** the user confirms the import  
**When** the import is processing  
**Then** a progress indicator is displayed  
**And** the confirmation dialog cannot be closed  
**And** all buttons are disabled during processing

#### Scenario: User sees import results summary

**Given** the import completes successfully  
**When** the result is received from server  
**Then** a summary card is displayed showing:
- "Database restored successfully"
- "Units imported: 5"
- "Suppliers imported: 10"
- "Products imported: 50"
- "Purchase lots imported: 200"
- "Year-end counts imported: 2"

#### Scenario: User sees detailed error message on import failure

**Given** the import fails due to validation error  
**When** the error response is received  
**Then** an error dialog appears  
**And** displays error message from server  
**And** lists specific validation errors (e.g., "Invalid foreign key in purchase lots")  
**And** includes "Close" button to dismiss

### Requirement: Backup & Restore accessible from main navigation

Users must be able to easily navigate to the Backup & Restore feature from the main application menu.

#### Scenario: User navigates to Backup & Restore from menu

**Given** the user is logged in  
**When** the user opens the main navigation menu  
**Then** a "Backup & Restore" menu item is visible  
**When** the user clicks the menu item  
**Then** the application navigates to `/backup-restore` route  
**And** displays the Backup & Restore view

### Requirement: UI is responsive and accessible

The Backup & Restore interface must work on different screen sizes and be accessible.

#### Scenario: UI works on mobile devices

**Given** the user accesses the Backup & Restore view on a mobile device  
**Then** the export and import sections stack vertically  
**And** buttons are large enough for touch interaction (min 44x44px)  
**And** text is readable without horizontal scrolling  
**And** the confirmation dialog fits within the viewport

#### Scenario: UI is keyboard navigable

**Given** the user navigates using only keyboard  
**Then** the user can tab to the "Download Backup" button  
**And** can tab to the "Choose File" button  
**And** can tab to the "Import" button  
**And** can activate buttons with Enter or Space key  
**And** can navigate dialog buttons with Tab  
**And** can dismiss dialogs with Escape key
