# Spec: Legacy JSON Import Script Updates

## Overview
Update the import script to support the new multi-supplier product model while maintaining backward compatibility with old JSON format.

## MODIFIED Requirements

### Requirement: Support New Multi-Supplier JSON Format
Import script SHALL handle products with multiple suppliers.

#### Scenario: Import product with suppliers array
**Given** JSON contains:
```json
{
  "products": [
    {
      "name": "Laptop Model X",
      "supplierIds": [5, 8],
      "unitId": 2
    }
  ]
}
```
**When** running the import script  
**Then** the product must be created with associations to suppliers 5 and 8

### Requirement: Backward Compatibility with Old Format
Import script SHALL convert old single-supplier format to new format.

#### Scenario: Import legacy product with supplierId
**Given** JSON contains old format:
```json
{
  "products": [
    {
      "name": "Old Product",
      "supplierId": 5,
      "unitId": 2
    }
  ]
}
```
**When** running the import script  
**Then** the product must be created  
**And** a ProductSupplier association must be created for supplier 5  
**And** a warning must be logged about old format usage

### Requirement: Validate Supplier References
Import SHALL validate that all supplier IDs exist before creating products.

#### Scenario: Reject products with invalid supplier IDs
**Given** JSON references supplier ID 999 which doesn't exist  
**When** importing the data  
**Then** the import must fail with error message  
**And** specify which supplier IDs are invalid  
**And** no partial data must be committed

## Validation Rules

1. **Supplier IDs**: All referenced suppliers must exist in database
2. **Format Detection**: Auto-detect old vs new format
3. **Minimum Suppliers**: Products SHALL have at least one supplier
4. **Unique Products**: Product names must be unique (existing constraint)

## Migration Path for Users

1. **Phase 1 (Immediate)**: Script supports both formats
2. **Phase 2 (6 months)**: Deprecation warning for old format
3. **Phase 3 (12 months)**: Remove support for old format

## Example Conversions

**Old → New:**
```json
// Before
{"name": "Product A", "supplierId": 5}

// After (auto-converted internally)
{"name": "Product A", "supplierIds": [5]}
```
