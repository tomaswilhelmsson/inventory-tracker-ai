import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePreferencesStore } from '@/stores/preferences';

/**
 * Composable for dynamic currency formatting based on user preferences
 * 
 * Usage:
 *   const { formatCurrency, currencySymbol } = useCurrency();
 *   formatCurrency(123.45) // Returns "$123.45" or "123,45 kr" based on preferences
 */
export function useCurrency() {
  const { locale } = useI18n();
  const preferencesStore = usePreferencesStore();

  // Get the current currency symbol
  const currencySymbol = computed(() => {
    return preferencesStore.currency === 'USD' ? '$' : 'kr';
  });

  // Get the currency code
  const currencyCode = computed(() => {
    return preferencesStore.currency;
  });

  // Get the locale for InputNumber (controls formatting)
  const inputNumberLocale = computed(() => {
    return locale.value === 'sv' ? 'sv-SE' : 'en-US';
  });

  // Get the input mode (currency vs decimal) - use decimal for SEK to avoid currency symbols
  const inputNumberMode = computed(() => {
    return preferencesStore.currency === 'SEK' ? 'decimal' : 'currency';
  });

  // Currency suffix text for SEK (to append to labels)
  const currencySuffix = computed(() => {
    return preferencesStore.currency === 'SEK' ? ' (SEK)' : '';
  });

  /**
   * Format a number as currency based on user preferences
   * @param value - The numeric value to format
   * @returns Formatted currency string
   */
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '-';
    }

    const currency = preferencesStore.currency;
    const lang = locale.value;

    try {
      // Swedish locale with SEK currency
      if (lang === 'sv' && currency === 'SEK') {
        return new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: 'SEK',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      }
      
      // Swedish locale with USD currency
      if (lang === 'sv' && currency === 'USD') {
        return new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      }
      
      // English locale with SEK currency
      if (lang === 'en' && currency === 'SEK') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'SEK',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      }
      
      // English locale with USD currency (default)
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currency} ${value.toFixed(2)}`;
    }
  };

  /**
   * Format a number as decimal (no currency symbol)
   * @param value - The numeric value to format
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted decimal string
   */
  const formatDecimal = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '-';
    }

    const lang = locale.value;

    try {
      return new Intl.NumberFormat(lang === 'sv' ? 'sv-SE' : 'en-US', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch (error) {
      console.error('Error formatting decimal:', error);
      return value.toFixed(decimals);
    }
  };

  /**
   * Normalize decimal separator input - accepts both . and , as decimal separator
   * Converts comma to period for internal numeric representation
   * @param value - The input string value
   * @returns Normalized numeric value
   */
  const normalizeDecimalInput = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // If already a number, return it
    if (typeof value === 'number') {
      return value;
    }

    // Replace comma with period for decimal separator
    // Remove spaces (thousand separators in Swedish format)
    const normalized = value
      .toString()
      .replace(/\s/g, '') // Remove spaces
      .replace(',', '.'); // Convert comma to period

    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  return {
    formatCurrency,
    formatDecimal,
    normalizeDecimalInput,
    currencySymbol,
    currencyCode,
    inputNumberLocale,
    inputNumberMode,
    currencySuffix,
  };
}
