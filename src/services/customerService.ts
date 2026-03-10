// src/services/customerService.ts

import { PaginatedResponse } from "@/types/common";
import { apiService } from "./api";
import {
  Customer,
  CustomerCreatePayload,
  CustomerForceDeletePayload,
  CustomerForceDeleteResponse,
  CustomerUpdatePayload,
  CustomerStats,
  CustomerStatsResponse,
  CustomerStatus,
} from "@/types/customer";

export const customerService = {
  getCustomers: async (params: Record<string, unknown>) =>
    (
      await apiService.get<PaginatedResponse<Customer>>("/customers", {
        params,
      })
    ).data,

  getCustomerById: async (id: string) =>
    (await apiService.get<Customer>(`/customers/${id}`)).data,

  getCustomerByCode: async (customerCode: string) =>
    (await apiService.get<Customer>(`/customers/code/${customerCode}`)).data,

  getCustomerByPhone: async (phoneNumber: string) =>
    (await apiService.get<Customer>(`/customers/phone/${phoneNumber}`)).data,

  getCustomerStats: async (id: string) =>
    (await apiService.get<CustomerStatsResponse>(`/customers/${id}/stats`))
      .data,

  createCustomer: async (payload: CustomerCreatePayload) =>
    (await apiService.post<Customer>("/customers", payload)).data,

  updateCustomer: async (id: string, payload: CustomerUpdatePayload) =>
    (await apiService.patch<Customer>(`/customers/${id}`, payload)).data,

  toggleCustomerStatus: async (id: string, isActive: boolean) =>
    (await apiService.patch<Customer>(`/customers/${id}`, { isActive })).data,

  deleteCustomer: async (id: string) =>
    (await apiService.delete(`/customers/${id}`)).data,

  forceDeleteCustomer: async (
    id: string,
    payload: CustomerForceDeletePayload,
  ) =>
    (
      await apiService.delete<CustomerForceDeleteResponse>(
        `/customers/${id}/force`,
        { data: payload },
      )
    ).data,

  exportCustomers: (params: Record<string, unknown>, format: "pdf" | "excel") =>
    apiService.get<Blob>(`/customers/export`, {
      params: { ...params, format },
      responseType: "blob",
    }),
};
