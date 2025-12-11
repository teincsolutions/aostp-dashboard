import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardKPIs,
  getInvoicesByMonth,
  getPaymentsByMonth,
  getIntakesByMonth,
  getPickupsByMonth,
  getPaymentMethods,
  getShippingModes,
  getTopCustomersByAmount,
  getTopCustomersShipping,
  getRecentIntakes,
  getRecentInvoicesPayments,
  getRecentAgedPackages,
  getRecentPackingLists,
  getRecentPickups,
} from "@/services/dashboardService";
import {
  DashboardKPIsParams,
  DashboardKPIsResponse,
  DashboardGraphParams,
  RecentItemsParams,
  InvoicesByMonthResponse,
  PaymentsByMonthResponse,
  IntakesByMonthResponse,
  PickupsByMonthResponse,
  PaymentMethodsResponse,
  ShippingModesResponse,
  TopCustomersByAmountResponse,
  TopCustomersShippingResponse,
  RecentIntakesResponse,
  RecentInvoicesPaymentsResponse,
  RecentAgedPackagesResponse,
  RecentPackingListsResponse,
  RecentPickupsResponse,
} from "@/types/dashboard";
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
  allowedRoles: string[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

// ===================================
// KPIs Hook
// ===================================

/**
 * Hook: Dashboard KPIs
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useDashboardKPIs(
  params?: DashboardKPIsParams,
  userRole?: UserRole
) {
  return useQuery<DashboardKPIsResponse>({
    queryKey: ["dashboard-kpis", params],
    queryFn: () => getDashboardKPIs(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

// ===================================
// Graph Hooks
// ===================================

/**
 * Hook: Invoices by Month
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useInvoicesByMonth(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<InvoicesByMonthResponse>({
    queryKey: ["dashboard-invoices-by-month", params],
    queryFn: () => getInvoicesByMonth(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

/**
 * Hook: Payments by Month (AIR vs SEA)
 * Access: SUPER_ADMIN, FINANCE_MANAGER
 */
export function usePaymentsByMonth(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<PaymentsByMonthResponse>({
    queryKey: ["dashboard-payments-by-month", params],
    queryFn: () => getPaymentsByMonth(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.FINANCE_MANAGER),
  });
}

/**
 * Hook: Intakes by Month
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useIntakesByMonth(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<IntakesByMonthResponse>({
    queryKey: ["dashboard-intakes-by-month", params],
    queryFn: () => getIntakesByMonth(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

/**
 * Hook: Pickups by Month
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function usePickupsByMonth(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<PickupsByMonthResponse>({
    queryKey: ["dashboard-pickups-by-month", params],
    queryFn: () => getPickupsByMonth(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

/**
 * Hook: Payment Methods Breakdown
 * Access: SUPER_ADMIN, FINANCE_MANAGER
 */
export function usePaymentMethods(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<PaymentMethodsResponse>({
    queryKey: ["dashboard-payment-methods", params],
    queryFn: () => getPaymentMethods(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.FINANCE_MANAGER),
  });
}

/**
 * Hook: Shipping Modes Summary
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useShippingModes(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<ShippingModesResponse>({
    queryKey: ["dashboard-shipping-modes", params],
    queryFn: () => getShippingModes(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

/**
 * Hook: Top Customers by Amount
 * Access: SUPER_ADMIN, FINANCE_MANAGER
 */
export function useTopCustomersByAmount(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<TopCustomersByAmountResponse>({
    queryKey: ["dashboard-top-customers-by-amount", params],
    queryFn: () => getTopCustomersByAmount(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.FINANCE_MANAGER),
  });
}

/**
 * Hook: Top Customers by Shipping Metrics
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useTopCustomersShipping(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  return useQuery<TopCustomersShippingResponse>({
    queryKey: ["dashboard-top-customers-shipping", params],
    queryFn: () => getTopCustomersShipping(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

// ===================================
// Recent Activity Hooks
// ===================================

/**
 * Hook: Recent Intakes
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useRecentIntakes(
  params?: RecentItemsParams,
  userRole?: UserRole
) {
  return useQuery<RecentIntakesResponse>({
    queryKey: ["dashboard-recent-intakes", params],
    queryFn: () => getRecentIntakes(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

/**
 * Hook: Recent Invoices & Payments
 * Access: SUPER_ADMIN, FINANCE_MANAGER
 */
export function useRecentInvoicesPayments(
  params?: RecentItemsParams,
  userRole?: UserRole
) {
  return useQuery<RecentInvoicesPaymentsResponse>({
    queryKey: ["dashboard-recent-invoices-payments", params],
    queryFn: () => getRecentInvoicesPayments(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.FINANCE_MANAGER),
  });
}

/**
 * Hook: Recent Aged Packages
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useRecentAgedPackages(
  params?: RecentItemsParams,
  userRole?: UserRole
) {
  return useQuery<RecentAgedPackagesResponse>({
    queryKey: ["dashboard-recent-aged-packages", params],
    queryFn: () => getRecentAgedPackages(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

/**
 * Hook: Recent Packing Lists
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useRecentPackingLists(
  params?: RecentItemsParams,
  userRole?: UserRole
) {
  return useQuery<RecentPackingListsResponse>({
    queryKey: ["dashboard-recent-packing-lists", params],
    queryFn: () => getRecentPackingLists(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

/**
 * Hook: Recent Pickups
 * Access: SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK
 */
export function useRecentPickups(
  params?: RecentItemsParams,
  userRole?: UserRole
) {
  return useQuery<RecentPickupsResponse>({
    queryKey: ["dashboard-recent-pickups", params],
    queryFn: () => getRecentPickups(params),
    enabled: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  });
}

// ===================================
// Composite Dashboard Hook
// ===================================

/**
 * Main dashboard hook that combines all data
 * with role-based access control
 */
export function useDashboard(
  params?: DashboardGraphParams,
  userRole?: UserRole
) {
  // KPIs params - convert from DashboardGraphParams to DashboardKPIsParams
  const kpisParams: DashboardKPIsParams = useMemo(
    () => ({
      dateFrom: params?.fromDate,
      dateTo: params?.toDate,
    }),
    [params?.fromDate, params?.toDate]
  );

  const kpis = useDashboardKPIs(kpisParams, userRole);
  const invoicesByMonth = useInvoicesByMonth(params, userRole);
  const paymentsByMonth = usePaymentsByMonth(params, userRole);
  const intakesByMonth = useIntakesByMonth(params, userRole);
  const pickupsByMonth = usePickupsByMonth(params, userRole);
  const paymentMethods = usePaymentMethods(params, userRole);
  const shippingModes = useShippingModes(params, userRole);
  const topCustomersByAmount = useTopCustomersByAmount(params, userRole);
  const topCustomersShipping = useTopCustomersShipping(params, userRole);

  const recentIntakesParams: RecentItemsParams = useMemo(
    () => ({ limit: 20, warehouseId: params?.warehouseId }),
    [params?.warehouseId]
  );

  const recentAgedPackagesParams: RecentItemsParams = useMemo(
    () => ({
      limit: 20,
      warehouseId: params?.warehouseId,
      minDays: 45, // Default to packages aged 45+ days
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    }),
    [params?.warehouseId, params?.fromDate, params?.toDate]
  );

  const recentIntakes = useRecentIntakes(recentIntakesParams, userRole);
  const recentInvoicesPayments = useRecentInvoicesPayments(
    recentIntakesParams,
    userRole
  );
  const recentAgedPackages = useRecentAgedPackages(
    recentAgedPackagesParams,
    userRole
  );
  const recentPackingLists = useRecentPackingLists(
    recentIntakesParams,
    userRole
  );
  const recentPickups = useRecentPickups(recentIntakesParams, userRole);

  return {
    // KPIs Data
    kpis: kpis.data,

    // Graph Data
    invoicesByMonth: invoicesByMonth.data,
    paymentsByMonth: paymentsByMonth.data,
    intakesByMonth: intakesByMonth.data,
    pickupsByMonth: pickupsByMonth.data,
    paymentMethods: paymentMethods.data,
    shippingModes: shippingModes.data,
    topCustomersByAmount: topCustomersByAmount.data,
    topCustomersShipping: topCustomersShipping.data,

    // Recent Activity Data
    recentIntakes: recentIntakes.data,
    recentInvoicesPayments: recentInvoicesPayments.data,
    recentAgedPackages: recentAgedPackages.data,
    recentPackingLists: recentPackingLists.data,
    recentPickups: recentPickups.data,

    // Loading States
    isLoading: {
      kpis: kpis.isLoading,
      invoicesByMonth: invoicesByMonth.isLoading,
      paymentsByMonth: paymentsByMonth.isLoading,
      intakesByMonth: intakesByMonth.isLoading,
      pickupsByMonth: pickupsByMonth.isLoading,
      paymentMethods: paymentMethods.isLoading,
      shippingModes: shippingModes.isLoading,
      topCustomersByAmount: topCustomersByAmount.isLoading,
      topCustomersShipping: topCustomersShipping.isLoading,
      recentIntakes: recentIntakes.isLoading,
      recentInvoicesPayments: recentInvoicesPayments.isLoading,
      recentAgedPackages: recentAgedPackages.isLoading,
      recentPackingLists: recentPackingLists.isLoading,
      recentPickups: recentPickups.isLoading,
    },

    // Error States
    error: {
      kpis: kpis.error,
      invoicesByMonth: invoicesByMonth.error,
      paymentsByMonth: paymentsByMonth.error,
      intakesByMonth: intakesByMonth.error,
      pickupsByMonth: pickupsByMonth.error,
      paymentMethods: paymentMethods.error,
      shippingModes: shippingModes.error,
      topCustomersByAmount: topCustomersByAmount.error,
      topCustomersShipping: topCustomersShipping.error,
      recentIntakes: recentIntakes.error,
      recentInvoicesPayments: recentInvoicesPayments.error,
      recentAgedPackages: recentAgedPackages.error,
      recentPackingLists: recentPackingLists.error,
      recentPickups: recentPickups.error,
    },

    // Refetch Functions
    refetch: {
      kpis: kpis.refetch,
      invoicesByMonth: invoicesByMonth.refetch,
      paymentsByMonth: paymentsByMonth.refetch,
      intakesByMonth: intakesByMonth.refetch,
      pickupsByMonth: pickupsByMonth.refetch,
      paymentMethods: paymentMethods.refetch,
      shippingModes: shippingModes.refetch,
      topCustomersByAmount: topCustomersByAmount.refetch,
      topCustomersShipping: topCustomersShipping.refetch,
      recentIntakes: recentIntakes.refetch,
      recentInvoicesPayments: recentInvoicesPayments.refetch,
      recentAgedPackages: recentAgedPackages.refetch,
      recentPackingLists: recentPackingLists.refetch,
      recentPickups: recentPickups.refetch,
    },

    // Access Control
    hasFinanceAccess: hasAccess(userRole, ALLOWED_ROLES.FINANCE_MANAGER),
    hasOperationsAccess: hasAccess(userRole, ALLOWED_ROLES.OPERATIONS_CLERK),
  };
}
