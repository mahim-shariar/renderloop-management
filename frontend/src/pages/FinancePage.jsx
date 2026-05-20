import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreHorizontal, Pencil, Trash2, Wallet, CheckCircle2, Filter, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { axisProps, gridProps, ChartTooltipContent } from '@/components/charts/chartUI.jsx';
import Button from '@/components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.jsx';
import { Table } from '@/components/ui/Table.jsx';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '@/components/ui/Dropdown.jsx';
import Avatar from '@/components/ui/Avatar.jsx';
import Select from '@/components/ui/Select.jsx';
import { formatCents } from '@/features/projects/projectConstants.js';
import {
  useListPaymentsQuery,
  usePaymentsSummaryQuery,
  useDeletePaymentMutation,
  useListExpensesQuery,
  useExpensesSummaryQuery,
  useDeleteExpenseMutation,
  useUpdateExpenseMutation,
  useListSalariesQuery,
  useSalariesSummaryQuery,
  useDeleteSalaryMutation,
  useMarkSalaryPaidMutation,
} from '@/features/finance/financeApi.js';
import SummaryCard from '@/features/finance/SummaryCard.jsx';
import PaymentDialog from '@/features/finance/PaymentDialog.jsx';
import ExpenseDialog from '@/features/finance/ExpenseDialog.jsx';
import PayoutDialog from '@/features/finance/PayoutDialog.jsx';
import {
  PAYMENT_SOURCES,
  PAYMENT_STATUSES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_BY_KEY,
  CHART_PALETTE,
} from '@/features/finance/financeConstants.js';

function PaymentStatusBadge({ status }) {
  const s = PAYMENT_STATUSES.find((x) => x.key === status);
  if (!s) return null;
  return <Badge variant={s.tone}>{s.label}</Badge>;
}

function sourceLabel(key) {
  return PAYMENT_SOURCES.find((s) => s.key === key)?.label || key;
}

// ----------------- Income tab -----------------

function IncomeTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const { data: summaryData } = usePaymentsSummaryQuery();
  const { data, isLoading } = useListPaymentsQuery({
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
  });
  const [deletePayment, { isLoading: deleting }] = useDeletePaymentMutation();

  const summary = summaryData?.data;
  const items = data?.data?.items || [];

  const sourceChart = (summary?.bySource || []).map((s, i) => ({
    name: sourceLabel(s.source),
    value: s.total / 100,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="This month"
          valueCents={summary?.thisMonth?.total}
          compareCents={summary?.lastMonth?.total}
          compareLabel="last month"
        />
        <SummaryCard label="Last month" valueCents={summary?.lastMonth?.total} hint={`${summary?.lastMonth?.count || 0} payments`} />
        <SummaryCard
          label="Year to date"
          valueCents={summary?.thisYearToDate?.total}
          compareCents={summary?.lastYearSamePeriod?.total}
          compareLabel="same period LY"
        />
        <SummaryCard label="Pending" valueCents={summary?.pending?.total} hint={`${summary?.pending?.count || 0} pending`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Income records — filter by status or source.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
                  <option value="">All statuses</option>
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </Select>
                <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-36">
                  <option value="">All sources</option>
                  {PAYMENT_SOURCES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </Select>
                <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4" /> Record
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : items.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No payments yet"
                description="Record your first incoming payment to start tracking revenue."
              />
            ) : (
              <Table
                pageSize={15}
                data={items}
                exportName="income"
                columns={[
                  {
                    key: 'date',
                    header: 'Date',
                    accessor: (p) => (p.date ? new Date(p.date).getTime() : 0),
                    exportAccessor: (p) => format(new Date(p.date), 'yyyy-MM-dd'),
                    render: (p) => format(new Date(p.date), 'MMM d, yyyy'),
                  },
                  {
                    key: 'amount',
                    header: 'Amount',
                    accessor: (p) => p.amountCents || 0,
                    exportAccessor: (p) => (p.amountCents || 0) / 100,
                    render: (p) => <span className="font-medium text-foreground">{formatCents(p.amountCents, p.currency)}</span>,
                  },
                  {
                    key: 'source',
                    header: 'Source',
                    accessor: (p) => p.source,
                    render: (p) => <Badge variant="outline" className="capitalize">{sourceLabel(p.source)}</Badge>,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    accessor: (p) => p.status,
                    render: (p) => <PaymentStatusBadge status={p.status} />,
                  },
                  {
                    key: 'client',
                    header: 'Client',
                    render: (p) => p.client?.name || <span className="text-muted-foreground">—</span>,
                    accessor: (p) => p.client?.name || '',
                  },
                  {
                    key: 'project',
                    header: 'Project',
                    render: (p) =>
                      p.project ? (
                        <Link to={`/projects/${p.project._id}`} className="text-foreground hover:underline">
                          {p.project.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      ),
                  },
                  {
                    key: 'invoice',
                    header: 'Invoice',
                    render: (p) => p.invoiceNumber || <span className="text-muted-foreground">—</span>,
                  },
                  {
                    key: 'actions',
                    header: '',
                    sortable: false,
                    cellClassName: 'text-right',
                    render: (p) => (
                      <Dropdown>
                        <DropdownTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownContent>
                          <DropdownItem onSelect={() => { setEditing(p); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownItem>
                          <DropdownItem
                            onSelect={() => setConfirmDelete(p)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    ),
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By source (YTD)</CardTitle>
            <CardDescription>Where this year&apos;s revenue came from.</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceChart.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No revenue yet.</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="none"
                    >
                      {sourceChart.map((s, i) => (
                        <Cell key={i} fill={s.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTooltipContent
                          format={(v) => formatCents(Math.round(v * 100))}
                        />
                      }
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} payment={editing} />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete payment"
        description={confirmDelete ? `Delete ${formatCents(confirmDelete.amountCents, confirmDelete.currency)} payment? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={async () => {
          try {
            await deletePayment(confirmDelete._id).unwrap();
            toast.success('Payment deleted');
            setConfirmDelete(null);
          } catch (err) {
            toast.error(err?.data?.message || 'Delete failed');
          }
        }}
      />
    </div>
  );
}

// ----------------- Expenses tab -----------------

function ExpensesTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: summaryData } = useExpensesSummaryQuery();
  const { data, isLoading } = useListExpensesQuery({ category: categoryFilter || undefined });
  const [deleteExpense, { isLoading: deleting }] = useDeleteExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();

  const summary = summaryData?.data;
  const items = data?.data?.items || [];

  const categoryChart = (summary?.byCategory || []).map((c, i) => ({
    name: EXPENSE_CATEGORY_BY_KEY[c.category]?.label || c.category,
    total: c.total / 100,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="This month"
          valueCents={summary?.thisMonth?.total}
          compareCents={summary?.lastMonth?.total}
          compareLabel="last month"
        />
        <SummaryCard label="Last month" valueCents={summary?.lastMonth?.total} hint={`${summary?.lastMonth?.count || 0} expenses`} />
        <SummaryCard label="Year to date" valueCents={summary?.thisYearToDate?.total} hint={`${summary?.thisYearToDate?.count || 0} entries`} />
        <SummaryCard label="Unpaid" valueCents={summary?.unpaid?.total} hint={`${summary?.unpaid?.count || 0} pending`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Software, salaries, ad spend and everything else.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-44">
                  <option value="">All categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4" /> Record
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : items.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No expenses yet"
                description="Add your first expense — Adobe CC, Frame.io and other common subs are one click away in the form."
              />
            ) : (
              <Table
                pageSize={15}
                data={items}
                exportName="expenses"
                columns={[
                  {
                    key: 'date',
                    header: 'Date',
                    accessor: (e) => (e.date ? new Date(e.date).getTime() : 0),
                    exportAccessor: (e) => format(new Date(e.date), 'yyyy-MM-dd'),
                    render: (e) => format(new Date(e.date), 'MMM d, yyyy'),
                  },
                  {
                    key: 'name',
                    header: 'Name',
                    render: (e) => (
                      <div>
                        <div className="font-medium text-foreground">{e.name}</div>
                        {e.recurring && (
                          <Badge variant="outline" className="mt-0.5 text-[10px]">
                            recurring
                          </Badge>
                        )}
                      </div>
                    ),
                    accessor: (e) => e.name,
                  },
                  {
                    key: 'category',
                    header: 'Category',
                    accessor: (e) => e.category,
                    render: (e) => (
                      <Badge variant="outline">{EXPENSE_CATEGORY_BY_KEY[e.category]?.label || e.category}</Badge>
                    ),
                  },
                  {
                    key: 'amount',
                    header: 'Amount',
                    accessor: (e) => e.amountCents || 0,
                    render: (e) => <span className="font-medium">{formatCents(e.amountCents, e.currency)}</span>,
                  },
                  {
                    key: 'paid',
                    header: 'Status',
                    accessor: (e) => (e.paid ? 1 : 0),
                    render: (e) =>
                      e.paid ? <Badge variant="success">paid</Badge> : <Badge variant="warning">owed</Badge>,
                  },
                  {
                    key: 'actions',
                    header: '',
                    sortable: false,
                    cellClassName: 'text-right',
                    render: (e) => (
                      <Dropdown>
                        <DropdownTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownContent>
                          {!e.paid && (
                            <DropdownItem
                              onSelect={async () => {
                                try {
                                  await updateExpense({ id: e._id, paid: true }).unwrap();
                                  toast.success('Marked paid');
                                } catch (err) {
                                  toast.error(err?.data?.message || 'Update failed');
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" /> Mark paid
                            </DropdownItem>
                          )}
                          <DropdownItem onSelect={() => { setEditing(e); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownItem>
                          <DropdownItem
                            onSelect={() => setConfirmDelete(e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    ),
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By category (YTD)</CardTitle>
            <CardDescription>Where the money goes.</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChart.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No expenses yet.</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis
                      dataKey="name"
                      {...axisProps}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis {...axisProps} width={48} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                      content={
                        <ChartTooltipContent
                          format={(v) => formatCents(Math.round(v * 100))}
                        />
                      }
                    />
                    <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {categoryChart.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete expense"
        description={confirmDelete ? `Delete "${confirmDelete.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={async () => {
          try {
            await deleteExpense(confirmDelete._id).unwrap();
            toast.success('Expense deleted');
            setConfirmDelete(null);
          } catch (err) {
            toast.error(err?.data?.message || 'Delete failed');
          }
        }}
      />
    </div>
  );
}

// ----------------- Payouts tab -----------------

function PayoutsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmPaid, setConfirmPaid] = useState(null);

  const { data: summaryData } = useSalariesSummaryQuery();
  const { data, isLoading } = useListSalariesQuery();
  const [deleteSalary, { isLoading: deleting }] = useDeleteSalaryMutation();
  const [markPaid, { isLoading: marking }] = useMarkSalaryPaidMutation();

  const summary = summaryData?.data;
  const items = data?.data?.items || [];

  const pending = items.filter((s) => !s.paid);
  const paid = items.filter((s) => s.paid);

  const rowActions = (s) => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Row actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownContent>
        {!s.paid && (
          <DropdownItem onSelect={() => setConfirmPaid(s)}>
            <CheckCircle2 className="h-4 w-4" /> Mark paid
          </DropdownItem>
        )}
        <DropdownItem onSelect={() => { setEditing(s); setDialogOpen(true); }}>
          <Pencil className="h-4 w-4" /> Edit
        </DropdownItem>
        <DropdownItem
          onSelect={() => setConfirmDelete(s)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );

  const renderRow = (s, options = {}) => (
    <tr key={s._id} className="border-b border-border last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm" name={s.teamMember?.name} />
          <div>
            <Link to={s.teamMember ? `/team/${s.teamMember._id}` : '#'} className="font-medium text-foreground hover:underline">
              {s.teamMember?.name || '—'}
            </Link>
            <div className="text-xs capitalize text-muted-foreground">{s.teamMember?.role}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 capitalize text-sm text-muted-foreground">{s.type.replace(/_/g, ' ')}</td>
      <td className="px-4 py-3 text-sm">{s.period || (s.project?.title ? <Link to={`/projects/${s.project._id}`} className="hover:underline">{s.project.title}</Link> : '—')}</td>
      <td className="px-4 py-3 text-sm font-medium text-foreground">{formatCents(s.amountCents, s.currency)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {s.paid
          ? s.paidAt && format(new Date(s.paidAt), 'MMM d, yyyy')
          : s.dueOn
          ? `due ${format(new Date(s.dueOn), 'MMM d')}`
          : '—'}
      </td>
      <td className="px-4 py-3 text-right">{rowActions(s)}</td>
    </tr>
  );

  const renderCard = (s) => (
    <div key={s._id} className="rounded-xl border border-border bg-card p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm" name={s.teamMember?.name} />
          <div>
            <Link
              to={s.teamMember ? `/team/${s.teamMember._id}` : '#'}
              className="text-sm font-medium text-foreground hover:underline"
            >
              {s.teamMember?.name || '—'}
            </Link>
            <div className="text-xs capitalize text-muted-foreground">
              {s.teamMember?.role}
            </div>
          </div>
        </div>
        {rowActions(s)}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2.5 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Amount</div>
          <div className="font-medium text-foreground">
            {formatCents(s.amountCents, s.currency)}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Type</div>
          <div className="capitalize text-muted-foreground">{s.type.replace(/_/g, ' ')}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Period / Project
          </div>
          <div className="text-foreground">
            {s.period || s.project?.title || '—'}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {s.paid ? 'Paid on' : 'Due'}
          </div>
          <div className="text-muted-foreground">
            {s.paid
              ? (s.paidAt && format(new Date(s.paidAt), 'MMM d, yyyy')) || '—'
              : s.dueOn
              ? format(new Date(s.dueOn), 'MMM d')
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Pending payouts" valueCents={summary?.pending?.total} hint={`${summary?.pending?.count || 0} owed`} />
        <SummaryCard label="Paid this month" valueCents={summary?.paidThisMonth?.total} hint={`${summary?.paidThisMonth?.count || 0} payouts`} />
        <Card className="flex items-center justify-end p-5">
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Schedule payout
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pending
            {pending.length > 0 && <Badge variant="warning">{pending.length}</Badge>}
          </CardTitle>
          <CardDescription>Owed to your team. Mark paid when the transfer goes through.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : pending.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              All caught up. No pending payouts.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto scrollbar-thin rounded-md border border-border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Team member</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Type</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Period / Project</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Amount</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Due</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>{pending.map((s) => renderRow(s))}</tbody>
                </table>
              </div>
              <div className="space-y-2.5 md:hidden">{pending.map(renderCard)}</div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paid history</CardTitle>
        </CardHeader>
        <CardContent>
          {paid.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No paid payouts yet.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto scrollbar-thin rounded-md border border-border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Team member</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Type</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Period / Project</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Amount</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left font-medium">Paid on</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>{paid.map((s) => renderRow(s))}</tbody>
                </table>
              </div>
              <div className="space-y-2.5 md:hidden">{paid.map(renderCard)}</div>
            </>
          )}
        </CardContent>
      </Card>

      <PayoutDialog open={dialogOpen} onOpenChange={setDialogOpen} salary={editing} />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete payout"
        description={confirmDelete ? `Delete ${formatCents(confirmDelete.amountCents, confirmDelete.currency)} payout? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={async () => {
          try {
            await deleteSalary(confirmDelete._id).unwrap();
            toast.success('Payout deleted');
            setConfirmDelete(null);
          } catch (err) {
            toast.error(err?.data?.message || 'Delete failed');
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(confirmPaid)}
        onOpenChange={(o) => !o && setConfirmPaid(null)}
        title="Mark payout as paid"
        description={
          confirmPaid
            ? `Confirm ${formatCents(confirmPaid.amountCents, confirmPaid.currency)} paid to ${confirmPaid.teamMember?.name || 'team member'}?`
            : ''
        }
        confirmLabel="Mark paid"
        loading={marking}
        onConfirm={async () => {
          try {
            await markPaid({ id: confirmPaid._id }).unwrap();
            toast.success('Marked paid');
            setConfirmPaid(null);
          } catch (err) {
            toast.error(err?.data?.message || 'Could not mark paid');
          }
        }}
      />
    </div>
  );
}

// ----------------- Page wrapper -----------------

export default function FinancePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Finance</h1>
        <p className="text-sm text-muted-foreground">
          Income, expenses, team payouts and invoices.
        </p>
      </div>

      <Tabs defaultValue="income">
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <IncomeTab />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab />
        </TabsContent>
        <TabsContent value="payouts">
          <PayoutsTab />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesIndex />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvoicesIndex() {
  const { data, isLoading } = useListPaymentsQuery({ limit: 500 });
  const items = (data?.data?.items || []).filter((p) => p.project);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate an invoice</CardTitle>
        <CardDescription>
          Pick a project to generate a printable PDF. Auto-fills client info, line item, and total
          from project budget.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Open any project and click the invoice action — or paste a project URL like{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/finance/invoice/&lt;projectId&gt;</code>.
          </p>
        )}
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto mb-2 h-5 w-5" />
          From any project, open the actions menu and pick &ldquo;Generate invoice&rdquo; (Phase 7
          shipped the route; add the menu item in Phase 10 polish).
        </div>
      </CardContent>
    </Card>
  );
}
