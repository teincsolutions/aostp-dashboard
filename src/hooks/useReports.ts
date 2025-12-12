import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getPaymentsReport,
  getPackingListsReport,
  getCustomerLeagueReport,
  getShippingMethodReport,
  getGeneralReport,
  getPickupsReport,
  getWarehouseReport,
} from "@/services/reportService";
import {
  ReportFilters,
  PaymentsReportResponse,
  PackingListsReportResponse,
  CustomerLeagueReportResponse,
  ShippingMethodReportResponse,
  GeneralReportResponse,
  PickupsReportResponse,
  WarehouseReportResponse,
} from "@/types/report";
import { UserRole } from "@/types/common";

// ===================================
// Role-Based Access Control Helper
// ===================================

const ALLOWED_ROLES = {
  SUPER_ADMIN: ["SUPER_ADMIN"],
  FINANCE_MANAGER: ["SUPER_ADMIN", "FINANCE_MANAGER"],
  OPERATIONS_CLERK: ["SUPER_ADMIN", "FINANCE_MANAGER", "OPERATIONS_CLERK"],
};

const hasAccess = (
  userRole: UserRole | undefined,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

// ===================================
// 1. Payments Report Hook
// ===================================

/**
 * Hook to fetch Payments Report
 *
 * Permissions: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 *
 * @param filters - Optional filters (fromDate, toDate, warehouseId, customerId)
 * @param userRole - Current user role for access control
 * @param enabled - Whether query should be enabled
 */
export const usePaymentsReport = (
  filters?: ReportFilters,
  userRole?: UserRole,
  enabled: boolean = true
): UseQueryResult<PaymentsReportResponse, Error> => {
  const canAccess = hasAccess(
    userRole,
    ALLOWED_ROLES.OPERATIONS_CLERK as UserRole[]
  );

  return useQuery<PaymentsReportResponse, Error>({
    queryKey: ["reports", "payments", filters],
    queryFn: () => getPaymentsReport(filters),
    enabled: enabled && canAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// 2. Packing Lists Report Hook
// ===================================

/**
 * Hook to fetch Packing Lists Report
 *
 * Permissions: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 *
 * @param filters - Optional filters (fromDate, toDate, warehouseId)
 * @param userRole - Current user role for access control
 * @param enabled - Whether query should be enabled
 */
export const usePackingListsReport = (
  filters?: ReportFilters,
  userRole?: UserRole,
  enabled: boolean = true
): UseQueryResult<PackingListsReportResponse, Error> => {
  const canAccess = hasAccess(
    userRole,
    ALLOWED_ROLES.OPERATIONS_CLERK as UserRole[]
  );

  return useQuery<PackingListsReportResponse, Error>({
    queryKey: ["reports", "packing-lists", filters],
    queryFn: () => getPackingListsReport(filters),
    enabled: enabled && canAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// 3. Customer League Report Hook
// ===================================

/**
 * Hook to fetch Customer League Report
 *
 * Permissions: SUPER_ADMIN, FINANCE_MANAGER
 *
 * @param filters - Optional filters (fromDate, toDate, warehouseId, customerId)
 * @param userRole - Current user role for access control
 * @param enabled - Whether query should be enabled
 */
export const useCustomerLeagueReport = (
  filters?: ReportFilters,
  userRole?: UserRole,
  enabled: boolean = true
): UseQueryResult<CustomerLeagueReportResponse, Error> => {
  const canAccess = hasAccess(
    userRole,
    ALLOWED_ROLES.FINANCE_MANAGER as UserRole[]
  );

  return useQuery<CustomerLeagueReportResponse, Error>({
    queryKey: ["reports", "customer-league", filters],
    queryFn: () => getCustomerLeagueReport(filters),
    enabled: enabled && canAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// 4. Shipping Method Report Hook
// ===================================

/**
 * Hook to fetch Shipping Method Report
 *
 * Permissions: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 *
 * @param filters - Optional filters (fromDate, toDate, warehouseId)
 * @param userRole - Current user role for access control
 * @param enabled - Whether query should be enabled
 */
export const useShippingMethodReport = (
  filters?: ReportFilters,
  userRole?: UserRole,
  enabled: boolean = true
): UseQueryResult<ShippingMethodReportResponse, Error> => {
  const canAccess = hasAccess(
    userRole,
    ALLOWED_ROLES.OPERATIONS_CLERK as UserRole[]
  );

  return useQuery<ShippingMethodReportResponse, Error>({
    queryKey: ["reports", "shipping-method", filters],
    queryFn: () => getShippingMethodReport(filters),
    enabled: enabled && canAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// 5. General Report Hook
// ===================================

/**
 * Hook to fetch General Report
 *
 * Permissions: SUPER_ADMIN, FINANCE_MANAGER
 *
 * @param filters - Optional filters (fromDate, toDate, warehouseId, customerId)
 * @param userRole - Current user role for access control
 * @param enabled - Whether query should be enabled
 */
export const useGeneralReport = (
  filters?: ReportFilters,
  userRole?: UserRole,
  enabled: boolean = true
): UseQueryResult<GeneralReportResponse, Error> => {
  const canAccess = hasAccess(
    userRole,
    ALLOWED_ROLES.FINANCE_MANAGER as UserRole[]
  );

  return useQuery<GeneralReportResponse, Error>({
    queryKey: ["reports", "general", filters],
    queryFn: () => getGeneralReport(filters),
    enabled: enabled && canAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// 6. Pickups Report Hook
// ===================================

/**
 * Hook to fetch Pickups Report
 *
 * Permissions: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 *
 * @param filters - Optional filters (fromDate, toDate, customerId)
 * @param userRole - Current user role for access control
 * @param enabled - Whether query should be enabled
 */
export const usePickupsReport = (
  filters?: ReportFilters,
  userRole?: UserRole,
  enabled: boolean = true
): UseQueryResult<PickupsReportResponse, Error> => {
  const canAccess = hasAccess(
    userRole,
    ALLOWED_ROLES.OPERATIONS_CLERK as UserRole[]
  );

  return useQuery<PickupsReportResponse, Error>({
    queryKey: ["reports", "pickups", filters],
    queryFn: () => getPickupsReport(filters),
    enabled: enabled && canAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// 7. Warehouse Report Hook
// ===================================

/**
 * Hook to fetch Warehouse Report
 *
 * Permissions: SUPER_ADMIN, FINANCE_MANAGER
 *
 * @param filters - Optional filters (fromDate, toDate, warehouseId)
 * @param userRole - Current user role for access control
 * @param enabled - Whether query should be enabled
 */
export const useWarehouseReport = (
  filters?: ReportFilters,
  userRole?: UserRole,
  enabled: boolean = true
): UseQueryResult<WarehouseReportResponse, Error> => {
  const canAccess = hasAccess(
    userRole,
    ALLOWED_ROLES.FINANCE_MANAGER as UserRole[]
  );

  return useQuery<WarehouseReportResponse, Error>({
    queryKey: ["reports", "warehouses", filters],
    queryFn: () => getWarehouseReport(filters),
    enabled: enabled && canAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
