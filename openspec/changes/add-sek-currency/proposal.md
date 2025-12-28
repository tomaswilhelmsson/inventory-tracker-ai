# Proposal: Add SEK Currency Support with User Preferences

## Change ID
`add-sek-currency`

## Status
Draft

## Author
System

## Date
2025-12-27

## Problem Statement

The inventory tracking system currently hardcodes USD (US Dollar) as the only currency across all monetary displays and input fields. Additionally, language and currency preferences are stored in localStorage, which means:

1. **Wrong currency symbol**: All amounts show "$" instead of "kr" for Swedish users
2. **Incorrect formatting**: Numbers use US format (e.g., $1,234.56) instead of Swedish format (e.g., 1 234,56 kr)
3. **No user choice**: Users cannot select their preferred currency
4. **Misleading data**: Financial reports show USD when actual costs are in SEK
5. **Lost preferences**: Settings don't sync across devices (localStorage is per-browser)
6. **No persistence after logout**: Preferences reset when user logs out and back in

## Proposed Solution

Add SEK (Swedish Krona) as a selectable currency option AND store user preferences (language + currency) in the database:

**Frontend:**
- Allow users to choose between USD and SEK
- Apply Swedish number formatting when SEK is selected
- Update all currency input fields to respect the selected currency

**Backend:**
- Add `preferredCurrency` and `preferredLanguage` fields to User model
- Create API endpoints to get/update user preferences
- Return preferences with authentication response
- Sync preferences across all user sessions and devices

**Benefits:**
- Preferences persist across devices and browsers
- Settings survive logout/login
- Centralized user profile management
- Future-proof for additional preference fields

## User Stories

1. As a Swedish business owner, I want to select SEK as my currency and have it remembered across all my devices
2. As a user, I want my language and currency preferences to persist after logout so I don't reconfigure every session
3. As a Swedish user, I want amounts formatted in Swedish style (e.g., "1 234,56 kr") for familiarity
4. As a multinational user, I want to easily switch between USD and SEK currencies from any device
5. As a user, when I log in on a new computer, I want my preferences to automatically load

## Scope

### In Scope
**Database:**
- Add `preferredCurrency` field to User model (default: 'USD')
- Add `preferredLanguage` field to User model (default: 'en')
- Create database migration

**Backend:**
- Add GET `/auth/preferences` endpoint
- Add PUT `/auth/preferences` endpoint
- Return preferences in login/session response
- Validate currency values ('USD' | 'SEK')
- Validate language values ('en' | 'sv')

**Frontend:**
- Create Pinia store for user preferences (currency + language)
- Load preferences from API after login
- Save preferences to API on change
- Currency selector component in app header
- Language selector updates to save to database (instead of localStorage)
- Support for two currencies: USD and SEK
- Swedish number formatting (space separator, comma decimal) when SEK selected
- Update all InputNumber components with `mode="currency"` to use selected currency

### Out of Scope
- Additional currencies beyond USD and SEK
- Currency conversion or exchange rates
- Multi-currency support (all amounts in one currency at a time)
- Currency field in database for purchases (values remain numeric)
- Historical currency tracking per purchase
- User profile management UI (separate feature)
- Email notifications about preference changes

## Dependencies

- Prisma ORM for database schema changes
- Prisma migrations
- Vue I18n for number formatting
- PrimeVue InputNumber component
- Pinia for state management
- Existing authentication system

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Migration fails on production database | High | Test migration thoroughly in dev/staging; include rollback script |
| API preferences endpoint breaks existing auth flow | High | Make preferences optional; maintain backward compatibility |
| User switches currency and gets confused | Medium | Add clear indicator showing active currency |
| Preferences don't load before app renders | Medium | Show loading state; use fallback to locale-based default |
| Database corruption of preference values | Low | Add validation constraints; validate on both frontend and backend |

## Success Criteria

1. ✅ User model has `preferredCurrency` and `preferredLanguage` fields
2. ✅ Migration runs successfully without data loss
3. ✅ User can select SEK and it saves to database
4. ✅ User can select language and it saves to database (replacing localStorage)
5. ✅ Preferences load automatically on login across all devices
6. ✅ All monetary amounts display with "kr" when SEK selected
7. ✅ Swedish number formatting applies correctly
8. ✅ Preferences persist after logout/login
9. ✅ API endpoints have proper validation and error handling

## Technical Approach

### Database Schema Changes

Update `backend/prisma/schema.prisma`:
```prisma
model User {
  id                 Int      @id @default(autoincrement())
  username           String   @unique
  passwordHash       String
  preferredLanguage  String   @default("en")  // 'en' | 'sv'
  preferredCurrency  String   @default("USD") // 'USD' | 'SEK'
  createdAt          DateTime @default(now())
  
  @@map("users")
}
```

### Backend API Endpoints

**GET `/auth/me`** (existing - enhance to include preferences):
```typescript
{
  id: 1,
  username: "admin",
  preferences: {
    language: "sv",
    currency: "SEK"
  }
}
```

**PUT `/auth/preferences`** (new):
```typescript
// Request body
{
  language?: "en" | "sv",
  currency?: "USD" | "SEK"
}

// Response
{
  message: "Preferences updated",
  preferences: {
    language: "sv",
    currency: "SEK"
  }
}
```

### Frontend Preferences Store

Create `frontend/src/stores/preferences.ts`:
```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const usePreferencesStore = defineStore('preferences', () => {
  const language = ref<'en' | 'sv'>('en');
  const currency = ref<'USD' | 'SEK'>('USD');
  const loading = ref(false);

  async function loadPreferences() {
    try {
      const response = await api.get('/auth/me');
      language.value = response.data.preferences?.language || 'en';
      currency.value = response.data.preferences?.currency || 'USD';
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  async function updatePreferences(prefs: { language?: string; currency?: string }) {
    try {
      loading.value = true;
      const response = await api.put('/auth/preferences', prefs);
      if (prefs.language) language.value = prefs.language;
      if (prefs.currency) currency.value = prefs.currency;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return { language, currency, loading, loadPreferences, updatePreferences };
});
```

### Migration Strategy

1. Create migration to add fields with defaults
2. All existing users get `preferredLanguage: 'en'` and `preferredCurrency: 'USD'`
3. No data migration needed (new fields with defaults)
4. Rollback: Drop the two columns if needed

### i18n Integration

Update language selector to use preferences store:
```typescript
async function setLanguage(locale: string) {
  await preferencesStore.updatePreferences({ language: locale });
  i18n.global.locale.value = locale;
}
```

Update currency formatting dynamically:
```typescript
const numberFormats = computed(() => ({
  en: {
    currency: {
      style: 'currency',
      currency: preferencesStore.currency === 'SEK' ? 'SEK' : 'USD',
    }
  },
  sv: {
    currency: {
      style: 'currency',
      currency: preferencesStore.currency === 'SEK' ? 'SEK' : 'USD',
    }
  }
}));
```

## Open Questions

1. **Should we keep localStorage as fallback if API fails?**
   - **Recommendation**: Yes, graceful degradation with localStorage fallback

2. **Should we provide a "reset to defaults" option?**
   - **Recommendation**: Not in v1, can add later

3. **Should language change trigger currency change (sv → SEK, en → USD)?**
   - **Recommendation**: No, keep them independent

4. **Should we log preference changes for audit trail?**
   - **Recommendation**: Not in v1, GDPR considerations needed

5. **What happens if user has no preferences (new users)?**
   - **Recommendation**: Default to locale-based (browser language → language, then language → currency)

## Estimated Effort

**Backend:**
- Database schema update: 1 hour
- Migration creation and testing: 1-2 hours
- API endpoints (GET/PUT preferences): 2-3 hours
- Validation and error handling: 1 hour
- Testing: 1-2 hours
- **Subtotal**: 6-9 hours

**Frontend:**
- Preferences store creation: 2 hours
- Update language selector to use API: 1 hour
- Currency selector component: 1-2 hours
- Load preferences on login: 1 hour
- Update all InputNumber components: 2-3 hours
- i18n format updates: 1 hour
- Testing: 2-3 hours
- **Subtotal**: 10-13 hours

**Total**: 16-22 hours (~2-3 days)
