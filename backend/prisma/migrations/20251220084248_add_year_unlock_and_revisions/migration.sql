-- CreateTable
CREATE TABLE "year_unlock_audits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reasonCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- AlterTable: Add revision column to year_end_counts
ALTER TABLE "year_end_counts" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

-- RedefineTables: Update unique constraint from year to (year, revision)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_year_end_counts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "confirmedAt" DATETIME,
    "backupPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_year_end_counts" ("id", "year", "revision", "status", "confirmedAt", "backupPath", "createdAt")
SELECT "id", "year", "revision", "status", "confirmedAt", "backupPath", "createdAt" FROM "year_end_counts";

DROP TABLE "year_end_counts";

ALTER TABLE "new_year_end_counts" RENAME TO "year_end_counts";

CREATE UNIQUE INDEX "year_end_counts_year_revision_key" ON "year_end_counts"("year", "revision");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
