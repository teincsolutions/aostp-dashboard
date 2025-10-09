import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  dueDate: string;
}

export const useCustomerInvoices = (customerId: string, limit: number = 5) => {
  return useQuery({
    queryKey: ['customer-invoices', customerId, limit],
    queryFn: async (): Promise<Invoice[]> => {
      if (!customerId) return [];
      const response = await apiService.get(`/customers/${customerId}/invoices`, {
        params: { limit }
      });
      return response.data?.data || [];
    },
    enabled: !!customerId,
  });
};

export const useInvoices = (params?: {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async (): Promise<{ data: Invoice[]; total: number }> => {
      const response = await apiService.get('/invoices', { params });
      return {
        data: response.data?.data || [],
        total: response.data?.meta?.total || 0
      };
    },
  });
};
