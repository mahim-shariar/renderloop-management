import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import Button from '@/components/ui/Button.jsx';
import { useListClientsQuery } from '@/features/clients/clientsApi.js';
import { useListUsersQuery } from '@/features/users/usersApi.js';
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from './projectsApi.js';
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  VIDEO_TYPES,
  ASPECT_RATIOS,
} from './projectConstants.js';
import { cn } from '@/lib/cn.js';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  client: z.string().min(1, 'Client required'),
  projectManager: z.string().optional().or(z.literal('')),
  videoType: z.string(),
  aspectRatio: z.string(),
  targetDurationSec: z.union([z.string(), z.number()]).optional(),
  platform: z.string().max(80).optional().or(z.literal('')),
  budget: z.union([z.string(), z.number()]).optional(),
  currency: z.string().length(3),
  deadline: z.string().optional().or(z.literal('')),
  priority: z.string(),
  status: z.string(),
  revisionRoundsAllowed: z.union([z.string(), z.number()]).optional(),
  finalDeliveryLink: z.string().max(500).optional().or(z.literal('')),
  thumbnailUrl: z.string().max(500).optional().or(z.literal('')),
  clientBrief: z.string().max(20000).optional().or(z.literal('')),
  internalNotes: z.string().max(20000).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  assignedEditors: z
    .array(
      z.object({
        user: z.string(),
        payout: z.union([z.string(), z.number()]).optional(),
      })
    )
    .optional(),
});

const EMPTY = {
  title: '',
  client: '',
  projectManager: '',
  videoType: 'youtube_long',
  aspectRatio: '16:9',
  targetDurationSec: '',
  platform: '',
  budget: '',
  currency: 'USD',
  deadline: '',
  priority: 'normal',
  status: 'not_started',
  revisionRoundsAllowed: '',
  finalDeliveryLink: '',
  thumbnailUrl: '',
  clientBrief: '',
  internalNotes: '',
  tags: '',
  assignedEditors: [],
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

function toFormShape(project) {
  if (!project) return EMPTY;
  return {
    ...EMPTY,
    title: project.title || '',
    client: project.client?._id || project.client || '',
    projectManager: project.projectManager?._id || project.projectManager || '',
    videoType: project.videoType || 'youtube_long',
    aspectRatio: project.aspectRatio || '16:9',
    targetDurationSec: project.targetDurationSec ?? '',
    platform: project.platform || '',
    budget: project.budgetCents != null ? (project.budgetCents / 100).toString() : '',
    currency: project.currency || 'USD',
    deadline: project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : '',
    priority: project.priority || 'normal',
    status: project.status || 'not_started',
    revisionRoundsAllowed:
      project.revisionRoundsAllowed != null ? project.revisionRoundsAllowed : '',
    finalDeliveryLink: project.finalDeliveryLink || '',
    thumbnailUrl: project.thumbnailUrl || '',
    clientBrief: project.clientBrief || '',
    internalNotes: project.internalNotes || '',
    tags: (project.tags || []).join(', '),
    assignedEditors: (project.assignedEditors || []).map((a) => ({
      user: a.user?._id || a.user,
      payout: a.payoutCents != null && a.payoutCents > 0 ? (a.payoutCents / 100).toString() : '',
    })),
  };
}

function toServerPayload(values) {
  const out = {
    title: values.title,
    client: values.client,
    projectManager: values.projectManager || null,
    videoType: values.videoType,
    aspectRatio: values.aspectRatio,
    platform: values.platform || undefined,
    currency: values.currency.toUpperCase(),
    priority: values.priority,
    status: values.status,
    finalDeliveryLink: values.finalDeliveryLink || undefined,
    thumbnailUrl: values.thumbnailUrl || undefined,
    clientBrief: values.clientBrief || undefined,
    internalNotes: values.internalNotes || undefined,
    tags: values.tags
      ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
    assignedEditors: (values.assignedEditors || []).map((a) => ({
      user: a.user,
      role: 'editor',
      payoutCents:
        a.payout !== '' && a.payout != null ? Math.round(Number(a.payout) * 100) : 0,
    })),
  };
  if (values.targetDurationSec !== '' && values.targetDurationSec != null) {
    out.targetDurationSec = Number(values.targetDurationSec);
  } else {
    out.targetDurationSec = null;
  }
  if (values.budget !== '' && values.budget != null) {
    out.budgetCents = Math.round(Number(values.budget) * 100);
  } else {
    out.budgetCents = 0;
  }
  if (values.deadline) {
    out.deadline = new Date(values.deadline).toISOString();
  } else {
    out.deadline = null;
  }
  if (values.revisionRoundsAllowed !== '' && values.revisionRoundsAllowed != null) {
    out.revisionRoundsAllowed = Number(values.revisionRoundsAllowed);
  }
  return out;
}

export default function ProjectFormDialog({ open, onOpenChange, project, defaultClientId }) {
  const isEdit = Boolean(project);
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const submitting = creating || updating;

  const { data: clientsData } = useListClientsQuery({ limit: 200 });
  const { data: usersData } = useListUsersQuery({ role: 'admin,manager,editor' });

  const clients = clientsData?.data?.items || [];
  const users = usersData?.data?.items || [];
  const editors = users.filter((u) => u.role === 'editor');
  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) {
      const initial = toFormShape(project);
      if (!project && defaultClientId) initial.client = defaultClientId;
      reset(initial);
    }
  }, [open, project, defaultClientId, reset]);

  // When client changes on a NEW project, prefill revisionRoundsAllowed from the client's default
  const watchClient = watch('client');
  useEffect(() => {
    if (!open || isEdit) return;
    const c = clients.find((c) => c._id === watchClient);
    if (c && c.defaultRevisionRounds != null) {
      setValue('revisionRoundsAllowed', c.defaultRevisionRounds);
    }
  }, [watchClient, clients, open, isEdit, setValue]);

  async function onSubmit(values) {
    const payload = toServerPayload(values);
    try {
      if (isEdit) {
        await updateProject({ id: project._id, ...payload }).unwrap();
        toast.success('Project updated');
      } else {
        await createProject(payload).unwrap();
        toast.success('Project created');
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
      title={isEdit ? 'Edit project' : 'New project'}
      description={isEdit ? 'Update project details.' : 'Add a new project to the pipeline.'}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
        <Field label="Title *" error={errors.title?.message}>
          <Input autoFocus {...register('title')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client *" error={errors.client?.message}>
            <Select {...register('client')}>
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.company ? ` · ${c.company}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project manager">
            <Select {...register('projectManager')}>
              <option value="">—</option>
              {managers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...register('status')}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select {...register('priority')}>
              {PROJECT_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Video type">
            <Select {...register('videoType')}>
              {VIDEO_TYPES.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Aspect ratio">
            <Select {...register('aspectRatio')}>
              {ASPECT_RATIOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target duration (sec)">
            <Input type="number" min={0} placeholder="e.g. 480" {...register('targetDurationSec')} />
          </Field>
          <Field label="Platform">
            <Input placeholder="e.g. YouTube" {...register('platform')} />
          </Field>
          <Field label="Budget">
            <Input type="number" min={0} step="0.01" placeholder="0.00" {...register('budget')} />
          </Field>
          <Field label="Currency">
            <Input maxLength={3} {...register('currency')} className="uppercase" />
          </Field>
          <Field label="Deadline">
            <Input type="date" {...register('deadline')} />
          </Field>
          <Field label="Revision rounds allowed">
            <Input type="number" min={0} max={20} {...register('revisionRoundsAllowed')} />
          </Field>
        </div>

        <Field label="Assigned editors & their payout">
          <Controller
            control={control}
            name="assignedEditors"
            render={({ field }) => {
              const value = field.value || [];
              const entryOf = (id) => value.find((a) => a.user === id);
              return (
                <div className="space-y-1.5">
                  {editors.length === 0 && (
                    <span className="text-xs text-muted-foreground">No editors yet.</span>
                  )}
                  {editors.map((u) => {
                    const entry = entryOf(u._id);
                    const checked = Boolean(entry);
                    return (
                      <div
                        key={u._id}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors',
                          checked ? 'border-primary/50 bg-primary/5' : 'border-border'
                        )}
                      >
                        <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={checked}
                            onChange={() => {
                              field.onChange(
                                checked
                                  ? value.filter((a) => a.user !== u._id)
                                  : [...value, { user: u._id, payout: '' }]
                              );
                            }}
                          />
                          <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>
                            {u.name}
                          </span>
                        </label>
                        {checked && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">payout</span>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0.00"
                              className="h-7 w-28 text-xs"
                              value={entry.payout}
                              onChange={(e) => {
                                field.onChange(
                                  value.map((a) =>
                                    a.user === u._id ? { ...a, payout: e.target.value } : a
                                  )
                                );
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">
                    Each editor sees only their own payout — never the client budget.
                  </p>
                </div>
              );
            }}
          />
        </Field>

        <Field label="Tags (comma-separated)">
          <Input placeholder="branded, vlog, b-roll" {...register('tags')} />
        </Field>

        <Field label="Client brief">
          <Textarea rows={4} {...register('clientBrief')} />
        </Field>
        <Field label="Internal notes">
          <Textarea rows={3} {...register('internalNotes')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Thumbnail URL">
            <Input {...register('thumbnailUrl')} />
          </Field>
          <Field label="Final delivery link">
            <Input {...register('finalDeliveryLink')} />
          </Field>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card pt-3">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
