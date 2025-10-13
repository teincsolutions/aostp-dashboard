// src/services/invoiceService.ts

import { apiService } from '@/services/api';
import {
  Invoice,
  Payment,
  PaymentCreatePayload,
  PaymentStats,
  Receipt,
  OutstandingBalance,
} from '@/types/invoice';

export const getInvoices = async (params?: {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: string;
}): Promise<{ data: Invoice[]; total: number }> => {
  const res = await apiService.get('/invoices', { params });
  return res.data;
};

export const getInvoice = async (invoiceId: string): Promise<Invoice> => {
  const res = await apiService.get(`/invoices/${invoiceId}`);
  return res.data;
};

export const getInvoicesByCustomer = async (
  customerId: string,
  limit?: number
): Promise<Invoice[]> => {
  const res = await apiService.get(`/invoices/customer/${customerId}`, {
    params: { limit }
  });
  return res.data?.data || [];
};

export const getInvoicePdf = async (invoiceId: string): Promise<{ url: string }> => {
  const res = await apiService.get(`/invoices/${invoiceId}/download-pdf`);
  return res.data;
};
