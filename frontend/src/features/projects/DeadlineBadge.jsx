import { differenceInCalendarDays, format } from 'date-fns';
import { Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn.js';

const TERMINAL = new Set(['delivered', 'cancelled']);

export default function DeadlineBadge({ deadline, status, className }) {
  if (!deadline) return null;
  const date = new Date(deadline);
  const days = differenceInCalendarDays(date, new Date());
  const isTerminal = TERMINAL.has(status);
  const overdue = !isTerminal && days < 0;
  const soon = !isTerminal && days >= 0 && days <= 2;

  const tone = overdue
    ? 'border-destructive/40 bg-destructive/10 text-destructive'
    : soon
    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    : 'border-border bg-muted text-muted-foreground';

  const label = overdue
    ? `${Math.abs(days)}d overdue`
    : days === 0
    ? 'Today'
    : days === 1
    ? 'Tomorrow'
    : days > 0
    ? `${days}d left`
    : format(date, 'MMM d');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        tone,
        className
      )}
      title={format(date, 'MMM d, yyyy')}
    >
      {overdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
      {label}
    </span>
  );
}
