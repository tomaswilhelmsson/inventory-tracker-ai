# Change: Add Full-Stack FIFO Inventory Tracking System

## Why

The company needs a comprehensive inventory tracking system to manage suppliers, products, and purchases with accurate FIFO (First-In-First-Out) cost accounting. The system must support year-end inventory counts that accurately calculate inventory value across multiple years, generate reports, and create locked database backups to preserve historical accuracy.

## What Changes

This proposal creates a complete full-stack application from scratch with:

- **Supplier Management**: CRUD operations for supplier records
- **Product Catalog**: Product management with linkage to suppliers
- **Purchase Tracking**: Record purchases with units, costs, and dates for FIFO calculations
- **Inventory Valuation**: FIFO-based inventory tracking across years
- **Year-End Count**: Annual inventory count process with confirmation and database locking
- **Reporting**: Purchase history and inventory valuation reports
- **Database Backup**: Automated Google Cloud Storage backups with year-end locks
- **Database Configuration**: SQLite with migration path to MariaDB

## Impact

- **New capabilities**: 7 core capabilities (supplier-management, product-catalog, purchase-tracking, inventory-valuation, year-end-count, reporting, database-backup)
- **Affected code**: Complete new application
  - Backend: Node.js/Express with Prisma ORM
  - Frontend: Vue.js
  - Database: SQLite (with MariaDB migration support)
  - Cloud: Google Cloud Storage integration
- **Breaking changes**: None (new system)

## Technical Stack

- **Backend**: Node.js with Express framework
- **Frontend**: Vue.js 3 with Composition API
- **Database**: SQLite (development/small deployments), MariaDB (production scaling)
- **ORM**: Prisma
- **Cloud Storage**: Google Cloud Storage for backups
- **Authentication**: Simple authentication (no complex role system)

## Key Features

1. **FIFO Inventory Tracking**: Purchases create inventory lots that are consumed in order
2. **Multi-Year Inventory**: Track remaining inventory from previous years
3. **Year-End Process**: Count, validate, report, confirm, and lock inventory
4. **Purchase History**: View purchases for current year and past years with remaining inventory
5. **Automated Backups**: Year-end confirmation triggers cloud backup
6. **Database Flexibility**: Start with SQLite, migrate to MariaDB when needed
