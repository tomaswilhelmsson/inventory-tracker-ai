# Design: Multi-Item Purchase Entry System

## Context

Users receive invoices with multiple products from a single supplier delivery. Current system requires creating each purchase lot individually, which is time-consuming and loses the relationship between items on the same invoice. Additionally, package-based items (screws, bulk materials) are often priced by total cost rather than unit cost, requiring manual calculations.

### Constraints
- Must maintain FIFO integrity - each line item becomes a separate lot
- Cannot modify locked years
- Must preserve existing single-item purchase flow for backward compatibility
- SQLite and MariaDB compatibility required

### Stakeholders
- End users entering purchase data (primary workflow improvement)
- Accountants reconciling invoices with inventory records
- Auditors reviewing historical purchase batches

## Goals / Non-Goals

### Goals
1. Enable entry of multiple products from one invoice in a single form submission
2. Validate invoice total matches sum of line items before creating lots
3. Automatically distribute shipping costs proportionally across items
4. Support reverse calculation (total cost → unit cost given quantity)
5. Track which lots originated from the same invoice/delivery
6. Provide clear validation feedback when totals don't match

### Non-Goals
- Editing existing batches as a unit (lots are independent after creation)
- Multi-currency invoices (single currency per batch)
- Partial deliveries / backorders (future enhancement)
- Tax calculation or GST handling (shipping is the only additional cost)

## Decisions

### Decision 1: Separate PurchaseBatch table vs embedded metadata
**Choice**: Create dedicated `PurchaseBatch` table

**Rationale**:
- Enables querying "all lots from invoice X"
- Stores invoice-level metadata (total, shipping, verification number) once
- Allows future enhancements (attach scanned invoice PDF, add notes)
- Cleaner than duplicating invoice data in every lot

**Alternatives considered**:
- Store batch ID only in PurchaseLot → loses invoice-level metadata
- No batch tracking → can't reconstruct which lots came together

### Decision 2: Shipping cost allocation formula
**Choice**: Distribute proportionally by line item subtotal (unit cost × quantity)

**Formula**:
```
shippingPerItem = (lineItemSubtotal / invoiceSubtotal) * totalShipping
finalUnitCost = (originalUnitCost + (shippingPerItem / quantity))
```

**Example** (from user requirements):
- Item A: 1 unit @ $5 = $5
- Item B: 1 unit @ $5 = $5  
- Item C: 1 unit @ $10 = $10
- Subtotal: $20, Shipping: $10
- Item A shipping: ($5/$20) × $10 = $2.50 → Final: $7.50/unit
- Item B shipping: ($5/$20) × $10 = $2.50 → Final: $7.50/unit
- Item C shipping: ($10/$20) × $10 = $5.00 → Final: $15.00/unit

**Rationale**:
- Fair distribution based on item value
- Higher-value items bear more shipping cost (industry standard)
- Avoids equal split which penalizes expensive items

**Alternatives considered**:
- Equal split per item → unfair when costs vary significantly
- By weight/volume → requires additional product data not in current schema

### Decision 3: Invoice validation strategy
**Choice**: Client-side real-time validation + server-side enforcement

**Client-side**:
- Live calculation showing: Line Items Total + Shipping = Invoice Total
- Disable submit button if totals don't match (within $0.01 tolerance for rounding)
- Visual indicators (red/green) for sum validation

**Server-side**:
- Reject batch creation if `sum(lineItems) + shipping ≠ invoiceTotal`
- Return 400 error with detailed breakdown

**Rationale**:
- Prevents data entry errors before submission
- Server validation ensures data integrity even if client bypassed
- Rounding tolerance handles floating-point precision issues

### Decision 4: UI table implementation
**Choice**: Editable DataTable with add/remove row controls

**Features**:
- Add Row button to insert new line item
- Delete icon per row (minimum 1 row required)
- Inline editing for product selection, quantity, unit cost, total cost
- Auto-calculate unit cost when total cost + quantity entered
- Auto-calculate total cost when unit cost + quantity entered
- Summary footer showing subtotal, shipping, grand total

**Rationale**:
- Familiar spreadsheet-like experience for data entry
- Immediate visual feedback on calculations
- Efficient keyboard navigation (Tab between cells)

**Alternatives considered**:
- Separate modal per line item → too many clicks
- CSV upload → less immediate feedback, harder to correct errors

### Decision 5: Backward compatibility approach
**Choice**: Add new "Multi-Item Purchase" option, keep existing single-item flow

**UI Flow**:
1. Purchases page has two action buttons:
   - "Add Purchase" (existing single-item dialog)
   - "Add Multi-Item Purchase" (new batch entry form)
2. Single-item flow unchanged for quick entries
3. Multi-item flow for invoices with 2+ products

**Rationale**:
- Users can choose workflow based on situation
- No disruption to existing muscle memory
- Single-item flow remains faster for one-off purchases

## Data Model Changes

### New Table: PurchaseBatch
```prisma
model PurchaseBatch {
  id                 Int      @id @default(autoincrement())
  supplierId         Int
  purchaseDate       DateTime
  verificationNumber String?  // Invoice number
  invoiceTotal       Float    // Grand total including shipping
  shippingCost       Float    // Total shipping cost
  notes              String?  // Optional invoice notes
  createdAt          DateTime @default(now())
  
  supplier     Supplier      @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  purchaseLots PurchaseLot[]
  
  @@map("purchase_batches")
}
```

### Modified Table: PurchaseLot
```prisma
model PurchaseLot {
  // ... existing fields ...
  batchId           Int?     // Foreign key to PurchaseBatch (null for single-item purchases)
  
  batch PurchaseBatch? @relation(fields: [batchId], references: [id], onDelete: SetNull)
  
  @@index([batchId])
}
```

## API Design

### New Endpoint: Create Batch Purchase
```typescript
POST /api/purchases/batch

Request:
{
  supplierId: number
  purchaseDate: string (ISO 8601)
  verificationNumber?: string
  shippingCost: number
  notes?: string
  items: [
    {
      productId: number
      quantity: number
      unitCost?: number      // Either unitCost or totalCost required
      totalCost?: number     // Either unitCost or totalCost required
    }
  ]
}

Response 201:
{
  batch: {
    id: number
    supplierId: number
    purchaseDate: string
    verificationNumber: string
    invoiceTotal: number
    shippingCost: number
    notes: string
    createdAt: string
  }
  lots: [
    {
      id: number
      productId: number
      batchId: number
      quantity: number
      unitCost: number       // After shipping distribution
      remainingQuantity: number
      // ... standard lot fields
    }
  ]
}

Validation Rules:
1. At least 1 item required
2. Each item must have either unitCost OR totalCost (not both)
3. sum(items[].totalCost) + shippingCost MUST equal calculated invoice total (±$0.01)
4. All items must share same supplier (validated against product.supplierId)
5. Purchase date cannot be in locked year
6. Shipping cost must be >= 0
```

### Enhanced Endpoint: Get Purchase Lots
```typescript
GET /api/purchases?batchId=123

Response: Include batch information in each lot
{
  id: number
  // ... existing fields ...
  batchId: number | null
  batch?: {
    id: number
    verificationNumber: string
    invoiceTotal: number
    shippingCost: number
  }
}
```

## Migration Plan

### Database Migration
1. Create `purchase_batches` table
2. Add `batchId` column to `purchase_lots` (nullable, default NULL)
3. Add foreign key constraint with `onDelete: SetNull`
4. Add index on `purchase_lots.batchId`

**Backward Compatibility**: Existing lots have `batchId = NULL` (single-item purchases)

### Deployment Steps
1. Run database migration
2. Deploy backend with new API endpoint
3. Deploy frontend with new multi-item UI
4. Existing single-item purchases continue working without changes

### Rollback Plan
If critical issues arise:
1. Remove "Multi-Item Purchase" button from frontend (hide feature)
2. Existing single-item flow unaffected
3. Database schema changes are additive (nullable columns), safe to leave in place

## Risks / Trade-offs

### Risk 1: Floating-point rounding errors
**Mitigation**: 
- Use $0.01 tolerance in validation
- Store costs with 2 decimal precision
- Display calculated totals with clear rounding indicators

### Risk 2: Complex shipping allocation confuses users
**Mitigation**:
- Show breakdown of shipping per item in table
- Display formula/tooltip explaining calculation
- Provide example in help documentation

### Risk 3: Performance with large batches (50+ items)
**Mitigation**:
- Client-side validation limits to 100 items per batch
- Server-side batch insert (single transaction)
- Pagination on purchases list already exists

### Trade-off: Data denormalization
Storing `invoiceTotal` and `shippingCost` in PurchaseBatch when they could be calculated from lots creates redundancy, but:
- **Pro**: Fast queries for "show all invoices with totals"
- **Pro**: Preserves original invoice amount even if lots are modified
- **Pro**: Enables future "invoice reconciliation" reports
- **Con**: Must ensure consistency during creation (transaction enforces this)

**Decision**: Accept redundancy for query performance and audit trail

## Open Questions

1. **Should we allow editing batch metadata after creation?**
   - Proposal: No. Batch is immutable once created. Edit individual lots if needed.
   - Rationale: Preserves audit trail, simpler logic

2. **How to handle batch deletion?**
   - Proposal: Cascade delete only if ALL lots in batch are unused (remainingQuantity = quantity)
   - Rationale: Can't delete if inventory consumed, consistent with single-lot deletion

3. **Display batch info on individual lot edit form?**
   - Proposal: Yes, show read-only badge "Part of Invoice #12345" with link to batch view
   - Rationale: Provides context when editing individual lots

4. **Export functionality for batch?**
   - Future enhancement: "Export Invoice" generates PDF/CSV of all lots in batch
   - Not in initial scope
