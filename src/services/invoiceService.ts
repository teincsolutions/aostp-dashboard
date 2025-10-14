// src/services/invoiceService.ts

import { apiService } from '@/services/api';
import { PaginatedResponse } from '@/types/common';
import {
  Invoice,
} from '@/types/invoice';

export const getInvoices = async (params?: {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: string;
}): Promise<PaginatedResponse<Invoice>> => {
  const res = await apiService.get('/invoices', { params });
  return res.data;
};

export const getInvoice = async (invoiceId: string): Promise<Invoice> => {
  const res = await apiService.get(`/invoices/${invoiceId}`);
  return res.data;
};

export const getInvoicesByCustomer = async (
  customerId: string,
  params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }
): Promise<PaginatedResponse<Invoice>> => {
  const res = await apiService.get(`/invoices/customer/${customerId}`, {
    params
  });
  return res.data;
};

export const getInvoicePdf = async (invoiceId: string): Promise<{ url: string }> => {
  const res = await apiService.get(`/invoices/${invoiceId}/download-pdf`);
  return res.data;
};
