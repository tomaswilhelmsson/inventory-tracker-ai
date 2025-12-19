-- Migration script to add Unit model and convert products to use unitId
-- This must be run before the new schema is applied

-- Step 1: Create units table
CREATE TABLE IF NOT EXISTS "units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL UNIQUE,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert default units
INSERT OR IGNORE INTO units (name) VALUES ('pieces');
INSERT OR IGNORE INTO units (name) VALUES ('kg');
INSERT OR IGNORE INTO units (name) VALUES ('g');
INSERT OR IGNORE INTO units (name) VALUES ('tons');
INSERT OR IGNORE INTO units (name) VALUES ('liters');
INSERT OR IGNORE INTO units (name) VALUES ('ml');
INSERT OR IGNORE INTO units (name) VALUES ('m3');
INSERT OR IGNORE INTO units (name) VALUES ('m');
INSERT OR IGNORE INTO units (name) VALUES ('m2');
INSERT OR IGNORE INTO units (name) VALUES ('boxes');
INSERT OR IGNORE INTO units (name) VALUES ('pallets');
INSERT OR IGNORE INTO units (name) VALUES ('rolls');

-- Step 3: Add unitId column to products
ALTER TABLE products ADD COLUMN unitId INTEGER;

-- Step 4: Update products to reference units
UPDATE products SET unitId = (SELECT id FROM units WHERE name = products.unit);
UPDATE products SET unitId = (SELECT id FROM units WHERE name = 'pieces') WHERE unitId IS NULL;

-- Step 5: Create new products table with proper schema
CREATE TABLE "products_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "unitId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 6: Copy data to new table
INSERT INTO products_new (id, name, description, unitId, supplierId, createdAt)
SELECT id, name, description, unitId, supplierId, createdAt FROM products;

-- Step 7: Drop old table and rename new one
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

-- Step 8: Recreate indexes
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- Verify migration
SELECT 'Units created:' as status, COUNT(*) as count FROM units;
SELECT 'Products migrated:' as status, COUNT(*) as count FROM products;
SELECT 'Sample product with unit:' as status, p.name as product, u.name as unit 
FROM products p JOIN units u ON p.unitId = u.id LIMIT 1;
