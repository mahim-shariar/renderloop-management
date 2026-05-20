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

export const teamApi = api.injectEndpoints({
  endpoints: (build) => ({
    listTeam: build.query({
      query: (params) => `/team${toQuery(params)}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((m) => ({ type: 'Team', id: m._id })),
              { type: 'Team', id: 'LIST' },
            ]
          : [{ type: 'Team', id: 'LIST' }],
    }),
    getTeamMember: build.query({
      query: (id) => `/team/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Team', id }],
    }),
    createTeamMember: build.mutation({
      query: (body) => ({ url: '/team', method: 'POST', body }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),
    updateTeamMember: build.mutation({
      query: ({ id, ...body }) => ({ url: `/team/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Team', id },
        { type: 'Team', id: 'LIST' },
      ],
    }),
    deleteTeamMember: build.mutation({
      query: (id) => ({ url: `/team/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),
    // The signed-in user's own team profile (payout + availability).
    getMyTeamProfile: build.query({
      query: () => '/team/me',
      providesTags: [{ type: 'Team', id: 'ME' }],
    }),
    updateMyTeamProfile: build.mutation({
      query: (body) => ({ url: '/team/me', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Team', id: 'ME' }],
    }),
  }),
});

export const {
  useListTeamQuery,
  useGetTeamMemberQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useGetMyTeamProfileQuery,
  useUpdateMyTeamProfileMutation,
} = teamApi;
