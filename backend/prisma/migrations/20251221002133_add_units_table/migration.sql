/*
  Warnings:

  - You are about to drop the column `contactInfo` on the `suppliers` table. All the data in the column will be lost.
  - Added the required column `unitId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productSnapshot` to the `purchase_lots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierSnapshot` to the `purchase_lots` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("createdAt", "description", "id", "name", "supplierId") SELECT "createdAt", "description", "id", "name", "supplierId" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");
CREATE TABLE "new_purchase_lots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "supplierId" INTEGER,
    "purchaseDate" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "productSnapshot" TEXT NOT NULL,
    "supplierSnapshot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_lots_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_purchase_lots" ("createdAt", "id", "productId", "purchaseDate", "quantity", "remainingQuantity", "supplierId", "unitCost", "year") SELECT "createdAt", "id", "productId", "purchaseDate", "quantity", "remainingQuantity", "supplierId", "unitCost", "year" FROM "purchase_lots";
DROP TABLE "purchase_lots";
ALTER TABLE "new_purchase_lots" RENAME TO "purchase_lots";
CREATE INDEX "fifo_index" ON "purchase_lots"("productId", "purchaseDate", "remainingQuantity");
CREATE TABLE "new_suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_suppliers" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "suppliers";
DROP TABLE "suppliers";
ALTER TABLE "new_suppliers" RENAME TO "suppliers";
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");
