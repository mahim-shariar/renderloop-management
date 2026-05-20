import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import Button from '@/components/ui/Button.jsx';
import { useListUsersQuery } from '@/features/users/usersApi.js';
import { useListProjectsQuery } from '@/features/projects/projectsApi.js';
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from './tasksApi.js';
import { cn } from '@/lib/cn.js';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  assignedTo: z.string().optional().or(z.literal('')),
  priority: z.string(),
  status: z.string(),
  dueDate: z.string().optional().or(z.literal('')),
  project: z.string().optional().or(z.literal('')),
});

const EMPTY = {
  title: '',
  description: '',
  assignedTo: '',
  priority: 'normal',
  status: 'todo',
  dueDate: '',
  project: '',
};

function Field({ label, error, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toShape(t) {
  if (!t) return EMPTY;
  return {
    ...EMPTY,
    title: t.title || '',
    description: t.description || '',
    assignedTo: t.assignedTo?._id || t.assignedTo || '',
    priority: t.priority || 'normal',
    status: t.status || 'todo',
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '',
    project: t.project?._id || t.project || '',
  };
}

function toPayload(v) {
  return {
    title: v.title,
    description: v.description || undefined,
    assignedTo: v.assignedTo || null,
    priority: v.priority,
    status: v.status,
    dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : null,
    project: v.project || null,
  };
}

export default function TaskDialog({ open, onOpenChange, task }) {
  const isEdit = Boolean(task);
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: deleting }] = useDeleteTaskMutation();
  const submitting = creating || updating;
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    try {
      await deleteTask(task._id).unwrap();
      toast.success('Task deleted');
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  }

  const { data: usersData } = useListUsersQuery();
  const { data: projectsData } = useListProjectsQuery({ limit: 200 });
  const users = usersData?.data?.items || [];
  const projects = projectsData?.data?.items || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) {
      reset(toShape(task));
      setConfirmDelete(false);
    }
  }, [open, task, reset]);

  async function onSubmit(values) {
    try {
      const body = toPayload(values);
      if (isEdit) {
        await updateTask({ id: task._id, ...body }).unwrap();
        toast.success('Task updated');
      } else {
        await createTask(body).unwrap();
        toast.success('Task created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit task' : 'New task'}
      description={isEdit ? 'Update task details.' : 'Create a task and optionally assign it.'}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title *" error={errors.title?.message}>
          <Input autoFocus {...register('title')} />
        </Field>
        <Field label="Description">
          <Textarea rows={3} {...register('description')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assigned to">
            <Select {...register('assignedTo')}>
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project">
            <Select {...register('project')}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select {...register('priority')}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...register('status')}>
              {TASK_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date" className="sm:col-span-2">
            <Input type="date" {...register('dueDate')} />
          </Field>
        </div>
        <div className="flex items-center gap-2 pt-2">
          {isEdit && (
            <Button
              type="button"
              variant={confirmDelete ? 'destructive' : 'ghost'}
              disabled={deleting}
              onClick={() => (confirmDelete ? handleDelete() : setConfirmDelete(true))}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {confirmDelete ? 'Click to confirm' : 'Delete'}
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
