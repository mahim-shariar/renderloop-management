import { api } from '@/app/api.js';

export const notificationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query({
      query: (params = {}) =>
        `/notifications${params.unreadOnly ? '?unreadOnly=true' : ''}`,
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markNotificationRead: build.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markAllNotificationsRead: build.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    getPushPublicKey: build.query({
      query: () => '/notifications/push/public-key',
    }),
    subscribePush: build.mutation({
      query: (subscription) => ({
        url: '/notifications/push/subscribe',
        method: 'POST',
        body: { subscription },
      }),
    }),
    unsubscribePush: build.mutation({
      query: (endpoint) => ({
        url: '/notifications/push/unsubscribe',
        method: 'POST',
        body: { endpoint },
      }),
    }),
    testPush: build.mutation({
      query: () => ({ url: '/notifications/push/test', method: 'POST' }),
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetPushPublicKeyQuery,
  useLazyGetPushPublicKeyQuery,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useTestPushMutation,
} = notificationsApi;
