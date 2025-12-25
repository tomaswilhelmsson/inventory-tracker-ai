# Change: Add Multi-Item Purchase Entry System

## Why

Currently, users must create separate purchase records for each product on an invoice, even when multiple items arrive together from the same supplier. This creates data entry inefficiency and makes it difficult to track which purchases were part of the same delivery/invoice. For items sold in packages (like screws) where only the total package cost is known, users must manually calculate unit costs before entry.

## What Changes

- Add multi-item purchase entry UI with spreadsheet-like table interface
- Implement invoice-level validation ensuring line items sum to invoice total
- Add automatic shipping cost distribution proportionally across line items based on unit cost
- Support flexible cost entry: total cost + quantity → auto-calculate unit cost
- Create purchase batch tracking to link lots created from the same invoice
- Maintain backward compatibility with existing single-item purchase flow

**BREAKING**: None - extends existing functionality

## Impact

- **Affected specs**: `purchase-tracking` (new capability)
- **Affected code**: 
  - Backend: `routes/purchases.ts`, `services/purchaseService.ts`, `schema.prisma`
  - Frontend: `views/PurchasesView.vue`, `i18n/locales/*.json`
- **Database changes**: 
  - Add `batchId` column to `PurchaseLot` table
  - Add `PurchaseBatch` table for invoice-level metadata
- **New API endpoint**: `POST /api/purchases/batch`
