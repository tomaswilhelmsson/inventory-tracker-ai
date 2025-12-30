# Data Model Consistency Analysis

## Overview
Phase 3 analysis of database schema and data model patterns for consistency and best practices.

## Schema Review

### Database: SQLite with Prisma ORM

**Models**: 8 entities
1. Unit
2. Supplier  
3. Product
4. ProductSupplier (junction table)
5. PurchaseBatch
6. PurchaseLot
7. YearEndCount
8. YearEndCountItem

---

## Findings

### DATA-001: Consistent Naming Conventions ✓
**Severity**: INFO  
**Status**: GOOD

**Analysis**:
- ✅ All tables use snake_case mapping: `@@map("units")`, `@@map("product_suppliers")`
- ✅ All fields use camelCase in schema
- ✅ Foreign keys follow pattern: `{entity}Id`
- ✅ Junction tables named: `{Entity1}{Entity2}`
- ✅ Timestamps: `createdAt`, `confirmedAt`, `unlockedAt`

**Consistency Score**: 10/10

---

### DATA-002: Proper Relationships and Cascading ✓
**Severity**: INFO  
**Status**: GOOD

**Analysis**:
```prisma
// Product-Supplier: Cascade on delete (correct)
Product.suppliers → onDelete: Cascade
Supplier.products → onDelete: Cascade

// Product-Unit: Restrict on delete (correct - prevents orphaning)
Product.unit → onDelete: Restrict

// Purchase-Supplier: Restrict (correct - preserves historical data)
PurchaseLot.supplier → onDelete: Restrict

// Year-End Count: Cascade (correct - count items belong to count)
YearEndCountItem.yearEndCount → onDelete: Cascade
```

**Reasoning**:
- ✅ Junction table cascades are correct (clean up when either side deleted)
- ✅ Reference data uses Restrict (Units cannot be deleted if in use)
- ✅ Historical data uses Restrict (Suppliers/Products preserved even if disabled)
- ✅ Child records cascade (Count items deleted with count)

**Consistency Score**: 10/10

---

### DATA-003: Index Strategy (GOOD)
**Severity**: INFO  
**Status**: GOOD

**Indexes Found**:
```prisma
Product:
  @@index([unitId])
  @@index([isActive])

Supplier:
  @@index([isActive])

ProductSupplier:
  @@index([supplierId])

PurchaseLot:
  @@index([productId])
  @@index([supplierId])
  @@index([year])
  @@index([batchId])

YearEndCount:
  @@index([year, revision])

YearEndCountItem:
  @@index([yearEndCountId])
  @@index([productId])
```

**Analysis**:
- ✅ Foreign keys are indexed
- ✅ Frequently filtered fields indexed (`isActive`, `year`)
- ✅ Composite indexes for common queries (`year, revision`)
- ✅ No over-indexing

**Recommendation**:
Consider adding index on `PurchaseLot.purchaseDate` for date range queries.

**Consistency Score**: 9/10

---

### DATA-004: Soft Delete Pattern (EXCELLENT)
**Severity**: INFO  
**Status**: EXCELLENT

**Implementation**:
```prisma
Supplier:
  isActive Boolean @default(true)

Product:
  isActive Boolean @default(true)
```

**Features**:
- ✅ Suppliers can be disabled (hidden from dropdowns)
- ✅ Products can be disabled (hidden from forms)
- ✅ Historical data preserved
- ✅ `@@index([isActive])` for efficient filtering
- ✅ Frontend respects `isActive` flag

**Benefits**:
- Maintains referential integrity
- Preserves purchase history
- Allows reporting on discontinued products
- Can be re-enabled if needed

**Consistency Score**: 10/10

---

### DATA-005: Decimal Precision (GOOD with caveat)
**Severity**: LOW  
**Impact**: Precision in calculations  
**Effort**: Low (documentation)

**Float Fields**:
```prisma
PurchaseLot:
  quantity          Float
  unitCost          Float
  remainingQuantity Float

YearEndCountItem:
  expectedQuantity Float
  countedQuantity  Float
  valueFIFO        Float

PurchaseBatch:
  invoiceTotalInclVAT Float
  invoiceTotalExclVAT Float
  shippingCost        Float
  vatRate             Float
```

**Analysis**:
SQLite stores Float as REAL (8-byte IEEE floating point).

**Precision**:
- ✅ Sufficient for quantities (0.68, 7.6, 31.25)
- ✅ Sufficient for currency (2 decimal places)
- ⚠️ Potential rounding in calculations

**Issue**:
Floating point arithmetic can cause precision issues:
```javascript
0.1 + 0.2 = 0.30000000000000004
```

**Current Mitigation**:
- Frontend uses `toFixed(2)` for display
- Currency composable handles formatting
- Calculations done with precision awareness

**Recommendation**:
Document that:
1. All currency should be displayed with 2 decimal places
2. Quantities can have 0-2 decimal places
3. Use rounding in calculations: `Math.round(value * 100) / 100`

**Alternative**:
Consider using INTEGER with implied 2 decimal places (store cents instead of dollars), but this would require schema migration.

**Priority**: LOW - Current approach works, just needs documentation

---

### DATA-006: Audit Trail Implementation (EXCELLENT)
**Severity**: INFO  
**Status**: EXCELLENT

**Year Unlock Audit**:
```prisma
YearUnlock {
  id                Int
  year              Int
  reasonCategory    String  // enum: data_error, recount_required, audit_adjustment, other
  description       String
  unlockedAt        DateTime
}
```

**Analysis**:
- ✅ Complete audit trail
- ✅ Categorized reasons
- ✅ Required description
- ✅ Timestamp recorded
- ✅ Cannot be deleted (no cascade delete)

**Business Value**:
- Compliance with accounting standards
- Clear history of year adjustments
- Supports auditing requirements

**Consistency Score**: 10/10

---

### DATA-007: Snapshot Pattern for Historical Data (EXCELLENT)
**Severity**: INFO  
**Status**: EXCELLENT

**Implementation**:
```prisma
PurchaseLot {
  productId           Int
  supplierId          Int
  productSnapshot     String?  // JSON snapshot of product at purchase time
  supplierSnapshot    String?  // JSON snapshot of supplier
}
```

**Analysis**:
- ✅ Preserves product name even if renamed
- ✅ Preserves supplier info even if changed
- ✅ Allows historical reporting accuracy
- ✅ Refresh snapshot endpoint available

**Benefits**:
- Reports show product name as it was at purchase time
- Renaming products doesn't break historical views
- Can refresh snapshot if needed

**Trade-off**:
- Slight data duplication
- **Worth it** for data integrity

**Consistency Score**: 10/10

---

### DATA-008: Unique Constraints (GOOD)
**Severity**: INFO  
**Status**: GOOD

**Constraints**:
```prisma
Unit:
  name String @unique

Supplier:
  name String @unique

Product:
  name String @unique

ProductSupplier:
  @@unique([productId, supplierId])

YearEndCount:
  @@unique([year, revision])
```

**Analysis**:
- ✅ Prevents duplicate names
- ✅ Prevents duplicate product-supplier pairs
- ✅ Ensures one count per year-revision combo

**Potential Issue**:
Name uniqueness might be too strict. What if:
- Two suppliers have same name but different locations?
- User wants to track same product with different specs?

**Current Workaround**:
Add suffix to name: "ABC Corp (NY)", "ABC Corp (CA)"

**Recommendation**:
Consider if name uniqueness is business requirement or implementation choice.

**Priority**: INFO - Works well currently

---

### DATA-009: FIFO Implementation (EXCELLENT)
**Severity**: INFO  
**Status**: EXCELLENT

**Design**:
```prisma
PurchaseLot {
  quantity          Float
  remainingQuantity Float  // Decremented as consumed
  purchaseDate      DateTime
}
```

**FIFO Logic** (in inventoryService.ts):
1. Sort lots by `purchaseDate` ASC (oldest first)
2. Consume from `remainingQuantity` until fulfilled
3. Update `remainingQuantity` on each lot

**Analysis**:
- ✅ Mathematically correct
- ✅ Tracks lot-level inventory
- ✅ Supports multi-lot products
- ✅ Year-end count updates FIFO lots

**Test Coverage**:
- ✅ Multi-year FIFO test exists (`tests/e2e/multiYearFIFO.test.ts`)

**Consistency Score**: 10/10

---

## Data Integrity Checks

### Referential Integrity: ✅ ENFORCED
- Foreign key constraints in place
- Cascade deletes configured appropriately
- Restrict deletes prevent orphans

### Data Consistency: ✅ GOOD
- No nullable foreign keys (except optional relations)
- Required fields enforced at schema level
- Unique constraints prevent duplicates

### Temporal Data: ✅ GOOD
- All entities have `createdAt`
- Critical events have timestamps (`confirmedAt`, `unlockedAt`)
- Purchase dates tracked

---

## Summary

### Scores
- **Naming Conventions**: 10/10 ✅
- **Relationships**: 10/10 ✅
- **Indexes**: 9/10 ✅
- **Soft Deletes**: 10/10 ✅
- **Decimal Precision**: 8/10 ⚠️
- **Audit Trail**: 10/10 ✅
- **Snapshots**: 10/10 ✅
- **Unique Constraints**: 9/10 ✅
- **FIFO Logic**: 10/10 ✅

**Overall**: **9.6/10** - Excellent data model design

### Strengths
1. Consistent naming throughout
2. Proper cascade/restrict configuration
3. Soft delete pattern for reference data
4. Snapshot pattern for historical accuracy
5. Complete audit trail for year unlocks
6. Correct FIFO implementation
7. Well-indexed for performance

### Minor Improvement Opportunities
1. Add `PurchaseLot.purchaseDate` index
2. Document float precision handling
3. Consider if name uniqueness should be relaxed

### Conclusion
The data model is **exceptionally well-designed** with:
- Strong referential integrity
- Thoughtful soft delete implementation
- Historical data preservation
- Comprehensive audit trails
- Correct accounting model (FIFO)

No critical issues found. This is a **production-ready schema**.
