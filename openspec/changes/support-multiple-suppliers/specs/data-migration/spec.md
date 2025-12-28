# Spec: Data Migration for Multi-Supplier Support

## Overview
Migrate existing single-supplier product data to the new many-to-many model without data loss.

## ADDED Requirements

### Requirement: Preserve All Existing Product-Supplier Relationships
Migration SHALL create ProductSupplier records from existing Product.supplierId values.

#### Scenario: Migrate products with suppliers
**Given** Product table has 100 products with supplierId values  
**When** running the migration  
**Then** ProductSupplier table must contain 100 records  
**And** each record must match the original product-supplier pair  
**And** createdAt must preserve the product's original createdAt

### Requirement: Set Preferred Costs from Recent Purchases
Migration SHALL populate preferredUnitCost from historical purchase data where available.

#### Scenario: Populate preferred cost from latest purchase
**Given** product 1 was last purchased from supplier 5 at cost 1200.00  
**When** creating the ProductSupplier record during migration  
**Then** preferredUnitCost must be set to 1200.00

#### Scenario: Leave preferred cost null when no purchases exist
**Given** product 10 has never been purchased (new product)  
**When** creating the ProductSupplier record  
**Then** preferredUnitCost must be null

### Requirement: Atomic Migration with Rollback
Migration SHALL complete fully or roll back entirely to prevent data corruption.

#### Scenario: Successful migration commits all changes
**Given** migration starts  
**When** all steps complete successfully  
**Then** database must commit:
- New ProductSupplier table
- Migrated data
- Removed supplierId column

#### Scenario: Failed migration rolls back
**Given** migration encounters an error during execution  
**When** the error occurs  
**Then** all changes must be rolled back  
**And** database must remain in pre-migration state  
**And** error details must be logged

### Requirement: Validate Migration Integrity
Post-migration validation SHALL confirm data integrity.

#### Scenario: All products have at least one supplier
**Given** migration has completed  
**When** validating the data  
**Then** every Product must have at least one ProductSupplier record

#### Scenario: No duplicate associations created
**Given** migration has completed  
**When** querying ProductSupplier  
**Then** no duplicate (productId, supplierId) pairs must exist

## Migration Steps

1. **Backup**: Create full database backup before starting
2. **Create Table**: Add ProductSupplier table with indexes
3. **Migrate Data**: Insert records from Product.supplierId
4. **Populate Costs**: Update preferredUnitCost from recent purchases
5. **Validate**: Check all products have suppliers
6. **Remove Column**: Drop Product.supplierId
7. **Regenerate**: Run `prisma generate` to update client

## Rollback Procedure

If migration fails or issues discovered post-deployment:
1. Restore database from backup
2. Revert Prisma schema changes
3. Regenerate Prisma client
4. Restart application with previous version
