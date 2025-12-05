// src/services/packageDeliveryService.ts

import { apiService } from "@/services/api";
import { PackageDelivery, CreatePackageDeliveryPayload } from "@/types/package";

export const createPackageDelivery = async (
  payload: CreatePackageDeliveryPayload
): Promise<PackageDelivery> => {
  const res = await apiService.post<PackageDelivery>(
    "/package-delivery",
    payload
  );
  return res.data;
};

export const getDeliveriesByInvoice = async (
  invoiceId: string
): Promise<PackageDelivery[]> => {
  const res = await apiService.get<PackageDelivery[]>(
    `/package-delivery/by-invoice/${invoiceId}`
  );
  return res.data;
};

export const getDeliveriesByCustomer = async (
  customerId: string
): Promise<PackageDelivery[]> => {
  const res = await apiService.get<PackageDelivery[]>(
    `/package-delivery/by-customer/${customerId}`
  );
  return res.data;
};

export const getDeliveryById = async (
  deliveryId: string
): Promise<PackageDelivery> => {
  const res = await apiService.get<PackageDelivery>(
    `/package-delivery/by-id/${deliveryId}`
  );
  return res.data;
};

// Get recent deliveries (using by-customer with pagination if needed)
export const getRecentDeliveries = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PackageDelivery[]> => {
  // Since there's no general list endpoint, we'll need to fetch by customer
  // For now, return empty array and handle via invoice/customer specific queries
  // Or if there's a generic endpoint, use it here
  return [];
};
