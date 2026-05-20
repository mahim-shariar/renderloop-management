import { api } from '@/app/api.js';

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const tasksApi = api.injectEndpoints({
  endpoints: (build) => ({
    listTasks: build.query({
      query: (params) => `/tasks${toQuery(params)}`,
      providesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    createTask: build.mutation({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: build.mutation({
      // listParams (optional) drives an optimistic cache patch for snappy drag.
      query: ({ id, listParams, ...body }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body,
      }),
      async onQueryStarted({ id, listParams, ...patch }, { dispatch, queryFulfilled }) {
        if (!listParams) {
          try {
            await queryFulfilled;
          } catch {
            /* invalidation will refetch */
          }
          return;
        }
        const undo = dispatch(
          tasksApi.util.updateQueryData('listTasks', listParams, (draft) => {
            const t = draft?.data?.items?.find((x) => x._id === id);
            if (t) Object.assign(t, patch);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          undo.undo();
        }
      },
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    deleteTask: build.mutation({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
  }),
});

export const {
  useListTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;

// Editing-workflow stages for the task board.
export const TASK_STATUSES = [
  { key: 'todo', label: 'To do', tone: 'muted', dot: 'bg-slate-400' },
  { key: 'in_progress', label: 'In progress', tone: 'primary', dot: 'bg-blue-400' },
  { key: 'review', label: 'In review', tone: 'default', dot: 'bg-violet-400' },
  { key: 'revisions', label: 'Revisions', tone: 'warning', dot: 'bg-amber-400' },
  { key: 'done', label: 'Done', tone: 'success', dot: 'bg-emerald-400' },
];

export const TASK_PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'normal', label: 'Normal' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
];

// Left-accent stripe colour per priority (ClickUp-style).
export const PRIORITY_ACCENT = {
  low: 'border-l-slate-400/40',
  normal: 'border-l-border',
  high: 'border-l-amber-400',
  urgent: 'border-l-rose-500',
};
