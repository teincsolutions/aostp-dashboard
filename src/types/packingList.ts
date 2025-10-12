// Packing List Management types for AOSTP Logistics Management System

import { ApiResponse, PaginatedResponse } from "./common";
import { Container } from "./container";
import { Customer } from "./customer";
import { Invoice } from "./invoice";
import { Package } from "./package";

// Packing List status enum
export enum PackingListStatus {
  DRAFT = "DRAFT",
  FINALIZED = "FINALIZED",
  POSTED = "POSTED",
}

// Packing List interface
export interface PackingList {
  id: string;
  name: string;
  containerId: string;
  warehouseId: string;
  destinationCity: string;
  eta: string;
  loadingDate: string;
  status: PackingListStatus;
  totalPackages: number | null;
  totalCBM: number | null;
  totalWeight: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  container: Container | null;
  warehouse: null;
  packages: Package[];
  correlationId: string;
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
export interface CustomerPackingSummary {
  customer: Customer;
  packages: Package[];
  totalWeight: number;
  totalCBM: number;
  packageCount: number;
}

// Packing List summary (grouped by customer)
export interface PackingListSummary {
  packingList: PackingList;
  customerSummaries: CustomerPackingSummary[];
  correlationId: string;
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
  PDF = "PDF",
  EXCEL = "EXCEL",
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
  sortOrder?: "asc" | "desc";
  status?: PackingListStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
