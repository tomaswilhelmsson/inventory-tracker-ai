# Database Backup

## ADDED Requirements

### Requirement: Create Database Backup
The system SHALL create a database backup file when year-end count is confirmed.

#### Scenario: Create SQLite backup file
- **WHEN** using SQLite and year-end count for 2024 is confirmed at 2024-12-31 14:30:00
- **THEN** the system creates a backup file named "inventory-backup-2024-20241231143000.db"

#### Scenario: Create MariaDB backup dump
- **WHEN** using MariaDB and year-end count for 2024 is confirmed at 2024-12-31 14:30:00
- **THEN** the system creates a SQL dump file named "inventory-backup-2024-20241231143000.sql"

#### Scenario: Store backup path in count record
- **WHEN** a backup is created for year-end count
- **THEN** the system stores the backup file path in the YearEndCount record

### Requirement: Upload Backup to Google Cloud Storage
The system SHALL upload database backup files to Google Cloud Storage.

#### Scenario: Upload backup to GCS bucket
- **WHEN** a backup file is created
- **THEN** the system uploads the file to the configured GCS bucket

#### Scenario: Use service account authentication
- **WHEN** uploading to GCS
- **THEN** the system authenticates using service account credentials from environment configuration

#### Scenario: Verify successful upload
- **WHEN** backup upload completes
- **THEN** the system verifies the file exists in GCS and logs the GCS path

#### Scenario: Retry failed uploads
- **WHEN** backup upload to GCS fails
- **THEN** the system retries up to 3 times with exponential backoff

#### Scenario: Fallback to local backup on GCS failure
- **WHEN** GCS upload fails after all retries
- **THEN** the system keeps the local backup file and logs an error for manual intervention

### Requirement: Backup File Naming Convention
The system SHALL use consistent naming for backup files to ensure uniqueness and traceability.

#### Scenario: Include year in filename
- **WHEN** a backup is created for year 2024
- **THEN** the filename includes "2024"

#### Scenario: Include timestamp in filename
- **WHEN** a backup is created at 2024-12-31 14:30:00
- **THEN** the filename includes "20241231143000" timestamp

#### Scenario: Include database type extension
- **WHEN** backing up SQLite database
- **THEN** the filename uses ".db" extension
- **WHEN** backing up MariaDB database  
- **THEN** the filename uses ".sql" extension

### Requirement: Backup Integrity Verification
The system SHALL verify backup file integrity before and after upload.

#### Scenario: Calculate local file checksum
- **WHEN** a backup file is created locally
- **THEN** the system calculates a SHA-256 checksum of the file

#### Scenario: Verify uploaded file matches local
- **WHEN** a backup is uploaded to GCS
- **THEN** the system compares the GCS file checksum with the local checksum

#### Scenario: Alert on checksum mismatch
- **WHEN** GCS checksum does not match local checksum
- **THEN** the system logs a critical error and alerts the user

### Requirement: Configure GCS Bucket
The system SHALL use environment configuration for GCS bucket settings.

#### Scenario: Read GCS bucket name from environment
- **WHEN** the system initializes GCS backup service
- **THEN** it reads the bucket name from GCS_BUCKET_NAME environment variable

#### Scenario: Read service account key path from environment
- **WHEN** the system initializes GCS backup service
- **THEN** it reads the service account key file path from GCS_KEY_FILE environment variable

#### Scenario: Validate GCS configuration on startup
- **WHEN** the application starts
- **THEN** the system validates that GCS_BUCKET_NAME and GCS_KEY_FILE are configured and accessible

#### Scenario: Fail gracefully with missing GCS config
- **WHEN** GCS configuration is missing or invalid
- **THEN** the system logs a warning and disables cloud backup, keeping local backup only

### Requirement: Backup Storage Management
The system SHALL manage backup storage and retention.

#### Scenario: Keep local backup after upload
- **WHEN** a backup is successfully uploaded to GCS
- **THEN** the system retains the local backup file in a designated backups directory

#### Scenario: Local backup directory organization
- **WHEN** local backups are stored
- **THEN** the system organizes them in "./backups/" directory with year subdirectories

#### Scenario: List available backups
- **WHEN** a user requests available backups
- **THEN** the system lists all local backup files and their corresponding GCS paths
