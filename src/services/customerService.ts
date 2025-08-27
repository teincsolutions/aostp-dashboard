// src/services/customerService.ts

import { apiService } from './api';
import {
  Customer,
  CustomerCreatePayload,
  CustomerUpdatePayload,
  CustomerStats,
  CustomerStatus,
} from '@/types/customer';

export const customerService = {
  getCustomers: (params: Record<string, unknown>) =>
    apiService.get<{ data: Customer[]; total: number }>('/customers', { params }),

  getCustomerById: (id: string) =>
    apiService.get<Customer>(`/customers/${id}`),

  getCustomerByCode: (customerCode: string) =>
    apiService.get<Customer>(`/customers/code/${customerCode}`),

  getCustomerByPhone: (phoneNumber: string) =>
    apiService.get<Customer>(`/customers/phone/${phoneNumber}`),

  getCustomerStats: (id: string) =>
    apiService.get<CustomerStats>(`/customers/${id}/stats`),

  createCustomer: (payload: CustomerCreatePayload) =>
    apiService.post<Customer>('/customers', payload),

  updateCustomer: (id: string, payload: CustomerUpdatePayload) =>
    apiService.patch<Customer>(`/customers/${id}`, payload),

  toggleCustomerStatus: (id: string, isActive: boolean) =>
    apiService.patch<Customer>(`/customers/${id}`, { isActive }),

  exportCustomers: (params: Record<string, unknown>, format: 'pdf' | 'excel') =>
    apiService.get<Blob>(`/customers/export`, {
      params: { ...params, format },
      responseType: 'blob',
    }),
};
