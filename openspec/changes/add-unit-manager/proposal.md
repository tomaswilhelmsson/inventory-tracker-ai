# Proposal: Add Unit Manager

## Change ID
`add-unit-manager`

## Status
Draft

## Author
System

## Date
2025-12-13

## Problem Statement

Currently, units of measure (e.g., pieces, kg, liters) are hardcoded in the frontend as a static array in `ProductsView.vue`. This approach has several limitations:

1. **No persistence**: Units are not stored in the database as separate entities
2. **Limited flexibility**: Adding or removing units requires code changes
3. **No validation**: Cannot prevent deletion of units that are in use by products
4. **Poor UX**: Users cannot customize units to match their business needs
5. **Inconsistency risk**: Multiple views may have different unit lists

## Proposed Solution

Add a comprehensive Unit Manager feature that allows users to:
- View all available units of measure
- Create new custom units
- Edit existing unit names/abbreviations
- Delete units (with cascade protection)
- See which products use each unit

This will follow the existing pattern established by Suppliers and Products management.

## User Stories

1. As a warehouse manager, I want to add custom units (e.g., "pallets", "cartons") so I can track inventory using units relevant to my business
2. As an admin, I want to rename units (e.g., "kg" to "kilograms") for clarity
3. As a user, I want to be prevented from deleting units that are in use by products to avoid data integrity issues
4. As an inventory clerk, I want to see which products use each unit before attempting deletion

## Scope

### In Scope
- Create Unit database model with Prisma
- Backend API endpoints for CRUD operations on units
- Frontend UnitsView component with DataTable
- Navigation menu item for Units
- Cascade protection (prevent deletion of units in use)
- Update ProductsView to fetch units from API instead of hardcoded array
- Database migration and seed data

### Out of Scope
- Unit conversion/calculation features
- Multi-language support for unit names
- Unit categories/grouping
- Historical tracking of unit changes
- Bulk import/export of units

## Dependencies

- Existing product management system
- Prisma ORM and database schema
- Vue 3 component architecture
- PrimeVue UI components

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Existing products have hardcoded "pieces" default | Medium | Migration will set existing products to use a default "pieces" unit record |
| Users delete critical units | High | Cascade protection prevents deletion of units in use |
| Performance degradation on unit list fetch | Low | Units table will be small (<100 records), cache in frontend if needed |

## Success Criteria

1. Users can manage units via dedicated UI without code changes
2. Products continue to work with new unit system
3. Cascade protection prevents data integrity issues
4. All existing functionality (inventory, purchases, year-end count) continues to display units correctly
5. Database migration completes successfully without data loss

## Open Questions

1. Should we provide a set of default units on first setup, or start with an empty list?
   - **Recommendation**: Seed with common units (pieces, kg, g, liters, ml, m, m2, m3, boxes, pallets, rolls)

2. Should unit names be unique across the system?
   - **Recommendation**: Yes, enforce uniqueness to avoid confusion

3. Should we allow abbreviations (e.g., "kg" vs "kilograms")?
   - **Recommendation**: Keep it simple - single name field only in v1, can add abbreviations later if needed

## Implementation Notes

- Follow existing CRUD patterns from Suppliers/Products
- Use PrimeVue DataTable with inline editing
- Backend validation for uniqueness and cascade checks
- Database index on unit name for efficient lookups
