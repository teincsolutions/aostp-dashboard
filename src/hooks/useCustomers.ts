// src/hooks/useCustomers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import {
  CustomerCreatePayload,
  CustomerUpdatePayload,
} from '@/types/customer';

export function useCustomers(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getCustomers(params).then(res => res.data),
  });
}

export function useCustomerById(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCustomerByCode(code: string) {
  return useQuery({
    queryKey: ['customerCode', code],
    queryFn: () => customerService.getCustomerByCode(code).then(res => res.data),
    enabled: !!code,
  });
}

export function useCustomerByPhone(phoneNumber: string) {
  return useQuery({
    queryKey: ['customerPhone', phoneNumber],
    queryFn: () => customerService.getCustomerByPhone(phoneNumber).then(res => res.data),
    enabled: !!phoneNumber,
  });
}

export function useCustomerStats(id: string) {
  return useQuery({
    queryKey: ['customerStats', id],
    queryFn: () => customerService.getCustomerStats(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerCreatePayload) =>
      customerService.createCustomer(payload).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerUpdatePayload }) =>
      customerService.updateCustomer(id, payload).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useToggleCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      customerService.toggleCustomerStatus(id, isActive).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useExportCustomers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ params, format }: { params: Record<string, unknown>; format: 'pdf' | 'excel' }) =>
      customerService.exportCustomers(params, format),
  });
}

// Unified mutations for create, update, delete, toggle status
export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const createCustomer = useMutation({
    mutationFn: (payload: CustomerCreatePayload) =>
      customerService.createCustomer(payload).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerUpdatePayload }) =>
      customerService.updateCustomer(id, payload).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) =>
      customerService.toggleCustomerStatus(id, false).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const toggleCustomerStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      customerService.toggleCustomerStatus(id, isActive).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return {
    createCustomer: createCustomer.mutateAsync,
    updateCustomer: updateCustomer.mutateAsync,
    deleteCustomer: deleteCustomer.mutateAsync,
    toggleCustomerStatus: toggleCustomerStatus.mutateAsync,
    isCreating: createCustomer.status === 'pending',
    isUpdating: updateCustomer.status === 'pending',
    isDeleting: deleteCustomer.status === 'pending',
    isTogglingStatus: toggleCustomerStatus.status === 'pending',
  };
}
