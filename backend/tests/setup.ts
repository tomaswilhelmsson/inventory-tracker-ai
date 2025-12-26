import { PrismaClient } from '@prisma/client';

// Use in-memory SQLite for tests
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file::memory:?cache=shared',
    },
  },
  log: [], // Disable logging during tests
});

beforeAll(async () => {
  // Enable foreign keys
  await testPrisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  
  // Run migrations to set up schema
  // Note: We'll use the actual schema from Prisma
  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "units" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL UNIQUE,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "suppliers" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL UNIQUE,
      "contactPerson" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "address" TEXT,
      "city" TEXT,
      "country" TEXT,
      "taxId" TEXT,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "products" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "unitId" INTEGER NOT NULL,
      "supplierId" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT,
      FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "purchase_batches" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "supplierId" INTEGER NOT NULL,
      "purchaseDate" DATETIME NOT NULL,
      "verificationNumber" TEXT,
      "invoiceTotal" REAL NOT NULL,
      "shippingCost" REAL NOT NULL,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT
    )
  `);

  await testPrisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "purchase_lots"`);
  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE "purchase_lots" (
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
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL,
      FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL,
      FOREIGN KEY ("batchId") REFERENCES "purchase_batches"("id") ON DELETE SET NULL
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "fifo_index" ON "purchase_lots"("productId", "purchaseDate", "remainingQuantity")
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "purchase_lots_batchId_idx" ON "purchase_lots"("batchId")
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "products_supplierId_idx" ON "products"("supplierId")
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "products_unitId_idx" ON "products"("unitId")
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "year_end_counts_year_idx" ON "year_end_counts"("year")
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "year_end_counts_status_idx" ON "year_end_counts"("status")
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "year_end_counts" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "year" INTEGER NOT NULL,
      "revision" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "confirmedAt" DATETIME,
      "backupPath" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("year", "revision")
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "year_end_count_items" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "yearEndCountId" INTEGER NOT NULL,
      "productId" INTEGER NOT NULL,
      "expectedQuantity" INTEGER NOT NULL,
      "countedQuantity" INTEGER,
      "variance" INTEGER,
      "value" REAL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("yearEndCountId", "productId"),
      FOREIGN KEY ("yearEndCountId") REFERENCES "year_end_counts"("id") ON DELETE CASCADE,
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "locked_years" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "year" INTEGER NOT NULL UNIQUE,
      "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "year_unlock_audits" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "year" INTEGER NOT NULL,
      "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "reasonCategory" TEXT NOT NULL,
      "description" TEXT NOT NULL
    )
  `);

  await testPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "username" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

beforeEach(async () => {
  // Clean all tables before each test
  const tables = [
    'year_unlock_audits',
    'locked_years',
    'year_end_count_items',
    'year_end_counts',
    'purchase_lots',
    'purchase_batches',
    'products',
    'suppliers',
    'units',
    'users',
  ];

  await testPrisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  for (const table of tables) {
    await testPrisma.$executeRawUnsafe(`DELETE FROM ${table}`);
  }
  await testPrisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
