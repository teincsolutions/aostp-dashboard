import { apiService } from "./api";
import { ApiResponse } from "@/types/common";
import {
  GetContainersParams,
  ContainerCreatePayload,
  ContainerUpdatePayload,
  ContainersResponse,
  ContainerResponse,
  ContainerStatisticsResponse,
  ContainerManifestResponse,
  ContainerExportResponse,
  ExportFormat,
  Container,
} from "@/types/container";

// Container-specific API service functions
export const containerService = {
  // Get all containers with pagination and filters
  async getContainers(
    params: GetContainersParams = {}
  ): Promise<ContainersResponse> {
    const response = await apiService.get<ContainersResponse>("/containers", {
      params,
    });
    return response.data;
  },

  // Get active containers (not closed)
  async getActiveContainers(): Promise<Container[]> {
    const response = await apiService.get<Container[]>("/containers/active");
    return response.data;
  },

  // Get containers by date range
  async getContainersByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ContainersResponse> {
    const response = await apiService.get<ContainersResponse>(
      "/containers/date-range",
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },

  // Get container by ID
  async getContainerById(id: string): Promise<ContainerResponse> {
    const response = await apiService.get<ContainerResponse>(
      `/containers/${id}`
    );
    return response.data;
  },

  // Get container by container number
  async getContainerByNumber(
    containerNumber: string
  ): Promise<ContainerResponse> {
    const response = await apiService.get<ContainerResponse>(
      `/containers/number/${containerNumber}`
    );
    return response.data;
  },

  // Get container statistics
  async getContainerStatistics(
    id: string
  ): Promise<ContainerStatisticsResponse> {
    const response = await apiService.get<ContainerStatisticsResponse>(
      `/containers/${id}/statistics`
    );
    return response.data;
  },

  // Get container manifest for export
  async getContainerManifest(id: string): Promise<ContainerManifestResponse> {
    const response = await apiService.get<ContainerManifestResponse>(
      `/containers/${id}/manifest`
    );
    return response.data;
  },

  // Export container manifest
  async exportContainerManifest(
    id: string,
    format: ExportFormat
  ): Promise<ContainerExportResponse> {
    const response = await apiService.post<ContainerExportResponse>(
      `/containers/${id}/export`,
      null,
      {
        params: { format },
      }
    );
    return response.data;
  },

  // Create new container
  async createContainer(
    containerData: ContainerCreatePayload
  ): Promise<Container> {
    const response = await apiService.post<Container>(
      "/containers",
      containerData
    );
    return response.data;
  },

  // Update container
  async updateContainer(
    id: string,
    containerData: ContainerUpdatePayload
  ): Promise<Container> {
    const response = await apiService.patch<Container>(
      `/containers/${id}`,
      containerData
    );
    return response.data;
  },

  // Delete container (with status validation)
  async deleteContainer(id: string): Promise<ApiResponse<null>> {
    const response = await apiService.delete<ApiResponse<null>>(
      `/containers/${id}`
    );
    return response.data;
  },

  // Update container status
  async updateContainerStatus(
    id: string,
    status: string
  ): Promise<ContainerResponse> {
    const response = await apiService.patch<ContainerResponse>(
      `/containers/${id}/status`,
      null,
      {
        params: { status },
      }
    );
    return response.data;
  },
};
