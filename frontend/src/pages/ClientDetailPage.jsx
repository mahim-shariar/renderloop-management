import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Clock,
  CreditCard,
  Pencil,
  Trash2,
  MessageSquarePlus,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.jsx';
import Avatar from '@/components/ui/Avatar.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import {
  useGetClientQuery,
  useDeleteClientMutation,
  useAddClientNoteMutation,
  useDeleteClientNoteMutation,
} from '@/features/clients/clientsApi.js';
import ClientFormDialog from '@/features/clients/ClientFormDialog.jsx';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate text-foreground">{value || <span className="text-muted-foreground">—</span>}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const variant =
    status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'muted';
  return <Badge variant={variant}>{status}</Badge>;
}

function CommunicationTab({ client }) {
  const user = useSelector(selectAuthUser);
  const [addNote, { isLoading: adding }] = useAddClientNoteMutation();
  const [deleteNote, { isLoading: removing }] = useDeleteClientNoteMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { body: '' },
  });

  const onSubmit = async ({ body }) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await addNote({ id: client._id, body: trimmed }).unwrap();
      reset({ body: '' });
      toast.success('Note added');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not add note');
    }
  };

  const log = [...(client.communicationLog || [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add a note</CardTitle>
          <CardDescription>
            Log a call, email, or message. Updates last-contacted-at.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <Textarea
              rows={3}
              placeholder="What did you discuss?"
              {...register('body', { required: true, minLength: 1 })}
            />
            {errors.body && <p className="text-xs text-destructive">Note body required</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
                Add note
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {log.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No notes yet"
          description="Communication notes will appear here in reverse chronological order."
        />
      ) : (
        <ol className="space-y-3">
          {log.map((note) => (
            <li
              key={note._id}
              className="flex gap-3 rounded-lg border border-border bg-card p-4"
            >
              <Avatar name={note.author?.name || 'User'} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {note.author?.name || 'Someone'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(note.at), 'MMM d, yyyy · h:mm a')}
                  </div>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.body}
                </div>
              </div>
              {note.author?._id === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={removing}
                  onClick={async () => {
                    try {
                      await deleteNote({ id: client._id, noteId: note._id }).unwrap();
                      toast.success('Note removed');
                    } catch (err) {
                      toast.error(err?.data?.message || 'Could not remove note');
                    }
                  }}
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  const { data, isLoading, isError, error } = useGetClientQuery(id);
  const [deleteClient, { isLoading: deleting }] = useDeleteClientMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={Building2}
        title="Client not found"
        description={error?.data?.message || 'It may have been deleted.'}
        action={
          <Button asChild variant="outline">
            <Link to="/clients">Back to clients</Link>
          </Button>
        }
      />
    );
  }

  const client = data.data.client;

  async function handleDelete() {
    try {
      await deleteClient(client._id).unwrap();
      toast.success('Client deleted');
      navigate('/clients', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/clients" aria-label="Back to clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {client.name}
              </h1>
              <StatusBadge status={client.status} />
            </div>
            {client.company && (
              <p className="text-sm text-muted-foreground">{client.company}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active projects</CardDescription>
            <CardTitle className="text-2xl">{client.activeProjects ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="muted">Phase 5</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime revenue</CardDescription>
            <CardTitle className="text-2xl">$0</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="muted">Phase 7</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">$0</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="muted">Phase 7</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last contact</CardDescription>
            <CardTitle className="text-base">
              {client.lastContactedAt
                ? format(new Date(client.lastContactedAt), 'MMM d, yyyy')
                : 'Never'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{client.communicationLog?.length || 0} notes</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notes">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <InfoRow icon={Mail} label="Email" value={client.email} />
              <InfoRow icon={Phone} label="Phone" value={client.phone} />
              <InfoRow icon={Globe} label="Country" value={client.country} />
              <InfoRow icon={Clock} label="Timezone" value={client.timezone} />
              <InfoRow icon={CreditCard} label="Payment method" value={client.paymentMethod} />
              <InfoRow
                icon={Building2}
                label="Default revision rounds"
                value={String(client.defaultRevisionRounds ?? 2)}
              />
              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Handles
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  {['discord', 'slack', 'whatsapp'].map((k) =>
                    client.handles?.[k] ? (
                      <Badge key={k} variant="outline">
                        <span className="capitalize">{k}:</span>&nbsp;
                        <span className="text-foreground">{client.handles[k]}</span>
                      </Badge>
                    ) : null
                  )}
                  {!client.handles?.discord &&
                    !client.handles?.slack &&
                    !client.handles?.whatsapp && (
                      <span className="text-muted-foreground">—</span>
                    )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Preferred platforms
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  {(client.preferredPlatforms || []).length > 0 ? (
                    client.preferredPlatforms.map((p) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              {client.notes && (
                <div className="sm:col-span-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Notes
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {client.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <EmptyState
            icon={Building2}
            title="Projects arrive in Phase 5"
            description="This tab will list every project for this client, grouped by status."
          />
        </TabsContent>

        <TabsContent value="payments">
          <EmptyState
            icon={CreditCard}
            title="Payments arrive in Phase 7"
            description="Income history, pending balances, and invoices will live here."
          />
        </TabsContent>

        <TabsContent value="notes">
          <CommunicationTab client={client} />
        </TabsContent>
      </Tabs>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete client"
        description={`Delete "${client.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
