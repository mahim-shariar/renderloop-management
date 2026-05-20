// Supported currencies — keep in sync with server/src/config/currencies.js
export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);

export function currencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code;
}
