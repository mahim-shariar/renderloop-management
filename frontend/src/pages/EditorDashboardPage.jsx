import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format, isPast } from 'date-fns';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  CalendarClock,
  CheckSquare,
  Target,
  Wallet,
  CircleDollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useMyDashboardQuery } from '@/features/insights/insightsApi.js';
import StatusBadge from '@/features/projects/StatusBadge.jsx';
import DeadlineBadge from '@/features/projects/DeadlineBadge.jsx';
import { formatCents } from '@/features/projects/projectConstants.js';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <Card hover className="overflow-hidden">
      <CardContent className="relative flex items-center gap-3.5 p-4">
        <div
          className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full opacity-20 blur-2xl"
          style={{ background: accent }}
        />
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EditorDashboardPage() {
  const user = useSelector(selectAuthUser);
  const { data, isLoading, isError, error } = useMyDashboardQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Couldn't load your dashboard"
        description={error?.data?.message || 'The server returned an error.'}
      />
    );
  }

  const { cards, myProjects, myTasks } = data.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hi {user?.name?.split(' ')[0] || 'there'} — here&apos;s your progress
        </h1>
        <p className="text-sm text-muted-foreground">
          Your workload, delivery performance and payouts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} accent="#3b82f6" label="Active projects" value={cards.activeProjects} />
        <StatCard icon={CheckCircle2} accent="#10b981" label="Delivered this month" value={cards.deliveredThisMonth} />
        <StatCard icon={Clock} accent="#06b6d4" label="Avg turnaround" value={cards.avgTurnaroundDays != null ? `${cards.avgTurnaroundDays}d` : '—'} />
        <StatCard icon={Target} accent="#8b5cf6" label="On-time delivery" value={`${cards.onTimePct}%`} />
        <StatCard icon={CheckSquare} accent="#f59e0b" label="Open tasks" value={cards.openTasks} />
        <StatCard icon={CalendarClock} accent="#f59e0b" label="Deadlines (next 7d)" value={cards.upcomingDeadlines} />
        <StatCard icon={CircleDollarSign} accent="#10b981" label="Earnings this month" value={formatCents(cards.earningsThisMonth)} />
        <StatCard icon={Wallet} accent="#8b5cf6" label="Pending payout" value={formatCents(cards.pendingPayout)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My active projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myProjects.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No active projects assigned to you.
              </div>
            ) : (
              myProjects.map((p) => (
                <Link
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {p.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.client?.name || '—'}
                      </div>
                    </div>
                    {p.myPayoutCents > 0 && (
                      <span className="shrink-0 text-sm font-semibold text-emerald-400">
                        {formatCents(p.myPayoutCents)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <DeadlineBadge deadline={p.deadline} status={p.status} />
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My open tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTasks.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No open tasks. Nice.
              </div>
            ) : (
              myTasks.map((t) => {
                const overdue = t.dueDate && isPast(new Date(t.dueDate));
                return (
                  <Link
                    key={t._id}
                    to="/tasks"
                    className="block rounded-md border border-border p-2.5 transition-colors hover:bg-accent"
                  >
                    <div className="text-sm font-medium text-foreground">{t.title}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant={t.status === 'in_progress' ? 'primary' : 'muted'}>
                        {t.status.replace('_', ' ')}
                      </Badge>
                      {t.dueDate && (
                        <Badge variant={overdue ? 'destructive' : 'outline'}>
                          {format(new Date(t.dueDate), 'MMM d')}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
