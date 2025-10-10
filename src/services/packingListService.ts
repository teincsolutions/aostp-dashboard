import { apiService } from "./api";
import {
  PackingListsResponse,
  PackingListResponse,
  PackingListSummaryResponse,
  PackingListExportResponse,
  PackingListCreatePayload,
  PackingListUpdatePayload,
  PackingListQueryParams,
  ExportFormat,
} from "@/types/packingList";
import { Package } from "@/types/package";

// Packing List service functions
export const packingListService = {
  // Get all packing lists with pagination and filters
  async getPackingLists(params: PackingListQueryParams = {}): Promise<PackingListsResponse> {
    const response = await apiService.get<PackingListsResponse>("/packing-lists", {
      params,
    });
    return response.data;
  },

  // Get packing list by ID
  async getPackingListById(id: string): Promise<PackingListResponse> {
    const response = await apiService.get<PackingListResponse>(`/packing-lists/${id}`);
    return response.data;
  },

  // Get packing list summary grouped by customer
  async getPackingListSummary(id: string): Promise<PackingListSummaryResponse> {
    const response = await apiService.get<PackingListSummaryResponse>(`/packing-lists/${id}/summary`);
    return response.data;
  },

  // Create a new packing list
  async createPackingList(payload: PackingListCreatePayload): Promise<PackingListResponse> {
    const response = await apiService.post<PackingListResponse>("/packing-lists", payload);
    return response.data;
  },

  // Update packing list
  async updatePackingList(id: string, payload: PackingListUpdatePayload): Promise<PackingListResponse> {
    const response = await apiService.patch<PackingListResponse>(`/packing-lists/${id}`, payload);
    return response.data;
  },

  // Delete packing list
  async deletePackingList(id: string): Promise<void> {
    await apiService.delete(`/packing-lists/${id}`);
  },

  // Get packing list by name
  async getPackingListByName(name: string): Promise<PackingListResponse> {
    const response = await apiService.get<PackingListResponse>(`/packing-lists/by-name/${name}`);
    return response.data;
  },

  // Add packages to packing list
  async addPackagesToPackingList(id: string, packageIds: string[]): Promise<PackingListResponse> {
    const response = await apiService.post<PackingListResponse>(`/packing-lists/${id}/packages`, {
      packageIds,
    });
    return response.data;
  },

  // Remove packages from packing list
  async removePackagesFromPackingList(id: string, packageIds: string[]): Promise<PackingListResponse> {
    const response = await apiService.delete<PackingListResponse>(`/packing-lists/${id}/packages`, {
      data: { packageIds },
    });
    return response.data;
  },

  // Export packing list
  async exportPackingList(id: string, format: ExportFormat): Promise<PackingListExportResponse> {
    const response = await apiService.get<PackingListExportResponse>(`/packing-lists/${id}/export`, {
      params: { format },
    });
    return response.data;
  },

  // Get unassigned packages (for package selection)
  async getUnassignedPackages(params: { search?: string; page?: number; limit?: number } = {}): Promise<{data: Package[], meta: any}> {
    const response = await apiService.get("/packages", {
      params: {
        ...params,
        packingListId: "", // Empty string to get unassigned packages
        status: "RECEIVED",
      },
    });
    return response.data;
  },

  // Get active containers (for container selection) - optionally filter by container type
  async getActiveContainers(containerType?: string): Promise<PackingListsResponse> {
    const response = await apiService.get("/containers/active", {
      params: containerType ? { containerType } : undefined,
    });
    return response.data;
  },

  // Finalize packing list (generate invoices without currency conversion)
  async finalizePackingList(id: string): Promise<PackingListResponse> {
    const response = await apiService.patch<PackingListResponse>(`/packing-lists/${id}/finalize`);
    return response.data;
  },
};
