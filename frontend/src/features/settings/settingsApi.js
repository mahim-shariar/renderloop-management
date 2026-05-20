import { api } from '@/app/api.js';

export const settingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation({
      query: (body) => ({ url: '/settings', method: 'PATCH', body }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
