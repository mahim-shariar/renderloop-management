import { api } from '@/app/api.js';

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const clientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listClients: build.query({
      query: (params) => `/clients${toQuery(params)}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((c) => ({ type: 'Client', id: c._id })),
              { type: 'Client', id: 'LIST' },
            ]
          : [{ type: 'Client', id: 'LIST' }],
    }),
    getClient: build.query({
      query: (id) => `/clients/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Client', id }],
    }),
    createClient: build.mutation({
      query: (body) => ({ url: '/clients', method: 'POST', body }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),
    updateClient: build.mutation({
      query: ({ id, ...body }) => ({ url: `/clients/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Client', id },
        { type: 'Client', id: 'LIST' },
      ],
    }),
    deleteClient: build.mutation({
      query: (id) => ({ url: `/clients/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),
    addClientNote: build.mutation({
      query: ({ id, body }) => ({ url: `/clients/${id}/notes`, method: 'POST', body: { body } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Client', id }],
    }),
    deleteClientNote: build.mutation({
      query: ({ id, noteId }) => ({ url: `/clients/${id}/notes/${noteId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Client', id }],
    }),
  }),
});

export const {
  useListClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useAddClientNoteMutation,
  useDeleteClientNoteMutation,
} = clientsApi;

export const CLIENT_STATUSES = ['active', 'paused', 'churned'];
export const PAYMENT_METHODS = ['bank', 'wise', 'payoneer', 'paypal', 'crypto', 'other'];
export const SOCIAL_PLATFORMS = [
  'YouTube',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Twitter',
  'Facebook',
  'Twitch',
  'Vimeo',
  'Other',
];
