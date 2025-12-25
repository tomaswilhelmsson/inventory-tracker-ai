# Change: Fix Security Vulnerabilities and Critical Bugs

## Why

A comprehensive code review identified 30 issues across security, data integrity, performance, and code quality. The most critical issues pose immediate security risks and potential data corruption that must be addressed before production deployment:

- **JWT secret fallback vulnerability**: Hardcoded default allows authentication bypass
- **Year-end count race condition**: No transaction wrapper risks data corruption
- **File upload DoS vulnerability**: Unlimited file sizes enable denial of service
- **Input validation gaps**: Missing validation on query parameters and search inputs
- **CORS misconfiguration**: Inadequate origin validation
- **Timing attack vulnerability**: Username enumeration possible via password hash timing

These vulnerabilities were discovered during a comprehensive review of ~11,400 LOC and represent critical security and data integrity risks that must be resolved immediately.

## What Changes

### Immediate (CRITICAL & HIGH Priority)

1. **Authentication Security** (CRITICAL)
   - Enforce JWT_SECRET in production environment
   - Add explicit token expiration validation
   - Implement constant-time password comparison to prevent timing attacks
   - Add CORS origin validation with multiple allowed origins

2. **Database Integrity** (CRITICAL)
   - Wrap year-end count confirmation in atomic transaction
   - Add database indexes for frequently queried fields
   - Fix N+1 query problem in report generation

3. **Input Validation** (HIGH)
   - Add input sanitization and length limits for search queries
   - Validate query parameters before parsing
   - Add purchase date range validation
   - Implement quantity overflow protection

4. **File Handling** (HIGH)
   - Add file size limits (5MB max) and type validation for CSV uploads
   - Implement periodic temporary file cleanup

5. **Rate Limiting** (HIGH)
   - Add rate limiting on authentication endpoints (5 attempts per 15 min)
   - Add general API rate limiting (100 requests per 15 min)

### Short Term (MEDIUM Priority - Deferred)

The following medium priority items are acknowledged but deferred to future work:
- Refresh token mechanism
- Decimal library for currency precision
- httpOnly cookie storage
- Duplicate purchase detection
- Integration test suite
- Centralized logging with Winston
- Frontend request/response logging
- Pagination for large datasets

### Documentation

- Add comments explaining cascade delete behavior
- Document nullable foreign key rationale
- Update environment variable requirements

## Impact

**Affected specs:**
- authentication (new)
- input-validation (new)
- file-handling (new)
- database-integrity (new)

**Affected code:**
- `backend/src/utils/config.ts` - JWT secret enforcement
- `backend/src/middleware/auth.ts` - Token validation
- `backend/src/routes/auth.ts` - Password hash timing fix
- `backend/src/server.ts` - CORS configuration, rate limiting
- `backend/src/services/yearEndCountService.ts` - Transaction wrapper, N+1 fix
- `backend/src/services/purchaseService.ts` - Date validation, overflow protection
- `backend/src/services/productService.ts` - Input sanitization
- `backend/src/services/supplierService.ts` - Input sanitization
- `backend/src/services/exportService.ts` - Periodic cleanup
- `backend/src/routes/yearEndCount.ts` - File upload limits, query validation
- `backend/prisma/schema.prisma` - Database indexes, documentation

**Breaking changes:** None - all changes are backward compatible security enhancements

**Dependencies:**
- New package: `express-rate-limit` for rate limiting
- Environment variable: `JWT_SECRET` now required in production
