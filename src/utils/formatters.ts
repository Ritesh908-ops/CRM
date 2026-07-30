/**
 * Sanitizes phone numbers by removing leading backticks, spaces, or illegal formatting chars
 * Example: "`9797836641" -> "9797836641"
 */
export function sanitizePhone(phoneStr: string | null | undefined): string {
  if (!phoneStr) return '';
  return phoneStr.toString().replace(/[`'\s]/g, '').trim();
}

/**
 * Clean strings by removing stray backticks, quotes, and excessive whitespace
 */
export function sanitizeString(val: string | null | undefined): string {
  if (!val) return '';
  return val.toString().replace(/^[`'"]+|[`'"]+$/g, '').trim();
}

/**
 * Safely parse numeric strings (handling commas, currency symbols, empty values)
 */
export function parseNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  const cleaned = val.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format currency to Indian Rupees (INR) format (e.g., ₹1,00,000 or ₹15 Lakhs)
 */
export function formatCurrency(amount: number): string {
  if (!amount || amount === 0) return '₹0';
  
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates composite key for deduplication
 * Uses entityId + directorName (or email if directorName is empty)
 */
export function generateCompositeKey(entityId: string, directorName: string, directorEmail: string): string {
  const cleanId = sanitizeString(entityId).toUpperCase();
  const cleanDirector = sanitizeString(directorName).toUpperCase();
  const cleanEmail = sanitizeString(directorEmail).toUpperCase();
  
  const directorIdentifier = cleanDirector || cleanEmail || 'NO_DIRECTOR';
  return `${cleanId}___${directorIdentifier}`;
}

/**
 * Return badge CSS status color
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'New':
      return 'b-new';
    case 'Contacted':
      return 'b-contacted';
    case 'In Discussion':
      return 'b-discussion';
    case 'Qualified':
      return 'b-qualified';
    case 'Converted':
      return 'b-converted';
    case 'Unresponsive':
      return 'b-unresponsive';
    default:
      return 'b-part';
  }
}

export function getStatusSelectClass(status: string): string {
  switch (status) {
    case 'New':
      return 's-new';
    case 'Contacted':
      return 's-contacted';
    case 'In Discussion':
      return 's-discussion';
    case 'Qualified':
      return 's-qualified';
    case 'Converted':
      return 's-converted';
    case 'Unresponsive':
      return 's-unresponsive';
    default:
      return '';
  }
}
