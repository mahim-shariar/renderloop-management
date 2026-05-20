import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Film,
  Plus,
  AlertTriangle,
  Clock,
  Calendar,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.jsx';
import Avatar from '@/components/ui/Avatar.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import { LinkPill } from '@/components/ui/LinkPill.jsx';
import StatusBadge from '@/features/projects/StatusBadge.jsx';
import DeadlineBadge from '@/features/projects/DeadlineBadge.jsx';
import ProjectFormDialog from '@/features/projects/ProjectFormDialog.jsx';
import {
  formatCents,
  formatDurationSec,
  PRIORITY_TONE,
  VIDEO_TYPES,
} from '@/features/projects/projectConstants.js';
import {
  useGetProjectQuery,
  useDeleteProjectMutation,
  useAddFootageMutation,
  useRemoveFootageMutation,
  useAddDraftMutation,
  useUpdateDraftFeedbackMutation,
  useRemoveDraftMutation,
} from '@/features/projects/projectsApi.js';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useListActivityQuery } from '@/features/activity/activityApi.js';
import { formatDistanceToNow } from 'date-fns';

function videoTypeLabel(key) {
  return VIDEO_TYPES.find((v) => v.key === key)?.label || key;
}

function ActivityTab({ projectId }) {
  const { data, isLoading } = useListActivityQuery({
    entityType: 'Project',
    entityId: projectId,
    limit: 50,
  });
  const items = data?.data?.items || [];

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No activity yet"
        description="Status changes, draft posts and assignments are logged here automatically."
      />
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ol className="divide-y divide-border">
          {items.map((a) => (
            <li key={a._id} className="flex items-start gap-3 p-4">
              <Avatar size="sm" name={a.actor?.name || 'System'} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground">{a.summary}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {a.actor?.name ? `${a.actor.name} · ` : ''}
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function FootageTab({ project }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { url: '', label: '' },
  });
  const [addFootage, { isLoading: adding }] = useAddFootageMutation();
  const [removeFootage] = useRemoveFootageMutation();

  const onSubmit = async (values) => {
    try {
      await addFootage({ id: project._id, url: values.url, label: values.label }).unwrap();
      reset({ url: '', label: '' });
      toast.success('Footage link added');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not add footage');
    }
  };

  const links = project.rawFootageLinks || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw footage</CardTitle>
        <CardDescription>
          Paste Frame.io / Google Drive / Dropbox / WeTransfer links. RenderLoop does not host
          videos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <Input placeholder="https://drive.google.com/..." {...register('url', { required: true })} />
          <Input placeholder="Label (optional)" {...register('label')} />
          <Button type="submit" disabled={adding}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add link
          </Button>
        </form>
        {errors.url && <p className="text-xs text-destructive">URL required</p>}

        {links.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No footage links yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {links.map((l) => (
              <li
                key={l._id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 p-2"
              >
                <LinkPill url={l.url} label={l.label || ''} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{l.addedBy?.name || '—'}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove footage"
                    onClick={async () => {
                      try {
                        await removeFootage({ id: project._id, linkId: l._id }).unwrap();
                        toast.success('Footage link removed');
                      } catch (err) {
                        toast.error(err?.data?.message || 'Remove failed');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DraftsList({ project, showFeedback = true, allowDelete = true }) {
  const [updateFeedback, { isLoading: saving }] = useUpdateDraftFeedbackMutation();
  const [removeDraft] = useRemoveDraftMutation();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const drafts = [...(project.draftLinks || [])].sort((a, b) => b.version - a.version);

  return (
    <ol className="space-y-3">
      {drafts.map((d) => (
        <li key={d._id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary">v{d.version}</Badge>
                <LinkPill url={d.url} label={`draft v${d.version}`} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Sent {format(new Date(d.sentAt), 'MMM d, yyyy · h:mm a')}
                {d.sentBy?.name ? ` · by ${d.sentBy.name}` : ''}
              </div>
            </div>
            {allowDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove draft"
                onClick={async () => {
                  try {
                    await removeDraft({ id: project._id, draftId: d._id }).unwrap();
                    toast.success('Draft removed');
                  } catch (err) {
                    toast.error(err?.data?.message || 'Remove failed');
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showFeedback && (
            <div className="mt-3 rounded-md bg-muted/40 p-3">
              {editingId === d._id ? (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder="Paste client feedback here..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={async () => {
                        try {
                          await updateFeedback({
                            id: project._id,
                            draftId: d._id,
                            clientFeedback: draft,
                          }).unwrap();
                          toast.success('Feedback saved');
                          setEditingId(null);
                        } catch (err) {
                          toast.error(err?.data?.message || 'Save failed');
                        }
                      }}
                    >
                      Save feedback
                    </Button>
                  </div>
                </div>
              ) : d.clientFeedback ? (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Client feedback
                    {d.feedbackReceivedAt && (
                      <span className="ml-2 normal-case text-[10px]">
                        ({format(new Date(d.feedbackReceivedAt), 'MMM d')})
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {d.clientFeedback}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0"
                    onClick={() => {
                      setEditingId(d._id);
                      setDraft(d.clientFeedback || '');
                    }}
                  >
                    Edit feedback
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(d._id);
                    setDraft('');
                  }}
                >
                  + Add client feedback
                </Button>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function DraftsTab({ project }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { url: '' },
  });
  const [addDraft, { isLoading: adding }] = useAddDraftMutation();

  const onSubmit = async (values) => {
    try {
      await addDraft({ id: project._id, url: values.url }).unwrap();
      reset({ url: '' });
      toast.success('Draft posted');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not add draft');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Drafts</CardTitle>
          <CardDescription>
            Versioned drafts sent to client. Posting a new draft auto-advances the project status
            and bumps the revision counter when applicable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-2 sm:grid-cols-[1fr_auto]"
          >
            <Input
              placeholder="https://frame.io/... or shared YouTube link"
              {...register('url', { required: true })}
            />
            <Button type="submit" disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add draft
            </Button>
          </form>
          {errors.url && <p className="mt-1 text-xs text-destructive">URL required</p>}
        </CardContent>
      </Card>

      {project.draftLinks?.length ? (
        <DraftsList project={project} />
      ) : (
        <EmptyState
          icon={Film}
          title="No drafts yet"
          description="Add the first draft URL. We'll auto-version subsequent uploads."
        />
      )}
    </div>
  );
}

function RevisionsTab({ project }) {
  const exceeded =
    project.revisionRoundsAllowed != null &&
    project.revisionRoundsUsed > project.revisionRoundsAllowed;
  const remaining =
    project.revisionRoundsAllowed != null
      ? Math.max(0, project.revisionRoundsAllowed - project.revisionRoundsUsed)
      : null;

  return (
    <div className="space-y-4">
      <Card className={exceeded ? 'border-destructive/50' : undefined}>
        <CardHeader>
          <CardTitle>Revision counter</CardTitle>
          <CardDescription>
            Each new draft above v1 is treated as a revision delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-3xl font-semibold text-foreground">
              {project.revisionRoundsUsed || 0}
              <span className="text-base font-normal text-muted-foreground">
                {' '}/ {project.revisionRoundsAllowed ?? '—'}
              </span>
            </div>
            {exceeded ? (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3" /> Exceeded by{' '}
                {project.revisionRoundsUsed - project.revisionRoundsAllowed} — bill the client
              </Badge>
            ) : remaining != null ? (
              <Badge variant="muted">{remaining} remaining</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {project.draftLinks?.length ? (
        <DraftsList project={project} allowDelete={false} />
      ) : (
        <EmptyState
          icon={Film}
          title="No revisions tracked"
          description="Revisions appear here as you post draft v2 and beyond."
        />
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const { data, isLoading, isError, error } = useGetProjectQuery(id);
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();
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
        icon={Film}
        title="Project not found"
        description={error?.data?.message || 'It may have been deleted.'}
        action={
          <Button asChild variant="outline">
            <Link to="/projects">Back to projects</Link>
          </Button>
        }
      />
    );
  }

  const p = data.data.project;
  const editors = p.assignedEditors || [];

  async function handleDelete() {
    try {
      await deleteProject(p._id).unwrap();
      toast.success('Project deleted');
      navigate('/projects', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projects" aria-label="Back to projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                {p.title}
              </h1>
              <StatusBadge status={p.status} />
              {p.priority && p.priority !== 'normal' && (
                <Badge variant={PRIORITY_TONE[p.priority] || 'outline'} className="capitalize">
                  {p.priority}
                </Badge>
              )}
              <DeadlineBadge deadline={p.deadline} status={p.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.client && (
                <Link to={`/clients/${p.client._id}`} className="hover:underline">
                  {p.client.name}
                </Link>
              )}
              {p.videoType && (
                <span className="ml-2 text-muted-foreground">
                  · {videoTypeLabel(p.videoType)} · {p.aspectRatio}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canManage && (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{p.budgetCents != null ? 'Budget' : 'Your payout'}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCents(p.budgetCents != null ? p.budgetCents : p.myPayoutCents, p.currency) ||
                '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Target duration</CardDescription>
            <CardTitle className="text-2xl">{formatDurationSec(p.targetDurationSec) || '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revisions used</CardDescription>
            <CardTitle className="text-2xl">
              {p.revisionRoundsUsed || 0} / {p.revisionRoundsAllowed ?? '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {p.revisionRoundsAllowed != null &&
              p.revisionRoundsUsed > p.revisionRoundsAllowed && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3" /> Charge extra
                </Badge>
              )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-2xl">{p.draftLinks?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            {p.finalDeliveryLink && (
              <a
                href={p.finalDeliveryLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Final delivery <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="footage">Footage &amp; Drafts</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.projectManager && (
                  <div className="flex items-center gap-3 text-sm">
                    <Avatar name={p.projectManager.name} size="sm" />
                    <div>
                      <div className="font-medium text-foreground">{p.projectManager.name}</div>
                      <div className="text-xs text-muted-foreground">Project manager</div>
                    </div>
                  </div>
                )}
                {editors.length === 0 && !p.projectManager && (
                  <span className="text-sm text-muted-foreground">No team assigned.</span>
                )}
                {editors.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 text-sm">
                    <Avatar name={a.user?.name} size="sm" />
                    <div>
                      <div className="font-medium text-foreground">{a.user?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{a.role}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Deadline:{' '}
                  {p.deadline ? format(new Date(p.deadline), 'MMM d, yyyy') : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Started:{' '}
                  {p.startedAt ? format(new Date(p.startedAt), 'MMM d, yyyy') : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Delivered:{' '}
                  {p.deliveredAt ? format(new Date(p.deliveredAt), 'MMM d, yyyy') : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-2">
                    {p.tags.map((t) => (
                      <Badge key={t} variant="outline">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="brief">
          <Card>
            <CardHeader>
              <CardTitle>Client brief</CardTitle>
              <CardDescription>What the client asked for.</CardDescription>
            </CardHeader>
            <CardContent>
              {p.clientBrief ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">{p.clientBrief}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No brief yet. Edit the project to add one.</p>
              )}
              {p.internalNotes && (
                <div className="mt-6">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Internal notes
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {p.internalNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footage">
          <div className="space-y-4">
            <FootageTab project={p} />
            <DraftsTab project={p} />
          </div>
        </TabsContent>

        <TabsContent value="revisions">
          <RevisionsTab project={p} />
        </TabsContent>

        <TabsContent value="files">
          <EmptyState
            icon={Film}
            title="File uploads arrive later"
            description="Thumbnails and small artifact uploads come with Phase 6/10. For now, link to external storage from the Footage tab."
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab projectId={p._id} />
        </TabsContent>

        <TabsContent value="payments">
          <EmptyState
            icon={Film}
            title="Payments arrive in Phase 7"
            description="Linked invoices and payment status will surface here once the finance module is built."
          />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={p} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete project"
        description={`Delete "${p.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
