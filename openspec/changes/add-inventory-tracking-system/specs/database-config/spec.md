# Database Configuration

## ADDED Requirements

### Requirement: Support Multiple Database Providers
The system SHALL support both SQLite and MariaDB database providers using Prisma ORM.

#### Scenario: Configure SQLite provider
- **WHEN** the system is configured with DATABASE_PROVIDER="sqlite"
- **THEN** Prisma connects to SQLite database file specified in DATABASE_URL

#### Scenario: Configure MariaDB provider
- **WHEN** the system is configured with DATABASE_PROVIDER="mysql"
- **THEN** Prisma connects to MariaDB using connection string in DATABASE_URL

#### Scenario: Default to SQLite if provider not specified
- **WHEN** DATABASE_PROVIDER environment variable is not set
- **THEN** the system defaults to SQLite provider

### Requirement: Database Schema Compatibility
The system SHALL maintain schema compatibility between SQLite and MariaDB.

#### Scenario: Use compatible data types
- **WHEN** defining schema in Prisma
- **THEN** the system uses data types supported by both SQLite and MariaDB

#### Scenario: Avoid provider-specific features
- **WHEN** writing database queries
- **THEN** the system avoids SQLite-specific or MySQL-specific SQL features

#### Scenario: Test schema on both providers
- **WHEN** schema changes are made
- **THEN** the system validates migrations work on both SQLite and MariaDB

### Requirement: Database Migration Support
The system SHALL support database migrations using Prisma Migrate.

#### Scenario: Generate migration files
- **WHEN** schema changes are made
- **THEN** Prisma generates migration SQL files compatible with the configured provider

#### Scenario: Apply migrations on startup
- **WHEN** the application starts
- **THEN** the system checks for pending migrations and prompts to apply them

#### Scenario: Rollback migration support
- **WHEN** a migration fails
- **THEN** Prisma provides information for manual rollback

### Requirement: Database Connection Configuration
The system SHALL read database connection settings from environment variables.

#### Scenario: Read SQLite database path
- **WHEN** DATABASE_URL is "file:./data/inventory.db"
- **THEN** the system creates/connects to SQLite database at ./data/inventory.db

#### Scenario: Read MariaDB connection string
- **WHEN** DATABASE_URL is "mysql://user:pass@localhost:3306/inventory"
- **THEN** the system connects to MariaDB server with specified credentials

#### Scenario: Validate connection on startup
- **WHEN** the application starts
- **THEN** the system tests database connectivity and fails fast if connection cannot be established

### Requirement: SQLite to MariaDB Migration Path
The system SHALL provide a documented process for migrating from SQLite to MariaDB.

#### Scenario: Export data from SQLite
- **WHEN** migrating from SQLite to MariaDB
- **THEN** the system provides a script to export all data to JSON format

#### Scenario: Update schema provider
- **WHEN** switching from SQLite to MariaDB
- **THEN** the administrator updates DATABASE_PROVIDER and DATABASE_URL, then runs migrations

#### Scenario: Import data to MariaDB
- **WHEN** MariaDB schema is ready
- **THEN** the system provides a script to import JSON data into MariaDB

#### Scenario: Verify data integrity after migration
- **WHEN** data import completes
- **THEN** the system provides a verification script to compare record counts and validate data
