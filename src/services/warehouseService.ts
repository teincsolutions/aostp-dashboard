import { apiService } from "@/services/api";
import { WarehousePackage, WarehouseAgingSummary, WarehouseCreatePayload, WarehouseUpdatePayload, Warehouse } from "@/types/warehouse";
import { ApiResponse, PaginatedResponse } from "@/types/common";

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
    "/packages/warehouse",
    { params }
  );
  return response.data;
};

export const getWarehouseAgingSummary = async (params?: { location?: string }) => {
  const response = await apiService.get<{ data: WarehouseAgingSummary[] }>(
    "/packages/warehouse/aging-summary",
    { params }
  );
  return response.data;
};

export const updatePackageWarehouseLocation = async (
  id: string,
  warehouseLocation: string
) => {
  const response = await apiService.patch<WarehousePackage>(
    `/packages/${id}`,
    { warehouseLocation }
  );
  return response.data;
};

export const updatePackageStatus = async (
  id: string,
  status: string
) => {
  const response = await apiService.patch<WarehousePackage>(
    `/packages/${id}/status`,
    null,
    { params: { status } }
  );
  return response.data;
};

// Warehouse CRUD operations
export const getWarehouses = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const response = await apiService.get<PaginatedResponse<Warehouse>>("/warehouses", { params });
  return response.data;
};

export const createWarehouse = async (payload: WarehouseCreatePayload) => {
  const response = await apiService.post<ApiResponse<Warehouse>>("/warehouses", payload);
  return response.data;
};

export const updateWarehouse = async (id: string, payload: WarehouseUpdatePayload) => {
  const response = await apiService.patch<ApiResponse<Warehouse>>(`/warehouses/${id}`, payload);
  return response.data;
};

export const updateWarehouseStatus = async (id: string, status: string) => {
  const response = await apiService.patch<ApiResponse<Warehouse>>(`/warehouses/${id}/status`, null, {
    params: { status },
  });
  return response.data;
};

export const deleteWarehouse = async (id: string) => {
  const response = await apiService.delete<ApiResponse<null>>(`/warehouses/${id}`);
  return response.data;
};

// Package warehouse days update
export const updateWarehouseDays = async () => {
  const response = await apiService.post<ApiResponse<null>>("/packages/update-warehouse-days");
  return response.data;
};
