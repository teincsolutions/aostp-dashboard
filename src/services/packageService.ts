// src/services/packageService.ts

import { apiService } from "@/services/api";
import {
  PackageIntakePayload,
  PackageIntake,
  PackagePhoto,
  Receipt,
} from "@/types/package";

export const createPackage = async (payload: PackageIntakePayload): Promise<PackageIntake> => {
  const res = await apiService.post("/packages", payload);
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

export const getRecentIntakes = async (
  params: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }
): Promise<{ data: PackageIntake[]; total: number }> => {
  const res = await apiService.get("/packages", {
    params: {
      ...params,
      status: "RECEIVED",
    },
  });
  return { data: res.data.data, total: res.data.meta.total };
};

export const getPackage = async (id: string): Promise<PackageIntake> => {
  const res = await apiService.get(`/packages/${id}`);
  return res.data;
};

export const updatePackage = async (
  id: string,
  payload: PackageIntakePayload
): Promise<PackageIntake> => {
  const res = await apiService.patch(`/packages/${id}`, payload);
  return res.data;
};

export const deletePackage = async (id: string): Promise<void> => {
  await apiService.delete(`/packages/${id}`);
};

export const generateReceipt = async (
  packageId: string
): Promise<Receipt> => {
  const res = await apiService.post(`/packages/${packageId}/receipt`);
  return res.data;
};
