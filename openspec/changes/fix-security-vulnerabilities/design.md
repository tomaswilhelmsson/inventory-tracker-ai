# Design: Security Vulnerabilities and Critical Bug Fixes

## Context

Following a comprehensive security audit of the inventory tracking system, multiple critical vulnerabilities and bugs were identified that pose immediate risks to system security and data integrity. This change addresses all CRITICAL and HIGH priority findings from the review.

**Key constraints:**
- Must maintain backward compatibility with existing API contracts
- Cannot break existing frontend functionality
- Must not require database migrations for most fixes
- Should minimize performance impact
- Need to support both SQLite (dev) and MariaDB (production)

## Goals / Non-Goals

### Goals
- Eliminate all CRITICAL security vulnerabilities
- Fix all HIGH priority bugs
- Add comprehensive input validation
- Prevent data corruption in year-end count process
- Implement rate limiting to prevent abuse
- Add database indexes for performance

### Non-Goals
- Implementing refresh token mechanism (deferred to future work)
- Converting to httpOnly cookies (deferred - requires frontend rewrite)
- Adding comprehensive logging system (deferred)
- Implementing pagination (deferred)
- Adding integration tests (separate change)
- Decimal library for currency (deferred)

## Decisions

### 1. JWT Secret Enforcement

**Decision:** Use IIFE to throw error in production if JWT_SECRET not set

```typescript
jwtSecret: process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return 'dev-secret-key-not-for-production';
})(),
```

**Rationale:**
- Fails fast on startup rather than at runtime
- Clear error message for operators
- Allows development without configuration
- No code changes needed, just environment variable

**Alternatives considered:**
- Generate random secret: Breaks multi-instance deployments
- Require always: Breaks development workflow
- Use environment-specific config files: More complexity

### 2. Transaction Wrapper for Year-End Count

**Decision:** Wrap all year-end confirmation operations in Prisma transaction

```typescript
await dbClient.$transaction(async (tx) => {
  // FIFO consumption
  // Year locking
  // Status update
});
```

**Rationale:**
- Ensures atomicity - all or nothing
- Prevents partial updates
- Leverages existing Prisma transaction support
- No schema changes required

**Challenge:** inventoryService.consumeInventoryFIFO needs to accept transaction client

**Solution:** Pass transaction client to consumeInventoryFIFO or inline the logic

### 3. Rate Limiting Strategy

**Decision:** Use express-rate-limit with different limits for auth vs general API

```typescript
// Auth: 5 attempts / 15 min
// API: 100 requests / 15 min
```

**Rationale:**
- Industry standard library
- In-memory store sufficient for single-instance deployment
- Stricter limits on authentication to prevent brute force
- Configurable via environment variables

**Alternatives considered:**
- Redis-backed rate limiting: Overkill for current scale
- Per-user rate limiting: Requires authentication first
- IP-based only: Good enough for current threat model

### 4. File Upload Validation

**Decision:** Configure multer with size and type limits

```typescript
limits: { fileSize: 5MB, files: 1 }
fileFilter: CSV only
```

**Rationale:**
- Simple configuration
- Fails before file is written to disk
- Clear error messages to user
- 5MB sufficient for typical CSV imports (thousands of rows)

**Trade-offs:**
- Legitimate large files rejected (acceptable - can split)
- Memory usage during upload (mitigated by streaming)

### 5. Input Sanitization

**Decision:** Add trim() and substring(0, 100) to search inputs

**Rationale:**
- Prevents extremely long strings
- Removes whitespace padding attacks
- Works with Prisma's SQL injection protection
- No breaking changes to API

**Alternatives considered:**
- Regex validation: More complex, not needed
- HTML sanitization: Not needed (API only)
- Full XSS library: Overkill

### 6. Password Hash Timing Attack Prevention

**Decision:** Always perform bcrypt.compare, even for non-existent users

```typescript
const passwordHash = user?.passwordHash || '$2b$10$invalidhash...';
const isValid = await bcrypt.compare(password, passwordHash);
if (!user || !isValid) { ... }
```

**Rationale:**
- Constant-time comparison prevents username enumeration
- Uses dummy hash with same computational cost
- No API changes
- Standard security practice

**Trade-offs:**
- Slightly slower for invalid usernames (acceptable for security)

### 7. Database Indexes

**Decision:** Add indexes on frequently queried foreign keys and status fields

```prisma
@@index([supplierId])
@@index([unitId])
@@index([year])
@@index([status])
```

**Rationale:**
- Significant performance improvement for filtered queries
- Small storage overhead
- Automatic maintenance by database
- Required database migration

**Trade-offs:**
- Slower writes (minimal impact with current write volume)
- Migration required (one-time cost)

### 8. N+1 Query Fix

**Decision:** Batch fetch all lots, then group by product in memory

**Rationale:**
- Reduces queries from N to 1
- Negligible memory overhead
- Significant performance improvement
- No breaking changes

**Alternatives considered:**
- Prisma nested includes: Still creates N+1 in some cases
- DataLoader library: Overkill for this use case

### 9. Quantity Overflow Protection

**Decision:** Add validation for quantities exceeding Number.MAX_SAFE_INTEGER / 1000

**Rationale:**
- Extremely unlikely to hit in practice (9 quadrillion units)
- Provides clear error message
- Prevents silent corruption
- Conservative limit with safety margin

### 10. CORS Configuration

**Decision:** Validate origin against allowlist, support multiple origins

**Rationale:**
- More secure than wildcard
- Supports dev, staging, prod environments
- Clear error on invalid origin
- Enables credentials for future cookie support

## Risks / Trade-offs

### Risk: Transaction Timeout
**Mitigation:** Year-end counts typically < 100 products, should complete quickly

### Risk: Rate Limiting False Positives
**Mitigation:** Configurable limits, can whitelist IPs if needed, logs incidents

### Risk: Breaking Existing Deployments
**Mitigation:** JWT_SECRET only enforced in production, clear error message

### Risk: File Upload Limits Too Restrictive
**Mitigation:** 5MB = ~50,000 rows, sufficient for most use cases

### Risk: Database Migration Failure
**Mitigation:** Index creation is idempotent, can rollback easily

### Trade-off: Performance vs Security
**Decision:** Favor security - constant-time password comparison worth slight slowdown

### Trade-off: Complexity vs Completeness
**Decision:** Focus on critical fixes, defer medium priority items

## Migration Plan

### Phase 1: Configuration (No downtime)
1. Add JWT_SECRET to environment variables
2. Add CORS allowed origins configuration
3. Test in staging environment

### Phase 2: Code Deployment
1. Deploy backend changes
2. Monitor error rates and performance
3. Verify rate limiting working correctly

### Phase 3: Database Migration
1. Run Prisma migration to add indexes
2. Monitor query performance improvement
3. Rollback plan: Drop indexes if issues

### Rollback Strategy
- All changes backward compatible except JWT_SECRET requirement
- Can temporarily set JWT_SECRET to old default if needed
- Database indexes can be dropped without data loss
- Rate limiting can be disabled by removing middleware

### Testing Strategy
1. Unit tests for each fix (e.g., input sanitization)
2. Manual testing of rate limiting
3. Verify transaction rollback on error
4. Test file upload limits
5. Performance testing with indexes

## Open Questions

1. **Should we log rate limit violations?**
   - **Answer:** Yes, use console.error for now (proper logging deferred)

2. **What happens to existing deployments without JWT_SECRET?**
   - **Answer:** Fail on startup with clear error in production, dev still works

3. **Should we add monitoring/alerting for security events?**
   - **Answer:** Out of scope, deferred to future work

4. **Should rate limits be per-IP or per-user?**
   - **Answer:** Per-IP for simplicity, per-user requires authentication first

5. **Should we version the API to signal breaking changes?**
   - **Answer:** No breaking changes, so no version bump needed
