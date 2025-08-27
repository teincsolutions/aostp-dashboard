import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getKpis,
  getPackagesByStatus,
  getPackagesByMonth,
  getRevenueTrend,
  getTopCustomers,
  getRecentInvoices,
  getAgingPackages,
} from "@/services/dashboardService";
import {
  DashboardFilters,
  Kpis,
  PackagesByStatusItem,
  SeriesPoint,
  InvoiceRow,
  AgingPackageRow,
} from "@/types/dashboard";

export function useDashboard(filters: DashboardFilters) {
  // Memoize normalized params
  const params = useMemo(() => {
    const { dateFrom, dateTo, status } = filters;
    return {
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(status ? { status } : {}),
    };
  }, [filters.dateFrom, filters.dateTo, filters.status]);

  // KPIs
  const kpisQuery = useQuery<Kpis>({
    queryKey: ["dashboard-kpis", params],
    queryFn: () => getKpis(params),
  });

  // Charts
  const packagesByStatusQuery = useQuery<PackagesByStatusItem[]>({
    queryKey: ["dashboard-packages-by-status", params],
    queryFn: () => getPackagesByStatus(params),
  });

  const packagesByMonthQuery = useQuery<SeriesPoint[]>({
    queryKey: ["dashboard-packages-by-month", params],
    queryFn: () => getPackagesByMonth(params),
  });

  const revenueTrendQuery = useQuery<SeriesPoint[]>({
    queryKey: ["dashboard-revenue-trend", params],
    queryFn: () => getRevenueTrend(params),
  });

  const topCustomersQuery = useQuery<SeriesPoint[]>({
    queryKey: ["dashboard-top-customers", params],
    queryFn: () => getTopCustomers(params),
  });

  // Tables
  const recentInvoicesQuery = useQuery<{ rows: InvoiceRow[]; total: number }>({
    queryKey: ["dashboard-recent-invoices", params],
    queryFn: () => getRecentInvoices(params),
  });

  const agingPackagesQuery = useQuery<{ rows: AgingPackageRow[]; total: number }>({
    queryKey: ["dashboard-aging-packages", params],
    queryFn: () => getAgingPackages(params),
  });

  return {
    kpis: kpisQuery.data,
    charts: {
      packagesByStatus: packagesByStatusQuery.data,
      packagesByMonth: packagesByMonthQuery.data,
      revenueTrend: revenueTrendQuery.data,
      topCustomers: topCustomersQuery.data,
    },
    tables: {
      recentInvoices: recentInvoicesQuery.data,
      agingPackages: agingPackagesQuery.data,
    },
    isLoading: {
      kpis: kpisQuery.isLoading,
      packagesByStatus: packagesByStatusQuery.isLoading,
      packagesByMonth: packagesByMonthQuery.isLoading,
      revenueTrend: revenueTrendQuery.isLoading,
      topCustomers: topCustomersQuery.isLoading,
      recentInvoices: recentInvoicesQuery.isLoading,
      agingPackages: agingPackagesQuery.isLoading,
    },
    refetch: {
      kpis: kpisQuery.refetch,
      packagesByStatus: packagesByStatusQuery.refetch,
      packagesByMonth: packagesByMonthQuery.refetch,
      revenueTrend: revenueTrendQuery.refetch,
      topCustomers: topCustomersQuery.refetch,
      recentInvoices: recentInvoicesQuery.refetch,
      agingPackages: agingPackagesQuery.refetch,
    },
    error: {
      kpis: kpisQuery.error,
      packagesByStatus: packagesByStatusQuery.error,
      packagesByMonth: packagesByMonthQuery.error,
      revenueTrend: revenueTrendQuery.error,
      topCustomers: topCustomersQuery.error,
      recentInvoices: recentInvoicesQuery.error,
      agingPackages: agingPackagesQuery.error,
    },
  };
}
