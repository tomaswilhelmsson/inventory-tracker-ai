# Project Context

## Purpose

Full-stack inventory tracking system for company-wide inventory management with FIFO (First-In-First-Out) cost accounting. The system manages suppliers, products, and purchases, and provides accurate year-end inventory counts with database backup to cloud storage.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Vue.js 3 (Composition API), Vite
- **Database**: SQLite (development/small scale), MariaDB (production scale)
- **ORM**: Prisma
- **Cloud Storage**: Google Cloud Storage (database backups)
- **Authentication**: Simple bcrypt-based authentication (no complex roles)

## Project Conventions

### Code Style
- TypeScript for type safety on both backend and frontend
- ESLint + Prettier for consistent formatting
- Functional programming preferred where applicable
- Clear, descriptive variable and function names

### Architecture Patterns
- Monolithic repository with `/backend` and `/frontend` separation
- Backend: Three-layer architecture (Routes → Services → Database)
- Frontend: Component-based architecture with Pinia state management
- RESTful API design
- FIFO inventory calculation as core business logic

### Testing Strategy
- Unit tests for FIFO calculation logic (critical path)
- Integration tests for API endpoints
- End-to-end tests for year-end count workflow
- Manual testing for database migration scenarios
- Security testing for authentication and data validation

### Git Workflow
- Main branch for production-ready code
- Feature branches for development
- Descriptive commit messages
- Pull requests for code review before merge

## Domain Context

### FIFO Inventory Accounting
- Purchases create discrete "lots" with quantity, unit cost, and date
- Inventory consumed from oldest lots first (First-In-First-Out)
- Year-end counts adjust lot quantities following FIFO order
- Accurate cost tracking across multiple years

### Year-End Process
1. Initiate count for specific year
2. Enter actual counted quantities per product
3. System calculates variance and FIFO values
4. User confirms accuracy
5. System updates lot quantities, locks year, creates backup

### Data Model
- **Supplier**: Company/vendor information
- **Product**: Items tracked in inventory (linked to supplier)
- **PurchaseLot**: Individual purchases with remaining quantity
- **YearEndCount**: Annual count records
- **YearEndCountItem**: Product-specific count details

## Important Constraints

- Simple authentication (no multi-user roles or permissions)
- Year-end counts are immutable after confirmation (year locking)
- Database must be portable (SQLite ↔ MariaDB)
- Cloud backups must be verified for integrity (checksums)
- FIFO calculations must be accurate across year boundaries
- Locked years prevent any data modification

## External Dependencies

- **Google Cloud Storage**: For database backup storage
  - Requires GCS bucket configuration
  - Service account authentication via key file
  - Retry logic for upload failures
  - Fallback to local backup if GCS unavailable

- **Database Providers**:
  - SQLite: Single-file database for simple deployments
  - MariaDB: For scaling to multiple concurrent users
  - Migration path documented for SQLite → MariaDB transition

## Business Rules

1. **Purchase Tracking**: Each purchase creates a lot with `quantity` and `remainingQuantity` (initially equal)
2. **FIFO Consumption**: When inventory is counted, oldest lots are depleted first
3. **Year Locking**: Once year-end count is confirmed, that year's data becomes read-only
4. **Backup Requirement**: Every year-end confirmation triggers automatic backup to GCS
5. **Cascade Protection**: Cannot delete suppliers/products with existing purchase history
6. **Inventory Reports**: Purchase history includes current year + past years with remaining inventory

## Performance Considerations

- Database indexes on `(productId, purchaseDate, remainingQuantity)` for FIFO queries
- Year-end reports cached after confirmation (immutable)
- SQLite suitable for <10GB, <5 concurrent users; migrate to MariaDB beyond that
- Backup files organized by year for efficient retrieval
