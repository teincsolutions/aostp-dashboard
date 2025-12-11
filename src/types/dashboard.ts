// ===================================
// Dashboard Query Parameters
// ===================================

export interface DashboardKPIsParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface DashboardGraphParams {
  year?: number;
  warehouseId?: string;
  shippingMode?: "AIR" | "SEA";
  fromDate?: string;
  toDate?: string;
}

export interface RecentItemsParams {
  limit?: number;
  cursor?: string;
  warehouseId?: string;
  minDays?: number; // For aged packages filter
  fromDate?: string; // ISO date string
  toDate?: string; // ISO date string
}

// ===================================
// KPIs Endpoint Response
// ===================================

export interface DashboardKPIsResponse {
  customersTotal: number;
  packagesTotal: number;
  seaTotal: number;
  airTotal: number;
  activeContainers: number;
  outstandingInvoicesCount: number;
  outstandingInvoicesAmount: number;
  paidInvoicesAmount: number;
  paidInvoicesCount: number;
  paymentsTotals: {
    amount: number | null;
    localAmount: number | null;
  };
}

// ===================================
// Graph Endpoint Responses
// ===================================

// 1. Invoices by Month
export interface InvoicesByMonthItem {
  month: string;
  count: number;
}

export interface InvoicesByMonthResponse {
  year: number;
  series: InvoicesByMonthItem[];
}

// 2. Payments by Month (AIR vs SEA)
export interface PaymentsByMonthItem {
  month: string;
  air: number;
  sea: number;
}

export interface PaymentsByMonthResponse {
  year: number;
  series: PaymentsByMonthItem[];
}

// 3. Intakes by Month
export interface IntakesByMonthItem {
  month: string;
  count: number;
}

export interface IntakesByMonthResponse {
  year: number;
  series: IntakesByMonthItem[];
}

// 4. Pickups by Month
export interface PickupsByMonthItem {
  month: string;
  count: number;
}

export interface PickupsByMonthResponse {
  year: number;
  series: PickupsByMonthItem[];
}

// 5. Payment Methods Breakdown
export interface PaymentMethodItem {
  method: string;
  amount: number;
}

export interface PaymentMethodsResponse {
  total: number;
  methods: PaymentMethodItem[];
}

// 6. Shipping Modes Summary
export interface ShippingModesResponse {
  air: number;
  sea: number;
}

// 7. Top Customers by Amount
export interface TopCustomerByAmount {
  customerCode: string;
  customerName: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  invoiceCount: number;
}

export interface TopCustomersByAmountResponse {
  year: number;
  top: TopCustomerByAmount[];
}

// 8. Top Customers by Shipping Metrics
export interface TopCustomerShipping {
  rank: number;
  customerCode: string;
  customerName: string;
  totalCBM: number;
  totalWeight: number;
  totalInvoiceAmount: number;
  totalPaid: number;
}

export interface TopCustomersShippingResponse {
  year: number;
  topCustomers: TopCustomerShipping[];
}

// ===================================
// Recent Activity Endpoint Responses
// ===================================

// 9. Recent Intakes
export interface RecentIntakeItem {
  id: string;
  intakeTrackingCode: string;
  customerCode: string;
  customerName: string;
  description: string;
  quantity: number;
  weight: number;
  cbm: number;
  intakeDate: string;
  warehouse: string;
}

export interface RecentIntakesResponse {
  items: RecentIntakeItem[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// 10. Recent Invoices & Payments
export interface RecentInvoicePaymentItem {
  id: string;
  invoiceNumber: string;
  customerCode: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  paymentCount: number;
  createdAt: string;
  dueDate: string;
}

export interface RecentInvoicesPaymentsResponse {
  items: RecentInvoicePaymentItem[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// 11. Recent Aged Packages
export interface RecentAgedPackageItem {
  id: string;
  trackingCode: string;
  customerCode: string;
  customerName: string;
  description: string;
  status: string;
  daysInWarehouse: number;
  receivedDate: string;
  warehouse: string;
}

export interface RecentAgedPackagesResponse {
  items: RecentAgedPackageItem[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// 12. Recent Packing Lists
export interface RecentPackingListItem {
  id: string;
  name: string;
  containerNumber: string;
  status: string;
  totalPackages: number;
  totalCustomers: number;
  totalCBM: number;
  totalWeight: number;
  loadingDate: string;
  eta: string;
  warehouse: string;
}

export interface RecentPackingListsResponse {
  items: RecentPackingListItem[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// 13. Recent Pickups
export interface RecentPickupItem {
  deliveryId: string;
  customerCode: string;
  customerName: string;
  invoiceNumber: string;
  trackingCode: string;
  pickupCode: string;
  quantity: number;
  receiverName: string;
  releaseDate: string;
  warehouse: string;
}

export interface RecentPickupsResponse {
  items: RecentPickupItem[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// ===================================
// Legacy Types (keeping for backward compatibility)
// ===================================

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}
