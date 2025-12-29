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
