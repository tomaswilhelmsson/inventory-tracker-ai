-- CreateTable
CREATE TABLE "purchase_batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" INTEGER NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "verificationNumber" TEXT,
    "invoiceTotal" REAL NOT NULL,
    "shippingCost" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_batches_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "productSnapshot" TEXT NOT NULL,
    "supplierSnapshot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_lots_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_lots_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "purchase_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_purchase_lots" ("createdAt", "id", "productId", "productSnapshot", "purchaseDate", "quantity", "remainingQuantity", "supplierId", "supplierSnapshot", "unitCost", "verificationNumber", "year") SELECT "createdAt", "id", "productId", "productSnapshot", "purchaseDate", "quantity", "remainingQuantity", "supplierId", "supplierSnapshot", "unitCost", "verificationNumber", "year" FROM "purchase_lots";
DROP TABLE "purchase_lots";
ALTER TABLE "new_purchase_lots" RENAME TO "purchase_lots";
CREATE INDEX "fifo_index" ON "purchase_lots"("productId", "purchaseDate", "remainingQuantity");
CREATE INDEX "purchase_lots_batchId_idx" ON "purchase_lots"("batchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
