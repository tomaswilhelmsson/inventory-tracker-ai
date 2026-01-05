# Add Finished Goods Tracking

## Change ID
`add-finished-goods-tracking`

## Status
Proposed

## Context
Currently, the inventory system tracks raw materials (products purchased from suppliers) with FIFO accounting. However, the company also produces finished goods from these materials that need to be tracked separately for year-end accounting purposes. These finished goods have a material cost value that doesn't affect raw material inventory counts but needs to be included in the year-end financial report.

## Why

The business produces finished goods from raw materials that have significant value and must be included in year-end financial accounting. Currently, year-end inventory reports only show raw material values, which understates the true inventory value of the business. Finished goods represent work-in-progress value that has been added to raw materials and needs separate tracking for accurate financial reporting.

Without this capability:
- Year-end financial reports are incomplete (missing finished goods value)
- True inventory value is understated in bookkeeping
- No way to track finished goods variance year-over-year
- Manual tracking outside the system is error-prone and inefficient

## Problem Statement
The business needs to:
1. Track finished goods inventory separately from raw materials
2. Record the material cost value of finished goods manually
3. Include finished goods in year-end count reports
4. Carry finished goods inventory forward across years
5. Calculate net value changes (variance) year-over-year

## Proposed Solution
Add a new "Finished Goods" tracking system that:
- Maintains a catalog of finished good types (name, unit of measure)
- Records material cost values manually for each finished good type
- Integrates with year-end count process (separate section from raw materials)
- Persists across years with variance calculation
- Includes finished goods in PDF bookkeeping reports

This is a **simple value-tracking system** - it does not:
- Consume raw material inventory (no production recording)
- Use FIFO or complex costing methods
- Automatically calculate costs from bills of materials

## Scope
This change introduces the following capabilities:

1. **Finished Good Management** (`specs/finished-good-management/`)
   - CRUD operations for finished good types
   - Manual material cost entry
   - Active/inactive status management

2. **Year-End Count Integration** (`specs/year-end-finished-goods/`)
   - Add finished goods to year-end count process
   - Record expected and actual quantities
   - Calculate variance and total value
   - Carry forward to next year

3. **PDF Report Enhancement** (`specs/finished-goods-reporting/`)
   - Add finished goods section to PDF report
   - Show quantity, unit cost, and total value
   - Display variance from previous year

## User Impact
- **Accounting Team**: Complete year-end inventory valuation including finished goods
- **System Users**: New "Finished Goods" management interface
- **Year-End Process**: Extended to include finished goods counting
- **Reports**: PDF reports will be longer with additional finished goods section

## Non-Goals
- Production planning or scheduling
- Bill of materials (BOM) management
- Raw material consumption tracking
- Automatic cost calculation
- Manufacturing order management
- Work-in-progress (WIP) tracking

## Dependencies
- Builds on existing year-end count infrastructure
- Uses same PDF report generation system
- Follows same year locking mechanism

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| User confusion between raw materials and finished goods | Medium | Clear UI separation and labeling |
| Manual cost entry errors | Medium | Validation rules, edit history |
| PDF report becoming too long | Low | Separate sections with clear headers |
| Database migration complexity | Low | Standard Prisma migration process |

## Success Criteria
1. Users can create and manage finished good types
2. Finished goods appear in year-end count process
3. PDF reports include finished goods section with totals
4. Finished goods carry forward across years
5. Variance calculations work correctly

## Open Questions
- Should finished goods support FIFO costing in the future? (Answer: Start simple with average cost, can add FIFO later if needed)
- Should we track production dates? (Answer: Not initially, only current quantity and value)
