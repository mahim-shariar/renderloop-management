import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { CURRENCIES } from '@/lib/currency.js';
import Button from '@/components/ui/Button.jsx';
import { useListTeamQuery } from '@/features/team/teamApi.js';
import { useListProjectsQuery } from '@/features/projects/projectsApi.js';
import { useCreateSalaryMutation, useUpdateSalaryMutation } from './financeApi.js';
import { cn } from '@/lib/cn.js';

const schema = z.object({
  teamMember: z.string().min(1, 'Team member required'),
  type: z.string(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM').optional().or(z.literal('')),
  project: z.string().optional().or(z.literal('')),
  amount: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 0, 'Amount must be ≥ 0'),
  currency: z.string().length(3),
  dueOn: z.string().optional().or(z.literal('')),
  paid: z.boolean().optional(),
  transactionRef: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

const EMPTY = {
  teamMember: '',
  type: 'monthly',
  period: new Date().toISOString().slice(0, 7),
  project: '',
  amount: '',
  currency: 'USD',
  dueOn: '',
  paid: false,
  transactionRef: '',
  notes: '',
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

function toShape(s) {
  if (!s) return EMPTY;
  return {
    ...EMPTY,
    teamMember: s.teamMember?._id || s.teamMember || '',
    type: s.type || 'monthly',
    period: s.period || EMPTY.period,
    project: s.project?._id || s.project || '',
    amount: s.amountCents != null ? (s.amountCents / 100).toString() : '',
    currency: s.currency || 'USD',
    dueOn: s.dueOn ? new Date(s.dueOn).toISOString().slice(0, 10) : '',
    paid: s.paid ?? false,
    transactionRef: s.transactionRef || '',
    notes: s.notes || '',
  };
}

function toPayload(v) {
  return {
    teamMember: v.teamMember,
    type: v.type,
    period: v.period || undefined,
    project: v.project || null,
    amountCents: Math.round(Number(v.amount) * 100),
    currency: v.currency.toUpperCase(),
    dueOn: v.dueOn ? new Date(v.dueOn).toISOString() : null,
    paid: !!v.paid,
    transactionRef: v.transactionRef || undefined,
    notes: v.notes || undefined,
  };
}

export default function PayoutDialog({ open, onOpenChange, salary }) {
  const isEdit = Boolean(salary);
  const [createSalary, { isLoading: creating }] = useCreateSalaryMutation();
  const [updateSalary, { isLoading: updating }] = useUpdateSalaryMutation();
  const submitting = creating || updating;

  // Fetch fresh selector data each time the dialog opens.
  const { data: teamData } = useListTeamQuery(
    { limit: 500 },
    { skip: !open, refetchOnMountOrArgChange: true }
  );
  const { data: projData } = useListProjectsQuery(
    { limit: 200 },
    { skip: !open, refetchOnMountOrArgChange: true }
  );
  const team = teamData?.data?.items || [];
  const projects = projData?.data?.items || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(toShape(salary));
  }, [open, salary, reset]);

  async function onSubmit(values) {
    try {
      const body = toPayload(values);
      if (isEdit) {
        await updateSalary({ id: salary._id, ...body }).unwrap();
        toast.success('Payout updated');
      } else {
        await createSalary(body).unwrap();
        toast.success('Payout scheduled');
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
      title={isEdit ? 'Edit payout' : 'Schedule payout'}
      description="Track a salary or per-project payout for a team member."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Team member *" error={errors.teamMember?.message}>
            <Select autoFocus {...register('teamMember')}>
              <option value="">
                {team.length ? 'Select…' : 'No team members yet — add one first'}
              </option>
              {team.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select {...register('type')}>
              <option value="monthly">Monthly</option>
              <option value="per_project">Per project</option>
            </Select>
          </Field>
          <Field label="Period (YYYY-MM)" error={errors.period?.message}>
            <Input placeholder="2026-05" {...register('period')} />
          </Field>
          <Field label="Project (if per-project)">
            <Select {...register('project')}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount *" error={errors.amount?.message}>
            <Input type="number" min={0} step="0.01" {...register('amount')} />
          </Field>
          <Field label="Currency">
            <Select {...register('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due on">
            <Input type="date" {...register('dueOn')} />
          </Field>
          <Field label="Transaction reference">
            <Input placeholder="Wise transfer #..." {...register('transactionRef')} />
          </Field>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" {...register('paid')} className="h-4 w-4 rounded border-border" />
          Mark as already paid
        </label>
        <Field label="Notes">
          <Textarea rows={3} {...register('notes')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Schedule payout'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
