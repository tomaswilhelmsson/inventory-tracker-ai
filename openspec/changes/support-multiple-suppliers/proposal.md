# Proposal: Support Multiple Suppliers per Product

## Problem Statement

Currently, each product can only be associated with a single supplier. This is unrealistic for businesses that source the same product from multiple vendors for price comparison, supply chain redundancy, or availability reasons.

**Current limitations:**
- Products have a rigid one-to-one relationship with suppliers (`supplierId` field)
- Cannot track that "Laptop Model X" can be purchased from both "Supplier A" and "Supplier B"
- Purchase forms don't allow selecting alternate suppliers for existing products
- Inventory reports can't show which suppliers provide which products

## Proposed Solution

Transform the product-supplier relationship from one-to-one to many-to-many by:

1. **Database Schema**: Create a junction table `ProductSupplier` to link products with multiple suppliers
2. **Data Migration**: Migrate existing single-supplier products to the new many-to-many model
3. **Supplier-Product Pricing**: Track preferred/historical unit costs per supplier-product combination
4. **Purchase Workflow**: Allow selecting any supplier when creating purchases, with supplier-specific price suggestions
5. **Inventory Views**: Support both aggregated (by product) and detailed (by supplier-product) views
6. **Legacy Data Import**: Update JSON import scripts to support the new multi-supplier structure

**Key Benefits:**
- More accurate representation of real-world supply chains
- Price comparison across suppliers for the same product
- Better inventory visibility (which suppliers provide stock)
- Flexibility to switch suppliers without creating duplicate products

## User Impact

**Existing Users:**
- Existing products will be migrated automatically (single supplier → multi-supplier)
- No data loss - all historical purchase lots remain linked correctly
- UI changes are additive (new views/filters), existing workflows continue to work

**New Capabilities:**
- Add multiple suppliers to any product
- See price history per supplier
- Filter inventory by supplier
- Make informed supplier selection during purchases

## Technical Approach

### Schema Changes
- Add `ProductSupplier` junction table with optional `preferredUnitCost` field
- Remove `supplierId` from `Product` table (breaking change)
- Add database migration with data transformation

### API Changes
- Update product CRUD endpoints to handle supplier associations
- Add endpoint to manage product-supplier relationships
- Modify purchase creation to validate supplier-product combinations (optional)

### UI Changes
- Products view: Multi-select for suppliers
- Purchase forms: Supplier dropdown shows suggested price when available
- Inventory views: Toggle between aggregated and supplier-specific views
- Reports: Filter/group by supplier

### Migration Strategy
1. Create `ProductSupplier` records from existing `Product.supplierId` relationships
2. Remove `supplierId` column after data migration
3. Update import scripts to handle new structure
4. Regenerate Prisma client

## Risks & Mitigations

**Risk**: Breaking change to database schema
- **Mitigation**: Comprehensive migration script with rollback capability, test on backup database first

**Risk**: Existing purchase lots reference suppliers differently than products
- **Mitigation**: Purchase lots already have independent `supplierId` field (nullable), no change needed

**Risk**: Performance impact of joins on large datasets
- **Mitigation**: Add indexes on junction table, monitor query performance

**Risk**: Confusion about which supplier to use for purchases
- **Mitigation**: Show recent purchase history with prices to guide selection

## Open Questions

None - all design decisions clarified:
- Single product with multiple supplier associations (Option A)
- No primary/preferred supplier concept at product level
- Full migration of existing data
- Any supplier allowed during purchases
- Supplier-specific pricing tracked
- Both aggregated and detailed inventory views available

## Success Criteria

1. All existing products successfully migrated to multi-supplier model
2. Can add/remove suppliers from products without data loss
3. Purchase workflow shows supplier-specific price suggestions
4. Inventory views support both aggregated and supplier-filtered display
5. Legacy JSON import script handles new multi-supplier format
6. Zero downtime during migration (for production deployments)
