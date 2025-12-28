# Design: Add Discard Draft Year-End Count

## Overview

This design adds the ability to discard (delete) draft year-end counts that have not been confirmed. This provides users with a clean way to remove mistakes or abandoned counts while ensuring confirmed counts cannot be deleted to preserve audit trail integrity.

## Architecture

### Current State

```
Year-End Count Lifecycle:
1. Initiate (creates draft count)
2. Enter counts (updates draft)
3. Confirm (locks count, updates FIFO, locks year)

Once confirmed: Immutable (no delete allowed)

Database:
YearEndCount (id, year, status='draft'/'confirmed')
  └─ YearEndCountItem[] (onDelete: Cascade)
```

### Target State

```
Year-End Count Lifecycle:
1. Initiate (creates draft count)
2. Enter counts (updates draft)
   └─ Option: Discard draft (NEW)
3. Confirm (locks count, updates FIFO, locks year)

Once confirmed: Immutable (no delete allowed)

Backend:
+ DELETE /api/year-end-count/:id
  - Validates status === 'draft'
  - Uses Prisma cascade delete

Frontend:
+ Discard button (visible only for drafts)
+ Confirmation dialog
+ Redirect after discard
```

## Data Model

No schema changes needed. Existing cascade delete handles cleanup:

```prisma
model YearEndCountItem {
  yearEndCount YearEndCount @relation(
    fields: [yearEndCountId], 
    references: [id], 
    onDelete: Cascade  // ← Already configured
  )
}
```

When we delete a YearEndCount record, all associated YearEndCountItem records are automatically deleted.

## API Design

### New Endpoint

```
DELETE /api/year-end-count/:id
```

**Request:**
- Path param: `id` (integer, year-end count ID)
- Headers: Authentication token required

**Response:**

Success (200):
```json
{
  "message": "Draft year-end count deleted successfully",
  "deletedItems": 15
}
```

Error (400 - Confirmed count):
```json
{
  "error": "Cannot delete confirmed year-end count. Confirmed counts are immutable for audit trail."
}
```

Error (404):
```json
{
  "error": "Year-end count not found"
}
```

## Backend Implementation

### Service Layer

```typescript
// yearEndCountService.ts
async deleteYearEndCount(countId: number) {
  // 1. Find count
  const count = await dbClient.yearEndCount.findUnique({
    where: { id: countId },
    include: { _count: { select: { items: true } } }
  });

  if (!count) {
    throw new AppError(404, 'Year-end count not found');
  }

  // 2. Validate status
  if (count.status === 'confirmed') {
    throw new AppError(400, 
      'Cannot delete confirmed year-end count. ' +
      'Confirmed counts are immutable for audit trail.'
    );
  }

  // 3. Delete (cascade handles items)
  await dbClient.yearEndCount.delete({
    where: { id: countId }
  });

  return {
    message: 'Draft year-end count deleted successfully',
    deletedItems: count._count.items
  };
}
```

### Route Layer

```typescript
// routes/yearEndCount.ts
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Valid count ID required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await yearEndCountService.deleteYearEndCount(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);
```

## Frontend Implementation

### UI Updates (YearEndCountView.vue)

#### 1. Add Discard Button

Location: Next to "Confirm Count" button (only visible for draft counts)

```vue
<Button
  v-if="countSheet.status === 'draft'"
  :label="t('yearEndCount.discardCount')"
  icon="pi pi-trash"
  severity="danger"
  outlined
  @click="confirmDiscard"
/>
```

#### 2. Confirmation Dialog

```typescript
const confirmDiscard = () => {
  confirm.require({
    message: t('yearEndCount.messages.discardConfirm', { 
      year: countSheet.value.year,
      count: countSheet.value.items?.length || 0
    }),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => discardCount(),
  });
};
```

#### 3. Discard Function

```typescript
const discardCount = async () => {
  try {
    await api.delete(`/year-end-count/${countSheet.value.id}`);
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('yearEndCount.messages.discardSuccess'),
      life: 3000,
    });
    
    // Redirect to year selection
    router.push('/year-end-count');
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || 
              t('yearEndCount.messages.discardFailed'),
      life: 5000,
    });
  }
};
```

## User Interface Design

### Button Placement

```
┌─────────────────────────────────────────────────────────┐
│  Year-End Count 2024 - Draft                            │
│                                                          │
│  Progress: 5/20 products counted                        │
│                                                          │
│  [Export CSV] [Export PDF] [Discard] [Confirm Count]   │
│                             ^^^^^^^^                     │
│                             NEW BUTTON                   │
└─────────────────────────────────────────────────────────┘
```

### Confirmation Dialog

```
┌───────────────────────────────────────────────┐
│  ⚠️  Confirm Discard                       [×] │
├───────────────────────────────────────────────┤
│                                               │
│  Are you sure you want to discard the        │
│  year-end count for 2024?                    │
│                                               │
│  This will delete the count with 20 products.│
│  This action cannot be undone.               │
│                                               │
├───────────────────────────────────────────────┤
│                    [Cancel]  [Discard]        │
└───────────────────────────────────────────────┘
```

## Translations

### English (en.json)

```json
{
  "yearEndCount": {
    "discardCount": "Discard",
    "messages": {
      "discardConfirm": "Are you sure you want to discard the year-end count for {year}? This will delete the count with {count} products. This action cannot be undone.",
      "discardSuccess": "Year-end count discarded successfully",
      "discardFailed": "Failed to discard year-end count"
    }
  }
}
```

### Swedish (sv.json)

```json
{
  "yearEndCount": {
    "discardCount": "Kassera",
    "messages": {
      "discardConfirm": "Är du säker på att du vill kassera årsbokslutet för {year}? Detta kommer att radera räkningen med {count} produkter. Denna åtgärd kan inte ångras.",
      "discardSuccess": "Årsbokslut kasserades framgångsrikt",
      "discardFailed": "Misslyckades med att kassera årsbokslut"
    }
  }
}
```

## Error Handling

### Backend Errors

| Error | Status | Message |
|-------|--------|---------|
| Count not found | 404 | "Year-end count not found" |
| Confirmed count | 400 | "Cannot delete confirmed year-end count. Confirmed counts are immutable for audit trail." |
| Database error | 500 | Generic database error |

### Frontend Error Handling

- Display toast notifications for all errors
- Show server error message if available
- On success: Redirect to year selection page
- On error: Stay on current page, allow retry

## Security Considerations

- **Authentication**: Endpoint requires valid JWT token
- **Authorization**: No role-based checks needed (simple auth model)
- **Validation**: 
  - ID must be valid integer
  - Count must exist
  - Status must be 'draft'
- **Audit Trail**: Confirmed counts cannot be deleted (preserved for compliance)

## Testing Strategy

### Backend Unit Tests

```typescript
describe('deleteYearEndCount', () => {
  test('successfully deletes draft count', async () => {
    // Create draft count
    // Delete it
    // Verify count and items are gone
  });

  test('throws error for confirmed count', async () => {
    // Create confirmed count
    // Attempt delete
    // Expect 400 error
  });

  test('throws error for non-existent count', async () => {
    // Attempt delete with invalid ID
    // Expect 404 error
  });

  test('cascade deletes all count items', async () => {
    // Create count with 5 items
    // Delete count
    // Verify all 5 items are deleted
  });
});
```

### Backend Integration Tests

```typescript
describe('DELETE /api/year-end-count/:id', () => {
  test('returns 200 for draft count', async () => {
    // Create draft count
    // DELETE request
    // Expect 200 response
  });

  test('returns 400 for confirmed count', async () => {
    // Create confirmed count
    // DELETE request
    // Expect 400 with error message
  });

  test('returns 404 for non-existent count', async () => {
    // DELETE request with invalid ID
    // Expect 404
  });

  test('requires authentication', async () => {
    // DELETE request without token
    // Expect 401
  });
});
```

### Frontend Component Tests

```typescript
describe('YearEndCountView - Discard', () => {
  test('shows discard button for draft count', async () => {
    // Load draft count
    // Verify discard button visible
  });

  test('hides discard button for confirmed count', async () => {
    // Load confirmed count
    // Verify discard button not visible
  });

  test('shows confirmation dialog on discard', async () => {
    // Click discard button
    // Verify confirmation dialog appears
  });

  test('redirects after successful discard', async () => {
    // Discard count
    // Mock successful API response
    // Verify redirect to /year-end-count
  });
});
```

### E2E Test Scenarios

1. **Happy path**: Initiate count → Enter some data → Discard → Confirm deletion → Verify removed
2. **Cannot delete confirmed**: Initiate → Complete → Confirm → Try to discard → Verify error
3. **Cancel discard**: Initiate → Click discard → Cancel in dialog → Verify count still exists
4. **Multiple revisions**: Discard revision 2 (draft) → Verify revision 1 (confirmed) unchanged

## Alternative Approaches Considered

### 1. Soft Delete with `deletedAt` Timestamp

**Pros**: Allows recovery, maintains history
**Cons**: Adds complexity, draft counts are not financially significant
**Decision**: Rejected - hard delete is sufficient for drafts

### 2. Archive Instead of Delete

**Pros**: Could review abandoned counts later
**Cons**: Adds storage overhead, UI complexity to show/hide archived counts
**Decision**: Rejected - not needed for draft counts

### 3. Auto-delete Old Drafts

**Pros**: Keeps system clean automatically
**Cons**: User might be in middle of counting, need to determine "old" threshold
**Decision**: Out of scope - manual discard is sufficient for v1

## Rollout Plan

### Phase 1: Backend (No User Impact)
1. Deploy service method
2. Deploy DELETE endpoint
3. Verify with curl/Postman

### Phase 2: Frontend
1. Deploy discard button and confirmation dialog
2. Deploy translations
3. Test end-to-end

### Rollback Strategy
1. If issues: Remove discard button from frontend (backend harmless if not called)
2. If critical: Revert both backend and frontend

## Future Enhancements

Potential additions for future iterations:
- Audit log of discarded counts (who, when, why)
- Bulk discard for multiple draft counts
- Auto-archive drafts older than X days
- Export draft count before discarding
- Soft delete with recovery option
