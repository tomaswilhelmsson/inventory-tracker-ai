# VAT Handling Design

## Architecture Overview

### Data Storage Strategy

**Dual Storage Approach**: Store both VAT-inclusive and VAT-exclusive amounts
- **Primary for FIFO**: `unitCostExclVAT` - used for all inventory calculations
- **Audit Trail**: `unitCostInclVAT` - preserves original invoice amounts
- **Configuration**: `vatRate` - percentage used (e.g., 0.25 for 25%)
- **Entry Mode**: `pricesIncludeVAT` - boolean flag indicating how user entered data

**Rationale**: 
- Year-end accounting requires VAT-exclusive values
- Audit compliance requires preserving original invoice amounts
- Both views needed for reconciliation and verification

### Calculation Modes

#### Mode 1: Prices Include VAT (Default, checkbox CHECKED)
```
User Input:
  - invoiceTotal: $125.00 (incl VAT)
  - lineItem1: $50.00 (incl VAT)
  - lineItem2: $75.00 (incl VAT)
  - vatRate: 25%

System Calculation:
  - unitCostExclVAT = unitCostInclVAT / 1.25
  - lineItem1ExclVAT: $40.00
  - lineItem2ExclVAT: $60.00
  - calculatedTotal: $100.00 (excl VAT) + $25.00 (VAT) = $125.00 ✓
```

#### Mode 2: Prices Exclude VAT (checkbox UNCHECKED)
```
User Input:
  - invoiceTotal: $125.00 (incl VAT - grand total from invoice)
  - lineItem1: $40.00 (excl VAT)
  - lineItem2: $60.00 (excl VAT)
  - vatRate: 25%

System Calculation:
  - unitCostInclVAT = unitCostExclVAT * 1.25
  - lineItem1InclVAT: $50.00
  - lineItem2InclVAT: $75.00
  - calculatedTotal: $100.00 (excl VAT) + $25.00 (VAT) = $125.00 ✓
```

### Shipping Allocation with VAT

**Challenge**: Shipping costs are typically VAT-inclusive in total invoice amount

**Solution**: Allocate shipping proportionally to VAT-exclusive line item values

```
Example:
  Items Excl VAT: $40 + $60 = $100
  Shipping: $10
  Invoice Total: ($100 + $10) * 1.25 = $137.50

Allocation:
  Item1: $40 base + ($40/$100 * $10) shipping = $44 excl VAT
  Item2: $60 base + ($60/$100 * $10) shipping = $66 excl VAT
  
Final Unit Costs (Excl VAT after shipping):
  Item1: $44 / qty
  Item2: $66 / qty
```

### Database Schema Changes

```prisma
model PurchaseLot {
  // ... existing fields ...
  
  // VAT fields
  vatRate         Float   @default(0)      // e.g., 0.25 for 25% VAT
  unitCostExclVAT Float                    // Primary for FIFO (renamed from unitCost)
  unitCostInclVAT Float?                   // Optional for audit trail
  
  // ... rest of fields ...
}

model PurchaseBatch {
  // ... existing fields ...
  
  // VAT fields
  vatRate              Float   @default(0)
  invoiceTotalInclVAT  Float                   // Renamed from invoiceTotal
  invoiceTotalExclVAT  Float                   // Calculated total excl VAT
  pricesIncludeVAT     Boolean @default(true)  // Entry mode flag
  
  // ... rest of fields ...
}
```

**Migration Strategy**:
1. Add new columns with defaults
2. Copy `unitCost` → `unitCostExclVAT`
3. Calculate `unitCostInclVAT` based on default VAT rate (or 0%)
4. Update application code to use new fields
5. Deprecate old `unitCost` column (optional, for rollback safety)

### API Contract Changes

#### Single Purchase Creation
```typescript
POST /api/purchases
{
  productId: number;
  supplierId: number;
  purchaseDate: string;
  quantity: number;
  unitCost: number;           // Amount entered by user
  pricesIncludeVAT: boolean;  // NEW: indicates if unitCost includes VAT
  vatRate?: number;           // NEW: optional override (default from config)
  verificationNumber?: string;
}

Response:
{
  id: number;
  // ... existing fields ...
  vatRate: number;
  unitCostExclVAT: number;
  unitCostInclVAT: number;
  pricesIncludeVAT: boolean;
}
```

#### Batch Purchase Creation
```typescript
POST /api/purchases/batch
{
  supplierId: number;
  purchaseDate: string;
  verificationNumber?: string;
  invoiceTotal: number;       // Always VAT-inclusive (grand total from invoice)
  shippingCost: number;
  vatRate: number;            // NEW: VAT rate for entire batch
  pricesIncludeVAT: boolean;  // NEW: indicates if line items include VAT
  notes?: string;
  items: [{
    productId: number;
    quantity: number;
    unitCost?: number;        // If pricesIncludeVAT=true, this is incl VAT
    totalCost?: number;       // If pricesIncludeVAT=true, this is incl VAT
  }];
}
```

### UI/UX Design

#### Toggle Placement
```
┌─ Multi-Item Purchase ──────────────────────┐
│ Supplier: [ACME Corp ▼]                    │
│ Purchase Date: [2024-01-15]                │
│                                             │
│ ┌─ VAT Settings ─────────────────┐         │
│ │ ☑ Prices Include VAT           │         │
│ │ VAT Rate: [25%] (configurable) │         │
│ └────────────────────────────────┘         │
│                                             │
│ Invoice Total: [$125.00] *                 │
│ ↳ This is the grand total including VAT   │
│                                             │
│ Line Items:                                │
│ ┌────────────────────────────────┐         │
│ │ Product  Qty  Unit Cost  Total │         │
│ │ Widget A  10   $5.00    $50.00 │         │
│ │ Widget B  15   $5.00    $75.00 │         │
│ └────────────────────────────────┘         │
│                                             │
│ ┌─ Summary ──────────────────────┐         │
│ │ Subtotal (excl VAT): $100.00   │         │
│ │ VAT (25%):            $25.00   │         │
│ │ Shipping:             $10.00   │         │
│ │ ──────────────────────────────  │         │
│ │ Total (incl VAT):    $135.00   │         │
│ │                                 │         │
│ │ ⚠ Mismatch: Entered $125.00    │         │
│ │   Calculated $135.00            │         │
│ │   Difference: $10.00            │         │
│ └─────────────────────────────────┘         │
│                                             │
│              [Cancel]  [Create Purchase]    │
└─────────────────────────────────────────────┘
```

#### Display Modes in Purchase List

**Toggle between views**:
- **Excluding VAT** (default for accounting): Shows `unitCostExclVAT`
- **Including VAT** (for invoice verification): Shows `unitCostInclVAT`

### Validation Rules

1. **VAT Rate**: Must be between 0 and 1 (0% to 100%)
2. **Invoice Total Matching**:
   - Calculate expected total based on line items + shipping + VAT
   - Allow $0.01 tolerance for rounding
   - Show warning if mismatch > tolerance
   - Allow submission with warning (user override)

3. **Mode Consistency**:
   - If `pricesIncludeVAT = true`: line items entered should sum (roughly) to invoice total
   - If `pricesIncludeVAT = false`: line items + calculated VAT should sum to invoice total

### Edge Cases

1. **Zero VAT**: System supports 0% VAT (VAT-exempt items)
2. **Existing Data**: Migrated with `vatRate = 0` or configurable default
3. **Rounding**: All calculations round to 2 decimal places
4. **Negative VAT**: Not supported (validation error)
5. **Mixed Rates**: Not supported in v1 (use single rate per batch)

### Performance Considerations

- **Index Changes**: No new indexes required (VAT fields not used in queries)
- **Migration**: Batch updates for large datasets (1000 records at a time)
- **Calculation**: Client-side for real-time feedback, server-side for validation

### Backward Compatibility

**Goal**: Existing code continues to work without modification

**Strategy**:
1. Keep `unitCost` as alias for `unitCostExclVAT` (view or computed)
2. Default `vatRate = 0` for old data
3. API accepts requests without VAT fields (default to 0%)
4. FIFO calculations unchanged (always use excl-VAT values)

### Security Considerations

- **No PII**: VAT data is financial, not personal
- **Validation**: Server-side validation of all VAT calculations
- **Audit Trail**: All VAT rates and calculations logged
- **Immutability**: Once year locked, VAT data cannot change

### Testing Strategy

1. **Unit Tests**:
   - VAT calculation functions
   - Rounding edge cases
   - Zero VAT scenarios

2. **Integration Tests**:
   - Purchase creation in both modes
   - Batch creation with VAT
   - Invoice total validation

3. **E2E Tests**:
   - Complete purchase workflow with VAT
   - Year-end count with VAT-exclusive values
   - Display toggle functionality

4. **Migration Tests**:
   - Data migration on sample dataset
   - Backward compatibility verification
   - Rollback scenarios
