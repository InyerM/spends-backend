/**
 * Get current date and time in Colombia timezone
 */
export function getCurrentColombiaTimes(): { date: string; time: string } {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const values: Record<string, string> = {};
  
  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  const date = `${values.year}-${values.month}-${values.day}`;
  const time = `${values.hour}:${values.minute}`;

  return { date, time };
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD
 */
export function convertDateFormat(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateForDisplay(yyyymmdd: string): string {
  const [year, month, day] = yyyymmdd.split('-');
  return `${day}/${month}/${year}`;
}
