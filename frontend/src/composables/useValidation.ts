import { useI18n } from 'vue-i18n';

/**
 * Centralized validation composable
 * Provides reusable validation functions for forms
 */
export function useValidation() {
  const { t } = useI18n();

  /**
   * Validate required field
   * @param value - Value to validate
   * @param fieldName - Optional field name for error message
   * @returns Error message or null if valid
   */
  const required = (value: any, fieldName?: string): string | null => {
    if (value === null || value === undefined || value === '') {
      return fieldName
        ? t('validation.requiredField', { field: fieldName })
        : t('validation.required');
    }
    if (typeof value === 'string' && !value.trim()) {
      return fieldName
        ? t('validation.requiredField', { field: fieldName })
        : t('validation.required');
    }
    if (Array.isArray(value) && value.length === 0) {
      return fieldName
        ? t('validation.requiredField', { field: fieldName })
        : t('validation.required');
    }
    return null;
  };

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns Error message or null if valid
   */
  const email = (email: string): string | null => {
    if (!email) return null; // Use required() to check if email is required
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return t('validation.invalidEmail');
    }
    return null;
  };

  /**
   * Validate minimum value
   * @param value - Number to validate
   * @param min - Minimum value
   * @returns Error message or null if valid
   */
  const minValue = (value: number, min: number): string | null => {
    if (value < min) {
      return t('validation.minValue', { min });
    }
    return null;
  };

  /**
   * Validate maximum value
   * @param value - Number to validate
   * @param max - Maximum value
   * @returns Error message or null if valid
   */
  const maxValue = (value: number, max: number): string | null => {
    if (value > max) {
      return t('validation.maxValue', { max });
    }
    return null;
  };

  /**
   * Validate positive number (> 0)
   * @param value - Number to validate
   * @returns Error message or null if valid
   */
  const positive = (value: number): string | null => {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      return t('validation.quantityPositive');
    }
    return null;
  };

  /**
   * Validate non-negative number (>= 0)
   * @param value - Number to validate
   * @returns Error message or null if valid
   */
  const nonNegative = (value: number): string | null => {
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
      return t('validation.unitCostNonNegative');
    }
    return null;
  };

  /**
   * Validate number type
   * @param value - Value to validate
   * @returns Error message or null if valid
   */
  const isNumber = (value: any): string | null => {
    if (typeof value !== 'number' || isNaN(value)) {
      return t('validation.invalidNumber');
    }
    return null;
  };

  /**
   * Validate string length
   * @param value - String to validate
   * @param min - Minimum length
   * @param max - Maximum length
   * @returns Error message or null if valid
   */
  const length = (value: string, min?: number, max?: number): string | null => {
    if (min !== undefined && value.length < min) {
      return t('validation.minLength', { min });
    }
    if (max !== undefined && value.length > max) {
      return t('validation.maxLength', { max });
    }
    return null;
  };

  /**
   * Run multiple validators and return first error
   * @param validators - Array of validation functions
   * @returns First error message or null if all valid
   */
  const validate = (...validators: Array<() => string | null>): string | null => {
    for (const validator of validators) {
      const error = validator();
      if (error) return error;
    }
    return null;
  };

  /**
   * Validate form with multiple fields
   * @param rules - Object mapping field names to validator arrays
   * @returns Object with validation results
   */
  const validateForm = (
    rules: Record<string, Array<() => string | null>>
  ): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    for (const [field, validators] of Object.entries(rules)) {
      const error = validate(...validators);
      if (error) {
        errors[field] = error;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  };

  return {
    required,
    email,
    minValue,
    maxValue,
    positive,
    nonNegative,
    isNumber,
    length,
    validate,
    validateForm,
  };
}
