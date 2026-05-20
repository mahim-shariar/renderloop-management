import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './authApi.js';
import { AUTH_TOKEN_KEY } from '@/app/api.js';

const initialState = {
  user: null,
  status: 'idle',
};

const setToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};
const dropToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth(state) {
      state.user = null;
      state.status = 'idle';
      dropToken();
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        state.user = action.payload.data.user;
        state.status = 'authenticated';
        setToken(action.payload.data.token);
      })
      .addMatcher(authApi.endpoints.me.matchFulfilled, (state, action) => {
        state.user = action.payload.data.user;
        state.status = 'authenticated';
      })
      .addMatcher(authApi.endpoints.me.matchRejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
        dropToken(); // stale or missing token — clear it
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
        dropToken();
      });
  },
});

export const { clearAuth } = authSlice.actions;
export const selectAuthUser = (s) => s.auth.user;
export const selectAuthStatus = (s) => s.auth.status;

export default authSlice.reducer;
