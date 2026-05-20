import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
} from '@/components/ui/Dropdown.jsx';
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './notificationsApi.js';
import { cn } from '@/lib/cn.js';

const TYPE_DOT = {
  deadline_approaching: 'bg-amber-400',
  deadline_overdue: 'bg-rose-400',
  draft_uploaded: 'bg-blue-400',
  client_feedback: 'bg-violet-400',
  revisions_exceeded: 'bg-rose-400',
  salary_due: 'bg-emerald-400',
  payment_overdue: 'bg-rose-400',
  task_assigned: 'bg-sky-400',
  project_assigned: 'bg-emerald-400',
  project_status_changed: 'bg-blue-400',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  // Poll every 30s so the badge stays fresh without websockets.
  const { data } = useListNotificationsQuery(undefined, { pollingInterval: 30000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll] = useMarkAllNotificationsReadMutation();

  const items = data?.data?.items || [];
  const unread = data?.data?.unreadCount || 0;

  async function open(n) {
    if (!n.read) await markRead(n._id);
    if (n.link) navigate(n.link);
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium text-foreground">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAll()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            items.map((n) => (
              <button
                type="button"
                key={n._id}
                onClick={() => open(n)}
                className={cn(
                  'flex w-full gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-accent',
                  !n.read && 'bg-primary/5'
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    TYPE_DOT[n.type] || 'bg-muted-foreground'
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{n.title}</span>
                  {n.body && (
                    <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                  )}
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
