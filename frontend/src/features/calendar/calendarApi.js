import { api } from '@/app/api.js';

export const calendarApi = api.injectEndpoints({
  endpoints: (build) => ({
    calendarEvents: build.query({
      query: (params = {}) => {
        const usp = new URLSearchParams();
        if (params.from) usp.set('from', params.from);
        if (params.to) usp.set('to', params.to);
        const s = usp.toString();
        return `/calendar/events${s ? `?${s}` : ''}`;
      },
    }),
  }),
});

export const { useCalendarEventsQuery } = calendarApi;
