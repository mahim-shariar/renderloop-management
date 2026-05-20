import { useDraggable } from '@dnd-kit/core';
import { CheckCircle2, Circle, GripVertical, CalendarDays, Film } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { Badge } from '@/components/ui/Badge.jsx';
import Avatar from '@/components/ui/Avatar.jsx';
import { PRIORITY_ACCENT } from './tasksApi.js';
import { cn } from '@/lib/cn.js';

const PRIORITY_TONE = { low: 'muted', normal: 'outline', high: 'warning', urgent: 'destructive' };

export default function TaskCard({
  task,
  onEdit,
  onToggleDone,
  draggable = false,
  dragOverlay = false,
}) {
  const drag = useDraggable({ id: task._id, disabled: !draggable });
  const { attributes, listeners, setNodeRef, isDragging } = draggable
    ? drag
    : { attributes: {}, listeners: {}, setNodeRef: undefined, isDragging: false };

  const done = task.status === 'done';
  const overdue = task.dueDate && !done && isPast(new Date(task.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={dragOverlay ? { cursor: 'grabbing' } : isDragging ? { opacity: 0.4 } : undefined}
      onClick={() => onEdit?.(task)}
      className={cn(
        'group cursor-pointer rounded-lg border border-l-[3px] border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
        PRIORITY_ACCENT[task.priority] || 'border-l-border',
        dragOverlay && 'shadow-xl ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={done ? 'Mark not done' : 'Mark done'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone?.(task);
          }}
          className={cn(
            'mt-0.5 shrink-0 transition-colors',
            done ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'text-sm font-medium',
              done ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            {task.title}
          </div>
          {task.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>

        {draggable && (
          <button
            type="button"
            {...listeners}
            {...attributes}
            aria-label="Drag task"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
        {task.priority && task.priority !== 'normal' && (
          <Badge variant={PRIORITY_TONE[task.priority]} className="capitalize">
            {task.priority}
          </Badge>
        )}
        {task.dueDate && (
          <Badge variant={overdue ? 'destructive' : 'outline'}>
            <CalendarDays className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </Badge>
        )}
        {task.project && (
          <Badge variant="muted">
            <Film className="h-3 w-3" />
            <span className="max-w-[120px] truncate">{task.project.title}</span>
          </Badge>
        )}
        {task.assignedTo && (
          <span className="ml-auto">
            <Avatar size="sm" name={task.assignedTo.name} src={task.assignedTo.avatarUrl} />
          </span>
        )}
      </div>
    </div>
  );
}
