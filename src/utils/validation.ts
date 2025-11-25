/**
 * Validate if a string is a valid date in YYYY-MM-DD format
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate if a string is a valid time in HH:mm format
 */
export function isValidTime(timeString: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}

/**
 * Validate amount is a positive number
 */
export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && isFinite(amount);
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
