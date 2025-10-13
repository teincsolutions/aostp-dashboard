import { useQuery } from '@tanstack/react-query';
import { getInvoices, getInvoicePdf, getInvoicesByCustomer } from '@/services/invoiceService';
import { Invoice } from '@/types/invoice';

export const useCustomerInvoices = (customerId: string, limit: number = 5) => {
  return useQuery({
    queryKey: ['customer-invoices', customerId, limit],
    queryFn: () => getInvoicesByCustomer(customerId, limit),
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
    queryFn: () => getInvoices(params),
  });
};

export const useInvoicePdf = (invoiceId?: string) => {
  return useQuery({
    queryKey: ['invoice-pdf', invoiceId],
    queryFn: () => getInvoicePdf(invoiceId!),
    enabled: !!invoiceId,
  });
};
