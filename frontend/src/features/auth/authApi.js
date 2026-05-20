import { api } from '@/app/api.js';

// Keep in sync with SECURITY_QUESTIONS in server/src/models/User.js
export const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was the name of your first school?',
  "What is your mother's maiden name?",
  'What was the make of your first phone or car?',
  'What is your favourite film?',
];

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    logout: build.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth'],
    }),
    me: build.query({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Auth'],
    }),
    updateProfile: build.mutation({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['Auth'],
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    setSecurityQuestion: build.mutation({
      query: (body) => ({ url: '/auth/security-question', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    getSecurityQuestion: build.mutation({
      query: (body) => ({ url: '/auth/forgot-password/question', method: 'POST', body }),
    }),
    resetPassword: build.mutation({
      query: (body) => ({ url: '/auth/forgot-password/reset', method: 'POST', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSetSecurityQuestionMutation,
  useGetSecurityQuestionMutation,
  useResetPasswordMutation,
} = authApi;
