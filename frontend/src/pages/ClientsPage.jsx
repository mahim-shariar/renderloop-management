import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Button from '@/components/ui/Button.jsx';
import { Table } from '@/components/ui/Table.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '@/components/ui/Dropdown.jsx';
import Select from '@/components/ui/Select.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import {
  useListClientsQuery,
  useDeleteClientMutation,
  CLIENT_STATUSES,
} from '@/features/clients/clientsApi.js';
import ClientFormDialog from '@/features/clients/ClientFormDialog.jsx';

function StatusBadge({ status }) {
  const variant =
    status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'muted';
  return <Badge variant={variant}>{status}</Badge>;
}

export default function ClientsPage() {
  const user = useSelector(selectAuthUser);
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading, isError, error } = useListClientsQuery({
    status: statusFilter || undefined,
    limit: 100,
  });
  const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation();

  const clients = data?.data?.items ?? [];

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (c) => (
          <div>
            <Link to={`/clients/${c._id}`} className="font-medium text-foreground hover:underline">
              {c.name}
            </Link>
            {c.company && <div className="text-xs text-muted-foreground">{c.company}</div>}
          </div>
        ),
        accessor: (c) => c.name,
      },
      {
        key: 'email',
        header: 'Email',
        render: (c) => c.email || <span className="text-muted-foreground">—</span>,
      },
      {
        key: 'country',
        header: 'Country',
        render: (c) => c.country || <span className="text-muted-foreground">—</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (c) => <StatusBadge status={c.status} />,
      },
      {
        key: 'lastContactedAt',
        header: 'Last contact',
        accessor: (c) => (c.lastContactedAt ? new Date(c.lastContactedAt).getTime() : 0),
        render: (c) =>
          c.lastContactedAt ? (
            format(new Date(c.lastContactedAt), 'MMM d, yyyy')
          ) : (
            <span className="text-muted-foreground">never</span>
          ),
      },
      {
        key: 'actions',
        header: '',
        sortable: false,
        cellClassName: 'text-right',
        render: (c) => (
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Row actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem asChild>
                <Link to={`/clients/${c._id}`}>Open</Link>
              </DropdownItem>
              {canManage && (
                <DropdownItem
                  onSelect={() => {
                    setEditing(c);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownItem>
              )}
              {canDelete && (
                <DropdownItem
                  onSelect={() => setConfirmDelete(c)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownItem>
              )}
            </DropdownContent>
          </Dropdown>
        ),
      },
    ],
    [canManage, canDelete]
  );

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteClient(confirmDelete._id).unwrap();
      toast.success('Client deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client roster and communication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          >
            <option value="">All statuses</option>
            {CLIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New client
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Users}
          title="Couldn't load clients"
          description={error?.data?.message || 'The server returned an error.'}
        />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking projects, payments, and notes."
          action={
            canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> New client
              </Button>
            )
          }
        />
      ) : (
        <Table columns={columns} data={clients} pageSize={15} exportName="clients" />
      )}

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete client"
        description={
          confirmDelete
            ? `Delete "${confirmDelete.name}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
