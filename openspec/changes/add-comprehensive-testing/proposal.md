# Proposal: Add Comprehensive Testing

## Change ID
`add-comprehensive-testing`

## Summary
Implement comprehensive automated testing for the inventory tracking system with focus on FIFO calculation accuracy, year-end count workflows, and data integrity across multi-year scenarios.

## Problem Statement
Currently, the application has no automated test suite (`"test": "echo \"Error: no test specified\" && exit 1"`). This creates significant risk for:

1. **FIFO Calculation Accuracy**: The core business logic of FIFO inventory consumption has no automated verification. Manual testing cannot consistently validate complex multi-year scenarios where purchases span multiple years and are consumed across year boundaries.

2. **Year-End Count Integrity**: The year-end count workflow involves critical operations (lot quantity updates, year locking, backup creation) with no regression protection.

3. **Data Consistency**: Multi-year inventory scenarios (e.g., 2022 purchases consumed in 2024) require verification that remainingQuantity values are correctly calculated across years.

4. **Regression Prevention**: Changes to FIFO logic, year unlock features, or revision tracking could silently break existing calculations without detection.

## Proposed Solution
Implement a multi-layered testing strategy:

1. **Unit Tests**: Isolated tests for FIFO calculation functions in `inventoryService.ts` and `yearEndCountService.ts`
2. **Integration Tests**: API endpoint tests with database operations for purchase tracking and year-end counts
3. **E2E Tests**: Complete workflows including multi-year FIFO scenarios as specified in the user requirements

### Test Framework Selection
- **Backend**: Jest + Supertest for API testing
- **Database**: In-memory SQLite for test isolation
- **Frontend**: Vitest (already configured with Vite)

### Critical Test Scenarios
The proposal includes specific FIFO accuracy tests based on the user's requirements:

**Scenario: Multi-year FIFO with partial consumption**
- Purchase 1 (2022): 10 bolts @ $1.00 each = $10.00
- Year-end count 2022: 2 bolts used → 8 bolts remaining @ $8.00
- Purchase 2 (2023): 5 bolts @ $1.50 each = $7.50
- Year-end count 2023: 2 more bolts used → 6 + 5 = 11 bolts remaining @ $13.50 (Purchase 1: $6, Purchase 2: $7.50)
- Year-end count 2024: 10 bolts used → 1 bolt remaining @ $1.50
  - Purchase 1 should have 0 remaining (6 bolts consumed from 2022 lot)
  - Purchase 2 should have 1 remaining (4 bolts consumed from 2023 lot)

This scenario validates:
- FIFO ordering across year boundaries
- Correct lot depletion (oldest first)
- Accurate inventory valuation using lot-specific unit costs
- Proper remainingQuantity updates in purchase lots

## Capabilities Impacted

### New Capabilities
1. **FIFO Calculation Testing** (`fifo-calculation-testing`)
   - Unit tests for `consumeInventoryFIFO()` function
   - Multi-year consumption scenarios
   - Edge cases (zero inventory, exact lot consumption, partial lot depletion)

2. **Year-End Count Workflow Testing** (`year-end-count-testing`)
   - Integration tests for year-end count API endpoints
   - Workflow tests (initiate → count → confirm → lock)
   - Year unlock and revision tracking tests

3. **Multi-Year FIFO Scenario Testing** (`multi-year-fifo-testing`)
   - E2E tests for complete multi-year inventory cycles
   - Data integrity validation across year boundaries
   - User-specified bolt scenario test

4. **Test Infrastructure** (`test-infrastructure`)
   - Jest configuration for backend tests
   - Test database setup/teardown
   - Test data factories for creating realistic test scenarios
   - CI/CD integration preparation

### Modified Capabilities
None (no existing test infrastructure)

## Success Criteria
1. ✅ All FIFO calculation tests pass, including the user-specified bolt scenario
2. ✅ Test coverage >80% for critical services (`inventoryService.ts`, `yearEndCountService.ts`)
3. ✅ Year-end count workflow tests validate lot quantity updates
4. ✅ Multi-year scenarios confirm correct remainingQuantity values
5. ✅ Tests run in <30 seconds on local development machine
6. ✅ Tests are isolated (no shared state between test cases)
7. ✅ CI-ready (can be integrated into GitHub Actions or similar)

## Implementation Approach
1. Install and configure Jest + testing dependencies
2. Create test utilities (database setup, data factories)
3. Write unit tests for FIFO calculation logic
4. Write integration tests for year-end count APIs
5. Write E2E tests for multi-year scenarios
6. Document testing conventions and how to run tests

## Dependencies
- External: `jest`, `@types/jest`, `ts-jest`, `supertest`, `@types/supertest`
- Internal: None (first testing implementation)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests interfere with development database | High | Use separate test database (in-memory SQLite) |
| Slow test execution | Medium | Mock external services (GCS), use in-memory DB |
| Flaky tests due to timing | Medium | Avoid time-dependent assertions, use deterministic data |
| Test maintenance overhead | Low | Use factories for test data, keep tests focused and small |

## Timeline Estimate
- Test infrastructure setup: 2-4 hours
- FIFO unit tests: 4-6 hours
- Year-end count integration tests: 6-8 hours
- Multi-year E2E tests: 4-6 hours
- Documentation: 2 hours
- **Total**: 18-26 hours

## Out of Scope
- Frontend component testing (Vitest already available, can be addressed separately)
- Performance/load testing
- Security testing (authentication, SQL injection)
- Database migration testing
- Cloud backup testing (GCS mock only)

## Open Questions
1. Should we test against both SQLite and MariaDB, or just SQLite?
   - **Recommendation**: Start with SQLite only, add MariaDB tests if needed
2. Do we need mutation testing to ensure test quality?
   - **Recommendation**: Not initially, focus on coverage first
3. Should tests run automatically on git commit (pre-commit hook)?
   - **Recommendation**: No, keep it manual/CI-only to avoid slowing development

## References
- Project conventions: `openspec/project.md` (lines 31-36)
- FIFO implementation: `backend/src/services/inventoryService.ts` (lines 186-241)
- Year-end count logic: `backend/src/services/yearEndCountService.ts` (lines 346-418)
- User requirement: Multi-year bolt scenario in UserRequest
