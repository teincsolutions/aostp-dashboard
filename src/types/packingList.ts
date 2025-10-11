// Packing List Management types for AOSTP Logistics Management System

import { ApiResponse, PaginatedResponse } from './common';

// Packing List status enum
export enum PackingListStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// Packing List interface
export interface PackingList {
  id: string;
  name: string;
  containerId?: string;
  container?: {
    id: string;
    containerNumber: string;
    loadingDate: string;
    destinationCity: string;
    eta: string;
    status: string;
  };
  destinationCity: string;
  loadingDate: string;
  eta?: string;
  packageCount?: number;
  totalWeight?: number;
  totalCbm?: number;
  totalValue?: number;
  status: PackingListStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Packing List Create Payload
export interface PackingListCreatePayload {
  name: string;
  containerId?: string;
  destinationCity: string;
  loadingDate: string;
  eta?: string;
  notes?: string;
  packageIds?: string[];
}

// Packing List Update Payload
export interface PackingListUpdatePayload {
  name?: string;
  containerId?: string;
  destinationCity?: string;
  loadingDate?: string;
  eta?: string;
  notes?: string;
  packageIds?: string[];
}

// Packing List filters
export interface PackingListFilters {
  status?: PackingListStatus;
  containerId?: string;
  destinationCity?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Packing List summary (grouped by customer)
export interface PackingListSummary {
  id: string;
  name: string;
  customerSummaries: Array<{
    customer: {
      id: string;
      name: string;
    };
    packages: Array<{
      id: string;
      trackingCode: string;
      description: string;
      weight: number;
      cbm: number;
      value: number;
    }>;
    totals: {
      packageCount: number;
      totalWeight: number;
      totalCbm: number;
      totalValue: number;
    };
  }>;
  totals: {
    packageCount: number;
    totalWeight: number;
    totalCbm: number;
    totalValue: number;
  };
}

// Package assignment interface
export interface PackageAssignment {
  packageId: string;
  trackingCode: string;
  description: string;
  weight: number;
  cbm: number;
  value: number;
  customerId: string;
  customerName: string;
}

// Export format enum
export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

// Service response types
export type PackingListsResponse = PaginatedResponse<PackingList>;

export type PackingListResponse = ApiResponse<PackingList>;

export type PackingListSummaryResponse = ApiResponse<PackingListSummary>;

export type PackingListExportResponse = ApiResponse<{
  url: string;
  filename: string;
}>;

// Query parameters
export interface PackingListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: PackingListStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
