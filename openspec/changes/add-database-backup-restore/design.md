# Design: Database Backup and Restore

## Overview

This feature provides on-demand database backup and restore capabilities through the web interface, enabling users to create snapshots before testing workflows and restore to known-good states.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  BackupRestoreView.vue                                 │ │
│  │  - Export Button → Downloads JSON                      │ │
│  │  - Import Button → Upload JSON + Confirmation Dialog   │ │
│  │  - Progress Indicators                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /api/backup/export (POST)                             │ │
│  │  → backupService.exportDatabase()                      │ │
│  │  → Returns JSON file download                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  /api/backup/import (POST)                             │ │
│  │  → backupService.importDatabase()                      │ │
│  │  → Returns success/error                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite/MariaDB)                 │
│  - Units, Suppliers, Products, ProductSuppliers             │
│  - PurchaseBatches, PurchaseLots                            │
│  - YearEndCounts, YearEndCountItems                         │
│  - LockedYears, YearUnlockAudits                            │
│  - Users (excluded from backup)                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### JSON Export Format

```typescript
interface DatabaseBackup {
  version: string;                    // Format version (e.g., "1.0")
  exportedAt: string;                 // ISO timestamp
  schemaVersion: string;              // Database schema version
  data: {
    units: Unit[];
    suppliers: Supplier[];
    products: Product[];
    productSuppliers: ProductSupplier[];
    purchaseBatches: PurchaseBatch[];
    purchaseLots: PurchaseLot[];
    yearEndCounts: YearEndCount[];
    yearEndCountItems: YearEndCountItem[];
    lockedYears: LockedYear[];
    yearUnlockAudits: YearUnlockAudit[];
    // Note: Users table excluded for security
  };
}
```

### Import Order (Dependency Resolution)

Must import in this specific order to maintain referential integrity:

1. **Units** (no dependencies)
2. **Suppliers** (no dependencies)
3. **Products** (depends on: Units)
4. **ProductSuppliers** (depends on: Products, Suppliers)
5. **PurchaseBatches** (depends on: Suppliers)
6. **PurchaseLots** (depends on: Products, Suppliers, PurchaseBatches)
7. **YearEndCounts** (no dependencies)
8. **YearEndCountItems** (depends on: YearEndCounts, Products)
9. **LockedYears** (no dependencies)
10. **YearUnlockAudits** (no dependencies)

## Backend Implementation

### Service Layer: `backupService.ts`

```typescript
interface BackupService {
  /**
   * Export entire database to JSON
   * - Queries all tables using Prisma
   * - Serializes to JSON with metadata
   * - Returns file path for download
   */
  exportDatabase(): Promise<string>;

  /**
   * Import database from JSON file
   * - Validates JSON structure
   * - Clears existing data in transaction
   * - Imports in dependency order
   * - Rolls back on error
   */
  importDatabase(jsonContent: string): Promise<ImportResult>;

  /**
   * Validate backup file structure
   * - Checks version compatibility
   * - Validates required fields
   * - Returns validation errors if any
   */
  validateBackup(jsonContent: string): ValidationResult;
}

interface ImportResult {
  success: boolean;
  recordsImported: {
    units: number;
    suppliers: number;
    products: number;
    purchaseLots: number;
    // ... etc
  };
  errors?: string[];
}
```

### API Routes: `routes/backup.ts`

```typescript
// POST /api/backup/export
// Returns: File download (application/json)
router.post('/export', authMiddleware, async (req, res) => {
  // Generate JSON export
  // Return as downloadable file
});

// POST /api/backup/import
// Body: { confirm: boolean }
// File: multipart/form-data (JSON file)
// Returns: { success: boolean, recordsImported: {...} }
router.post('/import', authMiddleware, upload.single('file'), async (req, res) => {
  // Validate confirmation
  // Parse uploaded JSON
  // Validate structure
  // Import in transaction
  // Return results
});
```

## Frontend Implementation

### View: `BackupRestoreView.vue`

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│ Backup & Restore                                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Export Database                                  │ │
│  │ Download a complete backup of your database      │ │
│  │ [Download Backup] 💾                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Import Database                                  │ │
│  │ ⚠️ Warning: This will replace all current data   │ │
│  │ [Choose File] [Import] 📁                        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Last Export: 2024-12-28 10:30:00                     │
└────────────────────────────────────────────────────────┘
```

**Confirmation Dialog (Import):**
```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Confirm Database Restore                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│ This will permanently delete all current data and      │
│ replace it with the backup file contents.             │
│                                                        │
│ Backup file: inventory-backup-2024-12-27.json         │
│ Exported: 2024-12-27 15:30:00                         │
│                                                        │
│ ☑️ I understand this cannot be undone                  │
│                                                        │
│ [Cancel]  [Restore Database]                          │
└────────────────────────────────────────────────────────┘
```

## Transaction & Rollback Strategy

### Import Transaction Flow

```typescript
// Pseudocode for import transaction
await prisma.$transaction(async (tx) => {
  // 1. Delete existing data (in reverse dependency order)
  await tx.yearUnlockAudit.deleteMany({});
  await tx.lockedYear.deleteMany({});
  await tx.yearEndCountItem.deleteMany({});
  await tx.yearEndCount.deleteMany({});
  await tx.purchaseLot.deleteMany({});
  await tx.purchaseBatch.deleteMany({});
  await tx.productSupplier.deleteMany({});
  await tx.product.deleteMany({});
  await tx.supplier.deleteMany({});
  await tx.unit.deleteMany({});

  // 2. Import new data (in dependency order)
  await tx.unit.createMany({ data: backup.data.units });
  await tx.supplier.createMany({ data: backup.data.suppliers });
  // ... continue for all tables

  // If any step fails, entire transaction rolls back
});
```

### Error Handling

- **Validation Errors**: Reject before transaction starts
- **Foreign Key Errors**: Caught during import, transaction rolled back
- **Network Errors**: File upload retries, timeout handling
- **Disk Space**: Check available space before export

## Security Considerations

### Authentication
- All backup/restore operations require authentication
- Use existing JWT authentication middleware
- No special admin role required (all authenticated users can backup/restore)

### Data Exclusions
- **Users table**: Excluded from backup/restore to prevent password leaks
- Current authenticated user persists after import
- System retains at least one admin user

### File Validation
- Validate JSON structure before processing
- Check file size limits (max 100MB recommended)
- Verify schema version compatibility
- Sanitize file names to prevent path traversal

## Performance Considerations

### Export Performance
- **Small databases (<1000 products)**: Immediate response (~1-2 seconds)
- **Medium databases (1000-5000 products)**: Streaming response (~5-10 seconds)
- **Large databases (>5000 products)**: Background job with polling (future enhancement)

### Import Performance
- Transaction-based import ensures atomicity
- Progress feedback via websocket or polling (future enhancement)
- Current implementation: synchronous with timeout (2 minutes max)

### Database Lock Considerations
- Export: Read-only, no locks required
- Import: Exclusive write lock during transaction
- Recommend scheduling imports during low-usage periods

## File Management

### Export Files
- Generated in `/tmp` directory
- Format: `inventory-backup-YYYY-MM-DD-HHmmss.json`
- Cleaned up after download
- No persistent storage on server

### Import Files
- Uploaded to `/tmp` via multipart form
- Validated before processing
- Deleted after import (success or failure)
- Size limit: 100MB (configurable)

## Future Enhancements

### Phase 1 (Current Proposal)
- Full database export/import
- Web UI with confirmation dialogs
- Basic validation and error handling

### Phase 2 (Future)
- Incremental backups (export only changes since last backup)
- Selective table export/import
- Merge mode (add/update instead of replace)
- Scheduled automatic backups

### Phase 3 (Future)
- Backup compression (gzip)
- Encryption of backup files
- Cloud storage integration (S3, GCS)
- Multi-version restore (choose from backup history)

## Testing Strategy

### Unit Tests
- `backupService.exportDatabase()` - verify JSON structure
- `backupService.importDatabase()` - verify data restoration
- `backupService.validateBackup()` - verify validation logic

### Integration Tests
- Export endpoint returns valid JSON
- Import endpoint restores data correctly
- Transaction rollback on import error
- Foreign key integrity maintained

### E2E Tests
- User exports database via UI
- User imports database via UI
- User sees confirmation dialog before import
- User can cancel import operation

### Manual Tests
- Export with large dataset (1000+ products)
- Import with corrupted JSON (should reject)
- Import with incompatible schema version (should reject)
- Import interruption (network loss) - should rollback

## Rollout Plan

1. **Backend**: Implement `backupService` and API routes
2. **API Testing**: Test export/import via Postman/curl
3. **Frontend**: Implement `BackupRestoreView.vue`
4. **Integration Testing**: Test full workflow via UI
5. **Documentation**: Update user guide with backup/restore instructions
6. **Deployment**: Feature flag for gradual rollout (optional)

## Migration & Compatibility

### Schema Version Tracking
- Export includes current Prisma schema version
- Import validates schema compatibility
- Reject imports from future schema versions
- Warn on imports from older schema versions (allow with confirmation)

### Backward Compatibility
- Format version in export metadata
- Future format changes increment version number
- Parser handles multiple format versions
