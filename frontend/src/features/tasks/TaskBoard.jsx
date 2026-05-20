import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/ui/Input.jsx';
import { cn } from '@/lib/cn.js';
import TaskCard from './TaskCard.jsx';
import {
  TASK_STATUSES,
  useUpdateTaskMutation,
  useCreateTaskMutation,
} from './tasksApi.js';

function QuickAdd({ status, onAdd, adding }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  async function submit() {
    const t = title.trim();
    if (!t) return;
    await onAdd(t, status);
    setTitle('');
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add task
      </button>
    );
  }
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <Input
        autoFocus
        value={title}
        placeholder="Task title…"
        disabled={adding}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') {
            setOpen(false);
            setTitle('');
          }
        }}
        onBlur={() => {
          if (!title.trim()) setOpen(false);
        }}
        className="h-8 text-sm"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={adding}
          className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

function Column({ status, tasks, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key });
  return (
    <div
      className={cn(
        'flex w-[80vw] max-w-[19rem] shrink-0 flex-col rounded-xl border border-border bg-card/40 transition-colors sm:w-72',
        isOver && 'border-primary/60 bg-primary/5'
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className={cn('h-2 w-2 rounded-full', status.dot)} />
        <span className="text-sm font-semibold text-foreground">{status.label}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin"
        style={{ minHeight: '55vh', maxHeight: '68vh' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function TaskBoard({ tasks, listParams, onEdit, defaultAssignee }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [activeId, setActiveId] = useState(null);
  const [updateTask] = useUpdateTaskMutation();
  const [createTask, { isLoading: adding }] = useCreateTaskMutation();

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(TASK_STATUSES.map((s) => [s.key, []]));
    tasks.forEach((t) => map[t.status]?.push(t));
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t._id === activeId) || null;

  async function move(taskId, newStatus) {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await updateTask({ id: taskId, status: newStatus, listParams }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not move task');
    }
  }

  async function toggleDone(task) {
    const next = task.status === 'done' ? 'todo' : 'done';
    try {
      await updateTask({ id: task._id, status: next, listParams }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed');
    }
  }

  async function quickAdd(title, status) {
    try {
      await createTask({
        title,
        status,
        priority: 'normal',
        assignedTo: defaultAssignee || null,
      }).unwrap();
      toast.success('Task added');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not add task');
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={(e) => {
        setActiveId(null);
        if (e.over) move(e.active.id, e.over.id);
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {TASK_STATUSES.map((s) => (
          <Column key={s.key} status={s} tasks={byStatus[s.key]}>
            {byStatus[s.key].map((t) => (
              <TaskCard
                key={t._id}
                task={t}
                draggable
                onEdit={onEdit}
                onToggleDone={toggleDone}
              />
            ))}
            <QuickAdd status={s.key} onAdd={quickAdd} adding={adding} />
          </Column>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} dragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
