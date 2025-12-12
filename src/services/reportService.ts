import { apiService } from "@/services/api";
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

const BASE_URL = "/reports";

// ===================================
// 1. Payments Report
// ===================================

/**
 * Get Payments Report
 * GET /reports/payments
 *
 * Returns comprehensive list of all payments with currency-based aggregations
 *
 * Filters: fromDate, toDate, warehouseId, customerId
 */
export const getPaymentsReport = async (
  filters?: ReportFilters
): Promise<PaymentsReportResponse> => {
  const response = await apiService.get<PaymentsReportResponse>(
    `${BASE_URL}/payments`,
    { params: filters }
  );
  return response.data;
};

// ===================================
// 2. Packing List Report
// ===================================

/**
 * Get Packing Lists Report
 * GET /reports/packing-lists
 *
 * Provides detailed statistics about invoices within packing lists
 *
 * Filters: fromDate (loadingDate), toDate (loadingDate), warehouseId
 */
export const getPackingListsReport = async (
  filters?: ReportFilters
): Promise<PackingListsReportResponse> => {
  const response = await apiService.get<PackingListsReportResponse>(
    `${BASE_URL}/packing-lists`,
    { params: filters }
  );
  return response.data;
};

// ===================================
// 3. Customer League Report
// ===================================

/**
 * Get Customer League Report
 * GET /reports/customer-league
 *
 * Ranks top customers across multiple dimensions:
 * - Invoice totals
 * - Payment totals
 * - CBM
 * - Weight
 *
 * Filters: fromDate, toDate, warehouseId, customerId
 */
export const getCustomerLeagueReport = async (
  filters?: ReportFilters
): Promise<CustomerLeagueReportResponse> => {
  const response = await apiService.get<CustomerLeagueReportResponse>(
    `${BASE_URL}/customer-league`,
    { params: filters }
  );
  return response.data;
};

// ===================================
// 4. Shipping Method Report
// ===================================

/**
 * Get Shipping Method Report
 * GET /reports/shipping-method
 *
 * Analyzes revenue, customer distribution, and outstanding invoices by shipping method
 *
 * Filters: fromDate, toDate, warehouseId
 */
export const getShippingMethodReport = async (
  filters?: ReportFilters
): Promise<ShippingMethodReportResponse> => {
  const response = await apiService.get<ShippingMethodReportResponse>(
    `${BASE_URL}/shipping-method`,
    { params: filters }
  );
  return response.data;
};

// ===================================
// 5. General Report
// ===================================

/**
 * Get General Report
 * GET /reports/general
 *
 * Comprehensive customer analytics including:
 * - Pickup rates
 * - Shipping preferences
 * - Payment behavior
 * - Transaction history
 *
 * Filters: fromDate, toDate, warehouseId, customerId
 */
export const getGeneralReport = async (
  filters?: ReportFilters
): Promise<GeneralReportResponse> => {
  const response = await apiService.get<GeneralReportResponse>(
    `${BASE_URL}/general`,
    { params: filters }
  );
  return response.data;
};

// ===================================
// 6. Pickup Report
// ===================================

/**
 * Get Pickups Report
 * GET /reports/pickups
 *
 * Detailed records of package deliveries including:
 * - Customer info
 * - Invoice details
 * - Delivery status
 *
 * Filters: fromDate (releaseDate), toDate (releaseDate), customerId
 */
export const getPickupsReport = async (
  filters?: ReportFilters
): Promise<PickupsReportResponse> => {
  const response = await apiService.get<PickupsReportResponse>(
    `${BASE_URL}/pickups`,
    { params: filters }
  );
  return response.data;
};

// ===================================
// 7. Warehouse Report
// ===================================

/**
 * Get Warehouse Report
 * GET /reports/warehouses
 *
 * Aggregates statistics by warehouse including:
 * - Packages
 * - Customers
 * - Volume/weight metrics
 * - Financial data
 *
 * Filters: fromDate, toDate, warehouseId
 */
export const getWarehouseReport = async (
  filters?: ReportFilters
): Promise<WarehouseReportResponse> => {
  const response = await apiService.get<WarehouseReportResponse>(
    `${BASE_URL}/warehouses`,
    { params: filters }
  );
  return response.data;
};
