import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.jsx';
import { Table } from '@/components/ui/Table.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import {
  axisProps,
  gridProps,
  ChartTooltipContent,
  LinearGradient,
} from '@/components/charts/chartUI.jsx';
import { useAnalyticsQuery } from '@/features/insights/insightsApi.js';
import { formatCents, VIDEO_TYPES } from '@/features/projects/projectConstants.js';
import { CHART_PALETTE } from '@/features/finance/financeConstants.js';

const money = (v) => formatCents(Math.round(v * 100));

function videoTypeLabel(key) {
  return VIDEO_TYPES.find((v) => v.key === key)?.label || key;
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, error } = useAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Couldn't load analytics"
        description={error?.data?.message || 'The server returned an error.'}
      />
    );
  }

  const {
    revenueGrowth,
    profitableClients,
    projectTypeBreakdown,
    teamProductivity,
    expenseVsProfit,
    revisionAnalytics,
  } = data.data;

  const growthChart = revenueGrowth.map((m) => ({ ...m, value: m.total / 100 }));
  const clientsChart = profitableClients.map((c, i) => ({
    name: c.name,
    value: c.total / 100,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));
  const typeChart = projectTypeBreakdown.map((t, i) => ({
    name: videoTypeLabel(t.videoType),
    revenue: t.revenue / 100,
    count: t.count,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));
  const profitChart = expenseVsProfit.map((m) => ({
    label: m.label,
    revenue: m.revenue / 100,
    expense: m.expense / 100,
    profit: m.profit / 100,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Revenue trends, client profitability, team productivity and revision economics.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue growth</CardTitle>
            <CardDescription>Monthly received revenue, last 12 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <LinearGradient id="anGrowth" color="#8b5cf6" from={0.4} to={0} />
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} width={48} />
                  <Tooltip
                    cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                    content={<ChartTooltipContent format={money} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#anGrowth)"
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
            <CardTitle>Expense vs profit</CardTitle>
            <CardDescription>Revenue, expense and net profit by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={4}>
                  <defs>
                    <LinearGradient id="anRev" color="#10b981" from={1} to={0.45} />
                    <LinearGradient id="anExp" color="#ef4444" from={1} to={0.45} />
                    <LinearGradient id="anPro" color="#8b5cf6" from={1} to={0.45} />
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} width={48} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                    content={<ChartTooltipContent format={money} />}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="url(#anRev)" radius={[5, 5, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="expense" name="Expense" fill="url(#anExp)" radius={[5, 5, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="profit" name="Profit" fill="url(#anPro)" radius={[5, 5, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most profitable clients</CardTitle>
            <CardDescription>Lifetime received revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            {clientsChart.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No revenue yet.</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientsChart} layout="vertical" margin={{ top: 8, right: 8, left: 24, bottom: 0 }}>
                    <CartesianGrid {...gridProps} horizontal={false} vertical />
                    <XAxis type="number" {...axisProps} />
                    <YAxis dataKey="name" type="category" {...axisProps} width={92} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                      content={<ChartTooltipContent format={money} />}
                    />
                    <Bar dataKey="value" name="Revenue" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {clientsChart.map((c, i) => (
                        <Cell key={i} fill={c.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by video type</CardTitle>
            <CardDescription>Which formats earn the most.</CardDescription>
          </CardHeader>
          <CardContent>
            {typeChart.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No projects yet.</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChart} margin={{ top: 8, right: 8, left: -8, bottom: 40 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis
                      dataKey="name"
                      {...axisProps}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis {...axisProps} width={48} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                      content={<ChartTooltipContent format={money} />}
                    />
                    <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {typeChart.map((t, i) => (
                        <Cell key={i} fill={t.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team productivity</CardTitle>
          <CardDescription>Delivered projects, on-time rate and average turnaround per editor.</CardDescription>
        </CardHeader>
        <CardContent>
          {teamProductivity.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No delivered projects yet.
            </div>
          ) : (
            <Table
              pageSize={10}
              data={teamProductivity}
              columns={[
                { key: 'name', header: 'Editor', accessor: (r) => r.name, render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
                { key: 'completed', header: 'Delivered', accessor: (r) => r.completed },
                {
                  key: 'onTimePct',
                  header: 'On-time %',
                  accessor: (r) => r.onTimePct,
                  render: (r) => (
                    <Badge variant={r.onTimePct >= 80 ? 'success' : r.onTimePct >= 50 ? 'warning' : 'destructive'}>
                      {r.onTimePct}%
                    </Badge>
                  ),
                },
                {
                  key: 'avgTurnaroundDays',
                  header: 'Avg turnaround',
                  accessor: (r) => r.avgTurnaroundDays || 0,
                  render: (r) => (r.avgTurnaroundDays != null ? `${r.avgTurnaroundDays}d` : '—'),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revision economics</CardTitle>
          <CardDescription>
            Which clients consume the most revision rounds — useful for repricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revisionAnalytics.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No project data yet.</div>
          ) : (
            <Table
              pageSize={10}
              data={revisionAnalytics}
              columns={[
                { key: 'name', header: 'Client', accessor: (r) => r.name, render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
                { key: 'projects', header: 'Projects', accessor: (r) => r.projects },
                {
                  key: 'avgRevisions',
                  header: 'Avg revisions / project',
                  accessor: (r) => r.avgRevisions,
                  render: (r) => (
                    <Badge variant={r.avgRevisions > 2 ? 'destructive' : r.avgRevisions > 1 ? 'warning' : 'muted'}>
                      {r.avgRevisions}
                    </Badge>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
