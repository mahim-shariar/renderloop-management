import { Link } from 'react-router-dom';
import { AlertTriangle, Film, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import Avatar from '@/components/ui/Avatar.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import DeadlineBadge from './DeadlineBadge.jsx';
import { formatCents, PRIORITY_TONE } from './projectConstants.js';
import { cn } from '@/lib/cn.js';

export default function ProjectCard({ project, draggable = false, dragOverlay = false }) {
  const draggableState = useDraggable({ id: project._id, disabled: !draggable });
  const { attributes, listeners, setNodeRef, isDragging } = draggable
    ? draggableState
    : { attributes: {}, listeners: {}, setNodeRef: undefined, isDragging: false };

  const exceeded =
    project.revisionRoundsAllowed != null &&
    project.revisionRoundsUsed > project.revisionRoundsAllowed;

  return (
    <div
      ref={setNodeRef}
      style={
        dragOverlay
          ? { cursor: 'grabbing' }
          : isDragging
          ? { opacity: 0.4 }
          : undefined
      }
      className={cn(
        'group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow',
        dragOverlay && 'shadow-xl ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <button
            type="button"
            {...listeners}
            {...attributes}
            aria-label="Drag project"
            className="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Link
            to={`/projects/${project._id}`}
            className="block truncate text-sm font-semibold text-foreground hover:underline"
            title={project.title}
          >
            {project.title}
          </Link>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {project.client?.name || '—'}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DeadlineBadge deadline={project.deadline} status={project.status} />
        {project.priority && project.priority !== 'normal' && (
          <Badge variant={PRIORITY_TONE[project.priority] || 'outline'}>{project.priority}</Badge>
        )}
        {project.videoType && (
          <Badge variant="outline" className="capitalize">
            <Film className="h-3 w-3" /> {project.videoType.replace(/_/g, ' ')}
          </Badge>
        )}
        {exceeded && (
          <Badge variant="destructive" title="Revision rounds exceeded">
            <AlertTriangle className="h-3 w-3" />
            R+{project.revisionRoundsUsed - project.revisionRoundsAllowed}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex -space-x-2">
          {(project.assignedEditors || []).slice(0, 3).map((a) => (
            <Avatar
              key={a._id || a.user?._id}
              size="sm"
              name={a.user?.name}
              className="border-2 border-card"
            />
          ))}
          {(project.assignedEditors || []).length > 3 && (
            <div className="z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
              +{project.assignedEditors.length - 3}
            </div>
          )}
        </div>
        {project.budgetCents != null
          ? project.budgetCents > 0 && (
              <div>{formatCents(project.budgetCents, project.currency)}</div>
            )
          : project.myPayoutCents > 0 && (
              <div title="Your payout" className="text-emerald-400">
                {formatCents(project.myPayoutCents, project.currency)}
              </div>
            )}
      </div>
    </div>
  );
}
