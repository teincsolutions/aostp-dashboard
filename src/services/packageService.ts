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

export const getRecentIntakes = async (
  params: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }
): Promise<{ data: PackageIntake[]; total: number }> => {
  const res = await apiService.get("/packages", {
    params: {
      ...params,
      status: "RECEIVED",
    },
  });
  return { data: res.data.items, total: res.data.total };
};

export const generateReceipt = async (
  packageId: string
): Promise<Receipt> => {
  const res = await apiService.post(`/packages/${packageId}/receipt`);
  return res.data;
};
