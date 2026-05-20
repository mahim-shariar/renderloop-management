import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { CURRENCIES } from '@/lib/currency.js';
import Button from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSetSecurityQuestionMutation,
  SECURITY_QUESTIONS,
} from '@/features/auth/authApi.js';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '@/features/settings/settingsApi.js';
import {
  useGetMyTeamProfileQuery,
  useUpdateMyTeamProfileMutation,
} from '@/features/team/teamApi.js';
import {
  AVAILABILITIES,
  PAYOUT_METHODS,
  SALARY_TYPES,
} from '@/features/team/teamConstants.js';
import { formatCents } from '@/features/projects/projectConstants.js';
import { cn } from '@/lib/cn.js';

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---- Profile ----
const profileSchema = z.object({
  name: z.string().min(1, 'Name required').max(120),
  email: z.string().email('A valid email is required'),
  avatarUrl: z.string().max(500).optional().or(z.literal('')),
});

function ProfileTab() {
  const user = useSelector(selectAuthUser);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', avatarUrl: '' },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, reset]);

  async function onSubmit(values) {
    try {
      await updateProfile({
        name: values.name,
        email: values.email,
        avatarUrl: values.avatarUrl || '',
      }).unwrap();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Role">
            <Badge variant="outline" className="capitalize">{user?.role}</Badge>
          </Field>
          <Field label="Avatar URL" error={errors.avatarUrl?.message}>
            <Input {...register('avatarUrl')} placeholder="https://..." />
          </Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---- Password ----
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(8, 'Must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

function PasswordTab() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  async function onSubmit(values) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      toast.success('Password updated');
      reset({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Could not change password');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <Field label="Current password" error={errors.currentPassword?.message}>
            <Input type="password" autoComplete="current-password" {...register('currentPassword')} />
          </Field>
          <Field label="New password" error={errors.newPassword?.message}>
            <Input type="password" autoComplete="new-password" {...register('newPassword')} />
          </Field>
          <Field label="Confirm new password" error={errors.confirm?.message}>
            <Input type="password" autoComplete="new-password" {...register('confirm')} />
          </Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---- Security question (used by the forgot-password flow) ----
function SecurityQuestionCard() {
  const user = useSelector(selectAuthUser);
  const [setSecurityQuestion, { isLoading }] = useSetSecurityQuestionMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { question: SECURITY_QUESTIONS[0], answer: '' },
  });

  useEffect(() => {
    if (user?.securityQuestion) {
      reset({ question: user.securityQuestion, answer: '' });
    }
  }, [user?.securityQuestion, reset]);

  async function onSubmit(values) {
    if (!values.answer || values.answer.trim().length < 2) {
      toast.error('Enter an answer');
      return;
    }
    try {
      await setSecurityQuestion(values).unwrap();
      toast.success('Security question saved');
      reset({ question: values.question, answer: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Could not save');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security question</CardTitle>
        <CardDescription>
          Used to recover your account if you forget your password.{' '}
          {user?.hasSecurityQuestion ? (
            <Badge variant="success">Set</Badge>
          ) : (
            <Badge variant="warning">Not set</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <Field label="Question" error={errors.question?.message}>
            <Select {...register('question')}>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Your answer" error={errors.answer?.message}>
            <Input
              autoComplete="off"
              placeholder="Answer (not case-sensitive)"
              {...register('answer')}
            />
          </Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save security question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---- Agency ----
const agencySchema = z.object({
  agencyName: z.string().min(1, 'Required').max(120),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  address: z.string().max(400).optional().or(z.literal('')),
  logoUrl: z.string().max(500).optional().or(z.literal('')),
  defaultRevisionRounds: z.union([z.string(), z.number()]),
  defaultCurrency: z.string().length(3),
  invoiceFooter: z.string().max(1000).optional().or(z.literal('')),
});

function AgencyTab() {
  const user = useSelector(selectAuthUser);
  const isAdmin = user?.role === 'admin';
  const { data, isLoading: loading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(agencySchema),
  });

  const settings = data?.data?.settings;
  useEffect(() => {
    if (settings) {
      reset({
        agencyName: settings.agencyName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        logoUrl: settings.logoUrl || '',
        defaultRevisionRounds: settings.defaultRevisionRounds ?? 2,
        defaultCurrency: settings.defaultCurrency || 'USD',
        invoiceFooter: settings.invoiceFooter || '',
      });
    }
  }, [settings, reset]);

  async function onSubmit(values) {
    try {
      await updateSettings({
        ...values,
        defaultRevisionRounds: Number(values.defaultRevisionRounds),
        defaultCurrency: values.defaultCurrency.toUpperCase(),
      }).unwrap();
      toast.success('Agency settings saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  }

  if (loading) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency</CardTitle>
        <CardDescription>
          Used on invoices and as defaults for new projects.
          {!isAdmin && ' Read-only — only admins can edit.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className={cn('max-w-xl space-y-4', !isAdmin && 'opacity-70')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Agency name" error={errors.agencyName?.message}>
              <Input disabled={!isAdmin} {...register('agencyName')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input disabled={!isAdmin} {...register('email')} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input disabled={!isAdmin} {...register('phone')} />
            </Field>
            <Field label="Logo URL" error={errors.logoUrl?.message}>
              <Input disabled={!isAdmin} {...register('logoUrl')} />
            </Field>
            <Field label="Default revision rounds" error={errors.defaultRevisionRounds?.message}>
              <Input type="number" min={0} max={20} disabled={!isAdmin} {...register('defaultRevisionRounds')} />
            </Field>
            <Field label="Default currency" error={errors.defaultCurrency?.message}>
              <Select disabled={!isAdmin} {...register('defaultCurrency')}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </Select>
            </Field>
          </div>
          <Field label="Address" error={errors.address?.message}>
            <Textarea rows={2} disabled={!isAdmin} {...register('address')} />
          </Field>
          <Field label="Invoice footer" error={errors.invoiceFooter?.message}>
            <Textarea rows={2} disabled={!isAdmin} {...register('invoiceFooter')} />
          </Field>
          {isAdmin && (
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save agency settings
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ---- Payout & availability (the user's own team profile) ----
const payoutSchema = z.object({
  availability: z.string(),
  paymentMethod: z.string().optional().or(z.literal('')),
  payoutDetails: z.string().max(5000).optional().or(z.literal('')),
});

function PayoutTab() {
  const { data, isLoading } = useGetMyTeamProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateMyTeamProfileMutation();
  const member = data?.data?.member;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(payoutSchema),
    defaultValues: { availability: 'available', paymentMethod: '', payoutDetails: '' },
  });

  useEffect(() => {
    if (member) {
      reset({
        availability: member.availability || 'available',
        paymentMethod: member.paymentMethod || '',
        payoutDetails: typeof member.payoutDetails === 'string' ? member.payoutDetails : '',
      });
    }
  }, [member, reset]);

  async function onSubmit(values) {
    try {
      await updateProfile({
        availability: values.availability,
        paymentMethod: values.paymentMethod || undefined,
        payoutDetails: values.payoutDetails,
      }).unwrap();
      toast.success('Payout details saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }
  if (!member) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout & availability</CardTitle>
          <CardDescription>
            No team profile is linked to your account yet. An admin needs to add you as a
            team member before you can set payout details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const salaryLabel =
    SALARY_TYPES.find((s) => s.key === member.salaryType)?.label || member.salaryType;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout & availability</CardTitle>
        <CardDescription>
          Set how you get paid and your current availability. Payout details are encrypted
          and only visible to you and admins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Your rate (set by the agency)</span>
              <span className="font-semibold text-foreground">
                {formatCents(member.rateCents || 0, member.currency)} · {salaryLabel}
              </span>
            </div>
          </div>

          <Field label="Availability" error={errors.availability?.message}>
            <Select {...register('availability')}>
              {AVAILABILITIES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Payment method" error={errors.paymentMethod?.message}>
            <Select {...register('paymentMethod')}>
              <option value="">— Select —</option>
              {PAYOUT_METHODS.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Payout details" error={errors.payoutDetails?.message}>
            <Textarea
              rows={4}
              placeholder="Wise email, bank account, PayPal, or wallet address…"
              {...register('payoutDetails')}
            />
          </Field>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save payout details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, password, payout details and agency information.
        </p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="payout">Payout</TabsTrigger>
          <TabsTrigger value="agency">Agency</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="password">
          <div className="space-y-4">
            <PasswordTab />
            <SecurityQuestionCard />
          </div>
        </TabsContent>
        <TabsContent value="payout">
          <PayoutTab />
        </TabsContent>
        <TabsContent value="agency">
          <AgencyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
