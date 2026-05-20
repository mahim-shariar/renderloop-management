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
import Button from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { useCreateExpenseMutation, useUpdateExpenseMutation } from './financeApi.js';
import {
  EXPENSE_CATEGORIES,
  SUBSCRIPTION_PRESETS,
} from './financeConstants.js';
import { cn } from '@/lib/cn.js';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  amount: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 0, 'Amount must be ≥ 0'),
  currency: z.string().length(3),
  category: z.string(),
  date: z.string().min(1, 'Date required'),
  paid: z.boolean().optional(),
  recurring: z.boolean().optional(),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

const EMPTY = {
  name: '',
  amount: '',
  currency: 'USD',
  category: 'misc',
  date: new Date().toISOString().slice(0, 10),
  paid: true,
  recurring: false,
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

function toShape(e) {
  if (!e) return EMPTY;
  return {
    ...EMPTY,
    name: e.name || '',
    amount: e.amountCents != null ? (e.amountCents / 100).toString() : '',
    currency: e.currency || 'USD',
    category: e.category || 'misc',
    date: e.date ? new Date(e.date).toISOString().slice(0, 10) : EMPTY.date,
    paid: e.paid ?? true,
    recurring: e.recurring ?? false,
    notes: e.notes || '',
  };
}

function toPayload(v) {
  return {
    name: v.name,
    amountCents: Math.round(Number(v.amount) * 100),
    currency: v.currency.toUpperCase(),
    category: v.category,
    date: new Date(v.date).toISOString(),
    paid: !!v.paid,
    recurring: !!v.recurring,
    notes: v.notes || undefined,
  };
}

export default function ExpenseDialog({ open, onOpenChange, expense }) {
  const isEdit = Boolean(expense);
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
  const submitting = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(toShape(expense));
  }, [open, expense, reset]);

  async function onSubmit(values) {
    try {
      const body = toPayload(values);
      if (isEdit) {
        await updateExpense({ id: expense._id, ...body }).unwrap();
        toast.success('Expense updated');
      } else {
        await createExpense(body).unwrap();
        toast.success('Expense recorded');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  }

  function applyPreset(preset) {
    setValue('name', preset.name);
    setValue('amount', String(preset.amount));
    setValue('category', 'software_subscription');
    setValue('recurring', preset.recurring);
    setValue('notes', preset.notes || '');
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit expense' : 'New expense'}
      description={
        isEdit
          ? 'Update an expense record.'
          : 'Log a software subscription, salary, ad spend, or other expense.'
      }
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Quick add subscription
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUBSCRIPTION_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {p.name} · ${p.amount}
                </button>
              ))}
            </div>
          </div>
        )}

        <Field label="Name *" error={errors.name?.message}>
          <Input autoFocus {...register('name')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount *" error={errors.amount?.message}>
            <Input type="number" min={0} step="0.01" {...register('amount')} />
          </Field>
          <Field label="Currency">
            <Input maxLength={3} className="uppercase" {...register('currency')} />
          </Field>
          <Field label="Category">
            <Select {...register('category')}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" {...register('date')} />
          </Field>
        </div>

        <div className="flex items-center gap-6">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register('paid')} className="h-4 w-4 rounded border-border" />
            Paid <Badge variant="muted" className="text-[10px]">vs. owed</Badge>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register('recurring')} className="h-4 w-4 rounded border-border" />
            Recurring (monthly)
          </label>
        </div>

        <Field label="Notes">
          <Textarea rows={3} {...register('notes')} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Record expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
