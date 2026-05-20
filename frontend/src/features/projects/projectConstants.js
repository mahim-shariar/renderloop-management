export const PROJECT_STATUSES = [
  { key: 'not_started', label: 'Not started', tone: 'slate' },
  { key: 'footage_received', label: 'Footage received', tone: 'sky' },
  { key: 'in_progress', label: 'In progress', tone: 'blue' },
  { key: 'internal_review', label: 'Internal review', tone: 'violet' },
  { key: 'awaiting_client_review', label: 'Awaiting client', tone: 'amber' },
  { key: 'revision', label: 'Revision', tone: 'orange' },
  { key: 'approved', label: 'Approved', tone: 'emerald' },
  { key: 'delivered', label: 'Delivered', tone: 'green' },
  { key: 'on_hold', label: 'On hold', tone: 'zinc' },
  { key: 'cancelled', label: 'Cancelled', tone: 'rose' },
];

export const STATUS_KEYS = PROJECT_STATUSES.map((s) => s.key);

export const STATUS_BY_KEY = Object.fromEntries(PROJECT_STATUSES.map((s) => [s.key, s]));

export const PROJECT_PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'normal', label: 'Normal' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
];

export const VIDEO_TYPES = [
  { key: 'youtube_long', label: 'YouTube long-form' },
  { key: 'youtube_short', label: 'YouTube short' },
  { key: 'reel', label: 'Reel' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'ad', label: 'Ad' },
  { key: 'podcast', label: 'Podcast' },
  { key: 'wedding', label: 'Wedding' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'other', label: 'Other' },
];

export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5', 'other'];

export const STATUS_BADGE_CLASS = {
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  green: 'bg-green-500/15 text-green-300 border-green-500/30',
  zinc: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export const PRIORITY_TONE = {
  low: 'muted',
  normal: 'outline',
  high: 'warning',
  urgent: 'destructive',
};

export function formatDurationSec(sec) {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function formatCents(cents, currency = 'USD') {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(0)}`;
  }
}
