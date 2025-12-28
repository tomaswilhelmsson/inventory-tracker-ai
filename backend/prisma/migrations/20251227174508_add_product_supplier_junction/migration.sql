-- CreateTable: product_suppliers junction table
CREATE TABLE "product_suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "preferredUnitCost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_suppliers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_suppliers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: unique constraint on product-supplier pair
CREATE UNIQUE INDEX "product_suppliers_productId_supplierId_key" ON "product_suppliers"("productId", "supplierId");

-- CreateIndex: index on supplierId for efficient queries
CREATE INDEX "product_suppliers_supplierId_idx" ON "product_suppliers"("supplierId");

-- Data Migration: Migrate existing product.supplierId to product_suppliers
-- Only migrate products that have a valid supplierId (NOT NULL)
INSERT INTO "product_suppliers" ("productId", "supplierId", "preferredUnitCost", "createdAt")
SELECT 
    p.id AS productId,
    p.supplierId AS supplierId,
    (
        -- Calculate preferredUnitCost as the average of the 3 most recent purchases
        -- Use unitCostExclVAT if available, otherwise fall back to unitCost
        SELECT AVG(COALESCE(pl.unitCostExclVAT, pl.unitCost))
        FROM purchase_lots pl
        WHERE pl.productId = p.id 
          AND pl.supplierId = p.supplierId
          AND COALESCE(pl.unitCostExclVAT, pl.unitCost) > 0
        ORDER BY pl.purchaseDate DESC
        LIMIT 3
    ) AS preferredUnitCost,
    CURRENT_TIMESTAMP AS createdAt
FROM products p
WHERE p.supplierId IS NOT NULL;

-- RedefineTables: Drop supplierId column from products table
PRAGMA foreign_keys=off;

-- Create temporary table without supplierId
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "new_products" ("id", "name", "description", "unitId", "createdAt")
SELECT "id", "name", "description", "unitId", "createdAt" FROM "products";

-- Drop old table
DROP TABLE "products";

-- Rename new table to products
ALTER TABLE "new_products" RENAME TO "products";

-- Recreate unique index on name
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- Recreate index on unitId
CREATE INDEX "products_unitId_idx" ON "products"("unitId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=on;
