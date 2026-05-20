import { api } from '@/app/api.js';

export const insightsApi = api.injectEndpoints({
  endpoints: (build) => ({
    overview: build.query({
      query: () => '/insights/overview',
    }),
    analytics: build.query({
      query: () => '/insights/analytics',
    }),
    myDashboard: build.query({
      query: () => '/insights/my-dashboard',
      providesTags: [
        { type: 'Project', id: 'LIST' },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

export const { useOverviewQuery, useAnalyticsQuery, useMyDashboardQuery } = insightsApi;
