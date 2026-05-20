/** Format an integer cent amount as a currency string for server-side summaries. */
export function formatCents(cents, currency = 'USD') {
  if (cents == null) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(0)}`;
  }
}
