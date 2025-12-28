# Design: Support Multiple Suppliers per Product

## Architecture Overview

### Current State
```
Product (1) ─────> (1) Supplier
    │
    │ (1:many)
    ↓
PurchaseLot ─────> Supplier
```

**Issues:**
- Product has rigid `supplierId` field
- Cannot represent that one product can come from multiple suppliers
- Workaround: Create duplicate products with different names

### Target State
```
Product (many) ←──── ProductSupplier ────→ (many) Supplier
    │                      │
    │ (1:many)             │ (optional metadata)
    ↓                      ↓
PurchaseLot ──────> Supplier   preferredUnitCost: Float?
```

**Benefits:**
- Products can have multiple suppliers
- Track supplier-specific pricing history
- No duplicate products needed
- Purchase lots maintain independent supplier references

## Database Schema Changes

### New Table: ProductSupplier (Junction Table)

```prisma
model ProductSupplier {
  id                 Int       @id @default(autoincrement())
  productId          Int
  supplierId         Int
  preferredUnitCost  Float?    // Optional: suggested price for this supplier-product combo
  createdAt          DateTime  @default(now())
  
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  supplier  Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  
  @@unique([productId, supplierId])
  @@index([supplierId])
  @@map("product_suppliers")
}
```

**Design Decisions:**
- `preferredUnitCost`: Nullable to support historical data where cost wasn't tracked
- `@@unique([productId, supplierId])`: Prevent duplicate associations
- `onDelete: Cascade`: If product/supplier deleted, remove associations automatically
- Index on `supplierId`: Fast reverse lookups (all products from a supplier)

### Modified Table: Product

```prisma
model Product {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  unitId      Int
  // REMOVED: supplierId  Int  ← This field is deleted
  createdAt   DateTime  @default(now())
  
  unit              Unit                @relation(fields: [unitId], references: [id], onDelete: Restrict)
  // REMOVED: supplier relationship
  suppliers         ProductSupplier[]   // NEW: Many-to-many through junction table
  purchaseLots      PurchaseLot[]
  yearEndCountItems YearEndCountItem[]
  
  @@index([unitId])
  @@map("products")
}
```

### Modified Table: Supplier

```prisma
model Supplier {
  // ... existing fields ...
  
  // REMOVED: products Product[]
  products        ProductSupplier[]   // NEW: Many-to-many through junction table
  purchaseLots    PurchaseLot[]
  purchaseBatches PurchaseBatch[]
  
  @@map("suppliers")
}
```

**No changes to PurchaseLot:**
- Already has nullable `supplierId` field for historical tracking
- Supplier reference is independent of product-supplier associations
- FIFO calculations remain unchanged

## Data Migration Strategy

### Phase 1: Create Junction Table
```sql
-- Create new ProductSupplier table
CREATE TABLE product_suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productId INTEGER NOT NULL,
  supplierId INTEGER NOT NULL,
  preferredUnitCost REAL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
  UNIQUE(productId, supplierId)
);

CREATE INDEX idx_product_suppliers_supplierId ON product_suppliers(supplierId);
```

### Phase 2: Migrate Existing Data
```sql
-- Copy existing product-supplier relationships to junction table
INSERT INTO product_suppliers (productId, supplierId, createdAt)
SELECT id, supplierId, createdAt
FROM products
WHERE supplierId IS NOT NULL;

-- Optional: Set preferredUnitCost from most recent purchase
UPDATE product_suppliers
SET preferredUnitCost = (
  SELECT unitCostExclVAT
  FROM purchase_lots
  WHERE productId = product_suppliers.productId
    AND supplierId = product_suppliers.supplierId
    AND unitCostExclVAT IS NOT NULL
  ORDER BY purchaseDate DESC
  LIMIT 1
);
```

### Phase 3: Remove Old Column
```sql
-- Create new products table without supplierId
CREATE TABLE products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  unitId INTEGER NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unitId) REFERENCES units(id) ON DELETE RESTRICT
);

-- Copy data
INSERT INTO products_new SELECT id, name, description, unitId, createdAt FROM products;

-- Drop old table and rename
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

-- Recreate indexes
CREATE INDEX idx_products_unitId ON products(unitId);
```

### Rollback Strategy
- Keep backup of database before migration
- Store migration SQL in separate file for manual rollback if needed
- Test migration on copy of production data first

## API Design Changes

### Product Endpoints

#### GET /api/products
**Response changes:**
```typescript
// Before
{
  id: 1,
  name: "Laptop Model X",
  supplierId: 5,
  supplier: { id: 5, name: "Tech Corp" }
}

// After
{
  id: 1,
  name: "Laptop Model X",
  suppliers: [
    { 
      id: 1, 
      supplier: { id: 5, name: "Tech Corp" },
      preferredUnitCost: 1200.00
    },
    { 
      id: 2, 
      supplier: { id: 8, name: "Office Supply Co" },
      preferredUnitCost: 1250.00
    }
  ]
}
```

#### POST /api/products
**Request changes:**
```typescript
// Before
{
  name: "Laptop Model X",
  supplierId: 5,
  unitId: 2
}

// After
{
  name: "Laptop Model X",
  supplierIds: [5, 8],  // Array of supplier IDs
  unitId: 2
}
```

#### PUT /api/products/:id/suppliers
**New endpoint for managing supplier associations:**
```typescript
// Add supplier to product
PUT /api/products/1/suppliers
{
  supplierId: 8,
  preferredUnitCost: 1250.00  // optional
}

// Update preferred price
PATCH /api/products/1/suppliers/8
{
  preferredUnitCost: 1225.00
}

// Remove supplier from product
DELETE /api/products/1/suppliers/8
```

### Purchase Endpoints

#### POST /api/purchases
**No breaking changes - already has supplierId:**
```typescript
{
  productId: 1,
  supplierId: 5,  // Can be any supplier, not just product's associated suppliers
  quantity: 10,
  unitCost: 1200.00,
  purchaseDate: "2024-01-15"
}
```

**Enhancement: Return suggested price if available:**
```typescript
// GET /api/products/1/suppliers/5/suggested-price
Response: { suggestedPrice: 1200.00 }  // From preferredUnitCost or recent purchase
```

### Inventory Endpoints

#### GET /api/inventory/value
**New query parameter for filtering:**
```typescript
// Get inventory aggregated by product (default)
GET /api/inventory/value?groupBy=product

// Get inventory broken down by supplier-product combination
GET /api/inventory/value?groupBy=supplier-product

// Filter by specific supplier
GET /api/inventory/value?supplierId=5
```

**Response for `groupBy=supplier-product`:**
```typescript
[
  {
    productId: 1,
    productName: "Laptop Model X",
    supplierId: 5,
    supplierName: "Tech Corp",
    totalQuantity: 15,
    averageUnitCost: 1200.00,
    totalValue: 18000.00
  },
  {
    productId: 1,
    productName: "Laptop Model X",
    supplierId: 8,
    supplierName: "Office Supply Co",
    totalQuantity: 8,
    averageUnitCost: 1250.00,
    totalValue: 10000.00
  }
]
```

## UI/UX Changes

### Products View

**Current:**
- Supplier: Dropdown (single selection)

**New:**
- Suppliers: Multi-select component
- Show "X suppliers" badge in table
- Click badge to see list of suppliers with prices

### Purchase Creation Form

**Current:**
- Product dropdown → Auto-fills supplier
- Supplier field disabled/readonly

**New:**
- Product dropdown (same)
- Supplier dropdown enabled (shows all suppliers, highlights product's associated suppliers)
- Show "Suggested price: $X" if supplier-product association exists
- Show recent purchase history for this product-supplier combo

### Inventory View

**New toggle/filter:**
```
View: [●Aggregated by Product] [○Grouped by Supplier]

Filter: [All Suppliers ▼]
```

**Aggregated View (default):**
- Product | Total Qty | Avg Cost | Total Value
- Laptop Model X | 23 | $1220 | $28,060

**Supplier-Grouped View:**
- Product | Supplier | Qty | Avg Cost | Value
- Laptop Model X | Tech Corp | 15 | $1200 | $18,000
- Laptop Model X | Office Supply | 8 | $1250 | $10,000

### Reports

**Add supplier filter/grouping:**
- Inventory Valuation Report: Group by supplier option
- Purchase History Report: Filter by supplier
- Year-End Count Report: Show supplier breakdown

## Performance Considerations

### Query Optimization

**Product listing with suppliers:**
```typescript
// Use eager loading to avoid N+1 queries
const products = await prisma.product.findMany({
  include: {
    suppliers: {
      include: {
        supplier: true
      }
    }
  }
});
```

**Inventory grouped by supplier:**
```typescript
// Single query with joins
SELECT 
  p.id, p.name,
  s.id, s.name,
  SUM(pl.remainingQuantity) as totalQuantity,
  AVG(pl.unitCostExclVAT) as avgCost
FROM purchase_lots pl
JOIN products p ON p.id = pl.productId
JOIN suppliers s ON s.id = pl.supplierId
WHERE pl.remainingQuantity > 0
GROUP BY p.id, s.id
ORDER BY p.name, s.name
```

### Indexing Strategy

**Critical indexes:**
- `ProductSupplier`: `(productId, supplierId)` unique + `supplierId` for reverse lookups
- `PurchaseLot`: Existing FIFO index unchanged
- No additional indexes needed (joins use existing PKs/FKs)

**Estimated impact:**
- Product queries: +1 join (negligible for <10k products)
- Inventory queries: Same performance (already joins suppliers)
- Purchase creation: No change (doesn't query ProductSupplier)

## Testing Strategy

### Unit Tests
- ProductService: CRUD operations with supplier associations
- Migration script: Verify data transformation correctness
- Pricing service: Suggested price calculation logic

### Integration Tests
- API: Product endpoints with multiple suppliers
- API: Purchase creation with any supplier
- API: Inventory filtering by supplier

### End-to-End Tests
- UI: Add/remove suppliers from product
- UI: Create purchase with suggested pricing
- UI: Toggle inventory view modes
- Migration: Full database migration with rollback

### Data Integrity Tests
- Ensure all products have at least one supplier after migration
- Verify purchase lots still reference correct suppliers
- Confirm FIFO calculations unchanged
- Check year-end count integrity

## Backwards Compatibility

### Breaking Changes
1. **API Response Format**: `Product.supplier` → `Product.suppliers[]`
2. **Database Schema**: `Product.supplierId` column removed
3. **Import Script**: JSON format must support multiple suppliers

### Migration Path for Clients
1. **Frontend**: Update components to handle `suppliers[]` array
2. **Import Scripts**: Add `suppliers` array field, migrate from `supplierId`
3. **Reports**: Update queries to use ProductSupplier junction table

### Rollback Plan
If critical issues found post-deployment:
1. Restore database from pre-migration backup
2. Revert Prisma schema to previous version
3. Redeploy previous application version
4. Retain ProductSupplier table for future retry (no data loss)

## Security Considerations

### Access Control
- No new permissions needed (same CRUD operations)
- Existing authentication applies to new endpoints
- Validate supplier IDs exist before creating associations

### Data Validation
- Prevent removing last supplier from product (business rule)
- Validate preferredUnitCost is positive number
- Ensure product-supplier uniqueness at DB and API level

### Audit Trail
- Log supplier association changes
- Track who added/removed suppliers from products
- Include in existing audit mechanisms (timestamps, user tracking)

## Open Issues

None - all design decisions finalized based on user requirements.
