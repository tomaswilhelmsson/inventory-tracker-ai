-- Migration: Make productId and supplierId nullable in purchase_lots
-- Purpose: Allow supplier/product deletion without losing purchase transaction history
-- Data is preserved in JSON snapshots

-- Step 1: Create a new table with nullable foreign keys
CREATE TABLE purchase_lots_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER,
    supplierId INTEGER,
    purchaseDate DATETIME NOT NULL,
    quantity INTEGER NOT NULL,
    unitCost REAL NOT NULL,
    remainingQuantity INTEGER NOT NULL,
    year INTEGER NOT NULL,
    productSnapshot TEXT NOT NULL,
    supplierSnapshot TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Step 2: Copy all data from old table to new table
INSERT INTO purchase_lots_new (id, productId, supplierId, purchaseDate, quantity, unitCost, remainingQuantity, year, productSnapshot, supplierSnapshot, createdAt)
SELECT id, productId, supplierId, purchaseDate, quantity, unitCost, remainingQuantity, year, productSnapshot, supplierSnapshot, createdAt
FROM purchase_lots;

-- Step 3: Drop old table
DROP TABLE purchase_lots;

-- Step 4: Rename new table to original name
ALTER TABLE purchase_lots_new RENAME TO purchase_lots;

-- Step 5: Recreate FIFO index
CREATE INDEX fifo_index ON purchase_lots(productId, purchaseDate, remainingQuantity);

-- Verify migration
SELECT COUNT(*) as total_purchases FROM purchase_lots;
SELECT COUNT(*) as purchases_with_null_refs FROM purchase_lots WHERE productId IS NULL OR supplierId IS NULL;
