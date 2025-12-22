# Import Scripts

This directory contains scripts for importing data into the inventory tracking system.

## Available Scripts

### import-from-json.ts

Imports data from the legacy PHPMyAdmin JSON export (`csv/wiltm_se_db_1.json`).

**What it imports:**
- Units (measurement units like "St", "Liter", "m2", etc.)
- Suppliers (with contact information)
- Products (with descriptions and units)
- Purchases (creates purchase lots with FIFO tracking)
- Year-end counts for 2023 and 2024 (from Purchases_YYYY tables)

**Data mapping:**
- The `Purchases` table contains all historical purchases
- The `Purchases_2023` table represents the year-end inventory snapshot for 2023
- The `Purchases_2024` table represents the year-end inventory snapshot for 2024
- Each year-end snapshot is used to create a YearEndCount with the remaining quantities

**Usage:**
```bash
npx ts-node backend/scripts/import-from-json.ts
```

**Important notes:**
- The script is idempotent - running it multiple times won't create duplicates
- It checks for existing records before inserting
- Year-end counts are only created if they don't already exist
- The `locked` field from the old system determines which years are locked
- The `date_counted` field indicates when the physical count was performed

### clear-data.ts

Clears all data from the database (except the admin user).

**Usage:**
```bash
npx ts-node backend/scripts/clear-data.ts
```

**What it deletes:**
- Year-end count items
- Year-end counts
- Locked years
- Unlock audits
- Purchase lots
- Products
- Suppliers
- Units

**What it keeps:**
- User accounts (admin)

### import-legacy-data.ts

**DEPRECATED** - This was the old CSV import script. Use `import-from-json.ts` instead.

## Import Workflow

To perform a fresh import:

1. **Clear existing data** (optional, if you want to start fresh):
   ```bash
   npx ts-node backend/scripts/clear-data.ts
   ```

2. **Run the import**:
   ```bash
   npx ts-node backend/scripts/import-from-json.ts
   ```

3. **Verify the import**:
   ```bash
   # Check year-end counts
   sqlite3 backend/prisma/data/inventory.db "SELECT year, status, (SELECT COUNT(*) FROM year_end_count_items WHERE yearEndCountId = year_end_counts.id) as item_count FROM year_end_counts;"
   
   # Check total inventory value
   sqlite3 backend/prisma/data/inventory.db "SELECT SUM(value) FROM year_end_count_items WHERE yearEndCountId = (SELECT id FROM year_end_counts WHERE year = 2024);"
   ```

## Data Structure

### Legacy System (wiltm_se_db_1.json)

The JSON export contains these tables:
- **Categories**: Product categories (not used in new system)
- **Products**: Product catalog
- **Suppliers**: Supplier information
- **Units**: Measurement units
- **Purchases**: All historical purchases with current remaining quantities
- **Purchases_2023**: Year-end inventory snapshot for 2023 (quantity_left at end of year)
- **Purchases_2024**: Year-end inventory snapshot for 2024 (quantity_left at end of year)
- **ProductCategories**: Product-to-category mappings
- **SupplierCategories**: Supplier-to-category mappings

### New System

The new system stores data in:
- **units**: Measurement units
- **suppliers**: Supplier information
- **products**: Product catalog with supplier and unit references
- **purchase_lots**: Individual purchase transactions with FIFO tracking
- **year_end_counts**: Annual inventory counts
- **year_end_count_items**: Individual product counts within a year-end count
- **locked_years**: Years that have been locked after confirmation

## Troubleshooting

### "No inventory data found"

This means the Purchases_YYYY table doesn't have matching products. Check:
- Are products imported correctly?
- Do product names in Purchases_YYYY match the Products table?

### "Skipped X purchases"

Common reasons:
- Duplicate purchases (same product, supplier, date, quantity)
- Invalid numeric data (price, quantity)
- Invalid date format
- Missing product or supplier references

### Database not found

Make sure the DATABASE_URL environment variable is set correctly in `.env`:
```
DATABASE_URL="file:./data/inventory.db"
```

## Example Output

```
🚀 Starting JSON data import...

📁 Reading JSON file: csv/wiltm_se_db_1.json

📋 Parsed JSON data:
  - Categories: 17
  - Units: 14
  - Suppliers: 21
  - Products: 101
  - Purchases: 168
  - Purchases_2023: 117
  - Purchases_2024: 168

📏 Importing 14 units...
  ✓ St (ID: 1 → 62)
  ✓ Liter (ID: 8 → 67)
  ...

📦 Importing 21 suppliers...
  ✓ Happy Homes (ID: 8 → 51)
  ...

🏷️  Importing 101 products...
  ✓ Plywood Björk 4mm (ID: 3 → 123)
  ...

💰 Importing 168 purchases...
  ... imported 50 purchases
  ... imported 100 purchases
  ... imported 150 purchases
  ✓ Imported 168 purchases

📊 Creating year-end count for 2023...
  Using count date: 2024-01-06
  Processed 117 purchases, skipped 0
  Found 86 products with inventory
  ✓ Created year-end count with 86 products
  📈 Total inventory value: 68218.17 SEK

📊 Creating year-end count for 2024...
  Using count date: 2024-01-06
  Processed 168 purchases, skipped 0
  Found 100 products with inventory
  ✓ Created year-end count with 100 products
  📈 Total inventory value: 65516.08 SEK

✅ Import completed successfully!

📊 Summary:
  - Units imported: 14
  - Suppliers imported: 21
  - Products imported: 101
  - Purchase lots imported: 168
  - Year-end counts created: 2

🎉 Import complete!
```
