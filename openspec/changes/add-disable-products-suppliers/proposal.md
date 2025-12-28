# Proposal: Add Disable Products and Suppliers

## Change ID
`add-disable-products-suppliers`

## Status
Draft

## Author
AI Assistant

## Date
2025-12-28

## Problem Statement

Currently, the system does not provide a way to hide products or suppliers that are no longer actively used while preserving their historical data. This creates several challenges:

1. **Cluttered UI**: Inactive products and suppliers appear in all dropdowns and lists, making it harder to find active items
2. **No soft delete**: Users cannot temporarily disable items without permanently deleting them and losing historical data
3. **Historical data preservation**: Deleting items with purchase history is already prevented by cascade protection, but there's no alternative to hide them
4. **User workflow disruption**: Users must scroll through inactive items when creating purchases or managing inventory

## Proposed Solution

Add a "disabled" state to products and suppliers that allows users to:
- Mark products/suppliers as disabled (soft disable)
- Hide disabled items from input fields (dropdowns, multi-selects) by default
- Hide disabled items from main list views by default
- Provide a toggle/filter option to show disabled items when needed
- Re-enable disabled items at any time
- Preserve all historical data and relationships for disabled items

This follows the common "soft delete" or "archive" pattern used in many business applications.

## User Stories

1. As a warehouse manager, I want to disable products that we no longer stock so they don't clutter my purchase entry dropdowns
2. As an admin, I want to disable suppliers we no longer work with while preserving historical purchase data for auditing
3. As an inventory clerk, I want to see only active products in the inventory list by default, but be able to view disabled ones when needed
4. As a user, I want to re-enable a previously disabled supplier if we resume business with them

## Scope

### In Scope
- Add `isActive` boolean field to Product and Supplier models (default: true)
- Backend API filtering to exclude inactive items from default queries
- Backend API parameter to include inactive items when explicitly requested
- Frontend UI toggle to show/hide disabled items in list views
- Frontend filtering to exclude disabled items from dropdowns and multi-selects
- UI indicators (visual styling) for disabled items when shown
- Enable/Disable buttons in product and supplier management views
- Database migration to add `isActive` field

### Out of Scope
- Audit log of disable/enable actions (can be added later)
- Bulk disable/enable operations
- Scheduled auto-disable based on inactivity
- Disabling units (not requested, less common use case)
- Cascading disable (e.g., disabling supplier auto-disables their products)
- Complete soft delete implementation (deleted vs disabled are different states)

## Dependencies

- Existing product and supplier management system
- Prisma ORM and database schema
- Vue 3 frontend with PrimeVue components
- Current API filtering mechanisms

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Disabled items break existing purchases | High | Purchases use snapshots, not live references - disabled status won't affect historical data |
| Users accidentally disable critical items | Medium | Add confirmation dialog for disable action, easy re-enable |
| Performance impact from filtering queries | Low | Add database index on `isActive` field, most queries already filter |
| Existing API consumers expect all items | Medium | Default to active-only, provide `includeInactive=true` query param for backward compatibility |

## Success Criteria

1. Users can disable and re-enable products and suppliers without data loss
2. Disabled items are hidden from dropdowns by default
3. Disabled items can be viewed when toggled "Show Disabled" in list views
4. All existing functionality (purchases, inventory, year-end count) continues to work with disabled items
5. Historical purchase data remains intact for disabled products/suppliers
6. Database migration completes successfully without data loss

## Open Questions

1. Should disabled products/suppliers be allowed in NEW purchases?
   - **Recommendation**: No - prevent selection of disabled items in purchase forms. Existing purchases with disabled items remain unchanged.

2. Should we show a warning when disabling a product/supplier?
   - **Recommendation**: Yes - show confirmation dialog with count of existing purchases

3. What should be the default view (active only or include disabled)?
   - **Recommendation**: Active only by default, with toggle to show all

4. Should we show disabled count in UI?
   - **Recommendation**: Yes - show count like "Products (45 active, 12 disabled)"

5. Should inventory view include disabled products with remaining stock?
   - **Recommendation**: Yes - if a disabled product has remaining inventory, it should be visible in inventory view (with visual indicator)

## Implementation Notes

- Use Prisma schema boolean field with default value `true`
- Add database index on `isActive` for efficient filtering
- Backend: Update all `getAll()` service methods to filter by `isActive` by default
- Frontend: Add toggle switches in ProductsView and SuppliersView headers
- Use PrimeVue Button/ToggleButton for show/hide disabled items
- Visual indicator: grayed out text or strikethrough for disabled items when shown
