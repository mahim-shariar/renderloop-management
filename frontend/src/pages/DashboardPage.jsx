import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  axisProps,
  gridProps,
  ChartTooltipContent,
  LinearGradient,
} from '@/components/charts/chartUI.jsx';
import { format, formatDistanceToNow } from 'date-fns';
import {
  TrendingUp,
  Wallet,
  Clock,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Activity,
  CircleDollarSign,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { cn } from '@/lib/cn.js';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useOverviewQuery } from '@/features/insights/insightsApi.js';
import { formatCents } from '@/features/projects/projectConstants.js';
import { STATUS_BY_KEY } from '@/features/projects/projectConstants.js';
import { CHART_PALETTE } from '@/features/finance/financeConstants.js';

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

export default function DashboardPage() {
  const user = useSelector(selectAuthUser);
  const { data, isLoading, isError, error } = useOverviewQuery();

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
        icon={Activity}
        title="Couldn't load dashboard"
        description={error?.data?.message || 'The server returned an error.'}
      />
    );
  }

  const { cards, revenueByMonth, statusBreakdown, topClients, activity, projectsAtRisk } = data.data;

  const revenueChart = revenueByMonth.map((m) => ({ ...m, value: m.total / 100 }));
  const statusChart = statusBreakdown
    .filter((s) => s.count > 0)
    .map((s, i) => ({
      name: STATUS_BY_KEY[s.status]?.label || s.status,
      value: s.count,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Good to see you, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s how the studio is doing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CircleDollarSign} accent="#10b981" label="Revenue (this month)" value={formatCents(cards.revenueThisMonth)} />
        <StatCard icon={TrendingUp} accent={cards.netProfit >= 0 ? '#8b5cf6' : '#ef4444'} label="Net profit (this month)" value={formatCents(cards.netProfit)} />
        <StatCard icon={Wallet} accent="#f59e0b" label="Pending payments" value={formatCents(cards.pendingPayments)} />
        <StatCard icon={CircleDollarSign} accent="#ef4444" label="Salary due" value={formatCents(cards.salaryDueThisMonth)} />
        <StatCard icon={Briefcase} accent="#3b82f6" label="Active projects" value={cards.activeProjects} />
        <StatCard icon={CheckCircle2} accent="#10b981" label="Delivered this month" value={cards.deliveredThisMonth} />
        <StatCard icon={Clock} accent="#06b6d4" label="Avg turnaround" value={cards.avgTurnaroundDays != null ? `${cards.avgTurnaroundDays}d` : '—'} />
        <StatCard icon={CalendarClock} accent="#f59e0b" label="Deadlines (next 7d)" value={cards.upcomingDeadlines} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue — last 12 months</CardTitle>
            <CardDescription>Received payments by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <LinearGradient id="dashRevenue" color="#8b5cf6" from={0.4} to={0} />
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} width={48} />
                  <Tooltip
                    cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent format={(v) => formatCents(Math.round(v * 100))} />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#dashRevenue)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChart.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No projects yet.</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="none"
                    >
                      {statusChart.map((s, i) => (
                        <Cell key={i} fill={s.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top clients by revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topClients.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No revenue yet.</div>
            ) : (
              topClients.map((c, i) => (
                <Link
                  key={c.clientId}
                  to={`/clients/${c.clientId}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                      i === 0
                        ? 'bg-amber-400/15 text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatCents(c.total)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Projects at risk
              {projectsAtRisk.length > 0 && (
                <Badge variant="destructive">{projectsAtRisk.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Overdue or over revision budget.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {projectsAtRisk.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nothing at risk. Nice.
              </div>
            ) : (
              projectsAtRisk.slice(0, 6).map((p) => (
                <Link
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className="block rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {p.title}
                    </span>
                  </div>
                  {(p.overdue || p.revisionsExceeded) && (
                    <div className="mt-1.5 flex flex-wrap gap-1 pl-4">
                      {p.overdue && <Badge variant="destructive">overdue</Badge>}
                      {p.revisionsExceeded && (
                        <Badge variant="warning">
                          <AlertTriangle className="h-3 w-3" /> revisions
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {activity.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No activity yet.</div>
            ) : (
              activity.map((a, i) => (
                <Link
                  key={i}
                  to={a.link}
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      a.type === 'payment' ? 'bg-emerald-400' : 'bg-blue-400'
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{a.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.date), { addSuffix: true })}
                    </span>
                  </span>
                  {a.amountCents != null && (
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-400">
                      {formatCents(a.amountCents, a.currency)}
                    </span>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
