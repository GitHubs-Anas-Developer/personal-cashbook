import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token || (typeof window !== 'undefined' ? localStorage.getItem('cashbook_token') : null);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: [
    'Auth',
    'Wallets',
    'Categories',
    'Transactions',
    'Budgets',
    'Goals',
    'Debts',
    'Recurring',
    'Reports',
    'Notifications',
    'User'
  ],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['Auth', 'Wallets', 'Reports', 'Transactions']
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData
      }),
      invalidatesTags: ['Auth', 'Wallets', 'Categories']
    }),
    logoutUser: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      invalidatesTags: ['Auth']
    }),
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: data
      })
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data
      })
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data
      })
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Auth']
    }),

    // Wallets
    getWallets: builder.query({
      query: (includeArchived = false) => `/wallets?includeArchived=${includeArchived}`,
      providesTags: ['Wallets']
    }),
    getWallet: builder.query({
      query: (id) => `/wallets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Wallets', id }]
    }),
    createWallet: builder.mutation({
      query: (data) => ({
        url: '/wallets',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Wallets', 'Reports']
    }),
    updateWallet: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/wallets/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Wallets', 'Reports']
    }),
    archiveWallet: builder.mutation({
      query: (id) => ({
        url: `/wallets/${id}/archive`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Wallets', 'Reports']
    }),
    unarchiveWallet: builder.mutation({
      query: (id) => ({
        url: `/wallets/${id}/unarchive`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Wallets', 'Reports']
    }),
    reconcileWallet: builder.mutation({
      query: (id) => ({
        url: `/wallets/${id}/reconcile`,
        method: 'POST'
      }),
      invalidatesTags: ['Wallets', 'Reports']
    }),

    // Categories
    getCategories: builder.query({
      query: (type) => (type ? `/categories?type=${type}` : '/categories'),
      providesTags: ['Categories']
    }),
    createCategory: builder.mutation({
      query: (data) => ({
        url: '/categories',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Categories']
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Categories', 'Reports', 'Transactions']
    }),
    archiveCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}/archive`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Categories']
    }),

    // Transactions
    getTransactions: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            queryParams.append(key, val);
          }
        });
        return `/transactions?${queryParams.toString()}`;
      },
      providesTags: ['Transactions']
    }),
    getTransaction: builder.query({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Transactions', id }]
    }),
    createTransaction: builder.mutation({
      query: (data) => ({
        url: '/transactions',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Transactions', 'Wallets', 'Reports', 'Budgets', 'Notifications']
    }),
    updateTransaction: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/transactions/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Transactions', 'Wallets', 'Reports', 'Budgets']
    }),
    reverseTransaction: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/transactions/${id}/reverse`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: ['Transactions', 'Wallets', 'Reports', 'Budgets']
    }),
    deleteTransaction: builder.mutation({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Transactions', 'Wallets', 'Reports', 'Budgets']
    }),
    uploadReceipt: builder.mutation({
      query: (formData) => ({
        url: '/transactions/upload-receipt',
        method: 'POST',
        body: formData
      })
    }),

    // Budgets
    getBudgets: builder.query({
      query: () => '/budgets',
      providesTags: ['Budgets']
    }),
    createBudget: builder.mutation({
      query: (data) => ({
        url: '/budgets',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Budgets', 'Reports']
    }),
    updateBudget: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/budgets/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Budgets', 'Reports']
    }),
    deleteBudget: builder.mutation({
      query: (id) => ({
        url: `/budgets/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Budgets', 'Reports']
    }),

    // Savings Goals
    getGoals: builder.query({
      query: () => '/savings-goals',
      providesTags: ['Goals']
    }),
    createGoal: builder.mutation({
      query: (data) => ({
        url: '/savings-goals',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Goals']
    }),
    updateGoal: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/savings-goals/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Goals']
    }),
    contributeGoal: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/savings-goals/${id}/contribute`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Goals', 'Wallets', 'Transactions', 'Reports']
    }),
    deleteGoal: builder.mutation({
      query: (id) => ({
        url: `/savings-goals/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Goals']
    }),

    // Debts
    getDebts: builder.query({
      query: (status) => (status ? `/debts?status=${status}` : '/debts'),
      providesTags: ['Debts']
    }),
    getDebt: builder.query({
      query: (id) => `/debts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Debts', id }]
    }),
    createDebt: builder.mutation({
      query: (data) => ({
        url: '/debts',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Debts', 'Wallets', 'Transactions', 'Reports']
    }),
    updateDebt: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/debts/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Debts']
    }),
    recordDebtPayment: builder.mutation({
      query: ({ debtId, ...data }) => ({
        url: `/debts/${debtId}/payments`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Debts', 'Wallets', 'Transactions', 'Reports']
    }),
    deleteDebt: builder.mutation({
      query: (id) => ({
        url: `/debts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Debts', 'Wallets', 'Transactions', 'Reports']
    }),

    // Recurring
    getRecurringRules: builder.query({
      query: () => '/recurring',
      providesTags: ['Recurring']
    }),
    createRecurringRule: builder.mutation({
      query: (data) => ({
        url: '/recurring',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Recurring']
    }),
    updateRecurringRule: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/recurring/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Recurring']
    }),
    processRecurringRule: builder.mutation({
      query: (id) => ({
        url: `/recurring/${id}/process`,
        method: 'POST'
      }),
      invalidatesTags: ['Recurring', 'Transactions', 'Wallets', 'Reports', 'Notifications']
    }),
    deleteRecurringRule: builder.mutation({
      query: (id) => ({
        url: `/recurring/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Recurring']
    }),

    // Reports & Dashboard
    getDashboardOverview: builder.query({
      query: (period = 'monthly') => `/reports/dashboard?period=${period}`,
      providesTags: ['Reports']
    }),
    getReportSummary: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val) queryParams.append(key, val);
        });
        return `/reports/summary?${queryParams.toString()}`;
      },
      providesTags: ['Reports']
    }),
    getCashFlowChart: builder.query({
      query: (months = 6) => `/reports/cashflow?months=${months}`,
      providesTags: ['Reports']
    }),

    // Notifications
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notifications']
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Notifications']
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'PATCH'
      }),
      invalidatesTags: ['Notifications']
    }),

    // User & Profile
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User']
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['User', 'Auth']
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: '/users/change-password',
        method: 'POST',
        body: data
      })
    }),
    getSessions: builder.query({
      query: () => '/users/sessions',
      providesTags: ['User']
    }),
    revokeSession: builder.mutation({
      query: (sessionId) => ({
        url: `/users/sessions/${sessionId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['User']
    }),
    deleteAccount: builder.mutation({
      query: (data) => ({
        url: '/users/delete-account',
        method: 'DELETE',
        body: data
      }),
      invalidatesTags: ['Auth']
    })
  })
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutUserMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useGetWalletsQuery,
  useGetWalletQuery,
  useCreateWalletMutation,
  useUpdateWalletMutation,
  useArchiveWalletMutation,
  useUnarchiveWalletMutation,
  useReconcileWalletMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useArchiveCategoryMutation,
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useReverseTransactionMutation,
  useDeleteTransactionMutation,
  useUploadReceiptMutation,
  useGetBudgetsQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useContributeGoalMutation,
  useDeleteGoalMutation,
  useGetDebtsQuery,
  useGetDebtQuery,
  useCreateDebtMutation,
  useUpdateDebtMutation,
  useRecordDebtPaymentMutation,
  useDeleteDebtMutation,
  useGetRecurringRulesQuery,
  useCreateRecurringRuleMutation,
  useUpdateRecurringRuleMutation,
  useProcessRecurringRuleMutation,
  useDeleteRecurringRuleMutation,
  useGetDashboardOverviewQuery,
  useGetReportSummaryQuery,
  useGetCashFlowChartQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useDeleteAccountMutation
} = api;
