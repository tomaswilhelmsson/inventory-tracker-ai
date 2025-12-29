-- AlterTable: Change quantity fields from Int to Float in purchase_lots
-- SQLite: PRAGMA foreign_keys=off;

-- Create new table with Float columns
CREATE TABLE "new_purchase_lots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "supplierId" INTEGER,
    "batchId" INTEGER,
    "purchaseDate" DATETIME NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "remainingQuantity" REAL NOT NULL,
    "year" INTEGER NOT NULL,
    "verificationNumber" TEXT,
    "vatRate" REAL NOT NULL DEFAULT 0,
    "unitCostExclVAT" REAL,
    "unitCostInclVAT" REAL,
    "productSnapshot" TEXT NOT NULL,
    "supplierSnapshot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_lots_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_lots_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "purchase_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "new_purchase_lots" SELECT * FROM "purchase_lots";

-- Drop old table
DROP TABLE "purchase_lots";

-- Rename new table to original name
ALTER TABLE "new_purchase_lots" RENAME TO "purchase_lots";

-- Recreate indexes
CREATE INDEX "purchase_lots_productId_idx" ON "purchase_lots"("productId");
CREATE INDEX "purchase_lots_supplierId_idx" ON "purchase_lots"("supplierId");
CREATE INDEX "purchase_lots_batchId_idx" ON "purchase_lots"("batchId");
CREATE INDEX "purchase_lots_year_idx" ON "purchase_lots"("year");
CREATE INDEX "purchase_lots_productId_purchaseDate_remainingQuantity_idx" ON "purchase_lots"("productId", "purchaseDate", "remainingQuantity");

-- AlterTable: Change quantity fields from Int to Float in year_end_count_items
CREATE TABLE "new_year_end_count_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yearEndCountId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "expectedQuantity" REAL NOT NULL,
    "countedQuantity" REAL,
    "variance" REAL,
    "value" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "year_end_count_items_yearEndCountId_fkey" FOREIGN KEY ("yearEndCountId") REFERENCES "year_end_counts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "year_end_count_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "new_year_end_count_items" SELECT * FROM "year_end_count_items";

-- Drop old table
DROP TABLE "year_end_count_items";

-- Rename new table to original name
ALTER TABLE "new_year_end_count_items" RENAME TO "year_end_count_items";

-- Recreate indexes and unique constraint
CREATE UNIQUE INDEX "year_end_count_items_yearEndCountId_productId_key" ON "year_end_count_items"("yearEndCountId", "productId");
