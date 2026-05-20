import { api } from '@/app/api.js';

export const activityApi = api.injectEndpoints({
  endpoints: (build) => ({
    listActivity: build.query({
      query: (params = {}) => {
        const usp = new URLSearchParams();
        if (params.entityType) usp.set('entityType', params.entityType);
        if (params.entityId) usp.set('entityId', params.entityId);
        if (params.limit) usp.set('limit', params.limit);
        const s = usp.toString();
        return `/activity${s ? `?${s}` : ''}`;
      },
      providesTags: ['Activity'],
    }),
  }),
});

export const { useListActivityQuery } = activityApi;
