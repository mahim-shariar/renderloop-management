import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const AUTH_TOKEN_KEY = 'rl_token';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    credentials: 'include',
    prepareHeaders: (headers) => {
      // Bearer auth — reliable cross-domain, where third-party cookies are blocked.
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'User',
    'Client',
    'Project',
    'Team',
    'Payment',
    'Expense',
    'Payout',
    'Task',
    'Notification',
    'Activity',
    'Settings',
  ],
  endpoints: () => ({}),
});
