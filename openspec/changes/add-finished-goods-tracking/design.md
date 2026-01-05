# Design: Finished Goods Tracking

## Architecture Overview

### Data Model
```
FinishedGood (catalog of finished good types)
├── id: Int
├── name: String (unique)
├── description: String?
├── unitId: Int → Unit
├── materialCost: Float (manually entered average cost)
├── isActive: Boolean
└── createdAt: DateTime

YearEndCount (existing, modified)
└── finishedGoodsItems: FinishedGoodsCountItem[]

FinishedGoodsCountItem (new, similar to YearEndCountItem)
├── id: Int
├── yearEndCountId: Int → YearEndCount
├── finishedGoodId: Int → FinishedGood
├── expectedQuantity: Float (from previous year)
├── countedQuantity: Float (manually entered)
├── variance: Float (counted - expected)
├── materialCostPerUnit: Float (snapshot from FinishedGood.materialCost)
└── totalValue: Float (countedQuantity × materialCostPerUnit)
```

### Key Design Decisions

#### 1. Separate from Raw Materials
- Finished goods are distinct entities, not products
- Separate database tables prevent confusion
- UI clearly distinguishes between "Products" (raw materials) and "Finished Goods"

#### 2. Simple Costing Model
- Single `materialCost` field per finished good (average cost)
- Cost is manually entered and updated by users
- Cost is snapshotted in year-end count items (immutable after confirmation)
- No FIFO, no lot tracking (can add later if needed)

#### 3. Year-End Count Integration
- Finished goods follow same workflow as raw materials:
  1. Initiate count → expected quantities populated from previous year
  2. Enter actual counted quantities
  3. System calculates variance and total value
  4. Confirm count → snapshot becomes immutable
- Year locking applies to both raw materials and finished goods

#### 4. Value Calculation
```
For each finished good in count:
  variance = countedQuantity - expectedQuantity
  totalValue = countedQuantity × materialCostPerUnit
  
For year-end summary:
  totalFinishedGoodsValue = Σ(totalValue for all items)
  totalVariance = Σ(variance × materialCostPerUnit)
```

## Component Architecture

### Backend Services
```
finishedGoodService
├── create(name, description, unitId, materialCost)
├── update(id, data)
├── getById(id)
├── getAll(filters)
├── delete(id)
└── updateMaterialCost(id, cost)

yearEndCountService (modified)
├── initiateYearEndCount(year)
│   └── Also populate finished goods expected quantities
├── updateFinishedGoodCountItem(countId, finishedGoodId, countedQuantity)
├── calculateFinishedGoodsVariances(countId)
└── generateYearEndReport(countId)
    └── Include finished goods section

exportService (modified)
└── exportYearEndReportPDF(reportData, language)
    └── Add finished goods section after raw materials
```

### Frontend Components
```
FinishedGoodsView.vue (new)
├── List all finished goods
├── Create/Edit dialog
├── Material cost management
└── Active/Inactive toggle

YearEndCountView.vue (modified)
├── Raw materials table (existing)
├── Finished goods table (new section)
└── Summary includes finished goods totals

Navigation (modified)
└── Add "Finished Goods" menu item
```

## Database Schema Changes

### New Tables
```sql
finished_goods
├── id (PK, autoincrement)
├── name (unique, not null)
├── description (nullable)
├── unit_id (FK → units)
├── material_cost (float, not null)
├── is_active (boolean, default true)
└── created_at (datetime, default now)

finished_goods_count_items
├── id (PK, autoincrement)
├── year_end_count_id (FK → year_end_counts, cascade delete)
├── finished_good_id (FK → finished_goods, restrict delete)
├── expected_quantity (float, not null)
├── counted_quantity (float, nullable)
├── variance (float, nullable)
├── material_cost_per_unit (float, not null, snapshot)
├── total_value (float, nullable)
└── created_at (datetime, default now)
└── UNIQUE(year_end_count_id, finished_good_id)
```

### Indexes
```sql
CREATE INDEX idx_finished_goods_active ON finished_goods(is_active);
CREATE INDEX idx_finished_goods_unit ON finished_goods(unit_id);
CREATE INDEX idx_fg_count_items_count ON finished_goods_count_items(year_end_count_id);
```

## API Endpoints

### Finished Goods Management
```
GET    /api/finished-goods              - List all (with filters)
GET    /api/finished-goods/:id          - Get by ID
POST   /api/finished-goods              - Create new
PUT    /api/finished-goods/:id          - Update
DELETE /api/finished-goods/:id          - Delete (soft delete if used in counts)
PATCH  /api/finished-goods/:id/cost     - Update material cost only
```

### Year-End Count Integration
```
PUT    /api/year-end-count/:id/finished-goods/:finishedGoodId
       - Update counted quantity for finished good
       
GET    /api/year-end-count/:id/finished-goods-variances
       - Get variance summary for finished goods
```

### Modified Endpoints
```
GET    /api/year-end-count/:id/report
       - Response now includes finishedGoodsItems array
       
GET    /api/year-end-count/:id/export-report-pdf
       - PDF now includes finished goods section
```

## PDF Report Layout Changes

### New Section: Finished Goods Inventory
```
Page N: Detailed Product Inventory (Raw Materials)
  [existing raw materials table]

Page N+1: Finished Goods Inventory (NEW)
  ┌─────────────────────────────────────────────────────────┐
  │ Finished Goods Inventory                                 │
  ├──────────────┬──────────┬─────────┬──────────┬──────────┤
  │ Product      │ Expected │ Counted │ Variance │ Value    │
  ├──────────────┼──────────┼─────────┼──────────┼──────────┤
  │ Widget A     │ 100      │ 95      │ -5       │ 9,500 kr │
  │ Widget B     │ 50       │ 60      │ +10      │ 12,000kr │
  └──────────────┴──────────┴─────────┴──────────┴──────────┘
  
  Totals:
  - Total Finished Goods Value: 21,500 kr
  - Total Variance: +5,000 kr

Page N+2: Combined Summary
  ┌─────────────────────────────────────────────────────┐
  │ Total Inventory Value (All Categories)              │
  ├─────────────────────────────────┬───────────────────┤
  │ Raw Materials                   │    65,359.31 kr   │
  │ Finished Goods                  │    21,500.00 kr   │
  ├─────────────────────────────────┼───────────────────┤
  │ TOTAL INVENTORY VALUE           │    86,859.31 kr   │
  └─────────────────────────────────┴───────────────────┘
```

## Validation Rules

### Finished Good Creation
- Name must be unique and non-empty
- Material cost must be >= 0
- Unit must exist and be valid

### Year-End Count
- Cannot delete finished good if used in any year-end count
- Counted quantity must be >= 0
- Material cost snapshot cannot be modified after count confirmation

### Year-End Initiation
- If no previous year exists, expected quantity = 0
- If previous year exists, expected quantity = previous counted quantity
- Material cost is taken from current FinishedGood.materialCost at time of count initiation

## Migration Strategy

### Phase 1: Database Schema
1. Create `finished_goods` table
2. Create `finished_goods_count_items` table
3. Add indexes

### Phase 2: Backend Implementation
1. Create `finishedGoodService`
2. Add API routes
3. Modify `yearEndCountService` to handle finished goods
4. Update PDF export to include finished goods section

### Phase 3: Frontend Implementation
1. Create `FinishedGoodsView.vue`
2. Add navigation menu item
3. Modify `YearEndCountView.vue` to show finished goods section
4. Add translations for new UI elements

### Phase 4: Data Migration
- No data migration needed (new feature)
- Users can start adding finished goods immediately

## Testing Strategy

### Unit Tests
- `finishedGoodService`: CRUD operations
- `yearEndCountService`: Finished goods variance calculations
- PDF export: Finished goods section rendering

### Integration Tests
- Year-end count workflow with finished goods
- Carry-forward logic from previous year
- Year locking includes finished goods

### Manual Testing
- Create finished goods and verify in UI
- Complete year-end count with finished goods
- Verify PDF report includes finished goods
- Test year rollover with finished goods

## Future Enhancements (Out of Scope)
- FIFO costing for finished goods (track production batches)
- Bill of materials (automatic cost calculation)
- Production order tracking
- Raw material consumption when producing finished goods
- Multi-location finished goods inventory
