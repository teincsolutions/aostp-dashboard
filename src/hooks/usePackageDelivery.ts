// src/hooks/usePackageDelivery.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackageDelivery,
  getAllPackageDeliveries,
  getDeliveriesByInvoice,
  getDeliveriesByCustomer,
  getDeliveryById,
} from "@/services/packageDeliveryService";
import {
  CreatePackageDeliveryPayload,
  PackageDelivery,
  GetPackageDeliveriesParams,
  PackageDeliveriesResponse,
} from "@/types/package";

const QUERY_KEYS = {
  deliveries: "deliveries",
  allDeliveries: "allDeliveries",
  deliveryByInvoice: "deliveryByInvoice",
  deliveryByCustomer: "deliveryByCustomer",
  deliveryById: "deliveryById",
};

// Hook for fetching all deliveries with filters
export function useAllPackageDeliveries(params?: GetPackageDeliveriesParams) {
  return useQuery<PackageDeliveriesResponse>({
    queryKey: [QUERY_KEYS.allDeliveries, params],
    queryFn: () => getAllPackageDeliveries(params),
  });
}

// Hook for creating a package delivery
export function useCreatePackageDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePackageDeliveryPayload) =>
      createPackageDelivery(payload),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.deliveries] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.allDeliveries] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.deliveryByInvoice],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.deliveryByCustomer],
      });
    },
  });
}

// Hook for fetching deliveries by invoice
export function useDeliveriesByInvoice(invoiceId: string | null) {
  return useQuery<PackageDelivery[]>({
    queryKey: [QUERY_KEYS.deliveryByInvoice, invoiceId],
    queryFn: () => getDeliveriesByInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
}

// Hook for fetching deliveries by customer
export function useDeliveriesByCustomer(customerId: string | null) {
  return useQuery<PackageDelivery[]>({
    queryKey: [QUERY_KEYS.deliveryByCustomer, customerId],
    queryFn: () => getDeliveriesByCustomer(customerId!),
    enabled: !!customerId,
  });
}

// Hook for fetching a single delivery by ID
export function useDeliveryById(deliveryId: string | null) {
  return useQuery<PackageDelivery>({
    queryKey: [QUERY_KEYS.deliveryById, deliveryId],
    queryFn: () => getDeliveryById(deliveryId!),
    enabled: !!deliveryId,
  });
}

// Main hook combining all delivery operations
export function usePackageDelivery() {
  const createDeliveryMutation = useCreatePackageDelivery();

  return {
    createDelivery: createDeliveryMutation.mutateAsync,
    isCreating: createDeliveryMutation.isPending,
    createError: createDeliveryMutation.error,
  };
}
