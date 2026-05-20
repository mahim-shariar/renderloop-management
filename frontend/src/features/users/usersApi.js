import { api } from '@/app/api.js';

export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query({
      query: (params = {}) => {
        const usp = new URLSearchParams();
        if (params.role) usp.set('role', Array.isArray(params.role) ? params.role.join(',') : params.role);
        const q = usp.toString();
        return `/users${q ? `?${q}` : ''}`;
      },
      providesTags: ['User'],
    }),
  }),
});

export const { useListUsersQuery } = usersApi;
