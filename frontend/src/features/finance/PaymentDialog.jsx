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
import { useListClientsQuery } from '@/features/clients/clientsApi.js';
import { useListProjectsQuery } from '@/features/projects/projectsApi.js';
import {
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} from './financeApi.js';
import { PAYMENT_SOURCES, PAYMENT_STATUSES } from './financeConstants.js';
import { cn } from '@/lib/cn.js';

const schema = z.object({
  amount: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 0, 'Amount must be ≥ 0'),
  currency: z.string().length(3),
  date: z.string().min(1, 'Date required'),
  source: z.string(),
  client: z.string().optional().or(z.literal('')),
  project: z.string().optional().or(z.literal('')),
  invoiceNumber: z.string().max(50).optional().or(z.literal('')),
  status: z.string(),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

const EMPTY = {
  amount: '',
  currency: 'USD',
  date: new Date().toISOString().slice(0, 10),
  source: 'client_direct',
  client: '',
  project: '',
  invoiceNumber: '',
  status: 'received',
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

function toShape(p) {
  if (!p) return EMPTY;
  return {
    ...EMPTY,
    amount: p.amountCents != null ? (p.amountCents / 100).toString() : '',
    currency: p.currency || 'USD',
    date: p.date ? new Date(p.date).toISOString().slice(0, 10) : EMPTY.date,
    source: p.source || 'client_direct',
    client: p.client?._id || p.client || '',
    project: p.project?._id || p.project || '',
    invoiceNumber: p.invoiceNumber || '',
    status: p.status || 'received',
    notes: p.notes || '',
  };
}

function toPayload(v) {
  return {
    amountCents: Math.round(Number(v.amount) * 100),
    currency: v.currency.toUpperCase(),
    date: new Date(v.date).toISOString(),
    source: v.source,
    client: v.client || null,
    project: v.project || null,
    invoiceNumber: v.invoiceNumber || undefined,
    status: v.status,
    notes: v.notes || undefined,
  };
}

export default function PaymentDialog({ open, onOpenChange, payment }) {
  const isEdit = Boolean(payment);
  const [createPayment, { isLoading: creating }] = useCreatePaymentMutation();
  const [updatePayment, { isLoading: updating }] = useUpdatePaymentMutation();
  const submitting = creating || updating;

  const { data: clientsData } = useListClientsQuery({ limit: 200 });
  const { data: projectsData } = useListProjectsQuery({ limit: 200 });
  const clients = clientsData?.data?.items || [];
  const projects = projectsData?.data?.items || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(toShape(payment));
  }, [open, payment, reset]);

  async function onSubmit(values) {
    try {
      const body = toPayload(values);
      if (isEdit) {
        await updatePayment({ id: payment._id, ...body }).unwrap();
        toast.success('Payment updated');
      } else {
        await createPayment(body).unwrap();
        toast.success('Payment recorded');
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
      title={isEdit ? 'Edit payment' : 'Record payment'}
      description={isEdit ? 'Update an income record.' : 'Log incoming revenue from a client or platform.'}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount *" error={errors.amount?.message}>
            <Input type="number" min={0} step="0.01" autoFocus {...register('amount')} />
          </Field>
          <Field label="Currency">
            <Input maxLength={3} className="uppercase" {...register('currency')} />
          </Field>
          <Field label="Date *" error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>
          <Field label="Status">
            <Select {...register('status')}>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source">
            <Select {...register('source')}>
              {PAYMENT_SOURCES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Invoice #">
            <Input {...register('invoiceNumber')} placeholder="INV-2026-001" />
          </Field>
          <Field label="Client">
            <Select {...register('client')}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
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
            {isEdit ? 'Save changes' : 'Record payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
