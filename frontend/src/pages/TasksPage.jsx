import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, CheckSquare, Search } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useListTasksQuery, TASK_PRIORITIES } from '@/features/tasks/tasksApi.js';
import TaskBoard from '@/features/tasks/TaskBoard.jsx';
import TaskDialog from '@/features/tasks/TaskDialog.jsx';

function BoardTab({ listParams, defaultAssignee, search, priority, onEdit }) {
  const { data, isLoading } = useListTasksQuery(listParams);
  const tasks = data?.data?.items || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (priority && t.priority !== priority) return false;
      if (q && !`${t.title} ${t.description || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, search, priority]);

  if (isLoading) return <Skeleton className="h-[60vh] w-full" />;
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks yet"
        description="Use “Add task” inside any column to create one — or the New task button for full details."
      />
    );
  }
  return (
    <TaskBoard
      tasks={filtered}
      listParams={listParams}
      defaultAssignee={defaultAssignee}
      onEdit={onEdit}
    />
  );
}

export default function TasksPage() {
  const user = useSelector(selectAuthUser);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('mine');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');

  function openEdit(task) {
    setEditing(task);
    setDialogOpen(true);
  }
  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Drag cards between columns. Click a card to edit, or add tasks inline.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-40">
          <option value="">Any priority</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mine">My tasks</TabsTrigger>
          <TabsTrigger value="all">Team board</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          {tab === 'mine' && (
            <BoardTab
              listParams={{ scope: 'mine' }}
              defaultAssignee={user?.id}
              search={search}
              priority={priority}
              onEdit={openEdit}
            />
          )}
        </TabsContent>
        <TabsContent value="all">
          {tab === 'all' && (
            <BoardTab
              listParams={{ scope: 'all' }}
              defaultAssignee={null}
              search={search}
              priority={priority}
              onEdit={openEdit}
            />
          )}
        </TabsContent>
      </Tabs>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
    </div>
  );
}
