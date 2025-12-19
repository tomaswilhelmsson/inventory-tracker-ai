-- Migration: Add JSON snapshot fields to purchase_lots table
-- Purpose: Store immutable transaction data to preserve purchase information even if supplier/product is deleted

-- Add new columns for JSON snapshots
ALTER TABLE purchase_lots ADD COLUMN productSnapshot TEXT;
ALTER TABLE purchase_lots ADD COLUMN supplierSnapshot TEXT;

-- Populate productSnapshot from existing relations
-- Format: {"id": 1, "name": "Product Name", "description": "...", "unit": {"id": 1, "name": "kg"}, "supplierIdRef": 1}
UPDATE purchase_lots
SET productSnapshot = (
  SELECT json_object(
    'id', p.id,
    'name', p.name,
    'description', COALESCE(p.description, ''),
    'unit', json_object('id', u.id, 'name', u.name),
    'supplierIdRef', p.supplierId
  )
  FROM products p
  JOIN units u ON p.unitId = u.id
  WHERE p.id = purchase_lots.productId
);

-- Populate supplierSnapshot from existing relations
-- Format: {"id": 1, "name": "Supplier Name", "contactPerson": "...", "email": "...", ...}
UPDATE purchase_lots
SET supplierSnapshot = (
  SELECT json_object(
    'id', s.id,
    'name', s.name,
    'contactPerson', COALESCE(s.contactPerson, ''),
    'email', COALESCE(s.email, ''),
    'phone', COALESCE(s.phone, ''),
    'address', COALESCE(s.address, ''),
    'city', COALESCE(s.city, ''),
    'country', COALESCE(s.country, ''),
    'taxId', COALESCE(s.taxId, '')
  )
  FROM suppliers s
  WHERE s.id = purchase_lots.supplierId
);

-- Verify migration
SELECT 
  id,
  productId,
  supplierId,
  substr(productSnapshot, 1, 100) as productSnap_preview,
  substr(supplierSnapshot, 1, 100) as supplierSnap_preview
FROM purchase_lots
LIMIT 5;
