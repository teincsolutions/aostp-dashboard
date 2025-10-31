import { apiService } from "@/services/api";
import { AxiosResponse } from "axios";
import {
  Kpis,
  PackagesByStatusItem,
  SeriesPoint,
  InvoiceRow,
  AgingPackageRow,
  DashboardFilters,
} from "@/types/dashboard";

// Fetch KPIs
export const getKpis = (params?: DashboardFilters) =>
  apiService
    .get<Kpis>("/dashboard/kpis", { params })
    .then((res: AxiosResponse<Kpis>) => res.data);

// Packages by status
export const getPackagesByStatus = (params: DashboardFilters) =>
  apiService
    .get<PackagesByStatusItem[]>("/dashboard/packages-by-status", { params })
    .then((res: AxiosResponse<PackagesByStatusItem[]>) => res.data);

// Packages by month
export const getPackagesByMonth = (params: DashboardFilters) =>
  apiService
    .get<SeriesPoint[]>("/dashboard/packages-by-month", { params })
    .then((res: AxiosResponse<SeriesPoint[]>) => res.data);

// Revenue trend
export const getRevenueTrend = (params: DashboardFilters) =>
  apiService
    .get<SeriesPoint[]>("/dashboard/revenue-trend", { params })
    .then((res: AxiosResponse<SeriesPoint[]>) => res.data);

// Top customers
export const getTopCustomers = (params: DashboardFilters) =>
  apiService
    .get<SeriesPoint[]>("/dashboard/top-customers", { params })
    .then((res: AxiosResponse<SeriesPoint[]>) => res.data);

// Recent invoices
export const getRecentInvoices = (params: DashboardFilters) =>
  apiService
    .get<{ rows: InvoiceRow[]; total: number }>("/dashboard/recent-invoices", {
      params,
    })
    .then(
      (res: AxiosResponse<{ rows: InvoiceRow[]; total: number }>) => res.data
    );

// Aging packages
export const getAgingPackages = (params: DashboardFilters) =>
  apiService
    .get<{ rows: AgingPackageRow[]; total: number }>(
      "/dashboard/aging-packages",
      { params }
    )
    .then(
      (res: AxiosResponse<{ rows: AgingPackageRow[]; total: number }>) =>
        res.data
    );
