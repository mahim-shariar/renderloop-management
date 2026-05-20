import { api } from '@/app/api.js';

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) v.length && usp.set(k, v.join(','));
    else usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const projectsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listProjects: build.query({
      query: (params) => `/projects${toQuery(params)}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((p) => ({ type: 'Project', id: p._id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),
    getProject: build.query({
      query: (id) => `/projects/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Project', id }],
    }),
    createProject: build.mutation({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    updateProject: build.mutation({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Project', id },
        { type: 'Project', id: 'LIST' },
      ],
    }),
    setProjectStatus: build.mutation({
      query: ({ id, status }) => ({
        url: `/projects/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      // Optimistic update on the list cache so Kanban drag feels instant
      async onQueryStarted({ id, status, listParams }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          projectsApi.util.updateQueryData('listProjects', listParams || {}, (draft) => {
            const item = draft?.data?.items?.find((p) => p._id === id);
            if (item) item.status = status;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Project', id },
        { type: 'Project', id: 'LIST' },
      ],
    }),
    deleteProject: build.mutation({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    addFootage: build.mutation({
      query: ({ id, ...body }) => ({ url: `/projects/${id}/footage`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }],
    }),
    removeFootage: build.mutation({
      query: ({ id, linkId }) => ({ url: `/projects/${id}/footage/${linkId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }],
    }),
    addDraft: build.mutation({
      query: ({ id, url }) => ({ url: `/projects/${id}/drafts`, method: 'POST', body: { url } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }],
    }),
    updateDraftFeedback: build.mutation({
      query: ({ id, draftId, clientFeedback }) => ({
        url: `/projects/${id}/drafts/${draftId}`,
        method: 'PATCH',
        body: { clientFeedback },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }],
    }),
    removeDraft: build.mutation({
      query: ({ id, draftId }) => ({ url: `/projects/${id}/drafts/${draftId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }],
    }),
  }),
});

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useSetProjectStatusMutation,
  useDeleteProjectMutation,
  useAddFootageMutation,
  useRemoveFootageMutation,
  useAddDraftMutation,
  useUpdateDraftFeedbackMutation,
  useRemoveDraftMutation,
} = projectsApi;
