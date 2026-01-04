# Proposal: Add Quick Product Creation to Multi-Item Purchase Dialog

## Problem Statement

When registering a multi-item purchase in the Multi-Item Purchase Dialog, users can only select from existing products. If a new product needs to be added, users must:
1. Cancel the multi-item purchase dialog
2. Navigate to the Products view
3. Create the new product
4. Return to the Purchases view
5. Start the multi-item purchase entry again

This workflow interruption causes:
- Loss of any partially entered purchase data
- Frustration and time waste
- Increased likelihood of data entry errors

The single purchase dialog already has this quick add functionality for products, but the multi-item dialog only has quick add for suppliers.

## Proposed Solution

Add a "Quick Add Product" button next to the product dropdown in the Multi-Item Purchase Dialog, mirroring the existing quick add supplier functionality. The quick add product dialog should:

1. Allow creating a product with minimal required fields (name, supplier, unit)
2. Pre-populate the supplier field with the currently selected supplier from the main form
3. Automatically refresh the product list after creation
4. Auto-select the newly created product in the current row

This maintains consistency with:
- The existing quick add supplier pattern in the multi-item dialog
- The existing quick add product pattern in the single purchase dialog

## Scope

**In Scope:**
- Add quick add product button to MultiItemPurchaseDialog component
- Implement quick add product dialog with form (name, supplier, unit)
- Auto-populate supplier from main form
- Refresh product list after creation
- Auto-select new product in current row
- Handle validation and error messages
- Support multiple suppliers per product (existing feature)

**Out of Scope:**
- Modifying the Products view or single purchase dialog (already has this feature)
- Adding description or other optional product fields (keep minimal)
- Changing the product creation API (use existing endpoint)
- Adding quick add unit functionality

## User Stories

**As a** warehouse manager entering a multi-item purchase,  
**I want to** quickly create a new product without leaving the dialog,  
**So that** I can complete my purchase entry without losing data or context.

**As a** user creating a new product in the multi-item dialog,  
**I want the** supplier field to be pre-filled with my selected supplier,  
**So that** I don't have to re-select it.

**As a** user who just created a product,  
**I want it** to be automatically selected in my current row,  
**So that** I can immediately continue entering quantity and cost.

## Success Criteria

1. Quick add product button appears next to product dropdown in multi-item dialog
2. Quick add dialog shows name, supplier (pre-filled), and unit fields
3. New product is created with selected supplier association
4. Product list refreshes automatically after creation
5. New product is auto-selected in the row where quick add was triggered
6. Validation errors are displayed clearly
7. Dialog can be cancelled without side effects
8. Existing quick add supplier functionality remains unchanged

## Dependencies

- Existing `/products` API endpoint for product creation
- Existing product-supplier many-to-many relationship
- PrimeVue Dialog and Form components
- i18n translations for new UI elements

## Risks and Mitigations

**Risk:** Users might create duplicate products with slightly different names  
**Mitigation:** Show validation error if product name already exists (existing behavior)

**Risk:** Product creation might fail if required relationships (supplier, unit) are invalid  
**Mitigation:** Validate before submission, show clear error messages

**Risk:** UI might become cluttered with too many action buttons  
**Mitigation:** Use consistent icon-based button design matching quick add supplier

## Alternatives Considered

1. **Do nothing**: Users continue the disruptive workflow  
   - Rejected: Poor UX, data loss risk

2. **Add full product form**: Include all product fields (description, etc.)  
   - Rejected: Too complex for quick add, use minimal fields only

3. **Redirect to Products view**: Auto-navigate and return  
   - Rejected: Still causes data loss and complex state management

## Timeline Estimate

- Proposal & Validation: 1 hour
- Implementation: 2-3 hours
- Testing & Refinement: 1 hour
- **Total**: 4-5 hours
