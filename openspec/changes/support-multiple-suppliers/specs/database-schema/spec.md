# Spec: Database Schema for Multi-Supplier Products

## Overview
Transform the product-supplier relationship from one-to-one to many-to-many using a junction table.

## ADDED Requirements

### Requirement: ProductSupplier Junction Table
The system SHALL maintain many-to-many relationships between products and suppliers.

#### Scenario: Create junction table with required fields
**Given** the database is being migrated to support multiple suppliers  
**When** the ProductSupplier table is created  
**Then** it must include:
- `id` (primary key, auto-increment)
- `productId` (foreign key to Product, not null)
- `supplierId` (foreign key to Supplier, not null)
- `preferredUnitCost` (nullable Float for supplier-specific pricing)
- `createdAt` (timestamp, defaults to current time)

#### Scenario: Enforce unique product-supplier combinations
**Given** a product has been associated with a supplier  
**When** attempting to create a duplicate product-supplier association  
**Then** the database must reject the operation with a unique constraint violation

#### Scenario: Cascade delete product-supplier associations
**Given** a product has multiple supplier associations  
**When** the product is deleted  
**Then** all ProductSupplier records for that product must be automatically deleted

**Given** a supplier has multiple product associations  
**When** the supplier is deleted  
**Then** all ProductSupplier records for that supplier must be automatically deleted

#### Scenario: Index for reverse supplier lookups
**Given** a supplier may have many products  
**When** querying all products from a specific supplier  
**Then** the query must use an index on `supplierId` for optimal performance

### Requirement: Store Supplier-Specific Pricing
The system SHALL optionally track preferred or historical unit costs per supplier-product combination.

#### Scenario: Allow null preferred unit cost
**Given** a new product-supplier association is created  
**When** no price information is available  
**Then** the `preferredUnitCost` field must accept null values

#### Scenario: Store positive unit costs only
**Given** a preferred unit cost is being set  
**When** the cost is zero or negative  
**Then** the system must reject the value  
**And** require a positive decimal number

## MODIFIED Requirements

### Requirement: Remove Single-Supplier Constraint from Product
Products SHALL support multiple suppliers instead of a single supplier.

#### Scenario: Remove supplierId column from Product table
**Given** the Product table has been migrated  
**When** querying the Product schema  
**Then** the `supplierId` column must not exist  
**And** the product must have a `suppliers` relationship to ProductSupplier

#### Scenario: Update Product-Supplier relationship
**Given** a product exists  
**When** querying its suppliers  
**Then** the system must return an array of ProductSupplier records  
**And** each record must include supplier details

### Requirement: Update Supplier Model
Suppliers SHALL reference products through the junction table.

#### Scenario: Replace direct product relationship
**Given** the Supplier table has been migrated  
**When** querying supplier's products  
**Then** the system must use the ProductSupplier junction table  
**And** not have a direct `products` relationship to Product model

## REMOVED Requirements

### Requirement: Product Single Supplier Constraint
~~Products SHALL have exactly one supplier.~~

**Rationale**: Replaced with many-to-many relationship to support real-world supply chains where products can be sourced from multiple vendors.

## Data Integrity Constraints

1. **ProductSupplier** must enforce referential integrity:
   - `productId` must reference valid Product
   - `supplierId` must reference valid Supplier
   - Unique constraint on `(productId, supplierId)` pair

2. **Cascade behavior**:
   - Deleting Product → Delete all ProductSupplier records
   - Deleting Supplier → Delete all ProductSupplier records
   - Deleting ProductSupplier → No cascade (leaf record)

3. **PurchaseLot integrity**:
   - Existing `supplierId` field remains unchanged
   - No foreign key constraint to ProductSupplier (independent tracking)
   - Historical purchases preserve supplier information even if association removed

## Performance Requirements

1. **Index coverage**:
   - Primary key on `id`
   - Unique composite index on `(productId, supplierId)`
   - Non-unique index on `supplierId` for reverse lookups

2. **Query efficiency**:
   - Loading products with suppliers: Single query with eager loading
   - Finding all products from supplier: Index scan on `supplierId`
   - Target: <100ms for product list with 1000 records

## Migration Requirements

1. **Zero data loss**: All existing product-supplier relationships must be preserved in ProductSupplier table
2. **Atomic migration**: Schema changes must complete in single transaction or roll back entirely
3. **Backwards compatibility**: Export/import of old format must remain supported during transition period
