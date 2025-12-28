# Spec: Product-Supplier Management API

## Overview
API endpoints for managing many-to-many relationships between products and suppliers, including CRUD operations and supplier-specific pricing.

## ADDED Requirements

### Requirement: List Products with Multiple Suppliers
The system SHALL return all suppliers associated with each product.

#### Scenario: GET /api/products returns supplier array
**Given** a product has multiple suppliers  
**When** fetching the product list via GET /api/products  
**Then** each product must include a `suppliers` array  
**And** each supplier entry must contain:
- `id` (ProductSupplier ID)
- `supplier` (full Supplier object)
- `preferredUnitCost` (nullable price)
- `createdAt` (association timestamp)

**Example Response:**
```json
{
  "id": 1,
  "name": "Laptop Model X",
  "suppliers": [
    {
      "id": 1,
      "supplier": { "id": 5, "name": "Tech Corp" },
      "preferredUnitCost": 1200.00,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "supplier": { "id": 8, "name": "Office Supply Co" },
      "preferredUnitCost": null,
      "createdAt": "2024-02-20T14:30:00Z"
    }
  ]
}
```

### Requirement: Create Product with Multiple Suppliers
The system SHALL allow specifying multiple suppliers when creating a product.

#### Scenario: POST /api/products with supplier array
**Given** a user wants to create a new product  
**When** submitting POST /api/products with:
```json
{
  "name": "New Laptop",
  "supplierIds": [5, 8, 12],
  "unitId": 2
}
```
**Then** the system must:
- Create the Product record
- Create ProductSupplier records for each supplier ID
- Return the product with populated suppliers array

#### Scenario: Reject invalid supplier IDs
**Given** a product is being created  
**When** the `supplierIds` array contains non-existent supplier IDs  
**Then** the system must return 400 Bad Request  
**And** include error message "Invalid supplier ID(s): [list]"

#### Scenario: Require at least one supplier
**Given** a product is being created  
**When** the `supplierIds` array is empty  
**Then** the system must return 400 Bad Request  
**And** include error message "Product must have at least one supplier"

### Requirement: Add Supplier to Existing Product
The system SHALL support adding new suppliers to existing products.

#### Scenario: PUT /api/products/:id/suppliers
**Given** a product exists with ID 1  
**When** sending PUT /api/products/1/suppliers with:
```json
{
  "supplierId": 15,
  "preferredUnitCost": 1300.00
}
```
**Then** the system must create a ProductSupplier association  
**And** return 201 Created with the new association details

#### Scenario: Prevent duplicate supplier associations
**Given** product 1 is already associated with supplier 5  
**When** attempting to add supplier 5 again  
**Then** the system must return 409 Conflict  
**And** include error message "Supplier already associated with this product"

#### Scenario: Validate preferred unit cost
**Given** adding a supplier to a product  
**When** `preferredUnitCost` is provided as negative or zero  
**Then** the system must return 400 Bad Request  
**And** require positive decimal values only

### Requirement: Update Supplier-Product Pricing
The system SHALL allow updating the preferred unit cost for existing associations.

#### Scenario: PATCH /api/products/:id/suppliers/:supplierId
**Given** product 1 is associated with supplier 5  
**When** sending PATCH /api/products/1/suppliers/5 with:
```json
{
  "preferredUnitCost": 1225.00
}
```
**Then** the system must update the ProductSupplier record  
**And** return 200 OK with updated association

#### Scenario: Allow clearing preferred cost
**Given** a product-supplier association has a preferred cost  
**When** sending PATCH with `preferredUnitCost: null`  
**Then** the system must set the cost to null  
**And** return 200 OK

### Requirement: Remove Supplier from Product
The system SHALL support removing supplier associations from products.

#### Scenario: DELETE /api/products/:id/suppliers/:supplierId
**Given** product 1 is associated with suppliers 5 and 8  
**When** sending DELETE /api/products/1/suppliers/5  
**Then** the system must delete the ProductSupplier record  
**And** return 204 No Content

#### Scenario: Prevent removing last supplier
**Given** product 1 has only one supplier (ID 5)  
**When** attempting to DELETE /api/products/1/suppliers/5  
**Then** the system must return 400 Bad Request  
**And** include error message "Cannot remove last supplier from product"

**Rationale**: Products SHALL always have at least one supplier for business logic integrity.

### Requirement: Get Suggested Price for Product-Supplier Combination
The system SHALL provide pricing guidance when creating purchases.

#### Scenario: GET /api/products/:id/suppliers/:supplierId/suggested-price
**Given** product 1 has a preferred cost of 1200.00 for supplier 5  
**When** fetching GET /api/products/1/suppliers/5/suggested-price  
**Then** the system must return:
```json
{
  "suggestedPrice": 1200.00,
  "source": "preferred"
}
```

#### Scenario: Fallback to recent purchase price
**Given** product 1 has no preferred cost for supplier 5  
**And** the most recent purchase from supplier 5 cost 1180.00  
**When** fetching suggested price  
**Then** the system must return:
```json
{
  "suggestedPrice": 1180.00,
  "source": "recent_purchase"
}
```

#### Scenario: Return null when no price data available
**Given** product 1 has no preferred cost and no purchase history for supplier 5  
**When** fetching suggested price  
**Then** the system must return:
```json
{
  "suggestedPrice": null,
  "source": "none"
}
```

## MODIFIED Requirements

### Requirement: Update Product Endpoint
Product update operations SHALL handle supplier associations.

#### Scenario: PUT /api/products/:id supports supplier updates
**Given** a product exists  
**When** sending PUT /api/products/1 with:
```json
{
  "name": "Updated Name",
  "supplierIds": [5, 9],
  "unitId": 2
}
```
**Then** the system must:
- Update product details
- Replace supplier associations with new list
- Remove associations not in new list
- Add associations from new list

#### Scenario: Preserve associations if supplierIds not provided
**Given** a product has suppliers [5, 8]  
**When** sending PUT /api/products/1 without `supplierIds` field  
**Then** the system must update other fields  
**And** leave supplier associations unchanged

## Validation Rules

1. **Supplier IDs**: Must reference existing Supplier records
2. **Preferred Unit Cost**: Must be positive number or null
3. **Minimum Suppliers**: Product must have at least one supplier at all times
4. **Unique Associations**: Each product-supplier pair must be unique

## Error Responses

| Status Code | Scenario | Error Message |
|-------------|----------|---------------|
| 400 | Empty supplier array | "Product must have at least one supplier" |
| 400 | Invalid supplier ID | "Invalid supplier ID(s): [ids]" |
| 400 | Negative price | "Preferred unit cost must be positive" |
| 400 | Removing last supplier | "Cannot remove last supplier from product" |
| 404 | Product not found | "Product not found" |
| 404 | Supplier not found | "Supplier not found" |
| 404 | Association not found | "Product is not associated with this supplier" |
| 409 | Duplicate association | "Supplier already associated with this product" |

## Performance Requirements

1. **Eager Loading**: Product list must load suppliers in single query (avoid N+1)
2. **Response Time**: Product CRUD operations <200ms for 1000 products
3. **Batch Operations**: Support adding/removing multiple suppliers in single request (future enhancement)
