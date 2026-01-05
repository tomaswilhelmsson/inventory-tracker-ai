-- CreateTable
CREATE TABLE "finished_goods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitId" INTEGER NOT NULL,
    "materialCost" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finished_goods_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finished_goods_count_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yearEndCountId" INTEGER NOT NULL,
    "finishedGoodId" INTEGER NOT NULL,
    "expectedQuantity" REAL NOT NULL,
    "countedQuantity" REAL,
    "variance" REAL,
    "materialCostPerUnit" REAL NOT NULL,
    "totalValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finished_goods_count_items_yearEndCountId_fkey" FOREIGN KEY ("yearEndCountId") REFERENCES "year_end_counts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "finished_goods_count_items_finishedGoodId_fkey" FOREIGN KEY ("finishedGoodId") REFERENCES "finished_goods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "finished_goods_name_key" ON "finished_goods"("name");

-- CreateIndex
CREATE INDEX "finished_goods_isActive_idx" ON "finished_goods"("isActive");

-- CreateIndex
CREATE INDEX "finished_goods_unitId_idx" ON "finished_goods"("unitId");

-- CreateIndex
CREATE INDEX "finished_goods_count_items_yearEndCountId_idx" ON "finished_goods_count_items"("yearEndCountId");

-- CreateIndex
CREATE UNIQUE INDEX "finished_goods_count_items_yearEndCountId_finishedGoodId_key" ON "finished_goods_count_items"("yearEndCountId", "finishedGoodId");
