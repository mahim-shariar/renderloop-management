import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
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
import { usePushNotifications } from './usePushNotifications.js';
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
  const push = usePushNotifications();

  const items = data?.data?.items || [];
  const unread = data?.data?.unreadCount || 0;

  // Show an in-app toast + OS notification (when the tab is visible) the moment
  // polling sees a new item. The service worker handles the tab-closed case.
  const seenIdsRef = useRef(null);
  useEffect(() => {
    if (!items.length) return;
    const currentIds = new Set(items.map((n) => n._id));
    if (seenIdsRef.current === null) {
      seenIdsRef.current = currentIds;
      return;
    }
    const fresh = items.filter((n) => !seenIdsRef.current.has(n._id) && !n.read);
    fresh.forEach((n) => {
      toast(n.title, { description: n.body });
      if (
        document.visibilityState === 'visible' &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          const note = new Notification(n.title, {
            body: n.body || '',
            icon: '/favicon.png',
            tag: n._id,
          });
          note.onclick = () => {
            window.focus();
            if (n.link) navigate(n.link);
            note.close();
          };
        } catch {
          /* ignore — sw will deliver instead */
        }
      }
    });
    seenIdsRef.current = currentIds;
  }, [items, navigate]);

  async function open(n) {
    if (!n.read) await markRead(n._id);
    if (n.link) navigate(n.link);
  }

  async function togglePush() {
    if (push.subscribed) {
      const r = await push.disable();
      if (r.ok) toast.success('Push notifications turned off');
    } else {
      const r = await push.enable();
      if (r.ok) {
        toast.success('Push notifications enabled');
      } else if (r.reason === 'denied') {
        toast.error('Permission denied — enable notifications in your browser settings.');
      } else if (r.reason === 'ios-install-required') {
        toast.message('On iPhone & iPad', {
          description:
            'Tap the Share icon in Safari, then "Add to Home Screen". Open the app from the Home Screen and turn on notifications from there.',
          duration: 10000,
        });
      } else if (r.reason === 'unsupported') {
        toast.error('Push notifications are not supported in this browser.');
      } else {
        toast.error('Could not enable push notifications.');
      }
    }
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
          <div className="flex items-center gap-2">
            {(push.supported || push.needsIOSInstall) && (
              <button
                type="button"
                onClick={togglePush}
                disabled={push.loading}
                title={
                  push.needsIOSInstall
                    ? 'Add to Home Screen to enable iOS push'
                    : push.subscribed
                    ? 'Turn off push notifications'
                    : 'Turn on push notifications'
                }
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {push.subscribed ? (
                  <>
                    <BellOff className="h-3 w-3" /> Off
                  </>
                ) : push.needsIOSInstall ? (
                  <>
                    <Bell className="h-3 w-3" /> Install to enable
                  </>
                ) : (
                  <>
                    <Bell className="h-3 w-3" /> Enable push
                  </>
                )}
              </button>
            )}
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
