# Implementation Tasks

## 1. Authentication Security Fixes

- [ ] 1.1 Update `backend/src/utils/config.ts` to enforce JWT_SECRET in production using IIFE
- [ ] 1.2 Update `backend/src/routes/auth.ts` to implement constant-time password comparison with dummy hash
- [ ] 1.3 Update `backend/src/server.ts` to add CORS origin validation with allowlist
- [ ] 1.4 Install `express-rate-limit` package: `npm install express-rate-limit`
- [ ] 1.5 Add rate limiting middleware to `backend/src/server.ts` for auth endpoints (5/15min)
- [ ] 1.6 Add general API rate limiting to `backend/src/server.ts` (100/15min)
- [ ] 1.7 Update `.env.example` with JWT_SECRET requirement and CORS_ALLOWED_ORIGINS
- [ ] 1.8 Add unit tests for JWT secret enforcement (test startup failure in production)
- [ ] 1.9 Add unit tests for rate limiting behavior

## 2. Database Integrity and Performance

- [ ] 2.1 Update `backend/src/services/yearEndCountService.ts` confirmYearEndCount to wrap in Prisma transaction
- [ ] 2.2 Update `backend/src/services/inventoryService.ts` consumeInventoryFIFO to accept optional transaction client
- [ ] 2.3 Add database indexes to `backend/prisma/schema.prisma` for Product (supplierId, unitId)
- [ ] 2.4 Add database indexes to `backend/prisma/schema.prisma` for YearEndCount (year, status)
- [ ] 2.5 Create Prisma migration for new indexes: `npx prisma migrate dev --name add-performance-indexes`
- [ ] 2.6 Update `backend/src/services/yearEndCountService.ts` generateYearEndReport to batch fetch lots
- [ ] 2.7 Add unit tests for transaction rollback on year-end confirmation failure
- [ ] 2.8 Add performance tests to verify N+1 query fix (before/after comparison)

## 3. Input Validation

- [ ] 3.1 Update `backend/src/services/productService.ts` getAll to sanitize search input (trim, substring 100)
- [ ] 3.2 Update `backend/src/services/supplierService.ts` getAll to sanitize search input
- [ ] 3.3 Update `backend/src/routes/yearEndCount.ts` compare endpoint to validate query params before parseInt
- [ ] 3.4 Update `backend/src/services/purchaseService.ts` create to validate purchase date range (2000 to current+1)
- [ ] 3.5 Update `backend/src/services/purchaseService.ts` update to validate purchase date range
- [ ] 3.6 Update `backend/src/services/purchaseService.ts` create to add quantity overflow protection (MAX_SAFE_INTEGER/1000)
- [ ] 3.7 Update `backend/src/services/purchaseService.ts` update to add quantity overflow protection
- [ ] 3.8 Add validation helper constants file `backend/src/utils/validation.ts` for MAX_SAFE_QUANTITY, DATE_RANGES
- [ ] 3.9 Add unit tests for search input sanitization (long strings, whitespace)
- [ ] 3.10 Add unit tests for purchase date validation (edge cases: year 1999, year 3000, future dates)
- [ ] 3.11 Add unit tests for quantity overflow protection

## 4. File Upload Security

- [ ] 4.1 Update `backend/src/routes/yearEndCount.ts` multer configuration with size limit (5MB)
- [ ] 4.2 Add file type validation to multer fileFilter (CSV only)
- [ ] 4.3 Add files limit (1 file per request) to multer configuration
- [ ] 4.4 Update `backend/src/services/exportService.ts` to add cleanupOldTempFiles method
- [ ] 4.5 Update `backend/src/server.ts` to schedule periodic temp file cleanup (hourly via setInterval)
- [ ] 4.6 Ensure tmp directory exists on server startup in `backend/src/server.ts`
- [ ] 4.7 Add unit tests for file upload validation (oversized, wrong type, multiple files)
- [ ] 4.8 Add integration test for file cleanup process

## 5. Documentation

- [ ] 5.1 Add comments to `backend/prisma/schema.prisma` PurchaseLot explaining nullable foreign keys
- [ ] 5.2 Add comments to `backend/prisma/schema.prisma` YearEndCountItem explaining cascade delete
- [ ] 5.3 Update README with environment variable requirements (JWT_SECRET mandatory in prod)
- [ ] 5.4 Update deployment documentation with security configuration checklist
- [ ] 5.5 Document rate limiting configuration in README

## 6. Testing and Validation

- [ ] 6.1 Run full test suite to ensure no regressions: `npm test`
- [ ] 6.2 Test production startup without JWT_SECRET (should fail with clear error)
- [ ] 6.3 Test rate limiting manually with multiple requests
- [ ] 6.4 Test file upload limits with oversized files
- [ ] 6.5 Verify transaction rollback behavior in year-end count confirmation
- [ ] 6.6 Run Prisma migration in test environment
- [ ] 6.7 Performance test: query products filtered by supplier (verify index usage)
- [ ] 6.8 Performance test: year-end report generation (verify no N+1 queries)

## 7. Deployment Preparation

- [ ] 7.1 Generate secure JWT_SECRET for production: `openssl rand -base64 32`
- [ ] 7.2 Add JWT_SECRET to production environment variables
- [ ] 7.3 Configure CORS_ALLOWED_ORIGINS for production, staging, dev
- [ ] 7.4 Run database migration in staging environment
- [ ] 7.5 Monitor staging for any issues with new validation rules
- [ ] 7.6 Document rollback procedure in case of issues
- [ ] 7.7 Deploy to production with monitoring enabled

## Dependencies

- **Parallel**: Tasks 1.1-1.7 can run in parallel with 2.1-2.2, 3.1-3.7, 4.1-4.4
- **Sequential**: 
  - 2.5 requires 2.3-2.4 (migration needs schema changes)
  - 2.7 requires 2.1-2.2 (tests need implementation)
  - 6.x requires all implementation tasks complete
  - 7.4 requires 2.5 (migration must exist)
  
## Validation Checklist

After all tasks complete, verify:

- [ ] All CRITICAL issues from review report addressed
- [ ] All HIGH priority issues from review report addressed
- [ ] No new test failures introduced
- [ ] Production startup requires JWT_SECRET
- [ ] Rate limiting works on auth endpoints
- [ ] File uploads respect size limits
- [ ] Year-end confirmation is atomic
- [ ] Database queries use new indexes
- [ ] N+1 query eliminated in reports
- [ ] All new code has tests
- [ ] Documentation updated
