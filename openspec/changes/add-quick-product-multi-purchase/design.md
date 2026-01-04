# Design: Add Quick Product Creation to Multi-Item Purchase Dialog

## Overview

Add inline product creation capability to the Multi-Item Purchase Dialog by implementing a quick add button and modal dialog. This mirrors the existing quick add supplier pattern in the same dialog and the quick add product pattern in the single purchase dialog.

## Architecture

### Current State

```
MultiItemPurchaseDialog
├── Supplier Dropdown (with quick add ✓)
├── Product Rows
│   └── Product Dropdown (no quick add ✗)
│       ├── Filtered by selected supplier
│       └── Shows existing products only
└── Quick Add Supplier Dialog ✓
```

Single Purchase Dialog (for reference):
```
PurchasesView > Create/Edit Dialog
├── Product Dropdown (with quick add ✓)
├── Supplier Dropdown (with quick add ✓)
├── Quick Add Product Dialog ✓
└── Quick Add Supplier Dialog ✓
```

### Target State

```
MultiItemPurchaseDialog
├── Supplier Dropdown (with quick add ✓)
├── Product Rows
│   └── Product Dropdown (with quick add ✓)  ← NEW
│       ├── Filtered by selected supplier
│       └── Shows existing + newly created products
├── Quick Add Supplier Dialog ✓
└── Quick Add Product Dialog ✓  ← NEW
```

## Component Structure

### MultiItemPurchaseDialog Additions

**New State Variables:**
```typescript
const quickProductDialogVisible = ref(false);
const quickProductForm = ref({
  name: '',
  supplierId: null as number | null,
  unitId: null as number | null,
});
const quickProductRowIndex = ref<number | null>(null);
const savingQuickProduct = ref(false);
```

**New Functions:**
```typescript
function showQuickProductDialog(rowIndex: number)
function saveQuickProduct()
function closeQuickProductDialog()
```

### UI Components

**Quick Add Button Location:**
```vue
<Column :header="Product">
  <template #body="{ data, index }">
    <div style="display: flex; gap: 0.5rem;">
      <Dropdown v-model="data.productId" ... />
      <Button 
        icon="pi pi-plus"
        @click="showQuickProductDialog(index)"
        v-tooltip.top="$t('products.addProduct')"
      />
    </div>
  </template>
</Column>
```

**Quick Add Product Dialog:**
```vue
<Dialog v-model:visible="quickProductDialogVisible" 
        :header="$t('products.addProduct')"
        modal
        :style="{ width: '500px' }">
  <div class="form-container">
    <!-- Name field (required) -->
    <InputText v-model="quickProductForm.name" />
    
    <!-- Supplier field (pre-filled, required) -->
    <Dropdown v-model="quickProductForm.supplierId" 
              :options="suppliers" />
    
    <!-- Unit field (required) -->
    <Dropdown v-model="quickProductForm.unitId" 
              :options="units" />
  </div>
  
  <template #footer>
    <Button :label="Cancel" @click="closeQuickProductDialog" />
    <Button :label="Create" 
            :loading="savingQuickProduct" 
            @click="saveQuickProduct" />
  </template>
</Dialog>
```

## Data Flow

### Opening Quick Add Dialog

```
User clicks [+] button on row N
  ↓
showQuickProductDialog(N)
  ↓
quickProductRowIndex = N
quickProductForm.supplierId = formData.value.supplierId (pre-fill)
quickProductDialogVisible = true
```

### Creating Product

```
User fills form and clicks Create
  ↓
saveQuickProduct()
  ↓
Validate form (name, supplierId, unitId required)
  ↓
POST /api/products
  body: {
    name: string,
    supplierId: number,  // Creates ProductSupplier association
    unitId: number
  }
  ↓
Success Response: { id, name, ... }
  ↓
loadProducts() (refresh product list)
  ↓
Set formData.value.items[quickProductRowIndex].productId = newProduct.id
  ↓
Show success toast
  ↓
closeQuickProductDialog()
```

### Error Handling

```
API Error (duplicate name, invalid supplier, etc.)
  ↓
Display error toast with message
  ↓
Keep dialog open for correction
```

## API Integration

### Existing Endpoint (No Changes Needed)

```
POST /api/products
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "name": "New Product",
  "supplierId": 123,      // Creates ProductSupplier relationship
  "unitId": 456,
  "description": null     // Optional, omit for quick add
}

Response 201:
{
  "id": 789,
  "name": "New Product",
  "unitId": 456,
  "suppliers": [
    {
      "id": 1,
      "supplierId": 123,
      "supplier": { "id": 123, "name": "Supplier Name" }
    }
  ],
  ...
}
```

The backend already supports:
- Creating products with supplier associations
- Multiple suppliers per product (many-to-many via ProductSupplier)
- Name uniqueness validation

## UI/UX Design

### Button Placement

```
┌─────────────────────────────────────────────────────────────┐
│ Product                          Quantity    Unit Cost      │
├─────────────────────────────────────────────────────────────┤
│ [Product Dropdown ▼][+]         [100]      [50.00]         │
│                     ^^^                                      │
│                     New button                               │
└─────────────────────────────────────────────────────────────┘
```

### Dialog Layout

```
┌─────────────────────────────────────┐
│  Add Product                    [×] │
├─────────────────────────────────────┤
│                                     │
│  Product Name *                     │
│  [________________________]         │
│                                     │
│  Supplier *                         │
│  [Happy Homes        ▼]  (pre-fill)│
│                                     │
│  Unit *                             │
│  [Select unit        ▼]             │
│                                     │
├─────────────────────────────────────┤
│                  [Cancel] [Create]  │
└─────────────────────────────────────┘
```

### Validation States

**Empty Required Field:**
- Red border on input
- "Required" message below field

**Duplicate Product Name:**
- Toast: "Product with this name already exists"
- Name field highlighted

**Success:**
- Toast: "Product 'XYZ' created successfully"
- Dialog closes
- Product auto-selected in dropdown

## Translations

### English (en.json)

```json
{
  "products": {
    "quickAdd": {
      "createSuccess": "Product '{name}' created successfully",
      "createFailed": "Failed to create product",
      "requiredFields": "Please fill in all required fields"
    }
  }
}
```

### Swedish (sv.json)

```json
{
  "products": {
    "quickAdd": {
      "createSuccess": "Produkt '{name}' skapades framgångsrikt",
      "createFailed": "Misslyckades med att skapa produkt",
      "requiredFields": "Vänligen fyll i alla obligatoriska fält"
    }
  }
}
```

Note: Reuse existing translation keys where possible:
- `products.addProduct` (already exists)
- `products.form.name` (already exists)
- `common.create` (already exists)
- `common.cancel` (already exists)

## Implementation Notes

### Code Reuse

**Copy pattern from:**
1. `MultiItemPurchaseDialog.vue` - Quick Add Supplier (lines 326-400, 900-940)
2. `PurchasesView.vue` - Quick Add Product (lines 365-418, similar logic)

**Key differences from single purchase quick add:**
- Pre-fill supplier from `formData.value.supplierId`
- Auto-select in specific row using `quickProductRowIndex`
- Support multiple suppliers per product (already handled by API)

### State Management

```typescript
// Track which row triggered quick add
const quickProductRowIndex = ref<number | null>(null);

// When opening dialog
function showQuickProductDialog(rowIndex: number) {
  quickProductRowIndex.value = rowIndex;
  quickProductForm.value = {
    name: '',
    supplierId: formData.value.supplierId, // Pre-fill
    unitId: null,
  };
  quickProductDialogVisible.value = true;
}

// After successful creation
const newProduct = response.data;
await loadProducts(); // Refresh list
if (quickProductRowIndex.value !== null) {
  formData.value.items[quickProductRowIndex.value].productId = newProduct.id;
}
```

### Loading States

```typescript
const savingQuickProduct = ref(false);

async function saveQuickProduct() {
  savingQuickProduct.value = true; // Disable button, show spinner
  try {
    // API call
  } finally {
    savingQuickProduct.value = false;
  }
}
```

### Units Loading

The dialog needs units data. Add to MultiItemPurchaseDialog:
```typescript
const units = ref<any[]>([]);

async function loadUnits() {
  const response = await api.get('/units');
  units.value = response.data;
}

// Call in onMounted or when dialog opens
onMounted(() => {
  loadSuppliers();
  loadProducts();
  loadUnits(); // Add this
});
```

## Testing Strategy

### Manual Testing

1. **Happy Path:**
   - Open multi-item purchase
   - Select supplier "Happy Homes"
   - Click [+] next to product dropdown
   - Verify supplier is pre-filled
   - Enter product name and unit
   - Click Create
   - Verify product appears in dropdown
   - Verify product is auto-selected

2. **Validation:**
   - Try creating with empty name → Should show error
   - Try creating with empty unit → Should show error
   - Try creating duplicate name → Should show error

3. **Supplier Pre-fill:**
   - Select different supplier
   - Open quick add
   - Verify correct supplier is pre-filled

4. **Multiple Rows:**
   - Add multiple item rows
   - Quick add product from row 2
   - Verify product is selected in row 2 only

5. **Cancel:**
   - Open dialog
   - Click Cancel
   - Verify no product created
   - Verify dialog closes

### Edge Cases

1. **No supplier selected:** Supplier field should be empty (user must select)
2. **Network error:** Show error toast, keep dialog open
3. **Product already exists:** Show clear error message
4. **Concurrent edits:** Product list refreshes, shows latest data

## Rollout Plan

### Phase 1: Implementation (2-3 hours)
1. Add state variables and functions
2. Add UI button and dialog
3. Implement quick add logic
4. Add translations

### Phase 2: Testing (1 hour)
1. Manual testing of all scenarios
2. Verify supplier pre-fill
3. Verify auto-selection
4. Test error handling

### Phase 3: Refinement (optional)
1. Adjust button styling if needed
2. Polish animations
3. Review accessibility

## Future Enhancements

Potential additions for future iterations:
- Quick add unit from within quick add product dialog
- Remember last used unit per supplier
- Bulk product import from CSV
- Product templates for common items
