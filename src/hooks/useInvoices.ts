import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvoices,
  getInvoice,
  getInvoicePdf,
  getInvoicesByCustomer,
  regenerateInvoicePdf,
  updateInvoice,
  getPendingInvoices,
  deleteInvoice,
} from "@/services/invoiceService";

export const useCustomerInvoices = (
  customerId: string,
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  },
) => {
  return useQuery({
    queryKey: ["customer-invoices", customerId, params],
    queryFn: () => getInvoicesByCustomer(customerId, params),
    enabled: !!customerId,
  });
};

export const useInvoices = (params?: {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  packingListId?: string;
}) => {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => getInvoices(params),
  });
};

export const useInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!invoiceId,
  });
};

export const usePendingInvoices = (params?: {
  customerId?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["pending-invoices", params],
    queryFn: () => getPendingInvoices(params),
  });
};

export const useInvoicePdf = (invoiceId?: string) => {
  return useQuery({
    queryKey: ["invoice-pdf", invoiceId],
    queryFn: () => getInvoicePdf(invoiceId!),
    enabled: !!invoiceId,
  });
};

export const useRegenerateInvoicePdf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => regenerateInvoicePdf(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-pdf"] });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string;
      data: {
        status?: string;
        paidAmount?: number;
        notes?: string;
        dueDate?: string;
      };
    }) => updateInvoice(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-pdf"] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pending-invoices"] });
    },
  });
};
