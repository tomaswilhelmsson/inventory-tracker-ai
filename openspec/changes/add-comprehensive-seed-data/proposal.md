# Change: Add Comprehensive Seed Data

## Why

The current seed script provides minimal test data limited to:
- 2 suppliers and 3 products
- Purchase lots spanning 2022-2024 with FIFO consumption patterns
- No year-end counts or locked years

This is insufficient for testing and demonstrating the full system capabilities, particularly:
- Multi-year FIFO calculations across confirmed year-end counts
- Year unlock and revision workflows
- Historical reporting and audit trails
- Count reminder functionality
- Real-world scenarios with diverse product types and suppliers

Comprehensive seed data enables better development testing, user demonstrations, and validates the complete year-end count lifecycle from 2022 through 2025.

## What Changes

- **Expand suppliers and products**: Add 3-5 more suppliers and 10-15 diverse products (different units, price ranges)
- **Multi-year purchase history**: Create realistic purchase patterns from 2022-2025 with varying quantities and costs
- **Year-end counts with confirmations**: Generate confirmed counts for 2022, 2023, 2024 with realistic variances
- **Locked years**: Create locked year records for 2022, 2023, 2024
- **Unlock audit examples**: Add 1-2 unlock audit records demonstrating correction scenarios
- **Multiple revisions**: Include a year with revision 2 to demonstrate unlock/recount workflow
- **2025 pending data**: Add 2025 purchases without year-end count to trigger reminder banner
- **FIFO accuracy**: Ensure all remaining quantities reflect proper FIFO consumption through confirmed counts

## Impact

- **Affected specs**: None - this is purely test data enhancement
- **Affected code**: 
  - `backend/prisma/seed.ts` - comprehensive rewrite to add multi-year data
  - No production code changes
- **Migration required**: No schema changes, just seed data
- **Breaking changes**: None - existing seed data will be replaced with more comprehensive version
