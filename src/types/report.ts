// ===================================
// Common Report Query Parameters
// ===================================

export interface ReportFilters {
  fromDate?: string; // ISO 8601 date string
  toDate?: string; // ISO 8601 date string
  warehouseId?: string; // UUID
  shippingMode?: "SEA" | "AIR";
  customerId?: string; // UUID
  processedById?: string; // UUID - filter by user who processed
}

// ===================================
// 1. Payments Report
// ===================================

export interface PaymentReportItem {
  paymentCode: string;
  customerCode: string;
  customerName: string;
  amount: number;
  localAmount: number;
  currency: string;
  paymentMethod: string;
  paymentSource?: "PAID_IN_GHANA" | "PAID_IN_CHINA";
  processedAt: string;
  warehouse: string;
  processedBy:
    | string
    | { firstName: string; lastName: string }
    | { firstName: string; lastName: string; email: string };
}

export interface PaymentReportTotals {
  usdTotal: number;
  ghsTotal: number;
  otherCurrencies: {
    currency: string;
    total: number;
  }[];
}

export interface PaymentsReportResponse {
  payments: PaymentReportItem[];
  totals: PaymentReportTotals;
  totalCount: number;
}

// ===================================
// 2. Packing List Report
// ===================================

export interface PackingListInvoiceStats {
  total: number;
  paid: number;
  unpaid: number;
  partial: number;
  paidPercentage: number;
  unpaidPercentage: number;
  partialPercentage: number;
}

export interface PackingListReportItem {
  id: string;
  name: string;
  containerNumber: string;
  totalPackages: number;
  totalCustomers: number;
  totalWeight: number;
  totalCBM: number;
  totalShippingCost: number;
  invoiceStats: PackingListInvoiceStats;
  loadingDate: string;
  eta: string;
}

export interface PackingListsReportResponse {
  totalInvoices: number;
  paid: number;
  unpaid: number;
  partial: number;
  paidPercentage: number;
  unpaidPercentage: number;
  partialPercentage: number;
  totalShippingCost: number;
  totalCBM: number;
  totalWeight: number;
  packingLists: PackingListReportItem[];
}

// ===================================
// 3. Customer League Report
// ===================================

export interface CustomerLeagueItem {
  customerCode: string;
  customerName: string;
  value: number;
  rank: number;
}

export interface CustomerLeagueReportResponse {
  topByInvoices: CustomerLeagueItem[];
  topByPayments: CustomerLeagueItem[];
  topByCbm: CustomerLeagueItem[];
  topByWeight: CustomerLeagueItem[];
}

// ===================================
// 4. Shipping Method Report
// ===================================

export interface ShippingMethodTopCustomer {
  customerCode: string;
  customerName: string;
  revenue: number;
}

export interface ShippingMethodReportItem {
  mode: "SEA" | "AIR";
  revenue: number;
  invoiceCount: number;
  outstandingCount: number;
  customerCount: number;
  topCustomers: ShippingMethodTopCustomer[];
}

export interface ShippingMethodReportResponse {
  shippingMethods: ShippingMethodReportItem[];
}

// ===================================
// 5. General Report
// ===================================

export interface GeneralReportCustomer {
  customerCode: string;
  customerName: string;
  totalInvoices: number;
  totalInvoiceAmount: number;
  totalPayments: number;
  totalPaymentAmount: number;
  pickupRate: number;
  shippingModesUsed: string[];
  firstDate: string;
  lastDate: string;
}

export interface GeneralReportResponse {
  topCustomers: GeneralReportCustomer[];
  totalCustomers: number;
}

// ===================================
// 6. Pickup Report
// ===================================

export interface PickupReportItem {
  customerCode: string;
  customerName: string;
  invoiceNumber: string;
  pickupCode: string;
  pickupDate: string;
  quantity: number;
  warehouse: string;
  status: string;
  trackingCode: string;
  description: string;
  deliveryId: string;
  receiverName?: string | { firstName: string; lastName: string };
  notes?: string;
}

export interface PickupsReportResponse {
  pickups: PickupReportItem[];
  totalCount: number;
}

// ===================================
// 7. Warehouse Report
// ===================================

export interface WarehousePackingList {
  id: string;
  name: string;
  totalPackages: number;
}

export interface WarehouseReportItem {
  id: string;
  name: string;
  totalPackages: number;
  totalCustomers: number;
  totalWeight: number;
  totalCBM: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  packingLists: WarehousePackingList[];
}

export interface WarehouseReportResponse {
  warehouses: WarehouseReportItem[];
  totalPackages: number;
  totalCustomers: number;
  totalWeight: number;
  totalCBM: number;
}
