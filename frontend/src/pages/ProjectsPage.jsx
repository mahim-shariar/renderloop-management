import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { LayoutGrid, Table as TableIcon, Plus, Film } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button.jsx';
import Select from '@/components/ui/Select.jsx';
import Input from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx';
import { cn } from '@/lib/cn.js';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useListClientsQuery } from '@/features/clients/clientsApi.js';
import { useListUsersQuery } from '@/features/users/usersApi.js';
import {
  useListProjectsQuery,
  useDeleteProjectMutation,
} from '@/features/projects/projectsApi.js';
import KanbanBoard from '@/features/projects/KanbanBoard.jsx';
import ProjectTable from '@/features/projects/ProjectTable.jsx';
import ProjectFormDialog from '@/features/projects/ProjectFormDialog.jsx';
import {
  PROJECT_PRIORITIES,
  VIDEO_TYPES,
} from '@/features/projects/projectConstants.js';

export default function ProjectsPage() {
  const user = useSelector(selectAuthUser);
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [editorFilter, setEditorFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [videoTypeFilter, setVideoTypeFilter] = useState('');

  const listParams = useMemo(
    () => ({
      search: search || undefined,
      clientId: clientFilter || undefined,
      editorId: editorFilter || undefined,
      priority: priorityFilter || undefined,
      videoType: videoTypeFilter || undefined,
      limit: 200,
    }),
    [search, clientFilter, editorFilter, priorityFilter, videoTypeFilter]
  );

  const { data, isLoading, isError, error } = useListProjectsQuery(listParams);
  // Client/team filters are staff-only — skip those fetches for editors.
  const { data: clientsData } = useListClientsQuery({ limit: 200 }, { skip: !canManage });
  const { data: usersData } = useListUsersQuery(
    { role: 'editor,manager,admin' },
    { skip: !canManage }
  );
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();

  const projects = data?.data?.items || [];
  const clients = clientsData?.data?.items || [];
  const editors = (usersData?.data?.items || []).filter(
    (u) => u.role === 'editor' || u.role === 'manager'
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteProject(confirmDelete._id).unwrap();
      toast.success('Project deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline view of every edit in production. Drag cards across statuses on the board.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-border bg-card">
            <button
              type="button"
              onClick={() => setView('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'kanban'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'table'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" /> Table
            </button>
          </div>
          {canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New project
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-2 gap-2',
          canManage ? 'md:grid-cols-5' : 'md:grid-cols-3'
        )}
      >
        <Input
          placeholder="Search title or tags"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {canManage && (
          <Select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        {canManage && (
          <Select value={editorFilter} onChange={(e) => setEditorFilter(e.target.value)}>
            <option value="">Any team member</option>
            {editors.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </Select>
        )}
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Any priority</option>
          {PROJECT_PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select value={videoTypeFilter} onChange={(e) => setVideoTypeFilter(e.target.value)}>
          <option value="">Any video type</option>
          {VIDEO_TYPES.map((v) => (
            <option key={v.key} value={v.key}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Film}
          title="Couldn't load projects"
          description={error?.data?.message || 'The server returned an error.'}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No projects yet"
          description="Spin up your first project to start tracking footage, drafts, and revisions."
          action={
            canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> New project
              </Button>
            )
          }
        />
      ) : view === 'kanban' ? (
        <KanbanBoard projects={projects} listParams={listParams} />
      ) : (
        <ProjectTable
          projects={projects}
          canManage={canManage}
          onEdit={(p) => {
            setEditing(p);
            setDialogOpen(true);
          }}
          onDelete={(p) => setConfirmDelete(p)}
        />
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete project"
        description={confirmDelete ? `Delete "${confirmDelete.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
