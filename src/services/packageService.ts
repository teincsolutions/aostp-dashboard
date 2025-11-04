// src/services/packageService.ts

import { apiService } from "@/services/api";
import {
  CreatePackagePayload,
  PackagePhoto,
  Receipt,
  Package,
  PackageItem,
  UpdatePackagePayload,
  PackageStatusPackages,
} from "@/types/package";

export const createPackage = async (
  payload: CreatePackagePayload
): Promise<Package> => {
  const res = await apiService.post<Package>("/packages", payload);
  return res.data;
};

export const uploadPackagePhoto = async (
  packageId: string,
  file: File
): Promise<PackagePhoto> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiService.post(`/packages/${packageId}/photos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const uploadPackageFiles = async (
  files: File[],
  folder?: "pictures" | "videos",
  bucketType?: "packages" | "users" | "logs"
): Promise<{ key: string; url: string; bucket: string; size: number }[]> => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append("files", file);
  });

  if (folder) formData.append("folder", folder);
  if (bucketType) formData.append("bucketType", bucketType);

  const res = await apiService.post("/uploads/packages", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getRecentIntakes = async (params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{ data: Package[]; total: number }> => {
  const res = await apiService.get("/packages", {
    params: {
      ...params,
      status: PackageStatusPackages.IN_WAREHOUSE,
    },
  });
  return { data: res.data.data, total: res.data.meta.total };
};

export const getPackage = async (id: string): Promise<Package> => {
  const res = await apiService.get(`/packages/${id}`);
  return res.data;
};

export const updatePackageIntake = async (
  id: string,
  payload: UpdatePackagePayload
): Promise<Package> => {
  const res = await apiService.patch(`/packages/${id}`, payload);
  return res.data;
};

export const deletePackage = async (id: string): Promise<void> => {
  await apiService.delete(`/packages/${id}`);
};

export const generateReceipt = async (packageId: string): Promise<Receipt> => {
  const res = await apiService.post(`/packages/${packageId}/receipt`);
  return res.data;
};

export const getPackageReceipt = async (
  packageId: string
): Promise<{ url: string }> => {
  const res = await apiService.get(`/packages/${packageId}/receipt`);
  return res.data;
};

// ===== NEW PACKAGE MANAGEMENT SYSTEM =====

// Packages API (Trackable units)
export const getPackages = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  warehouse_id?: string;
  customer_code?: string;
  is_consolidated?: boolean;
}): Promise<{ data: Package[]; total: number }> => {
  const res = await apiService.get("/packages", { params });
  return res.data;
};

export const getPackageDetails = async (
  packageId: string
): Promise<Package> => {
  const res = await apiService.get(`/packages/${packageId}`);
  return res.data;
};

export const updatePackage = async (
  packageId: string,
  payload: Partial<Package>
): Promise<Package> => {
  const res = await apiService.patch(`/packages/${packageId}`, payload);
  return res.data;
};

export const deletePackageV2 = async (packageId: string): Promise<void> => {
  await apiService.delete(`/packages/${packageId}`);
};

export const consolidatePackages = async (payload: {
  items: string[]; // package_ids to consolidate
  tracking_code: string;
  mode: string;
  customer_code: string;
  warehouse_id: string;
}): Promise<Package> => {
  const res = await apiService.post("/packages/consolidate", payload);
  return res.data;
};

export const generateTrackingCode = async (): Promise<{
  tracking_code: string;
}> => {
  const res = await apiService.post("/packages/generate-tracking");
  return res.data;
};

// Package Items API (Physical units)
export const getPackageItems = async (params?: {
  page?: number;
  limit?: number;
  package_id?: string; // Filter by consolidated package
  warehouse_id?: string;
  status?: string;
  customer_code?: string;
}): Promise<{ data: PackageItem[]; total: number }> => {
  const res = await apiService.get("/package-items", { params });
  return res.data;
};

export const getPackageItem = async (itemId: string): Promise<PackageItem> => {
  const res = await apiService.get(`/package-items/${itemId}`);
  return res.data;
};

export const updatePackageItem = async (
  itemId: string,
  payload: Partial<PackageItem>
): Promise<PackageItem> => {
  const res = await apiService.patch(`/package-items/${itemId}`, payload);
  return res.data;
};

// ===== LEGACY SUPPORT =====

export const updatePackageStatus = async (
  id: string,
  status: string
): Promise<Package> => {
  const res = await apiService.patch(`/packages/${id}/status`, null, {
    params: { status },
  });
  return res.data;
};
