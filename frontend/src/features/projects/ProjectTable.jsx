import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { Table } from '@/components/ui/Table.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '@/components/ui/Dropdown.jsx';
import StatusBadge from './StatusBadge.jsx';
import DeadlineBadge from './DeadlineBadge.jsx';
import { PRIORITY_TONE, formatCents } from './projectConstants.js';
import Avatar from '@/components/ui/Avatar.jsx';

export default function ProjectTable({ projects, onEdit, onDelete, canManage }) {
  // Editors receive projects with budgetCents stripped and myPayoutCents added.
  const editorView = projects.some((p) => p.budgetCents === undefined);
  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Project',
        render: (p) => (
          <div className="min-w-0">
            <Link
              to={`/projects/${p._id}`}
              className="block truncate font-medium text-foreground hover:underline"
            >
              {p.title}
            </Link>
            <div className="truncate text-xs text-muted-foreground">{p.client?.name || '—'}</div>
          </div>
        ),
        accessor: (p) => p.title,
      },
      {
        key: 'status',
        header: 'Status',
        accessor: (p) => p.status,
        render: (p) => <StatusBadge status={p.status} />,
      },
      {
        key: 'priority',
        header: 'Priority',
        accessor: (p) => p.priority,
        render: (p) => (
          <Badge variant={PRIORITY_TONE[p.priority] || 'outline'} className="capitalize">
            {p.priority}
          </Badge>
        ),
      },
      {
        key: 'deadline',
        header: 'Deadline',
        accessor: (p) => (p.deadline ? new Date(p.deadline).getTime() : 0),
        render: (p) => <DeadlineBadge deadline={p.deadline} status={p.status} />,
      },
      {
        key: 'team',
        header: 'Team',
        sortable: false,
        render: (p) => (
          <div className="flex -space-x-2">
            {(p.assignedEditors || []).slice(0, 4).map((a) => (
              <Avatar
                key={a._id || a.user?._id}
                size="sm"
                name={a.user?.name}
                className="border-2 border-card"
              />
            ))}
            {(p.assignedEditors || []).length === 0 && (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        key: 'budget',
        header: editorView ? 'Your payout' : 'Budget',
        accessor: (p) => (editorView ? p.myPayoutCents : p.budgetCents) || 0,
        render: (p) => {
          const cents = editorView ? p.myPayoutCents : p.budgetCents;
          return cents > 0 ? (
            <span className="text-foreground">{formatCents(cents, p.currency)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        key: 'revisions',
        header: 'Revisions',
        accessor: (p) => p.revisionRoundsUsed || 0,
        render: (p) => {
          const exceeded =
            p.revisionRoundsAllowed != null &&
            p.revisionRoundsUsed > p.revisionRoundsAllowed;
          return (
            <span
              className={
                exceeded ? 'font-medium text-destructive' : 'text-muted-foreground'
              }
            >
              {p.revisionRoundsUsed || 0}/{p.revisionRoundsAllowed ?? '—'}
            </span>
          );
        },
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
              <DropdownItem asChild>
                <Link to={`/projects/${p._id}`}>Open</Link>
              </DropdownItem>
              {canManage && (
                <DropdownItem onSelect={() => onEdit(p)}>
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownItem>
              )}
              {canManage && (
                <DropdownItem
                  onSelect={() => onDelete(p)}
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
    [canManage, onEdit, onDelete, editorView]
  );

  return <Table columns={columns} data={projects} pageSize={20} exportName="projects" />;
}
