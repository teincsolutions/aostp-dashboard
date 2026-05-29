// src/services/packageDeliveryService.ts

import { apiService } from "@/services/api";
import {
  PackageDelivery,
  CreatePackageDeliveryPayload,
  PackageDeliveryResponse,
  GetPackageDeliveriesParams,
  PackageDeliveriesResponse,
} from "@/types/package";

export const createPackageDelivery = async (
  payload: CreatePackageDeliveryPayload
): Promise<PackageDeliveryResponse> => {
  const res = await apiService.post<PackageDeliveryResponse>(
    "/package-delivery",
    payload
  );
  return res.data;
};

export const getAllPackageDeliveries = async (
  params?: GetPackageDeliveriesParams
): Promise<PackageDeliveriesResponse> => {
  const res = await apiService.get<PackageDeliveriesResponse>(
    "/package-delivery",
    { params }
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

export const getDeliveriesByInvoices = async (
  invoiceIds: string[]
): Promise<PackageDelivery[]> => {
  if (invoiceIds.length === 0) return [];
  const results = await Promise.all(
    invoiceIds.map((id) => getDeliveriesByInvoice(id))
  );
  const merged = results.flat();
  const seen = new Set<string>();
  return merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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

// Get recent deliveries with pagination
export const getRecentDeliveries = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PackageDeliveriesResponse> => {
  return getAllPackageDeliveries({
    page: params?.page || 1,
    limit: params?.limit || 20,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });
};
