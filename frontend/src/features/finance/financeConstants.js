export const PAYMENT_SOURCES = [
  { key: 'client_direct', label: 'Client (direct)' },
  { key: 'fiverr', label: 'Fiverr' },
  { key: 'upwork', label: 'Upwork' },
  { key: 'wise', label: 'Wise' },
  { key: 'payoneer', label: 'Payoneer' },
  { key: 'paypal', label: 'PayPal' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'other', label: 'Other' },
];

export const PAYMENT_STATUSES = [
  { key: 'pending', label: 'Pending', tone: 'warning' },
  { key: 'received', label: 'Received', tone: 'success' },
  { key: 'failed', label: 'Failed', tone: 'destructive' },
];

export const EXPENSE_CATEGORIES = [
  { key: 'team_salary', label: 'Team salary' },
  { key: 'software_subscription', label: 'Software subscription' },
  { key: 'ads', label: 'Ads' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'stock_assets', label: 'Stock assets' },
  { key: 'misc', label: 'Misc' },
];

export const EXPENSE_CATEGORY_BY_KEY = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.key, c])
);

// Pre-canned subscriptions for one-click expense entry
export const SUBSCRIPTION_PRESETS = [
  { name: 'Adobe Creative Cloud', amount: 59.99, recurring: true, notes: 'Monthly · all-apps plan' },
  { name: 'Frame.io', amount: 25, recurring: true, notes: 'Monthly · per-seat review platform' },
  { name: 'Epidemic Sound', amount: 17, recurring: true, notes: 'Monthly · music licensing' },
  { name: 'Artlist', amount: 16.6, recurring: true, notes: 'Monthly · music + sfx + footage' },
  { name: 'Envato Elements', amount: 16.5, recurring: true, notes: 'Monthly · asset library' },
  { name: 'Storyblocks', amount: 30, recurring: true, notes: 'Monthly · stock footage' },
  { name: 'Motion Array', amount: 29.99, recurring: true, notes: 'Monthly · templates + sfx' },
];

export const CHART_PALETTE = [
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#84cc16',
];
