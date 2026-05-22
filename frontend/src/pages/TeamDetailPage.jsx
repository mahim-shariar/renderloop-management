import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UsersRound,
  Mail,
  Lock,
  Wallet,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { useListSalariesQuery } from '@/features/finance/financeApi.js';
import Avatar from '@/components/ui/Avatar.jsx';
import Button from '@/components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.jsx';
import { Table } from '@/components/ui/Table.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import {
  useGetTeamMemberQuery,
  useDeleteTeamMemberMutation,
} from '@/features/team/teamApi.js';
import TeamFormDialog from '@/features/team/TeamFormDialog.jsx';
import StatusBadge from '@/features/projects/StatusBadge.jsx';
import DeadlineBadge from '@/features/projects/DeadlineBadge.jsx';
import { formatCents } from '@/features/projects/projectConstants.js';
import {
  TEAM_ROLE_BY_KEY,
  ROLE_BADGE_CLASS,
  AVAILABILITY_BY_KEY,
  SALARY_TYPES,
} from '@/features/team/teamConstants.js';
import { cn } from '@/lib/cn.js';

function StatCard({ label, value, hint, badge }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {(hint || badge) && (
        <CardContent>{badge || <span className="text-xs text-muted-foreground">{hint}</span>}</CardContent>
      )}
    </Card>
  );
}

function PayoutsTab({ memberId, canManage }) {
  const { data, isLoading } = useListSalariesQuery(
    { teamMemberId: memberId, limit: 200 },
    { skip: !canManage }
  );

  if (!canManage) {
    return (
      <EmptyState
        icon={Lock}
        title="Finance access required"
        description="Only admins and managers can view payout history."
      />
    );
  }
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  const items = data?.data?.items || [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No payouts yet"
        description="Salaries and per-project payouts scheduled for this member will appear here."
      />
    );
  }

  return (
    <Table
      data={items}
      pageSize={15}
      columns={[
        {
          key: 'period',
          header: 'Period / Type',
          accessor: (s) => s.period || s.type || '',
          render: (s) => (
            <div>
              <div className="font-medium text-foreground">{s.period || '—'}</div>
              <div className="text-xs capitalize text-muted-foreground">
                {(s.type || '').replace(/_/g, ' ')}
              </div>
            </div>
          ),
        },
        {
          key: 'project',
          header: 'Project',
          accessor: (s) => s.project?.title || '',
          render: (s) => s.project?.title || '—',
        },
        {
          key: 'status',
          header: 'Status',
          accessor: (s) => (s.paid ? 'paid' : 'pending'),
          render: (s) => (
            <Badge variant={s.paid ? 'success' : 'warning'}>
              {s.paid ? 'Paid' : 'Pending'}
            </Badge>
          ),
        },
        {
          key: 'date',
          header: 'Paid / Due',
          accessor: (s) =>
            new Date(s.paidAt || s.dueOn || s.createdAt || 0).getTime(),
          render: (s) => {
            const d = s.paidAt || s.dueOn;
            return d ? format(new Date(d), 'MMM d, yyyy') : '—';
          },
        },
        {
          key: 'amount',
          header: 'Amount',
          headerClassName: 'text-right',
          cellClassName: 'text-right font-medium',
          accessor: (s) => s.amountCents,
          render: (s) => formatCents(s.amountCents, s.currency),
        },
      ]}
    />
  );
}

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = useSelector(selectAuthUser);
  const canManage = authUser?.role === 'admin' || authUser?.role === 'manager';
  const isAdmin = authUser?.role === 'admin';

  const { data, isLoading, isError, error } = useGetTeamMemberQuery(id);
  const [deleteMember, { isLoading: deleting }] = useDeleteTeamMemberMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Team member not found"
        description={error?.data?.message || 'It may have been archived.'}
        action={
          <Button asChild variant="outline">
            <Link to="/team">Back to team</Link>
          </Button>
        }
      />
    );
  }

  const m = data.data.member;
  const role = TEAM_ROLE_BY_KEY[m.role];
  const av = AVAILABILITY_BY_KEY[m.availability];
  const salaryLabel = SALARY_TYPES.find((s) => s.key === m.salaryType)?.label || m.salaryType;

  const projects = m.assignedProjects || [];

  async function handleDelete() {
    try {
      await deleteMember(m._id).unwrap();
      toast.success('Team member archived');
      navigate('/team', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/team" aria-label="Back to team">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar name={m.name} src={m.avatarUrl} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{m.name}</h1>
              {role && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    ROLE_BADGE_CLASS[role.tone]
                  )}
                >
                  {role.label}
                </span>
              )}
              {av && <Badge variant={av.tone}>{av.label}</Badge>}
            </div>
            {m.email && <p className="mt-1 text-sm text-muted-foreground">{m.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {isAdmin && (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Archive
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active projects" value={m.activeProjects ?? 0} />
        <StatCard label="Delivered this month" value={m.projectsCompletedThisMonth ?? 0} />
        <StatCard
          label="Avg turnaround"
          value={m.avgTurnaroundDays != null ? `${m.avgTurnaroundDays}d` : '—'}
        />
        <StatCard
          label="Pending payouts"
          value={formatCents(m.pendingPayouts || 0, 'USD')}
          hint={`${formatCents(m.totalEarnings || 0, 'USD')} paid to date`}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{m.email || <span className="text-muted-foreground">—</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined{' '}
                    {m.joinedAt ? format(new Date(m.joinedAt), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
                {m.specialties?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-2">
                    {m.specialties.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                {m.bio && (
                  <p className="whitespace-pre-wrap pt-2 text-foreground">{m.bio}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compensation</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'Payout details are encrypted at rest and only visible to admins.'
                    : 'Rate and payment method are visible to managers. Payout details are admin-only.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {salaryLabel}: <span className="font-medium">{formatCents(m.rateCents || 0, m.currency)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">
                    Pays via {m.paymentMethod || '—'}
                  </span>
                </div>
                {isAdmin && (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                    <div className="mb-1 inline-flex items-center gap-1 font-medium text-muted-foreground">
                      <Lock className="h-3 w-3" /> Payout details (decrypted)
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-foreground">
                      {m.payoutDetails || '—'}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          {projects.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title={m.user ? 'No projects assigned yet' : 'Link a user account first'}
              description={
                m.user
                  ? 'Assign this team member from a project to see them here.'
                  : 'This team member needs to be linked to a user account before they can be assigned to projects.'
              }
            />
          ) : (
            <Table
              data={projects}
              columns={[
                {
                  key: 'title',
                  header: 'Project',
                  render: (p) => (
                    <Link to={`/projects/${p._id}`} className="font-medium text-foreground hover:underline">
                      {p.title}
                    </Link>
                  ),
                  accessor: (p) => p.title,
                },
                {
                  key: 'client',
                  header: 'Client',
                  render: (p) => p.client?.name || '—',
                  accessor: (p) => p.client?.name || '',
                },
                {
                  key: 'status',
                  header: 'Status',
                  accessor: (p) => p.status,
                  render: (p) => <StatusBadge status={p.status} />,
                },
                {
                  key: 'deadline',
                  header: 'Deadline',
                  accessor: (p) => (p.deadline ? new Date(p.deadline).getTime() : 0),
                  render: (p) => <DeadlineBadge deadline={p.deadline} status={p.status} />,
                },
              ]}
              pageSize={15}
            />
          )}
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutsTab memberId={m._id} canManage={canManage} />
        </TabsContent>
      </Tabs>

      <TeamFormDialog open={editOpen} onOpenChange={setEditOpen} member={m} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Archive team member"
        description={`Archive "${m.name}"? They will no longer appear in lists but historical assignments are preserved.`}
        confirmLabel="Archive"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
