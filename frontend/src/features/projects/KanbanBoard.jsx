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
import { toast } from 'sonner';
import ProjectCard from './ProjectCard.jsx';
import { PROJECT_STATUSES, STATUS_BADGE_CLASS } from './projectConstants.js';
import { useSetProjectStatusMutation } from './projectsApi.js';
import { cn } from '@/lib/cn.js';

function Column({ status, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key });
  return (
    <div
      className={cn(
        'flex w-[80vw] max-w-[19rem] shrink-0 flex-col rounded-xl border border-border bg-card/50 transition-colors sm:w-72',
        isOver && 'border-primary/60 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
            STATUS_BADGE_CLASS[status.tone]
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin"
        style={{ minHeight: '60vh', maxHeight: '70vh' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function KanbanBoard({ projects, listParams }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [activeId, setActiveId] = useState(null);
  const [setStatus] = useSetProjectStatusMutation();

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(PROJECT_STATUSES.map((s) => [s.key, []]));
    projects.forEach((p) => {
      if (map[p.status]) map[p.status].push(p);
    });
    return map;
  }, [projects]);

  const activeProject = projects.find((p) => p._id === activeId) || null;

  async function onDragEnd(e) {
    setActiveId(null);
    if (!e.over) return;
    const projectId = e.active.id;
    const newStatus = e.over.id;
    const project = projects.find((p) => p._id === projectId);
    if (!project || project.status === newStatus) return;
    try {
      await setStatus({ id: projectId, status: newStatus, listParams }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not move project');
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {PROJECT_STATUSES.map((s) => (
          <Column key={s.key} status={s} count={byStatus[s.key].length}>
            {byStatus[s.key].map((p) => (
              <ProjectCard key={p._id} project={p} draggable />
            ))}
            {byStatus[s.key].length === 0 && (
              <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                Empty
              </div>
            )}
          </Column>
        ))}
      </div>
      <DragOverlay>
        {activeProject ? (
          <div className="w-72">
            <ProjectCard project={activeProject} dragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
