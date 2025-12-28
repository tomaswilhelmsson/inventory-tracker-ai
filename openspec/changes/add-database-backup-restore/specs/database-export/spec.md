# Spec: Database Export

## ADDED Requirements

### Requirement: Export complete database as JSON file

The system must provide an API endpoint to export the entire database contents as a structured JSON file that can be downloaded by authenticated users.

#### Scenario: Authenticated user exports database successfully

**Given** a user is authenticated with valid JWT token  
**And** the database contains units, suppliers, products, and purchase lots  
**When** the user sends POST request to `/api/backup/export`  
**Then** the system returns HTTP 200 with `Content-Type: application/json`  
**And** the response includes `Content-Disposition` header with filename `inventory-backup-YYYY-MM-DD-HHmmss.json`  
**And** the JSON file contains metadata section with `version`, `exportedAt`, and `schemaVersion` fields  
**And** the JSON file contains data section with all database tables  
**And** all foreign key relationships are preserved in the export

#### Scenario: Unauthenticated user attempts to export database

**Given** a user is not authenticated (no JWT token)  
**When** the user sends POST request to `/api/backup/export`  
**Then** the system returns HTTP 401 Unauthorized  
**And** the response includes error message "No token provided"

#### Scenario: Export includes correct data structure and ordering

**Given** a database with:
- 5 units
- 10 suppliers
- 50 products with multi-supplier relationships
- 200 purchase lots
- 2 year-end counts with items
- 1 locked year

**When** the user exports the database  
**Then** the JSON export contains exactly:
- 5 unit records in `data.units` array
- 10 supplier records in `data.suppliers` array
- 50 product records in `data.products` array
- Product-supplier associations in `data.productSuppliers` array
- 200 purchase lot records in `data.purchaseLots` array
- 2 year-end count records in `data.yearEndCounts` array
- Corresponding year-end count items in `data.yearEndCountItems` array
- 1 locked year record in `data.lockedYears` array

**And** all ID references match between related tables

#### Scenario: Export excludes sensitive user data

**Given** a database with 3 user accounts (including password hashes)  
**When** the user exports the database  
**Then** the JSON export does NOT contain `data.users` field  
**And** the JSON export does NOT contain any password hashes  
**And** the export contains all other data tables

#### Scenario: Export generates unique timestamped filename

**Given** the current datetime is 2024-12-28 15:30:45  
**When** the user exports the database  
**Then** the filename is `inventory-backup-2024-12-28-153045.json`  
**And** a subsequent export 10 seconds later generates `inventory-backup-2024-12-28-153055.json`

### Requirement: Export includes version metadata for compatibility checking

The JSON export must include version information to enable import validation and schema compatibility checks.

#### Scenario: Export includes format version

**When** the user exports the database  
**Then** the JSON contains `version` field with value "1.0"  
**And** the JSON contains `exportedAt` field with ISO 8601 timestamp  
**And** the JSON contains `schemaVersion` field with current Prisma schema version

#### Scenario: Export metadata enables version validation on import

**Given** an exported JSON file from schema version "20241228"  
**When** the user attempts import on system with schema version "20241230"  
**Then** the system can detect schema version mismatch using metadata  
**And** can warn or reject incompatible imports

### Requirement: Export handles large databases efficiently

The export operation must handle databases of varying sizes without timeout or memory issues.

#### Scenario: Export completes for small database within 5 seconds

**Given** a database with 100 products and 500 purchase lots  
**When** the user exports the database  
**Then** the export completes within 5 seconds  
**And** returns valid JSON file

#### Scenario: Export completes for medium database within 30 seconds

**Given** a database with 1,000 products and 5,000 purchase lots  
**When** the user exports the database  
**Then** the export completes within 30 seconds  
**And** returns valid JSON file under 10MB size

#### Scenario: Export handles empty database gracefully

**Given** a newly initialized database with no data records  
**When** the user exports the database  
**Then** the export succeeds with HTTP 200  
**And** the JSON contains empty arrays for all data tables  
**And** metadata fields are populated correctly

### Requirement: Temporary export files are cleaned up after download

Export files generated on the server must be automatically deleted after successful download to prevent disk space accumulation.

#### Scenario: Export file is deleted after successful download

**Given** the user initiates a database export  
**And** the temporary file is created at `/tmp/inventory-backup-2024-12-28-150000.json`  
**When** the file download completes successfully  
**Then** the temporary file is deleted from `/tmp` directory within 1 second  
**And** no orphaned export files remain on the server

#### Scenario: Export file cleanup handles download interruption

**Given** the user initiates a database export  
**And** the temporary file is created  
**When** the download is interrupted (network error)  
**Then** the temporary file is still deleted from `/tmp` directory  
**And** the server does not accumulate failed export files
