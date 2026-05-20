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
import { cn } from '@/lib/cn.js';
import {
  CLIENT_STATUSES,
  PAYMENT_METHODS,
  SOCIAL_PLATFORMS,
  useCreateClientMutation,
  useUpdateClientMutation,
} from './clientsApi.js';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(120),
  company: z.string().max(120).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  country: z.string().max(80).optional().or(z.literal('')),
  timezone: z.string().max(80).optional().or(z.literal('')),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().or(z.literal('')),
  status: z.enum(CLIENT_STATUSES),
  defaultRevisionRounds: z
    .union([z.number().int().min(0).max(20), z.string().regex(/^\d+$/)])
    .transform((v) => Number(v)),
  preferredPlatforms: z.array(z.enum(SOCIAL_PLATFORMS)),
  notes: z.string().max(5000).optional().or(z.literal('')),
  handles: z
    .object({
      discord: z.string().max(80).optional().or(z.literal('')),
      slack: z.string().max(80).optional().or(z.literal('')),
      whatsapp: z.string().max(80).optional().or(z.literal('')),
    })
    .optional(),
});

const EMPTY = {
  name: '',
  company: '',
  email: '',
  phone: '',
  country: '',
  timezone: '',
  paymentMethod: '',
  status: 'active',
  defaultRevisionRounds: 2,
  preferredPlatforms: [],
  notes: '',
  handles: { discord: '', slack: '', whatsapp: '' },
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

export default function ClientFormDialog({ open, onOpenChange, client }) {
  const isEdit = Boolean(client);
  const [createClient, { isLoading: creating }] = useCreateClientMutation();
  const [updateClient, { isLoading: updating }] = useUpdateClientMutation();
  const isSubmitting = creating || updating;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              ...EMPTY,
              ...client,
              paymentMethod: client.paymentMethod || '',
              handles: { ...EMPTY.handles, ...(client.handles || {}) },
              preferredPlatforms: client.preferredPlatforms || [],
              defaultRevisionRounds: client.defaultRevisionRounds ?? 2,
            }
          : EMPTY
      );
    }
  }, [client, open, reset]);

  async function onSubmit(values) {
    const payload = {
      ...values,
      paymentMethod: values.paymentMethod || undefined,
      email: values.email || undefined,
    };
    try {
      if (isEdit) {
        await updateClient({ id: client._id, ...payload }).unwrap();
        toast.success('Client updated');
      } else {
        await createClient(payload).unwrap();
        toast.success('Client created');
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
      title={isEdit ? 'Edit client' : 'New client'}
      description={isEdit ? 'Update client info and preferences.' : 'Add a new client to your roster.'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *" error={errors.name?.message}>
            <Input {...register('name')} autoFocus />
          </Field>
          <Field label="Company" error={errors.company?.message}>
            <Input {...register('company')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input {...register('phone')} />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <Input placeholder="e.g. United States" {...register('country')} />
          </Field>
          <Field label="Timezone" error={errors.timezone?.message}>
            <Input placeholder="e.g. America/Los_Angeles" {...register('timezone')} />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <Select {...register('status')}>
              {CLIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment method" error={errors.paymentMethod?.message}>
            <Select {...register('paymentMethod')}>
              <option value="">—</option>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Default revision rounds" error={errors.defaultRevisionRounds?.message}>
            <Input type="number" min={0} max={20} {...register('defaultRevisionRounds')} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Discord" error={errors.handles?.discord?.message}>
            <Input {...register('handles.discord')} />
          </Field>
          <Field label="Slack" error={errors.handles?.slack?.message}>
            <Input {...register('handles.slack')} />
          </Field>
          <Field label="WhatsApp" error={errors.handles?.whatsapp?.message}>
            <Input {...register('handles.whatsapp')} />
          </Field>
        </div>

        <Field label="Preferred platforms">
          <Controller
            control={control}
            name="preferredPlatforms"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((p) => {
                  const checked = field.value?.includes(p);
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => {
                        const next = checked
                          ? field.value.filter((x) => x !== p)
                          : [...(field.value || []), p];
                        field.onChange(next);
                      }}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        checked
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>

        <Field label="Notes" error={errors.notes?.message}>
          <Textarea rows={3} {...register('notes')} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
