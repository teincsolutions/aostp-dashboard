import { apiService } from "@/services/api";
import { WarehousePackage, WarehouseAgingSummary } from "@/types/warehouse";

export interface GetWarehousePackagesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  warehouseLocation?: string;
  status?: string;
  daysInWarehouseFrom?: number;
  daysInWarehouseTo?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const getWarehousePackages = async (params: GetWarehousePackagesParams) => {
  const response = await apiService.get<{ data: WarehousePackage[]; total: number }>(
    "/api/v1/packages/warehouse",
    { params }
  );
  return response.data;
};

export const getWarehouseAgingSummary = async (params?: { location?: string }) => {
  const response = await apiService.get<{ data: WarehouseAgingSummary[] }>(
    "/api/v1/packages/warehouse/aging-summary",
    { params }
  );
  return response.data;
};

export const updatePackageWarehouseLocation = async (
  id: string,
  warehouseLocation: string
) => {
  const response = await apiService.patch<WarehousePackage>(
    `/api/v1/packages/${id}`,
    { warehouseLocation }
  );
  return response.data;
};

export const updatePackageStatus = async (
  id: string,
  status: string
) => {
  const response = await apiService.patch<WarehousePackage>(
    `/api/v1/packages/${id}/status`,
    null,
    { params: { status } }
  );
  return response.data;
};
