/*
  Warnings:

  - You are about to drop the column `invoiceTotal` on the `purchase_batches` table. All the data in the column will be lost.
  - Added the required column `invoiceTotalInclVAT` to the `purchase_batches` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_purchase_batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" INTEGER NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "verificationNumber" TEXT,
    "invoiceTotalInclVAT" REAL NOT NULL,
    "invoiceTotalExclVAT" REAL,
    "shippingCost" REAL NOT NULL,
    "notes" TEXT,
    "vatRate" REAL NOT NULL DEFAULT 0,
    "pricesIncludeVAT" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_batches_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Migrate existing data: copy invoiceTotal to invoiceTotalInclVAT, set defaults for new fields
INSERT INTO "new_purchase_batches" ("id", "supplierId", "purchaseDate", "verificationNumber", "invoiceTotalInclVAT", "invoiceTotalExclVAT", "shippingCost", "notes", "vatRate", "pricesIncludeVAT", "createdAt") 
SELECT "id", "supplierId", "purchaseDate", "verificationNumber", "invoiceTotal", "invoiceTotal", "shippingCost", "notes", 0, true, "createdAt" 
FROM "purchase_batches";
DROP TABLE "purchase_batches";
ALTER TABLE "new_purchase_batches" RENAME TO "purchase_batches";
CREATE TABLE "new_purchase_lots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "supplierId" INTEGER,
    "batchId" INTEGER,
    "purchaseDate" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
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
-- Migrate existing data: copy unitCost to unitCostExclVAT, set VAT defaults
INSERT INTO "new_purchase_lots" ("id", "productId", "supplierId", "batchId", "purchaseDate", "quantity", "unitCost", "remainingQuantity", "year", "verificationNumber", "vatRate", "unitCostExclVAT", "unitCostInclVAT", "productSnapshot", "supplierSnapshot", "createdAt") 
SELECT "id", "productId", "supplierId", "batchId", "purchaseDate", "quantity", "unitCost", "remainingQuantity", "year", "verificationNumber", 0, "unitCost", "unitCost", "productSnapshot", "supplierSnapshot", "createdAt" 
FROM "purchase_lots";
DROP TABLE "purchase_lots";
ALTER TABLE "new_purchase_lots" RENAME TO "purchase_lots";
CREATE INDEX "fifo_index" ON "purchase_lots"("productId", "purchaseDate", "remainingQuantity");
CREATE INDEX "purchase_lots_batchId_idx" ON "purchase_lots"("batchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
