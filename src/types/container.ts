// Container status enum - follows the flow: Planned → Loaded → Shipped → Arrived → Closed
export enum ContainerStatus {
  PLANNED = 'PLANNED',
  LOADED = 'LOADED',
  SHIPPED = 'SHIPPED',
  ARRIVED = 'ARRIVED',
  CLOSED = 'CLOSED',
}

// Base Container interface
export interface Container {
  id: string;
  containerNumber: string;
  vesselFlight?: string; // Vessel name or flight number
  loadingDate: string;
  departureCity: string;
  destinationCity: string;
  eta: string;
  status: ContainerStatus;
  notes?: string;
  packingListCount?: number;
  totalWeight?: number;
  totalCbm?: number;
  totalPackages?: number;
  totalRevenue?: number;
  uniqueCustomers?: number;
  actualArrival?: string;
  createdAt: string;
  updatedAt: string;
  packingLists?: {
    id: string;
    name: string;
    loadingDate: string;
    packageCount: number;
    customerName: string;
  }[];
}

// Container create payload
export interface ContainerCreatePayload {
  containerNumber: string;
  vesselFlight?: string;
  loadingDate: string;
  departureCity: string;
  destinationCity: string;
  eta: string;
  status: ContainerStatus;
  notes?: string;
}

// Container update payload
export interface ContainerUpdatePayload {
  containerNumber?: string;
  vesselFlight?: string;
  loadingDate?: string;
  departureCity?: string;
  destinationCity?: string;
  eta?: string;
  status?: ContainerStatus;
  notes?: string;
  actualArrival?: string;
}

// Container statistics
export interface ContainerStatistics {
  totalPackingLists: number;
  totalPackages: number;
  totalWeight: number;
  totalCbm: number;
  totalRevenue: number;
  uniqueCustomers: number;
  statusBreakdown: {
    [key in ContainerStatus]: number;
  };
}

// Container manifest for export
export interface ContainerManifest {
  container: Container;
  packingLists: {
    id: string;
    name: string;
    customerName: string;
    packageCount: number;
    totalWeight: number;
    totalCbm: number;
    totalValue: number;
  }[];
  summary: {
    totalPackages: number;
    totalWeight: number;
    totalCbm: number;
    totalValue: number;
    customerCount: number;
  };
}

// Container list query parameters
export interface GetContainersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: ContainerStatus;
  departureCity?: string;
  destinationCity?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Export format options
export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

// Container service response types
export interface ContainersResponse extends PaginatedResponse<Container> {
  correlationId: string;
}

export interface ContainerResponse extends ApiResponse<Container> {
  correlationId: string;
}

export interface ContainerStatisticsResponse extends ApiResponse<ContainerStatistics> {
  correlationId: string;
}

export interface ContainerManifestResponse extends ApiResponse<ContainerManifest> {
  correlationId: string;
}

export interface ContainerExportResponse extends ApiResponse<{
  downloadUrl: string;
  expiresAt: string;
}> {
  correlationId: string;
}

// Import required types from common
import { ApiResponse, PaginatedResponse } from './common';
