import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, KeyRound } from 'lucide-react';
import { useSelector } from 'react-redux';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import Button from '@/components/ui/Button.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import {
  TEAM_ROLES,
  SALARY_TYPES,
  AVAILABILITIES,
  PAYOUT_METHODS,
} from './teamConstants.js';
import {
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
} from './teamApi.js';
import { cn } from '@/lib/cn.js';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(120),
  email: z.string().email('A valid email is required'),
  tempPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().optional().or(z.literal('')),
  role: z.string(),
  specialties: z.string().optional().or(z.literal('')),
  salaryType: z.string(),
  rate: z.union([z.string(), z.number()]).optional(),
  currency: z.string().length(3),
  availability: z.string(),
  paymentMethod: z.string().optional().or(z.literal('')),
  payoutDetails: z.string().max(5000).optional().or(z.literal('')),
  joinedAt: z.string().optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  avatarUrl: z.string().max(500).optional().or(z.literal('')),
});

const EMPTY = {
  name: '',
  email: '',
  tempPassword: '',
  newPassword: '',
  role: 'editor',
  specialties: '',
  salaryType: 'per_project',
  rate: '',
  currency: 'USD',
  availability: 'available',
  paymentMethod: '',
  payoutDetails: '',
  joinedAt: '',
  bio: '',
  avatarUrl: '',
};

function Field({ label, error, children, className, hint }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toFormShape(m) {
  if (!m) return EMPTY;
  return {
    ...EMPTY,
    name: m.name || '',
    email: m.email || '',
    role: m.role || 'editor',
    specialties: (m.specialties || []).join(', '),
    salaryType: m.salaryType || 'per_project',
    rate: m.rateCents != null ? (m.rateCents / 100).toString() : '',
    currency: m.currency || 'USD',
    availability: m.availability || 'available',
    paymentMethod: m.paymentMethod || '',
    payoutDetails: typeof m.payoutDetails === 'string' ? m.payoutDetails : '',
    joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString().slice(0, 10) : '',
    bio: m.bio || '',
    avatarUrl: m.avatarUrl || '',
  };
}

function toServerPayload(values, { isEdit, isAdmin }) {
  const out = {
    name: values.name,
    email: values.email,
    role: values.role,
    specialties: values.specialties
      ? values.specialties.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    salaryType: values.salaryType,
    currency: values.currency.toUpperCase(),
    availability: values.availability,
    paymentMethod: values.paymentMethod || undefined,
    bio: values.bio || undefined,
    avatarUrl: values.avatarUrl || undefined,
  };
  if (!isEdit) out.tempPassword = values.tempPassword;
  if (isEdit && values.newPassword) out.newPassword = values.newPassword;
  if (values.rate !== '' && values.rate != null) {
    out.rateCents = Math.round(Number(values.rate) * 100);
  } else {
    out.rateCents = 0;
  }
  if (values.joinedAt) out.joinedAt = new Date(values.joinedAt).toISOString();
  if (isAdmin && values.payoutDetails !== '') {
    out.payoutDetails = values.payoutDetails;
  }
  return out;
}

export default function TeamFormDialog({ open, onOpenChange, member }) {
  const isEdit = Boolean(member);
  const authUser = useSelector(selectAuthUser);
  const isAdmin = authUser?.role === 'admin';

  const [createMember, { isLoading: creating }] = useCreateTeamMemberMutation();
  const [updateMember, { isLoading: updating }] = useUpdateTeamMemberMutation();
  const submitting = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(toFormShape(member));
  }, [open, member, reset]);

  async function onSubmit(values) {
    if (!isEdit && (!values.tempPassword || values.tempPassword.length < 8)) {
      setError('tempPassword', {
        message: 'Set a temporary password of at least 8 characters',
      });
      return;
    }
    if (isEdit && values.newPassword && values.newPassword.length < 8) {
      setError('newPassword', { message: 'New password must be at least 8 characters' });
      return;
    }
    const payload = toServerPayload(values, { isEdit, isAdmin });
    try {
      if (isEdit) {
        await updateMember({ id: member._id, ...payload }).unwrap();
        toast.success('Team member updated');
      } else {
        await createMember(payload).unwrap();
        toast.success('Team member added — login account created');
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
      title={isEdit ? 'Edit team member' : 'New team member'}
      description={
        isEdit
          ? 'Update profile, role and payout settings.'
          : 'Adds the editor and creates a login account they can sign in with.'
      }
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *" error={errors.name?.message}>
            <Input autoFocus {...register('name')} />
          </Field>
          <Field
            label="Email *"
            error={errors.email?.message}
            hint="Their login email — changing it updates their sign-in."
          >
            <Input type="email" {...register('email')} />
          </Field>
          {!isEdit && (
            <Field
              label="Temporary password *"
              error={errors.tempPassword?.message}
              hint="Share this with them — they can change it after first login."
              className="sm:col-span-2"
            >
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" placeholder="At least 8 characters" {...register('tempPassword')} />
              </div>
            </Field>
          )}
          {isEdit && (
            <Field
              label="Reset password"
              error={errors.newPassword?.message}
              hint="Leave blank to keep their current password unchanged."
              className="sm:col-span-2"
            >
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  type="text"
                  autoComplete="off"
                  placeholder="New password (min 8 characters)"
                  {...register('newPassword')}
                />
              </div>
            </Field>
          )}
          <Field label="Role *">
            <Select {...register('role')}>
              {TEAM_ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Availability">
            <Select {...register('availability')}>
              {AVAILABILITIES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Joined">
            <Input type="date" {...register('joinedAt')} />
          </Field>
          <Field label="Salary type">
            <Select {...register('salaryType')}>
              {SALARY_TYPES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rate">
            <Input type="number" min={0} step="0.01" placeholder="0.00" {...register('rate')} />
          </Field>
          <Field label="Currency">
            <Input maxLength={3} className="uppercase" {...register('currency')} />
          </Field>
          <Field label="Payment method">
            <Select {...register('paymentMethod')}>
              <option value="">—</option>
              {PAYOUT_METHODS.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Specialties (comma-separated)">
          <Input placeholder="motion graphics, color, sfx" {...register('specialties')} />
        </Field>

        {isAdmin && (
          <Field label="Payout details (encrypted at rest)">
            <Textarea
              rows={3}
              placeholder="Wise email / bank account / wallet — visible to admins only."
              {...register('payoutDetails')}
            />
          </Field>
        )}

        <Field label="Bio">
          <Textarea rows={3} {...register('bio')} />
        </Field>

        <Field label="Avatar URL">
          <Input {...register('avatarUrl')} />
        </Field>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card pt-3">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Add member & create login'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
