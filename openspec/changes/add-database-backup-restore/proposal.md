# Proposal: Add Database Backup and Restore

## Problem Statement

Users need a way to safely test changes and workflows without risking their production data. Currently, there is no built-in mechanism to:
- Export the entire database state as a portable file
- Restore a previously exported database state
- Rollback to a known-good state after testing

This creates significant friction for:
- Testing year-end count workflows without permanently affecting data
- Experimenting with purchase entries and inventory adjustments
- Training new users on a copy of real data
- Recovering from accidental data modifications

## Proposed Solution

Add database backup and restore functionality accessible from the web interface:

1. **Export Database**: Download entire database as a JSON file containing all tables (suppliers, products, purchase lots, year-end counts, etc.)
2. **Import Database**: Upload and restore a previously exported JSON file, replacing current database contents
3. **UI Integration**: Add a dedicated "Backup & Restore" section in the settings or dashboard

**Key Benefits:**
- Users can create snapshots before risky operations
- Test workflows can be practiced and rolled back
- Data can be migrated between environments (dev, staging, production)
- Manual backups complement automatic year-end backups

## User Impact

**Existing Users:**
- New optional feature - no breaking changes to existing workflows
- Complements existing year-end backup system
- Does not replace automatic GCS backups (those remain for compliance)

**New Capabilities:**
- On-demand full database export (JSON format)
- On-demand database restore from JSON backup
- Timestamp-based backup file naming
- Visual feedback during export/import operations
- Data validation before import to prevent corruption

## Technical Approach

### Backend API
- `POST /api/backup/export` - Generate full database JSON export
- `POST /api/backup/import` - Restore database from uploaded JSON file
- Use Prisma transactions for atomic import operations
- Include metadata (export timestamp, version, database schema version)

### Export Strategy
- Query all tables using Prisma
- Serialize to JSON with proper relationship ordering
- Include foreign key relationships for referential integrity
- Generate downloadable file with timestamp

### Import Strategy
- Validate JSON structure before import
- Clear existing data in transaction (optional, user-confirmed)
- Import in dependency order (units → suppliers → products → purchases → year-end counts)
- Verify foreign key integrity
- Rollback on any error

### UI Changes
- Add "Backup & Restore" view or settings section
- Export button: Downloads `inventory-backup-YYYY-MM-DD-HHmmss.json`
- Import button: File upload with confirmation dialog
- Progress indicators for long-running operations
- Warning dialogs for destructive restore operation

### Data Format
```json
{
  "version": "1.0",
  "exportedAt": "2024-12-28T10:00:00Z",
  "schemaVersion": "current",
  "data": {
    "units": [...],
    "suppliers": [...],
    "products": [...],
    "productSuppliers": [...],
    "purchaseBatches": [...],
    "purchaseLots": [...],
    "yearEndCounts": [...],
    "yearEndCountItems": [...],
    "lockedYears": [...],
    "yearUnlockAudits": [...]
  }
}
```

## Risks & Mitigations

**Risk**: Accidental data loss during restore
- **Mitigation**: Require explicit confirmation with warning message, option to export current state before import

**Risk**: Import of corrupted or incompatible JSON
- **Mitigation**: Validate JSON structure and schema version before processing, use transactions with rollback

**Risk**: Performance impact on large databases
- **Mitigation**: Stream large exports, show progress indicators, run as background job for very large datasets

**Risk**: Security - unauthorized access to sensitive data
- **Mitigation**: Require authentication, only allow authenticated users to export/import

**Risk**: Version mismatch between export and current schema
- **Mitigation**: Include schema version in export, reject imports from incompatible versions

## Open Questions

1. **Scope of Restore**: Should restore be:
   - Full replace (delete all data, import new) - **Recommended for testing use case**
   - Merge (add new records, update existing) - More complex, higher risk of conflicts
   
2. **User Data**: Should the export include:
   - User accounts (passwords) - **No for security**
   - Only data tables - **Yes, recommended**

3. **Locked Years**: Should restore:
   - Preserve locked year status - **Yes, to maintain data integrity**
   - Reset all locks - **No, could violate audit requirements**

4. **File Size Limits**: What's the maximum database size to support?
   - **Recommended**: 100MB JSON file (~10,000 products, ~50,000 purchase lots)
   - Larger databases should use database-native backup tools

5. **Authentication**: Should this feature require:
   - Any authenticated user - **Yes, for simplicity**
   - Admin-only permission - **No, adds complexity (future enhancement)**

## Success Criteria

1. User can export entire database as JSON file via web interface
2. User can import previously exported JSON file via web interface
3. Import completely replaces database contents (after confirmation)
4. All relationships and foreign keys preserved correctly
5. Export includes metadata (timestamp, version)
6. Import validates JSON structure before processing
7. Import runs in transaction with rollback on error
8. UI provides clear feedback during export/import operations
9. Warning dialogs prevent accidental data loss
10. Zero downtime for export operation (read-only)
11. System remains functional after successful import
