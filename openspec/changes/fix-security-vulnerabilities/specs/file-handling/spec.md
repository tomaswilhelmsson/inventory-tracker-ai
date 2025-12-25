# File Upload Security and Temporary File Management

## ADDED Requirements

### Requirement: CSV Upload Size Limits
The system SHALL enforce file size limits on CSV uploads to prevent denial of service attacks.

#### Scenario: CSV upload within size limit
- **WHEN** a user uploads a CSV file of 5MB or less
- **THEN** the file SHALL be accepted and processed

#### Scenario: CSV upload exceeding size limit
- **WHEN** a user attempts to upload a CSV file larger than 5MB
- **THEN** the upload SHALL be rejected
- **AND** return 400 Bad Request with error message specifying the size limit
- **AND** no file SHALL be written to disk

### Requirement: CSV Upload File Type Validation
The system SHALL validate that uploaded files are CSV format to prevent malicious file uploads.

#### Scenario: Valid CSV file upload
- **WHEN** a user uploads a file with MIME type "text/csv" or filename ending in ".csv"
- **THEN** the file SHALL be accepted for processing

#### Scenario: Non-CSV file upload
- **WHEN** a user attempts to upload a file that is not CSV format
- **THEN** the upload SHALL be rejected
- **AND** return error message "Only CSV files are allowed"
- **AND** no file SHALL be written to disk

### Requirement: Multiple File Upload Prevention
The system SHALL limit uploads to a single file per request.

#### Scenario: Single file upload
- **WHEN** a user uploads exactly one file
- **THEN** the file SHALL be processed

#### Scenario: Multiple file upload attempt
- **WHEN** a user attempts to upload more than one file in a single request
- **THEN** the upload SHALL be rejected
- **AND** return error indicating only one file allowed per request

### Requirement: Temporary File Cleanup
The system SHALL periodically clean up temporary files to prevent disk space exhaustion.

#### Scenario: Recent temporary files retained
- **WHEN** the cleanup process runs
- **AND** temporary files exist that are less than 24 hours old
- **THEN** those files SHALL be retained

#### Scenario: Old temporary files removed
- **WHEN** the cleanup process runs
- **AND** temporary files exist that are 24 hours or older
- **THEN** those files SHALL be deleted
- **AND** errors during deletion SHALL be logged but not halt the process

#### Scenario: Periodic cleanup execution
- **WHEN** the server is running
- **THEN** the temporary file cleanup process SHALL execute every hour

### Requirement: Upload Error Handling
The system SHALL properly clean up temporary files when upload processing fails.

#### Scenario: Upload processing fails
- **WHEN** a CSV upload is accepted but processing fails (e.g., invalid data)
- **THEN** the temporary file SHALL be deleted
- **AND** appropriate error SHALL be returned to the user
- **AND** no orphaned files SHALL remain
