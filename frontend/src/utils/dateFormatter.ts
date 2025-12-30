/**
 * Format a date string or Date object to YYYY-MM-DD format
 * @param date - ISO date string or Date object
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check for invalid date
  if (isNaN(dateObj.getTime())) return '-';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string or Date object to YYYY-MM-DD HH:MM format
 * @param date - ISO date string or Date object
 * @returns Formatted datetime string in YYYY-MM-DD HH:MM format
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check for invalid date
  if (isNaN(dateObj.getTime())) return '-';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD) preserving local timezone
 * Replaces toISOString().split('T')[0] which causes timezone shifts
 * @param date - Date object to format
 * @returns ISO date string in YYYY-MM-DD format
 */
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check for invalid date
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string in YYYY-MM-DD format to a Date object
 * Centralizes date parsing logic to avoid duplication
 * @param value - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseDateString(value: string): Date | null {
  const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;
  
  const year = dateMatch[1];
  const month = dateMatch[2];
  const day = dateMatch[3];
  
  if (!year || !month || !day) return null;
  
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  
  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
    return null;
  }
  
  const date = new Date(yearNum, monthNum - 1, dayNum);
  return isNaN(date.getTime()) ? null : date;
}
