export const TEAM_ROLES = [
  { key: 'editor', label: 'Editor', tone: 'blue' },
  { key: 'colorist', label: 'Colorist', tone: 'violet' },
  { key: 'sound_designer', label: 'Sound designer', tone: 'amber' },
  { key: 'motion_graphics', label: 'Motion graphics', tone: 'emerald' },
  { key: 'thumbnail_designer', label: 'Thumbnail designer', tone: 'orange' },
  { key: 'manager', label: 'Manager', tone: 'sky' },
];

export const TEAM_ROLE_BY_KEY = Object.fromEntries(TEAM_ROLES.map((r) => [r.key, r]));

export const SALARY_TYPES = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'per_project', label: 'Per project' },
  { key: 'per_minute_of_footage', label: 'Per minute of footage' },
];

export const AVAILABILITIES = [
  { key: 'available', label: 'Available', tone: 'success' },
  { key: 'busy', label: 'Busy', tone: 'warning' },
  { key: 'on_leave', label: 'On leave', tone: 'muted' },
];

export const AVAILABILITY_BY_KEY = Object.fromEntries(AVAILABILITIES.map((a) => [a.key, a]));

export const PAYOUT_METHODS = ['wise', 'payoneer', 'bank', 'crypto', 'paypal', 'other'];

export const ROLE_BADGE_CLASS = {
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};
