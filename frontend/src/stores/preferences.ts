import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import api from '../services/api';

export type Language = 'en' | 'sv';
export type Currency = 'USD' | 'SEK';

export interface UserPreferences {
  language: Language;
  currency: Currency;
}

export const usePreferencesStore = defineStore('preferences', () => {
  // Initialize from localStorage with fallback to defaults
  const language = ref<Language>((localStorage.getItem('preferredLanguage') as Language) || 'en');
  const currency = ref<Currency>((localStorage.getItem('preferredCurrency') as Currency) || 'USD');
  const isLoaded = ref(false);

  // Persist to localStorage whenever preferences change
  watch(language, (newLang) => {
    localStorage.setItem('preferredLanguage', newLang);
  });

  watch(currency, (newCurr) => {
    localStorage.setItem('preferredCurrency', newCurr);
  });

  /**
   * Load user preferences from the server
   * This should be called after successful login
   */
  async function loadPreferences() {
    try {
      const response = await api.get('/auth/me');
      const prefs = response.data.preferences;
      
      if (prefs) {
        language.value = prefs.language || 'en';
        currency.value = prefs.currency || 'USD';
        isLoaded.value = true;
      }
    } catch (error) {
      console.warn('Failed to load user preferences from server, using local defaults', error);
      // Keep localStorage values as fallback
      isLoaded.value = true;
    }
  }

  /**
   * Update language preference
   * Saves to server and updates local state
   */
  async function updateLanguage(newLanguage: Language) {
    const previousLanguage = language.value;
    
    // Optimistically update local state
    language.value = newLanguage;

    try {
      await api.put('/auth/preferences', { language: newLanguage });
    } catch (error) {
      console.error('Failed to update language preference', error);
      // Rollback on error
      language.value = previousLanguage;
      throw error;
    }
  }

  /**
   * Update currency preference
   * Saves to server and updates local state
   */
  async function updateCurrency(newCurrency: Currency) {
    const previousCurrency = currency.value;
    
    // Optimistically update local state
    currency.value = newCurrency;

    try {
      await api.put('/auth/preferences', { currency: newCurrency });
    } catch (error) {
      console.error('Failed to update currency preference', error);
      // Rollback on error
      currency.value = previousCurrency;
      throw error;
    }
  }

  /**
   * Update both language and currency preferences at once
   */
  async function updatePreferences(prefs: Partial<UserPreferences>) {
    const previousLanguage = language.value;
    const previousCurrency = currency.value;

    // Optimistically update local state
    if (prefs.language) language.value = prefs.language;
    if (prefs.currency) currency.value = prefs.currency;

    try {
      await api.put('/auth/preferences', prefs);
    } catch (error) {
      console.error('Failed to update preferences', error);
      // Rollback on error
      language.value = previousLanguage;
      currency.value = previousCurrency;
      throw error;
    }
  }

  /**
   * Reset preferences to defaults (logout scenario)
   */
  function resetPreferences() {
    language.value = 'en';
    currency.value = 'USD';
    isLoaded.value = false;
  }

  return {
    language,
    currency,
    isLoaded,
    loadPreferences,
    updateLanguage,
    updateCurrency,
    updatePreferences,
    resetPreferences,
  };
});
