-- Migration script to add detailed supplier fields
-- This adds new fields to the suppliers table for better contact management

-- Add new fields to suppliers table
ALTER TABLE suppliers ADD COLUMN contactPerson TEXT;
ALTER TABLE suppliers ADD COLUMN email TEXT;
ALTER TABLE suppliers ADD COLUMN phone TEXT;
ALTER TABLE suppliers ADD COLUMN address TEXT;
ALTER TABLE suppliers ADD COLUMN city TEXT;
ALTER TABLE suppliers ADD COLUMN country TEXT;
ALTER TABLE suppliers ADD COLUMN taxId TEXT;
ALTER TABLE suppliers ADD COLUMN notes TEXT;

-- Migrate existing contactInfo to notes field (if any data exists)
UPDATE suppliers SET notes = contactInfo WHERE contactInfo IS NOT NULL AND contactInfo != '';

-- Drop old contactInfo column (optional - can keep for backward compatibility)
-- Uncomment the line below if you want to remove the old column
-- ALTER TABLE suppliers DROP COLUMN contactInfo;

-- Verify migration
SELECT 'Supplier fields updated:' as status, COUNT(*) as count FROM suppliers;
