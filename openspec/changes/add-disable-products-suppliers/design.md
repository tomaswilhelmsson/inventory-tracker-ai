# Design: Add Disable Products and Suppliers

## Overview

This design document outlines the architecture and implementation details for adding disable/enable functionality to products and suppliers. The feature allows users to soft-disable items that are no longer in active use while preserving all historical data and relationships.

## Architecture

### Current State

```
Product Model (Prisma)
├── id, name, description, unitId
├── No status/active field
└── Can be deleted only if no purchase history

Supplier Model (Prisma)
├── id, name, contactPerson, email, etc.
├── No status/active field
└── Can be deleted only if no purchase history

Frontend Lists
├── Show all products/suppliers
└── No filtering by active status
```

### Target State

```
Product Model (Prisma)
├── id, name, description, unitId
├── isActive: Boolean (default: true) ← NEW
└── Index on isActive for efficient filtering

Supplier Model (Prisma)
├── id, name, contactPerson, email, etc.
├── isActive: Boolean (default: true) ← NEW
└── Index on isActive for efficient filtering

Backend API
├── GET /api/products?includeInactive=false (default)
├── GET /api/suppliers?includeInactive=false (default)
├── PATCH /api/products/:id/toggle-active
└── PATCH /api/suppliers/:id/toggle-active

Frontend Views
├── ProductsView: Toggle to show/hide disabled
├── SuppliersView: Toggle to show/hide disabled
├── Dropdowns: Filter out disabled by default
└── Visual indicator for disabled items
```

## Data Model

### Schema Changes

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  unitId      Int
  isActive    Boolean  @default(true) // NEW FIELD
  createdAt   DateTime @default(now())
  
  unit              Unit               @relation(...)
  suppliers         ProductSupplier[]
  purchaseLots      PurchaseLot[]
  yearEndCountItems YearEndCountItem[]
  
  @@index([unitId])
  @@index([isActive]) // NEW INDEX for efficient filtering
  @@map("products")
}

model Supplier {
  id            Int      @id @default(autoincrement())
  name          String   @unique
  contactPerson String?
  email         String?
  phone         String?
  address       String?
  city          String?
  country       String?
  taxId         String?
  notes         String?
  isActive      Boolean  @default(true) // NEW FIELD
  createdAt     DateTime @default(now())
  
  productSuppliers ProductSupplier[]
  purchaseLots     PurchaseLot[]
  purchaseBatches  PurchaseBatch[]
  
  @@index([isActive]) // NEW INDEX for efficient filtering
  @@map("suppliers")
}
```

**Design Decisions:**
- Use `isActive` instead of `isDisabled` for positive semantics (true = normal state)
- Default to `true` so existing records are active
- Add indexes on `isActive` for efficient filtering (common query pattern)
- No cascading behavior (disabling supplier doesn't auto-disable products)

### Migration Strategy

1. Add `isActive` column to `products` table with default value `true`
2. Add `isActive` column to `suppliers` table with default value `true`
3. Create indexes on both `isActive` columns
4. All existing records automatically get `isActive = true` (no data migration needed)

**Rollback Plan:**
- Simple: Remove `isActive` columns and indexes
- No data loss since we're only adding fields

## API Design

### New/Modified Endpoints

```
# Products
GET    /api/products?includeInactive=false&search=...&supplierId=...
PATCH  /api/products/:id/toggle-active

# Suppliers
GET    /api/suppliers?includeInactive=false&search=...
PATCH  /api/suppliers/:id/toggle-active
```

### Request/Response Examples

**GET /api/products (default: active only)**
```json
Request: GET /api/products
Response 200:
[
  {
    "id": 1,
    "name": "Widget A",
    "isActive": true,
    "unit": {"id": 1, "name": "pieces"},
    "suppliers": [...]
  }
  // Disabled products NOT included
]
```

**GET /api/products?includeInactive=true (show all)**
```json
Request: GET /api/products?includeInactive=true
Response 200:
[
  {
    "id": 1,
    "name": "Widget A",
    "isActive": true,
    ...
  },
  {
    "id": 5,
    "name": "Discontinued Widget",
    "isActive": false, // ← Disabled product
    ...
  }
]
```

**PATCH /api/products/:id/toggle-active**
```json
Request: PATCH /api/products/5/toggle-active
Response 200:
{
  "id": 5,
  "name": "Discontinued Widget",
  "isActive": false, // Toggled from true to false
  "unit": {...},
  "suppliers": [...]
}

// Subsequent toggle
Request: PATCH /api/products/5/toggle-active
Response 200:
{
  "id": 5,
  "name": "Discontinued Widget",
  "isActive": true, // Toggled back to true
  ...
}
```

**DELETE /api/products/:id (unchanged behavior)**
```json
# Still requires no purchase history (cascade protection)
Request: DELETE /api/products/5
Response 400:
{
  "error": "Cannot delete product with purchase history. Consider disabling instead."
}
```

## Backend Architecture

### Service Layer Updates

```typescript
// productService.ts
export const productService = {
  async getAll(filters?: { 
    search?: string; 
    supplierId?: number;
    includeInactive?: boolean; // NEW parameter
  }) {
    const where: any = {};
    
    // Default to active only unless explicitly requested
    if (filters?.includeInactive !== true) {
      where.isActive = true;
    }
    
    // ... existing search and supplier filters ...
    
    return await prisma.product.findMany({ where, ... });
  },
  
  async toggleActive(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError(404, 'Product not found');
    
    return await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include: { unit: true, suppliers: {...} }
    });
  },
  
  // ... existing methods ...
};

// Similar changes for supplierService.ts
```

### Route Layer Updates

```typescript
// routes/products.ts

// Modify existing GET endpoint
router.get(
  '/',
  [
    query('search').optional().isString(),
    query('supplierId').optional().isInt(),
    query('includeInactive').optional().isBoolean(), // NEW
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { search, supplierId, includeInactive } = req.query;
      const products = await productService.getAll({
        search: search as string,
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
        includeInactive: includeInactive === 'true', // Parse query param
      });
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
);

// Add new toggle endpoint
router.patch(
  '/:id/toggle-active',
  [param('id').isInt().withMessage('Invalid product ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.toggleActive(id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// Similar changes for routes/suppliers.ts
```

## Frontend Architecture

### Component Updates

#### ProductsView.vue

```vue
<template>
  <div>
    <Card>
      <template #title>
        <div class="header-row">
          <span>{{ t('products.title') }}</span>
          <div class="header-actions">
            <!-- NEW: Toggle for showing disabled items -->
            <Button
              :label="showDisabled ? t('common.hideDisabled') : t('common.showDisabled')"
              :icon="showDisabled ? 'pi pi-eye-slash' : 'pi pi-eye'"
              text
              @click="showDisabled = !showDisabled"
            />
            <Button 
              :label="t('products.addProduct')" 
              icon="pi pi-plus" 
              @click="openCreateDialog" 
            />
          </div>
        </div>
      </template>
      
      <template #content>
        <DataTable :value="filteredProducts">
          <Column field="name" :header="t('products.table.name')">
            <template #body="{ data }">
              <!-- Visual indicator for disabled products -->
              <span :class="{ 'disabled-item': !data.isActive }">
                {{ data.name }}
              </span>
              <Tag v-if="!data.isActive" severity="secondary" value="Disabled" />
            </template>
          </Column>
          
          <!-- Other columns... -->
          
          <Column :header="t('common.actions')">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" @click="openEditDialog(data)" />
              <Button 
                :icon="data.isActive ? 'pi pi-ban' : 'pi pi-check'"
                :severity="data.isActive ? 'warning' : 'success'"
                @click="toggleActive(data)"
                :label="data.isActive ? 'Disable' : 'Enable'"
              />
              <Button icon="pi pi-trash" @click="confirmDelete(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
const showDisabled = ref(false);

const fetchProducts = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value) params.append('search', searchQuery.value);
    if (!showDisabled.value) params.append('includeInactive', 'false'); // Default
    else params.append('includeInactive', 'true'); // Explicitly show all
    
    const response = await api.get(`/products?${params.toString()}`);
    products.value = response.data;
  } catch (error) {
    // error handling...
  } finally {
    loading.value = false;
  }
};

const toggleActive = async (product: Product) => {
  const action = product.isActive ? 'disable' : 'enable';
  const confirmed = await confirm({
    message: `Are you sure you want to ${action} "${product.name}"?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
  });
  
  if (!confirmed) return;
  
  try {
    await api.patch(`/products/${product.id}/toggle-active`);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Product ${action}d successfully`,
      life: 3000,
    });
    await fetchProducts(); // Refresh list
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || `Failed to ${action} product`,
      life: 3000,
    });
  }
};

// Watch showDisabled to refetch when toggled
watch(showDisabled, () => {
  fetchProducts();
});
</script>

<style scoped>
.disabled-item {
  color: var(--text-color-secondary);
  text-decoration: line-through;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
```

#### Dropdown Filtering (Purchases, etc.)

```typescript
// In PurchasesView.vue and other views with product/supplier dropdowns

const fetchProducts = async () => {
  try {
    // ALWAYS filter out inactive items in dropdowns (no toggle here)
    const response = await api.get('/products?includeInactive=false');
    products.value = response.data;
  } catch (error) {
    // error handling...
  }
};

const fetchSuppliers = async () => {
  try {
    // ALWAYS filter out inactive items in dropdowns
    const response = await api.get('/suppliers?includeInactive=false');
    suppliers.value = response.data;
  } catch (error) {
    // error handling...
  }
};
```

### State Management

No Pinia store changes needed - component-level state is sufficient:
- `showDisabled: Ref<boolean>` - toggle state for showing disabled items
- Existing `products` and `suppliers` refs

## User Interface Design

### ProductsView/SuppliersView with Toggle

```
┌────────────────────────────────────────────────────────────┐
│  Products                [👁 Show Disabled] [+ Add Product] │
├────────────────────────────────────────────────────────────┤
│  [Search products...]                                      │
├──────────────────┬────────────┬────────────┬───────────────┤
│  Name            │  Unit      │  Supplier  │  Actions      │
├──────────────────┼────────────┼────────────┼───────────────┤
│  Widget A        │  pieces    │  Acme Inc  │  [✏️] [⛔] [🗑️]│
│  Widget B        │  kg        │  Global Co │  [✏️] [⛔] [🗑️]│
│  Discontinued ❌ │  liters    │  Old Corp  │  [✏️] [✅] [🗑️]│
│    [Disabled]    │            │            │               │
└──────────────────┴────────────┴────────────┴───────────────┘

When toggle is OFF (default):
- Show only active products
- Disabled products hidden

When toggle is ON:
- Show all products
- Disabled products shown with visual indicator
- Enable button available for disabled items
```

### Confirmation Dialog for Disable

```
┌───────────────────────────────────────────┐
│  Confirm Disable                       [×] │
├───────────────────────────────────────────┤
│  ⚠️  Are you sure you want to disable     │
│      product "Widget A"?                  │
│                                           │
│      This product has 15 purchases.       │
│      It will be hidden from dropdowns     │
│      but historical data will remain.     │
│                                           │
│      You can re-enable it anytime.        │
├───────────────────────────────────────────┤
│              [Cancel]  [Disable]          │
└───────────────────────────────────────────┘
```

## Impact on Other Views

### InventoryView

**Decision**: Show disabled products ONLY if they have remaining inventory

```typescript
// inventoryService.ts
async getInventorySummary() {
  // Get inventory for all products (including disabled)
  const inventory = await calculateInventory();
  
  // Filter: active products OR disabled products with remaining quantity > 0
  return inventory.filter(item => 
    item.product.isActive || item.totalQuantity > 0
  );
}
```

**Rationale**: If a disabled product still has stock, warehouse needs to see it for physical inventory management.

### PurchasesView

**Decision**: Dropdowns show only active products/suppliers, but existing purchase records display correctly regardless of status

```typescript
// Dropdown for creating new purchase
const fetchProducts = async () => {
  const response = await api.get('/products?includeInactive=false');
  products.value = response.data; // Only active
};

// Display of existing purchases (includeInactive doesn't matter here)
// Historical records already have product/supplier snapshots
```

### YearEndCountView

**Decision**: Year-end count includes only active products by default, with option to include all

```typescript
// yearEndCountService.ts
async initiateCount(year: number, includeInactive = false) {
  const products = await prisma.product.findMany({
    where: {
      isActive: includeInactive ? undefined : true
    }
  });
  
  // Create count items for products...
}
```

## Error Handling

### Backend Errors

| Error | Status | Message |
|-------|--------|---------|
| Product not found (toggle) | 404 | "Product not found" |
| Supplier not found (toggle) | 404 | "Supplier not found" |
| Invalid query parameter | 400 | "includeInactive must be a boolean" |

### Frontend Error Handling

- Display toast notifications for toggle failures
- Show loading state during toggle operation
- Graceful degradation if `includeInactive` parameter not supported (backward compatibility)

## Performance Considerations

### Database Indexes

```prisma
model Product {
  // ...
  @@index([isActive])           // NEW: Fast filtering by active status
  @@index([isActive, unitId])   // Optional: Composite index for common queries
}

model Supplier {
  // ...
  @@index([isActive])           // NEW: Fast filtering by active status
}
```

### Query Optimization

Most efficient query (uses index):
```sql
SELECT * FROM products WHERE isActive = true ORDER BY name ASC;
```

With search (still uses index on isActive):
```sql
SELECT * FROM products 
WHERE isActive = true AND name LIKE '%widget%' 
ORDER BY name ASC;
```

## Testing Strategy

### Unit Tests (Backend)

```typescript
describe('ProductService', () => {
  test('getAll() returns only active products by default', async () => {});
  test('getAll({includeInactive: true}) returns all products', async () => {});
  test('toggleActive() disables active product', async () => {});
  test('toggleActive() enables disabled product', async () => {});
  test('toggleActive() throws error for non-existent product', async () => {});
});
```

### Integration Tests (API)

```typescript
describe('GET /api/products', () => {
  test('returns only active products by default', async () => {});
  test('?includeInactive=true returns all products', async () => {});
  test('disabled products excluded from dropdown queries', async () => {});
});

describe('PATCH /api/products/:id/toggle-active', () => {
  test('toggles product from active to inactive', async () => {});
  test('toggles product from inactive to active', async () => {});
  test('returns 404 for non-existent product', async () => {});
});
```

### Component Tests (Frontend)

```typescript
describe('ProductsView', () => {
  test('shows only active products by default', async () => {});
  test('shows all products when toggle is ON', async () => {});
  test('disable button shows confirmation dialog', async () => {});
  test('visual indicator shown for disabled products', async () => {});
  test('dropdowns exclude disabled products', async () => {});
});
```

### E2E Test Scenarios

1. Disable product → Verify hidden from purchase dropdown → Verify visible in products list with "Show Disabled" → Re-enable → Verify visible in dropdown
2. Disable supplier → Verify products from that supplier still work → Verify supplier hidden from dropdown
3. Create purchase with active product → Disable product → Verify existing purchase still displays correctly
4. Disable product with inventory → Verify appears in inventory view → Sell all inventory → Verify removed from inventory view

## Alternative Approaches Considered

### 1. Soft Delete with `deletedAt` Timestamp
**Pros**: Common pattern, provides deletion timestamp
**Cons**: Semantically different from "disabled" (deletion implies intent to remove)
**Decision**: Rejected - "disabled" better represents temporary deactivation vs permanent deletion

### 2. Status Enum (active, disabled, archived, deleted)
**Pros**: More granular states, extensible
**Cons**: Adds complexity, not requested by user, overkill for current needs
**Decision**: Deferred - simple boolean is sufficient for v1, can add enum later if needed

### 3. Separate "archived" flag vs "active" flag
**Pros**: Differentiates between temporarily disabled and permanently archived
**Cons**: Confusion about which flag to use, requires two fields
**Decision**: Rejected - single `isActive` boolean is clearer

### 4. Cascading Disable (disabling supplier auto-disables products)
**Pros**: Maintains consistency
**Cons**: Unexpected behavior, might disable products user wants to keep
**Decision**: Out of scope - let users explicitly disable products if needed

## Rollout Plan

### Phase 1: Backend (No User Impact)
1. Deploy database migration (adds `isActive` column with default `true`)
2. Deploy updated API with `includeInactive` parameter and toggle endpoint
3. Verify existing functionality unchanged (all queries default to active-only)

### Phase 2: Frontend (Gradual Rollout)
1. Deploy ProductsView and SuppliersView with toggle UI
2. Deploy dropdown filtering updates (purchases, etc.)
3. Test end-to-end disable/enable workflows
4. Monitor for any issues with hidden items

### Rollback Strategy
1. If Phase 1 issues: Restore database backup, remove `isActive` column
2. If Phase 2 issues: Revert frontend to show all items (remove filtering), keep backend changes

## Future Enhancements

Potential additions for future iterations:
- Bulk disable/enable operations
- Audit log of disable/enable actions (who, when, why)
- Auto-disable based on inactivity (e.g., no purchases in X months)
- Notification/warning when last active product from supplier is disabled
- "Disabled at" timestamp for tracking
- Disable reasons (dropdown: discontinued, supplier changed, etc.)
