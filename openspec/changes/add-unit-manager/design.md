# Design: Add Unit Manager

## Overview

This design document outlines the architecture and implementation details for adding a Unit Manager feature to the inventory tracking system. The feature will allow users to manage units of measure (e.g., pieces, kg, liters) through a dedicated UI instead of relying on hardcoded values.

## Architecture

### Current State

```
Product Model (Prisma)
├── unit: String (hardcoded default: "pieces")
└── No validation or management

ProductsView.vue
└── unitOptions: hardcoded array
```

### Target State

```
Unit Model (Prisma)
├── id: Int
├── name: String (unique)
└── createdAt: DateTime

Product Model (Prisma)
├── unitId: Int (foreign key)
└── unit: Unit (relation, onDelete: Restrict)

Backend
├── services/unitService.ts
├── routes/units.ts
└── API endpoints for CRUD

Frontend
├── views/UnitsView.vue (new)
├── views/ProductsView.vue (updated)
└── Dynamic unit loading from API
```

## Data Model

### Unit Schema (Prisma)

```prisma
model Unit {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  createdAt DateTime  @default(now())
  
  products  Product[]
  
  @@map("units")
}

model Product {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  unitId      Int       // Changed from: unit String
  supplierId  Int
  createdAt   DateTime  @default(now())
  
  unit        Unit      @relation(fields: [unitId], references: [id], onDelete: Restrict)
  supplier    Supplier  @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  purchaseLots PurchaseLot[]
  yearEndCountItems YearEndCountItem[]
  
  @@map("products")
}
```

**Design Decisions:**
- `onDelete: Restrict` prevents deletion of units in use by products (cascade protection)
- `name` is unique to avoid duplicate units (e.g., two "kg" entries)
- Simple model with only essential fields; extensible for future features (abbreviations, descriptions)

### Migration Strategy

1. Create `units` table
2. Seed default units from existing hardcoded list
3. Add `unitId` column to `products` table
4. Migrate existing product.unit strings:
   ```sql
   -- For each product with unit="pieces", set unitId to the id of "pieces" unit
   -- For each product with unit="kg", set unitId to the id of "kg" unit
   -- etc.
   ```
5. Remove old `unit` string column from products
6. Add foreign key constraint

**Rollback Plan:**
- Keep backup before migration
- If migration fails, restore from backup
- If migration succeeds but issues found, can add back unit string column and populate from unit.name

## API Design

### Endpoints

```
GET    /api/units          - List all units with product count
GET    /api/units/:id      - Get unit by ID with related products
POST   /api/units          - Create new unit
PUT    /api/units/:id      - Update unit name
DELETE /api/units/:id      - Delete unit (cascade check)
```

### Request/Response Examples

**GET /api/units**
```json
Response 200:
[
  {
    "id": 1,
    "name": "pieces",
    "createdAt": "2025-01-01T00:00:00Z",
    "_count": {
      "products": 15
    }
  },
  {
    "id": 2,
    "name": "kg",
    "createdAt": "2025-01-01T00:00:00Z",
    "_count": {
      "products": 8
    }
  }
]
```

**POST /api/units**
```json
Request:
{
  "name": "cartons"
}

Response 201:
{
  "id": 13,
  "name": "cartons",
  "createdAt": "2025-12-13T10:30:00Z"
}

Error 400:
{
  "error": "Unit with this name already exists"
}
```

**DELETE /api/units/1**
```json
Response 200:
{
  "message": "Unit deleted successfully"
}

Error 400:
{
  "error": "Cannot delete unit with 15 product(s). Reassign products first."
}
```

## Frontend Architecture

### Component Hierarchy

```
UnitsView.vue
├── Card (PrimeVue)
│   └── DataTable
│       ├── Column: Name
│       ├── Column: Products Count
│       └── Column: Actions (Edit, Delete)
├── Dialog (Create/Edit)
│   └── InputText (unit name)
└── Toast notifications
```

### State Management

No Pinia store needed initially - component-level state is sufficient:
- `units: Ref<Unit[]>` - list of all units
- `loading: Ref<boolean>` - loading state
- `dialogVisible: Ref<boolean>` - dialog visibility
- `formData: Ref<FormData>` - form state
- `editMode: Ref<boolean>` - create vs edit mode

If needed later, can add Pinia store for caching units across components.

### Component Interactions

1. **UnitsView** fetches units from `/api/units`
2. **ProductsView** fetches units from `/api/units` for dropdown
3. **Other views** display `product.unit.name` via API responses (already includes unit relation)

## User Interface Design

### UnitsView Layout

```
┌─────────────────────────────────────────────────┐
│  Units Management                    [+ Add Unit] │
├─────────────────────────────────────────────────┤
│  [Search units...]                              │
├──────────┬─────────────┬─────────────────────────┤
│  Name    │  Products   │  Actions                │
├──────────┼─────────────┼─────────────────────────┤
│  pieces  │  15         │  [Edit] [Delete]        │
│  kg      │  8          │  [Edit] [Delete]        │
│  liters  │  0          │  [Edit] [Delete]        │
│  ...     │  ...        │  ...                    │
└──────────┴─────────────┴─────────────────────────┘
```

### Create/Edit Dialog

```
┌───────────────────────────────┐
│  Add Unit                  [×] │
├───────────────────────────────┤
│                               │
│  Unit Name: [_____________]   │
│                               │
├───────────────────────────────┤
│         [Cancel]  [Create]    │
└───────────────────────────────┘
```

### Delete Confirmation

```
┌───────────────────────────────────────┐
│  Confirm Deletion                  [×] │
├───────────────────────────────────────┤
│  ⚠️  Are you sure you want to delete  │
│      unit "kg"?                       │
│                                       │
│      This unit is used by 8 products. │
│      You must reassign those products │
│      before deleting this unit.       │
├───────────────────────────────────────┤
│              [Cancel]  [Delete]       │
└───────────────────────────────────────┘
```

## Navigation Integration

Add Units menu item in main navigation (AppLayout or similar):

```
Dashboard
Suppliers
Products
→ Units (NEW)
Purchases
Inventory
Year-End Count
Reports
```

## Error Handling

### Backend Errors

| Error | Status | Message |
|-------|--------|---------|
| Unit name already exists | 400 | "Unit with this name already exists" |
| Unit in use (delete attempt) | 400 | "Cannot delete unit with X product(s). Reassign products first." |
| Unit not found | 404 | "Unit not found" |
| Invalid unit name (empty) | 400 | "Unit name is required" |

### Frontend Error Handling

- Display toast notifications for all errors
- Show inline validation in forms
- Disable delete button if unit has products (with tooltip explanation)
- Show loading states during API calls
- Graceful degradation if units API fails (fallback to cached data or hardcoded list)

## Performance Considerations

### Database Indexes

```prisma
model Unit {
  // ...
  @@index([name]) // For efficient lookups and uniqueness checks
}

model Product {
  // ...
  @@index([unitId]) // For efficient join queries
}
```

### Caching Strategy

- **Backend**: No caching needed (units table is small, rarely changes)
- **Frontend**: 
  - Cache units in component after first fetch
  - Refresh on CRUD operations
  - Optional: Add Pinia store if multiple components need units simultaneously

### Query Optimization

Use Prisma's `select` and `include` to fetch only needed fields:

```typescript
// Efficient unit list with product count
const units = await prisma.unit.findMany({
  orderBy: { name: 'asc' },
  include: {
    _count: {
      select: {
        products: true
      }
    }
  }
});
```

## Security Considerations

- **Authentication**: All unit endpoints require authentication (existing middleware)
- **Authorization**: No role-based access control needed (simple auth model)
- **Validation**: 
  - Sanitize unit names (trim whitespace, prevent SQL injection via Prisma)
  - Enforce max length on unit names (e.g., 50 characters)
  - Prevent special characters if needed (alphanumeric + spaces/hyphens only)
- **Cascade Protection**: Prevent deletion of units in use (database constraint + API check)

## Testing Strategy

### Unit Tests (Backend)

```typescript
describe('UnitService', () => {
  test('create() creates new unit with unique name', async () => {});
  test('create() throws error for duplicate name', async () => {});
  test('delete() prevents deletion of unit in use', async () => {});
  test('delete() succeeds for unused unit', async () => {});
  test('update() allows name change', async () => {});
  test('update() validates uniqueness on update', async () => {});
});
```

### Integration Tests (API)

```typescript
describe('GET /api/units', () => {
  test('returns all units with product counts', async () => {});
  test('requires authentication', async () => {});
});

describe('DELETE /api/units/:id', () => {
  test('prevents deletion of unit with products', async () => {});
  test('successfully deletes unused unit', async () => {});
});
```

### Component Tests (Frontend)

```typescript
describe('UnitsView', () => {
  test('renders unit list', async () => {});
  test('opens create dialog on button click', async () => {});
  test('displays error toast on API failure', async () => {});
  test('disables delete for units in use', async () => {});
});
```

### E2E Test Scenarios

1. Create unit → Assign to product → Delete unit (should fail) → Reassign product → Delete unit (should succeed)
2. Edit unit name → Verify change reflects in product views
3. Search/filter units in table
4. Create duplicate unit (should show error)

## Alternative Approaches Considered

### 1. Keep Hardcoded Units
**Pros**: Simpler, no database changes
**Cons**: No flexibility, requires code deployment for unit changes
**Decision**: Rejected - not scalable for diverse business needs

### 2. Unit Categories/Types
**Pros**: Better organization (weight, volume, length, etc.)
**Cons**: Adds complexity, not requested by user
**Decision**: Deferred to future iteration if needed

### 3. Unit Conversion System
**Pros**: Automatic conversion (kg ↔ g, m ↔ cm)
**Cons**: Complex, error-prone, not requested
**Decision**: Out of scope for v1

### 4. Multi-tenant Units (per-user or per-organization)
**Pros**: Isolation for multi-tenant scenarios
**Cons**: App uses simple auth (no multi-tenancy)
**Decision**: Not applicable to current architecture

## Rollout Plan

### Phase 1: Backend (No User Impact)
1. Deploy database migration
2. Deploy unit API endpoints
3. Verify existing product functionality unchanged

### Phase 2: Frontend (Gradual Rollout)
1. Deploy UnitsView (new route, no impact on existing features)
2. Update ProductsView to use API units (test thoroughly)
3. Verify all other views display units correctly

### Rollback Strategy
1. If Phase 1 issues: Restore database backup, redeploy previous backend
2. If Phase 2 issues: Revert frontend to hardcoded units, keep backend changes (harmless)

## Future Enhancements

Potential additions for future iterations:
- Unit abbreviations (display "kg" but store "kilograms")
- Unit descriptions/help text
- Unit categories/grouping
- Bulk import/export of units
- Unit conversion factors
- Audit log for unit changes
- Multi-language unit names
