# Spec: Database Import

## ADDED Requirements

### Requirement: Import database from valid JSON backup file

The system must provide an API endpoint to restore database contents from a previously exported JSON file, replacing all existing data.

#### Scenario: Authenticated user imports valid backup file successfully

**Given** a user is authenticated with valid JWT token  
**And** a valid JSON backup file exported from the same system  
**And** the user confirms the destructive operation  
**When** the user uploads the file to `/api/backup/import`  
**Then** the system validates the JSON structure  
**And** deletes all existing data in a transaction  
**And** imports all records from the backup file  
**And** returns HTTP 200 with import summary  
**And** the summary includes record counts for each table  
**And** the database contains exactly the data from the backup file

#### Scenario: Unauthenticated user attempts to import database

**Given** a user is not authenticated (no JWT token)  
**When** the user uploads a backup file to `/api/backup/import`  
**Then** the system returns HTTP 401 Unauthorized  
**And** the response includes error message "No token provided"  
**And** no database changes occur

#### Scenario: Import without confirmation is rejected

**Given** a user is authenticated  
**And** uploads a valid backup file  
**But** does not include `confirm: true` in request body  
**When** the import request is sent  
**Then** the system returns HTTP 400 Bad Request  
**And** the response includes error message "Confirmation required"  
**And** no database changes occur

### Requirement: Import maintains referential integrity

All foreign key relationships must be preserved during import, and the import must fail atomically if any integrity constraint would be violated.

#### Scenario: Import preserves product-supplier relationships

**Given** a backup file contains:
- Product ID 1 named "Widget"
- Supplier ID 5 named "Acme Corp"  
- ProductSupplier record linking product 1 to supplier 5

**When** the backup is imported  
**Then** the product "Widget" exists with ID 1  
**And** the supplier "Acme Corp" exists with ID 5  
**And** the product-supplier relationship exists  
**And** querying product 1's suppliers returns "Acme Corp"

#### Scenario: Import preserves purchase lot relationships

**Given** a backup file contains:
- Product ID 3 
- Supplier ID 7
- PurchaseLot with productId: 3, supplierId: 7, remainingQuantity: 100

**When** the backup is imported  
**Then** the purchase lot is linked to product ID 3  
**And** the purchase lot is linked to supplier ID 7  
**And** querying purchase lots for product 3 returns the lot  
**And** the lot's remainingQuantity is 100

#### Scenario: Import preserves year-end count relationships

**Given** a backup file contains:
- Product ID 2
- YearEndCount ID 10 for year 2023
- YearEndCountItem linking count 10 to product 2

**When** the backup is imported  
**Then** the year-end count exists with ID 10  
**And** the count item is linked to count 10 and product 2  
**And** querying count 10's items includes the product 2 item

### Requirement: Import validates file structure before processing

The system must validate the backup file's structure and schema version before beginning the import transaction to prevent partial imports or data corruption.

#### Scenario: Import rejects file with invalid JSON syntax

**Given** a user uploads a file with malformed JSON (missing commas, brackets)  
**When** the import request is processed  
**Then** the system returns HTTP 400 Bad Request  
**And** the response includes error message "Invalid JSON format"  
**And** no database transaction is started  
**And** existing data remains unchanged

#### Scenario: Import rejects file missing required metadata fields

**Given** a user uploads JSON file missing `version` field  
**When** the import request is processed  
**Then** the system returns HTTP 400 Bad Request  
**And** the response includes error message "Missing required field: version"  
**And** no database changes occur

#### Scenario: Import rejects file with incompatible schema version

**Given** the current system uses schema version "20241228"  
**And** a backup file was exported from schema version "20250115" (future version)  
**When** the user attempts to import the backup  
**Then** the system returns HTTP 400 Bad Request  
**And** the response includes error message "Incompatible schema version"  
**And** no database changes occur

#### Scenario: Import rejects file with missing required data tables

**Given** a JSON file contains `data.units` and `data.suppliers`  
**But** is missing `data.products` field  
**When** the import request is processed  
**Then** the system returns HTTP 400 Bad Request  
**And** the response includes error message "Missing required table: products"  
**And** no database changes occur

### Requirement: Import is atomic via database transaction

The entire import operation must complete successfully or rollback completely, with no partial imports or inconsistent states.

#### Scenario: Import rolls back on foreign key constraint violation

**Given** a backup file contains:
- PurchaseLot with productId: 999 (product does not exist in import data)

**When** the import is processed  
**Then** the import transaction fails during purchase lot insertion  
**And** the system rolls back all changes  
**And** returns HTTP 400 with error message "Foreign key constraint failed"  
**And** the database is restored to its pre-import state  
**And** existing data remains unchanged

#### Scenario: Import rolls back on duplicate unique constraint violation

**Given** the backup file contains two units with the same name "Pieces"  
**When** the import is processed  
**Then** the transaction fails during unit insertion  
**And** the system rolls back all changes  
**And** returns HTTP 400 with error message "Unique constraint violation"  
**And** the database is restored to its pre-import state

#### Scenario: Import completes fully when all validations pass

**Given** a valid backup file with 1000 records across all tables  
**And** all foreign keys are valid  
**And** no constraint violations exist  
**When** the import is processed  
**Then** exactly 1000 records are imported  
**And** the transaction commits successfully  
**And** returns HTTP 200  
**And** subsequent queries return the imported data

### Requirement: Import replaces all existing data

The import operation must delete all existing data before importing new data to ensure a clean restore.

#### Scenario: Import deletes existing data before importing

**Given** the current database contains:
- 50 products
- 20 suppliers  
- 300 purchase lots

**And** a backup file contains:
- 10 products
- 5 suppliers
- 50 purchase lots

**When** the backup is imported  
**Then** all 50 existing products are deleted  
**And** all 20 existing suppliers are deleted  
**And** all 300 existing purchase lots are deleted  
**And** the new 10 products are imported  
**And** the new 5 suppliers are imported  
**And** the new 50 purchase lots are imported  
**And** querying the database returns only the 10 products from backup

#### Scenario: Import deletion respects dependency order

**Given** the database has year-end count items that reference year-end counts  
**And** the database has purchase lots that reference products  
**When** the import begins deletion phase  
**Then** year-end count items are deleted before year-end counts  
**And** purchase lots are deleted before products  
**And** product-suppliers are deleted before products and suppliers  
**And** no foreign key constraint violations occur during deletion

### Requirement: Import handles large files within timeout limits

The import operation must complete within reasonable time limits for typical database sizes.

#### Scenario: Import completes for small database within 10 seconds

**Given** a backup file with 100 products and 500 purchase lots  
**When** the user imports the backup  
**Then** the import completes within 10 seconds  
**And** returns HTTP 200 success

#### Scenario: Import completes for medium database within 60 seconds

**Given** a backup file with 1,000 products and 5,000 purchase lots  
**When** the user imports the backup  
**Then** the import completes within 60 seconds  
**And** returns HTTP 200 success

#### Scenario: Import rejects files exceeding size limit

**Given** a backup file larger than 100MB  
**When** the user attempts to upload the file  
**Then** the system returns HTTP 413 Payload Too Large  
**And** the response includes error message "File size exceeds maximum (100MB)"  
**And** no import is attempted

### Requirement: Import provides detailed result summary

The import response must include statistics about what was imported to allow verification.

#### Scenario: Import returns record counts for all tables

**Given** a backup file with:
- 5 units
- 10 suppliers
- 50 products
- 75 product-supplier associations
- 200 purchase lots

**When** the import completes successfully  
**Then** the response includes `recordsImported` object with:
- `units: 5`
- `suppliers: 10`
- `products: 50`
- `productSuppliers: 75`
- `purchaseLots: 200`

#### Scenario: Import returns error details on validation failure

**Given** a backup file with invalid product reference in purchase lot  
**When** the import is attempted  
**Then** the response includes `success: false`  
**And** the response includes `errors` array  
**And** the errors array contains "Invalid productId reference in purchaseLots"

### Requirement: Import preserves locked year status

Locked years from the backup must be restored to maintain audit trail integrity.

#### Scenario: Import restores locked years

**Given** a backup file contains:
- LockedYear record for year 2023
- LockedYear record for year 2024

**When** the backup is imported  
**Then** year 2023 is marked as locked in the database  
**And** year 2024 is marked as locked in the database  
**And** users cannot modify purchase data for locked years

#### Scenario: Import restores year unlock audit trail

**Given** a backup file contains year unlock audit records for year 2023  
**When** the backup is imported  
**Then** the year unlock audit records are restored  
**And** the audit trail shows when and why the year was unlocked
