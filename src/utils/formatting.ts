/**
 * Format number as COP currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(confidence: number | null): string {
  if (confidence === null || confidence === undefined) return 'N/A';
  return `${Math.round(confidence)}%`;
}
