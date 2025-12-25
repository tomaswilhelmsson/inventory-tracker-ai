-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- CreateIndex
CREATE INDEX "products_unitId_idx" ON "products"("unitId");

-- CreateIndex
CREATE INDEX "year_end_counts_year_idx" ON "year_end_counts"("year");

-- CreateIndex
CREATE INDEX "year_end_counts_status_idx" ON "year_end_counts"("status");
