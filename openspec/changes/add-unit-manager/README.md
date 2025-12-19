# Change Proposal: Add Unit Manager

## Status
✅ **Validated** - Ready for Review

## Quick Summary

This change proposal adds a complete Unit Management system to the inventory tracker, allowing users to create, edit, and delete units of measure through a dedicated UI instead of relying on hardcoded values.

## What's Included

### 📄 Documents Created

1. **proposal.md** - High-level overview
   - Problem statement
   - Proposed solution
   - User stories
   - Scope definition
   - Success criteria

2. **tasks.md** - Detailed implementation checklist
   - 4 phases with 30+ granular tasks
   - Dependencies and parallelization notes
   - Validation steps for each task
   - Estimated effort: 14-20 hours

3. **design.md** - Technical architecture
   - Data model changes (Prisma schema)
   - API design with request/response examples
   - UI component hierarchy
   - Migration strategy with rollback plan
   - Performance and security considerations

4. **specs/** - Three capability specifications
   - `unit-management` - Backend CRUD operations
   - `product-integration` - Product-Unit relationship
   - `ui-components` - Frontend interfaces

### 🎯 Key Features

- **Database Model**: New `Unit` table with cascade protection
- **Backend API**: Full CRUD endpoints (`/api/units`)
- **Frontend UI**: Dedicated UnitsView with DataTable
- **Navigation**: New menu item for Units management
- **Validation**: Prevent deletion of units in use
- **Migration**: Convert existing string units to database records
- **Integration**: Update ProductsView to use dynamic units

### 📊 Capabilities

```
unit-management (Backend)
├── UM-001: Unit Data Model
├── UM-002: Unit CRUD API
├── UM-003: Unit Service Layer
└── UM-004: Authentication

product-integration (Backend + Database)
├── PI-001: Product-Unit Relationship (FK)
├── PI-002: Product API Returns Unit Details
├── PI-003: Product Validation
├── PI-004: Remove String-Based Unit (REMOVED)
└── PI-005: Data Migration

ui-components (Frontend)
├── UI-001: Units Management View
├── UI-002: Create/Edit Dialog
├── UI-003: Deletion with Protection
├── UI-004: Error Handling
├── UI-005: Navigation Integration
├── UI-006: ProductsView Dynamic Units (MODIFIED)
└── UI-007: Remove Hardcoded Units (REMOVED)
```

## How to Review

1. **Read proposal.md** for business context and user stories
2. **Review design.md** for technical approach and trade-offs
3. **Check tasks.md** for implementation breakdown
4. **Examine specs/** for detailed requirements and scenarios

## Next Steps

### To Approve
```bash
openspec approve add-unit-manager
```

### To Apply (after approval)
```bash
openspec apply add-unit-manager
```

### To View Details
```bash
openspec show add-unit-manager
openspec show add-unit-manager --json
openspec show add-unit-manager --deltas-only
```

## Questions Answered

- **Q: Should we provide default units?**  
  A: Yes, seed with common units (pieces, kg, g, liters, ml, m, m2, m3, boxes, pallets, rolls)

- **Q: Should unit names be unique?**  
  A: Yes, enforce database-level uniqueness

- **Q: Should we allow abbreviations?**  
  A: Not in v1 - keep single name field, can add later

## Migration Notes

- Existing products will be migrated to use unit references
- All current unit strings will be converted to database records
- Rollback plan included in design.md
- No data loss expected

## Validation

✅ All specs validated with `openspec validate --strict`  
✅ No validation errors  
✅ Cross-references properly linked  
✅ Scenarios cover success and failure paths
