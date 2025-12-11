import { apiService } from "@/services/api";
import { AxiosResponse } from "axios";
import {
  DashboardGraphParams,
  DashboardKPIsParams,
  DashboardKPIsResponse,
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

const BASE_URL = "/reports/dashboard";
const DASHBOARD_BASE_URL = "/dashboard";

// ===================================
// KPIs Endpoint
// ===================================

/**
 * Dashboard KPIs
 * GET /dashboard/kpis
 */
export const getDashboardKPIs = async (
  params?: DashboardKPIsParams
): Promise<DashboardKPIsResponse> => {
  const response = await apiService.get<DashboardKPIsResponse>(
    `${DASHBOARD_BASE_URL}/kpis`,
    { params }
  );
  return response.data;
};

// ===================================
// Graph Endpoints (Monthly/Aggregated Data)
// ===================================

/**
 * 1. Invoices by Month
 * GET /reports/dashboard/invoices-by-month
 */
export const getInvoicesByMonth = async (
  params?: DashboardGraphParams
): Promise<InvoicesByMonthResponse> => {
  const response = await apiService.get<InvoicesByMonthResponse>(
    `${BASE_URL}/invoices-by-month`,
    { params }
  );
  return response.data;
};

/**
 * 2. Payments by Month (AIR vs SEA)
 * GET /reports/dashboard/payments-by-month
 */
export const getPaymentsByMonth = async (
  params?: DashboardGraphParams
): Promise<PaymentsByMonthResponse> => {
  const response = await apiService.get<PaymentsByMonthResponse>(
    `${BASE_URL}/payments-by-month`,
    { params }
  );
  return response.data;
};

/**
 * 3. Intakes by Month
 * GET /reports/dashboard/intakes-by-month
 */
export const getIntakesByMonth = async (
  params?: DashboardGraphParams
): Promise<IntakesByMonthResponse> => {
  const response = await apiService.get<IntakesByMonthResponse>(
    `${BASE_URL}/intakes-by-month`,
    { params }
  );
  return response.data;
};

/**
 * 4. Pickups by Month
 * GET /reports/dashboard/pickups-by-month
 */
export const getPickupsByMonth = async (
  params?: DashboardGraphParams
): Promise<PickupsByMonthResponse> => {
  const response = await apiService.get<PickupsByMonthResponse>(
    `${BASE_URL}/pickups-by-month`,
    { params }
  );
  return response.data;
};

/**
 * 5. Payment Methods Breakdown
 * GET /reports/dashboard/payment-methods
 */
export const getPaymentMethods = async (
  params?: DashboardGraphParams
): Promise<PaymentMethodsResponse> => {
  const response = await apiService.get<PaymentMethodsResponse>(
    `${BASE_URL}/payment-methods`,
    { params }
  );
  return response.data;
};

/**
 * 6. Shipping Modes Summary
 * GET /reports/dashboard/shipping-modes
 */
export const getShippingModes = async (
  params?: DashboardGraphParams
): Promise<ShippingModesResponse> => {
  const response = await apiService.get<ShippingModesResponse>(
    `${BASE_URL}/shipping-modes`,
    { params }
  );
  return response.data;
};

/**
 * 7. Top Customers by Amount
 * GET /reports/dashboard/top-customers-by-amount
 */
export const getTopCustomersByAmount = async (
  params?: DashboardGraphParams
): Promise<TopCustomersByAmountResponse> => {
  const response = await apiService.get<TopCustomersByAmountResponse>(
    `${BASE_URL}/top-customers-by-amount`,
    { params }
  );
  return response.data;
};

/**
 * 8. Top Customers by Shipping Metrics
 * GET /reports/dashboard/top-customers-shipping
 */
export const getTopCustomersShipping = async (
  params?: DashboardGraphParams
): Promise<TopCustomersShippingResponse> => {
  const response = await apiService.get<TopCustomersShippingResponse>(
    `${BASE_URL}/top-customers-shipping`,
    { params }
  );
  return response.data;
};

// ===================================
// Recent Activity Endpoints (Paginated)
// ===================================

/**
 * 9. Recent Intakes
 * GET /reports/dashboard/recent-intakes
 */
export const getRecentIntakes = async (
  params?: RecentItemsParams
): Promise<RecentIntakesResponse> => {
  const response = await apiService.get<RecentIntakesResponse>(
    `${BASE_URL}/recent-intakes`,
    { params }
  );
  return response.data;
};

/**
 * 10. Recent Invoices & Payments
 * GET /reports/dashboard/recent-invoices-payments
 */
export const getRecentInvoicesPayments = async (
  params?: RecentItemsParams
): Promise<RecentInvoicesPaymentsResponse> => {
  const response = await apiService.get<RecentInvoicesPaymentsResponse>(
    `${BASE_URL}/recent-invoices-payments`,
    { params }
  );
  return response.data;
};

/**
 * 11. Recent Aged Packages
 * GET /reports/dashboard/recent-aged-packages
 */
export const getRecentAgedPackages = async (
  params?: RecentItemsParams
): Promise<RecentAgedPackagesResponse> => {
  const response = await apiService.get<RecentAgedPackagesResponse>(
    `${BASE_URL}/recent-aged-packages`,
    { params }
  );
  return response.data;
};

/**
 * 12. Recent Packing Lists
 * GET /reports/dashboard/recent-packing-lists
 */
export const getRecentPackingLists = async (
  params?: RecentItemsParams
): Promise<RecentPackingListsResponse> => {
  const response = await apiService.get<RecentPackingListsResponse>(
    `${BASE_URL}/recent-packing-lists`,
    { params }
  );
  return response.data;
};

/**
 * 13. Recent Pickups
 * GET /reports/dashboard/recent-pickups
 */
export const getRecentPickups = async (
  params?: RecentItemsParams
): Promise<RecentPickupsResponse> => {
  const response = await apiService.get<RecentPickupsResponse>(
    `${BASE_URL}/recent-pickups`,
    { params }
  );
  return response.data;
};
