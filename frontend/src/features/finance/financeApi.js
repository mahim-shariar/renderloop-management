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

export const financeApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Payments / Income
    listPayments: build.query({
      query: (params) => `/finance/payments${toQuery(params)}`,
      providesTags: [{ type: 'Payment', id: 'LIST' }],
    }),
    paymentsSummary: build.query({
      query: () => '/finance/payments/summary',
      providesTags: [{ type: 'Payment', id: 'SUMMARY' }],
    }),
    createPayment: build.mutation({
      query: (body) => ({ url: '/finance/payments', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Payment', id: 'LIST' },
        { type: 'Payment', id: 'SUMMARY' },
      ],
    }),
    updatePayment: build.mutation({
      query: ({ id, ...body }) => ({ url: `/finance/payments/${id}`, method: 'PATCH', body }),
      invalidatesTags: [
        { type: 'Payment', id: 'LIST' },
        { type: 'Payment', id: 'SUMMARY' },
      ],
    }),
    deletePayment: build.mutation({
      query: (id) => ({ url: `/finance/payments/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Payment', id: 'LIST' },
        { type: 'Payment', id: 'SUMMARY' },
      ],
    }),

    // Expenses
    listExpenses: build.query({
      query: (params) => `/finance/expenses${toQuery(params)}`,
      providesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    expensesSummary: build.query({
      query: () => '/finance/expenses/summary',
      providesTags: [{ type: 'Expense', id: 'SUMMARY' }],
    }),
    createExpense: build.mutation({
      query: (body) => ({ url: '/finance/expenses', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Expense', id: 'LIST' },
        { type: 'Expense', id: 'SUMMARY' },
      ],
    }),
    updateExpense: build.mutation({
      query: ({ id, ...body }) => ({ url: `/finance/expenses/${id}`, method: 'PATCH', body }),
      invalidatesTags: [
        { type: 'Expense', id: 'LIST' },
        { type: 'Expense', id: 'SUMMARY' },
      ],
    }),
    deleteExpense: build.mutation({
      query: (id) => ({ url: `/finance/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Expense', id: 'LIST' },
        { type: 'Expense', id: 'SUMMARY' },
      ],
    }),

    // Salaries / Payouts
    listSalaries: build.query({
      query: (params) => `/finance/salaries${toQuery(params)}`,
      providesTags: [{ type: 'Payout', id: 'LIST' }],
    }),
    salariesSummary: build.query({
      query: () => '/finance/salaries/summary',
      providesTags: [{ type: 'Payout', id: 'SUMMARY' }],
    }),
    createSalary: build.mutation({
      query: (body) => ({ url: '/finance/salaries', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Payout', id: 'LIST' },
        { type: 'Payout', id: 'SUMMARY' },
      ],
    }),
    updateSalary: build.mutation({
      query: ({ id, ...body }) => ({ url: `/finance/salaries/${id}`, method: 'PATCH', body }),
      invalidatesTags: [
        { type: 'Payout', id: 'LIST' },
        { type: 'Payout', id: 'SUMMARY' },
      ],
    }),
    deleteSalary: build.mutation({
      query: (id) => ({ url: `/finance/salaries/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Payout', id: 'LIST' },
        { type: 'Payout', id: 'SUMMARY' },
      ],
    }),
    markSalaryPaid: build.mutation({
      query: ({ id, transactionRef }) => ({
        url: `/finance/salaries/${id}/mark-paid`,
        method: 'POST',
        body: transactionRef ? { transactionRef } : {},
      }),
      invalidatesTags: [
        { type: 'Payout', id: 'LIST' },
        { type: 'Payout', id: 'SUMMARY' },
      ],
    }),

    // Invoice
    buildInvoiceFromProject: build.query({
      query: (projectId) => `/finance/invoice/from-project/${projectId}`,
    }),
  }),
});

export const {
  useListPaymentsQuery,
  usePaymentsSummaryQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useListExpensesQuery,
  useExpensesSummaryQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useListSalariesQuery,
  useSalariesSummaryQuery,
  useCreateSalaryMutation,
  useUpdateSalaryMutation,
  useDeleteSalaryMutation,
  useMarkSalaryPaidMutation,
  useBuildInvoiceFromProjectQuery,
} = financeApi;
