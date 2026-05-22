// Currency exchange — fetches live USD-base rates and converts amounts.
// Every monetary value in the app is stored as USD cents; this module is the
// single place that knows how to move money between currencies.
import { CURRENCIES } from '../config/currencies.js';

// Free, no-API-key endpoint. The base currency is always USD.
// Swap EXCHANGE_RATES_URL for any provider that returns { rates: { USD, ... } }
// or { conversion_rates: { ... } } — e.g. exchangerate-api.com, frankfurter.app.
const RATES_URL =
  process.env.EXCHANGE_RATES_URL || 'https://open.er-api.com/v6/latest/USD';
const TTL_MS = Number(process.env.EXCHANGE_RATES_TTL_MS) || 6 * 60 * 60 * 1000; // 6h

// Static fallback so the app keeps working if the rate API is unreachable.
const FALLBACK_RATES = { USD: 1, BDT: 120, EUR: 0.92 };

let cache = { rates: null, fetchedAt: 0 };

async function fetchRates() {
  const res = await fetch(RATES_URL, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Rate API responded ${res.status}`);
  const json = await res.json();
  // Support both common response shapes.
  const raw = json.rates || json.conversion_rates;
  if (!raw || !raw.USD) throw new Error('Rate API returned no usable rates');
  // Keep only the currencies the app supports.
  const rates = {};
  for (const code of CURRENCIES) {
    rates[code] = raw[code] != null ? raw[code] : FALLBACK_RATES[code] ?? 1;
  }
  return rates;
}

/**
 * Live USD-base rates, e.g. { USD: 1, BDT: 119.8, EUR: 0.93 } — meaning
 * "units of that currency per 1 USD". Cached in memory for TTL_MS.
 */
export async function getRates() {
  const fresh = cache.rates && Date.now() - cache.fetchedAt < TTL_MS;
  if (fresh) return cache.rates;
  try {
    const rates = await fetchRates();
    cache = { rates, fetchedAt: Date.now() };
    return rates;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[currency] rate fetch failed, using fallback:', err.message);
    // Prefer a stale cache over the static fallback if we have one.
    return cache.rates || { ...FALLBACK_RATES };
  }
}

/** Convert an integer cent amount between two currencies. Returns USD-rounded cents. */
export async function convert(amountCents, from, to) {
  const f = (from || 'USD').toUpperCase();
  const t = (to || 'USD').toUpperCase();
  if (!amountCents || f === t) return Math.round(amountCents || 0);
  const rates = await getRates();
  const fromRate = rates[f] || 1; // units of `from` per 1 USD
  const toRate = rates[t] || 1; // units of `to` per 1 USD
  const usd = amountCents / fromRate;
  return Math.round(usd * toRate);
}

/** Convert an amount in `currency` into USD cents — used before storing. */
export function toUSD(amountCents, currency) {
  return convert(amountCents, currency, 'USD');
}

/** Convert USD cents into `currency` — used when displaying to a user. */
export function fromUSD(usdCents, currency) {
  return convert(usdCents, 'USD', currency);
}
