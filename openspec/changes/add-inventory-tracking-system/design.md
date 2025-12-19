# Design: Full-Stack FIFO Inventory Tracking System

## Context

This is a greenfield full-stack application for inventory tracking with FIFO cost accounting. The system must:
- Track supplier and product data
- Record purchases with units and costs
- Calculate inventory value using FIFO across multiple years
- Support year-end inventory counts with database locking
- Generate reports and backup data to Google Cloud Storage
- Start with SQLite but support migration to MariaDB

**Stakeholders**: Company inventory managers, accountants, year-end auditors

**Constraints**:
- Simple authentication (no complex roles)
- Must accurately track FIFO across year boundaries
- Year-end backups must be immutable
- Database must be portable (SQLite → MariaDB)

## Goals / Non-Goals

**Goals**:
- Accurate FIFO inventory valuation across years
- Simple, intuitive UI for inventory management
- Reliable year-end count and backup process
- Database portability (SQLite ↔ MariaDB)
- Cloud backup integration

**Non-Goals**:
- Multi-user role/permission system
- Real-time inventory tracking (focus on year-end counts)
- Mobile app (web-only)
- Multi-currency support
- Integration with external accounting systems (v1)

## Decisions

### 1. FIFO Implementation Strategy

**Decision**: Store purchases as discrete "lots" with remaining quantity tracked per lot.

**Rationale**:
- Each purchase creates a lot with: product, quantity, unit cost, purchase date
- A `remainingQuantity` field tracks unconsumed units
- Year-end count reduces `remainingQuantity` following FIFO order (oldest first)
- This allows accurate cost calculation: sum(lot.remainingQuantity × lot.unitCost)

**Alternatives considered**:
- Transaction-based ledger: More complex, harder to query current state
- Aggregated inventory: Loses granular cost tracking needed for FIFO

### 2. Database Strategy

**Decision**: Use Prisma with abstract provider configuration. Start with SQLite, support MariaDB migration.

**Rationale**:
- Prisma supports both SQLite and MariaDB with minimal schema changes
- SQLite perfect for single-user/small deployments (simple file-based)
- MariaDB for scaling to multiple concurrent users
- Schema design compatible with both (avoid SQLite-specific features)

**Migration Path**:
1. Export data from SQLite
2. Update Prisma schema provider
3. Run migrations on MariaDB
4. Import data

### 3. Year-End Count Process

**Decision**: Multi-step workflow: Count Entry → Validation → Report → User Confirmation → Backup & Lock

**Workflow**:
1. User initiates year-end count for year YYYY
2. System generates count sheet with all products (sorted alphabetically)
3. User performs physical count using one of these methods:
   - **Online**: Enter counts directly in web app with auto-save
   - **Offline**: Print/export count sheet, manually count, then import CSV
4. System calculates real-time variance as counts are entered
5. Generate report showing discrepancies and FIFO values
6. User confirms accuracy
7. System:
   - Updates lot quantities to match count (consuming oldest first)
   - Creates backup file with timestamp
   - Uploads to Google Cloud Storage
   - Marks year YYYY as "locked" (prevents edits)

**Count Sheet UI Design**:
```
Year-End Inventory Count - 2024
Progress: 15 / 50 products counted

[Export to PDF] [Export to CSV] [Import from CSV]

+------------------------------------------------------------------+
| Product Name          | Expected | Actual Count | Variance       |
|                       | Quantity | (input)      |                |
+------------------------------------------------------------------+
| Bolt 10mm            |    120   |  [115___]    |  -5 (red)      |
| Bolt 12mm            |     85   |  [85____]    |   0 ✓ (exact)  |
| Gasket Ring A        |    450   |  [______]    |   - (pending)  |  ← highlighted
| Nut M10              |    300   |  [310___]    |  +10 (green)   |
| Widget Standard      |     10   |  [5_____]    |  -5 (red)      |
| Widget Premium       |     10   |  [______]    |   - (pending)  |  ← highlighted
+------------------------------------------------------------------+

Total Expected: 975 | Total Counted: 515 | Remaining: 2 products

[Save Draft] [Preview Report] [Confirm Count]
```

**Key UI Features**:
- Alphabetical sorting for easy product lookup during physical count
- Real-time variance calculation with color coding (green +, red -, exact match ✓)
- Auto-save draft counts (employee can pause/resume)
- Progress indicator shows completion status
- Empty fields highlighted to show what needs counting
- Keyboard-friendly (Tab to next field, Enter to save)
- Mobile/tablet responsive for warehouse use
- Export/Import CSV for offline counting workflows
- Print-friendly PDF with blank Actual Count column

**Rationale**:
- User confirmation prevents accidental data loss
- Backup before finalizing provides rollback capability
- Locked years ensure historical data integrity
- Alphabetical sorting matches physical warehouse organization
- Multiple input methods (online/offline) support different workflows
- Real-time variance helps catch counting errors immediately

### 4. Architecture: Monolithic with Clear Separation

**Decision**: Single repository with `/backend` and `/frontend` directories.

**Structure**:
```
/backend
  /src
    /routes       # Express routes
    /services     # Business logic (FIFO, reports, backup)
    /prisma       # Schema and migrations
    /middleware   # Auth, validation
    server.js
/frontend
  /src
    /components   # Vue components
    /views        # Page views
    /services     # API client
    /stores       # Pinia state management
```

**Rationale**:
- Simple deployment (single repo)
- Clear boundaries between API and UI
- Easy to split into microservices later if needed

### 5. Backup Strategy

**Decision**: Create SQLite file snapshot (or SQL dump for MariaDB) and upload to Google Cloud Storage with naming: `inventory-backup-{year}-{timestamp}.db`

**Rationale**:
- SQLite: Simple file copy
- MariaDB: `mysqldump` for portability
- GCS provides durability and versioning
- Timestamp prevents overwrites

**Configuration**:
- GCS bucket name in environment variable
- Service account key for authentication
- Retention policy managed in GCS (e.g., keep 10 years)

### 6. Reporting Design

**Decision**: Server-side report generation returning JSON. Frontend renders as HTML tables with export to CSV/PDF.

**Reports**:
1. **Purchase History**: All purchases for year, plus past-year purchases with remaining inventory
   - Columns: Date, Product, Supplier, Quantity, Unit Cost, Remaining Quantity
   - Filter: Year, Product, Supplier
2. **Year-End Inventory Report**: Snapshot after count confirmation
   - Columns: Product, Total Quantity, Total Value, Lot Breakdown
   - Frozen after year lock

**Rationale**:
- JSON API allows flexibility (web, future mobile, exports)
- CSV/PDF export for auditing and external use

## Data Model

### Core Entities

**Supplier**
- id, name, contactInfo, createdAt

**Product**
- id, name, description, supplierId (FK), createdAt

**PurchaseLot**
- id, productId (FK), supplierId (FK), purchaseDate, quantity, unitCost, remainingQuantity, year

**YearEndCount**
- id, year, status (draft|confirmed), confirmedAt, backupPath

**YearEndCountItem**
- id, yearEndCountId (FK), productId (FK), expectedQuantity, countedQuantity, variance, value

### Relationships
- Product → Supplier (many-to-one)
- PurchaseLot → Product (many-to-one)
- PurchaseLot → Supplier (many-to-one)
- YearEndCount → YearEndCountItem (one-to-many)
- YearEndCountItem → Product (many-to-one)

## Security Considerations

1. **Authentication**: Simple username/password (stored hashed with bcrypt)
2. **Authorization**: All authenticated users have full access (no roles)
3. **Data Integrity**:
   - Locked years cannot be modified (enforced in API)
   - Backup verification (checksum validation)
4. **Cloud Security**: GCS service account with minimal permissions (storage.objects.create)

## Performance Considerations

- **FIFO Calculation**: 
  - **CRITICAL**: All lot queries MUST use `ORDER BY purchaseDate ASC` (oldest first)
  - Database index on `(productId, purchaseDate, remainingQuantity)` enforces efficient FIFO ordering
  - This index is mandatory for data integrity and cannot be removed
- **Report Generation**: Cache year-end reports after confirmation (immutable)
- **Database Size**: SQLite handles millions of rows; migrate to MariaDB if >10GB or concurrent users >5

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Year-end count errors | Incorrect valuation | Multi-step validation, user confirmation, pre-backup |
| Cloud backup failure | Lost historical data | Retry logic, local backup fallback, monitoring |
| FIFO calculation bugs | Wrong costs | Comprehensive unit tests, manual verification in reports |
| SQLite concurrency limits | Lock errors with multiple users | Migration path to MariaDB documented |
| Data loss during migration | Business disruption | Detailed migration guide, test environment validation |

## Migration Plan

### Phase 1: Initial Deployment (SQLite)
1. Initialize Prisma with SQLite provider
2. Create schema and seed test data
3. Build and deploy backend API
4. Build and deploy frontend
5. Configure GCS backup

### Phase 2: MariaDB Migration (when needed)
1. Set up MariaDB instance
2. Update Prisma schema provider to `mysql`
3. Run `prisma migrate deploy`
4. Export SQLite data (custom script)
5. Import into MariaDB
6. Update connection string in environment
7. Test thoroughly before switching production

**Rollback**: Keep SQLite file as backup during transition period

## Open Questions

1. **Inventory adjustments**: How to handle damaged/lost inventory mid-year? (Proposal: Add manual adjustment feature in v2)
2. **Multi-location**: Future requirement? (Proposal: Add locationId to PurchaseLot in v2)
3. **Batch imports**: Import purchases from CSV? (Proposal: Add in v1.1 if needed)
4. **Audit trail**: Track who made changes? (Proposal: Add audit log table if compliance requires)

## Testing Strategy

1. **Unit Tests**: FIFO logic, cost calculations, backup/restore
2. **Integration Tests**: API endpoints, database operations
3. **E2E Tests**: Full year-end count workflow
4. **Manual Testing**: Year-end process with sample data spanning 3 years
