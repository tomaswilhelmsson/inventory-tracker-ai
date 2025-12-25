import { AppError } from '../middleware/errorHandler';

/**
 * Validation constants and utilities for business logic
 */

// Date validation constants
const MIN_VALID_YEAR = 2000;
const MAX_FUTURE_MONTHS = 12;

// Quantity validation constants
// Prevent JavaScript integer overflow (Number.MAX_SAFE_INTEGER = 2^53 - 1)
// Using a conservative limit to ensure calculations don't overflow
export const MAX_QUANTITY = Math.floor(Number.MAX_SAFE_INTEGER / 1000);

/**
 * Validates purchase date is within acceptable range
 * @param date - The date to validate
 * @throws AppError if date is invalid
 */
export function validatePurchaseDate(date: Date): void {
  const year = date.getFullYear();
  
  // Reject dates before year 2000
  if (year < MIN_VALID_YEAR) {
    throw new AppError(400, `Purchase date cannot be before year ${MIN_VALID_YEAR}`);
  }

  // Reject dates more than 1 year in the future
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + MAX_FUTURE_MONTHS);
  
  if (date > maxFutureDate) {
    throw new AppError(400, 'Purchase date cannot be more than 1 year in the future');
  }
}

/**
 * Validates quantity is within safe integer range
 * @param quantity - The quantity to validate
 * @param fieldName - Name of the field for error messages
 * @throws AppError if quantity exceeds safe limits
 */
export function validateQuantity(quantity: number, fieldName: string = 'Quantity'): void {
  if (quantity > MAX_QUANTITY) {
    throw new AppError(400, `${fieldName} exceeds maximum allowed value (${MAX_QUANTITY})`);
  }
}
