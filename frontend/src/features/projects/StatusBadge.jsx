import { STATUS_BY_KEY, STATUS_BADGE_CLASS } from './projectConstants.js';
import { cn } from '@/lib/cn.js';

export default function StatusBadge({ status, className }) {
  const s = STATUS_BY_KEY[status];
  if (!s) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_BADGE_CLASS[s.tone],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
