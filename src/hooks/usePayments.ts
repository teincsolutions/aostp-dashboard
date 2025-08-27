import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import {
  PaymentSearchParams,
  PaymentHistoryParams,
  PaymentCreatePayload,
  Invoice,
  Payment,
  OutstandingBalance,
  PaymentStats,
} from "@/types/invoice";

// Query keys for React Query
export const paymentKeys = {
  all: ["payments"] as const,
  search: (params: PaymentSearchParams) => [...paymentKeys.all, "search", params] as const,
  customerInvoices: (customerId: string) => [...paymentKeys.all, "customer", customerId, "invoices"] as const,
  packageInvoices: (trackingId: string) => [...paymentKeys.all, "package", trackingId, "invoices"] as const,
  history: (params: PaymentHistoryParams) => [...paymentKeys.all, "history", params] as const,
  balance: (customerId: string) => [...paymentKeys.all, "balance", customerId] as const,
  stats: (params: { dateFrom?: string; dateTo?: string; customerId?: string }) => [...paymentKeys.all, "stats", params] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
} as const;

// Hook for searching invoices by customer or package
export const useSearchInvoices = (params: PaymentSearchParams = {}) => {
  return useQuery({
    queryKey: paymentKeys.search(params),
    queryFn: async () => {
      return await paymentService.searchInvoices(params);
    },
    enabled: !!params.search,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching customer invoices
export const useCustomerInvoices = (customerId: string, params: PaymentSearchParams = {}) => {
  return useQuery({
    queryKey: paymentKeys.customerInvoices(customerId),
    queryFn: async () => {
      return await paymentService.getInvoicesByCustomer(customerId, params);
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching package invoices
export const usePackageInvoices = (trackingId: string, params: PaymentSearchParams = {}) => {
  return useQuery({
    queryKey: paymentKeys.packageInvoices(trackingId),
    queryFn: async () => {
      return await paymentService.getInvoicesByPackage(trackingId, params);
    },
    enabled: !!trackingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching payment history
export const usePaymentHistory = (params: PaymentHistoryParams = {}) => {
  return useQuery({
    queryKey: paymentKeys.history(params),
    queryFn: async () => {
      return await paymentService.getPaymentHistory(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching outstanding balance
export const useOutstandingBalance = (customerId: string) => {
  return useQuery({
    queryKey: paymentKeys.balance(customerId),
    queryFn: async () => {
      const response = await paymentService.getOutstandingBalance(customerId);
      return response.data;
    },
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for balance)
  });
};

// Hook for fetching payment statistics
export const usePaymentStats = (params: { dateFrom?: string; dateTo?: string; customerId?: string } = {}) => {
  return useQuery({
    queryKey: paymentKeys.stats(params),
    queryFn: async () => {
      const response = await paymentService.getPaymentStats(params);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for payment mutations
export const usePaymentMutations = () => {
  const queryClient = useQueryClient();

  // Make payment mutation
  const makePaymentMutation = useMutation({
    mutationFn: async (paymentData: PaymentCreatePayload) => {
      const response = await paymentService.makePayment(paymentData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.history({}) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.balance(data.customerId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.customerInvoices(data.customerId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats({}) });
      // Invalidate search results
      queryClient.invalidateQueries({ queryKey: paymentKeys.search({}) });
    },
  });

  // Generate receipt mutation
  const generateReceiptMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await paymentService.generateReceipt(paymentId);
      return response.data;
    },
    onSuccess: (data, paymentId) => {
      // Update the payment in cache with receipt data
      queryClient.setQueryData(paymentKeys.detail(paymentId), (oldData: Payment | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          receipt: data,
        };
      });
    },
  });

  return {
    makePayment: makePaymentMutation.mutateAsync,
    generateReceipt: generateReceiptMutation.mutateAsync,

    // Loading states
    isProcessingPayment: makePaymentMutation.isPending,
    isGeneratingReceipt: generateReceiptMutation.isPending,

    // Error states
    paymentError: makePaymentMutation.error,
    receiptError: generateReceiptMutation.error,
  };
};

// Hook for getting exchange rate
export const useExchangeRate = (fromCurrency: string, toCurrency: string) => {
  return useQuery({
    queryKey: ["exchangeRate", fromCurrency, toCurrency],
    queryFn: async () => {
      const response = await paymentService.getExchangeRate(fromCurrency, toCurrency);
      return response.data;
    },
    enabled: !!fromCurrency && !!toCurrency && fromCurrency !== toCurrency,
    staleTime: 30 * 60 * 1000, // 30 minutes (exchange rates don't change frequently)
  });
};
