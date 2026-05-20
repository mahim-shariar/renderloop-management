import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Film, Loader2, ArrowLeft, ShieldQuestion } from 'lucide-react';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import {
  useGetSecurityQuestionMutation,
  useResetPasswordMutation,
} from './authApi.js';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'answer'
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');

  const [getQuestion, { isLoading: loadingQ }] = useGetSecurityQuestionMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

  const emailForm = useForm({ defaultValues: { email: '' } });
  const answerForm = useForm({ defaultValues: { answer: '', newPassword: '', confirm: '' } });

  async function onEmailSubmit({ email: enteredEmail }) {
    try {
      const res = await getQuestion({ email: enteredEmail }).unwrap();
      setEmail(enteredEmail);
      setQuestion(res.data.question);
      setStep('answer');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not find that account');
    }
  }

  async function onAnswerSubmit(values) {
    if (values.newPassword.length < 8) {
      answerForm.setError('newPassword', { message: 'At least 8 characters' });
      return;
    }
    if (values.newPassword !== values.confirm) {
      answerForm.setError('confirm', { message: 'Passwords do not match' });
      return;
    }
    try {
      await resetPassword({
        email,
        answer: values.answer,
        newPassword: values.newPassword,
      }).unwrap();
      toast.success('Password reset — sign in with your new password');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Reset failed');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Film className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Reset your password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 'email'
              ? 'Enter your email to find your security question.'
              : 'Answer your security question to set a new password.'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="fp-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="fp-email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                {...emailForm.register('email', { required: true })}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loadingQ}>
              {loadingQ && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={answerForm.handleSubmit(onAnswerSubmit)} className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-card/60 p-3">
              <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm font-medium text-foreground">{question}</div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fp-answer" className="text-sm font-medium text-foreground">
                Your answer
              </label>
              <Input id="fp-answer" autoFocus {...answerForm.register('answer', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fp-new" className="text-sm font-medium text-foreground">
                New password
              </label>
              <Input
                id="fp-new"
                type="password"
                autoComplete="new-password"
                {...answerForm.register('newPassword', { required: true })}
              />
              {answerForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {answerForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fp-confirm" className="text-sm font-medium text-foreground">
                Confirm new password
              </label>
              <Input
                id="fp-confirm"
                type="password"
                autoComplete="new-password"
                {...answerForm.register('confirm', { required: true })}
              />
              {answerForm.formState.errors.confirm && (
                <p className="text-xs text-destructive">
                  {answerForm.formState.errors.confirm.message}
                </p>
              )}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={resetting}>
              {resetting && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset password
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
