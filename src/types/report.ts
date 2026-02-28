// ===================================
// Common Report Query Parameters
// ===================================

export interface ReportFilters {
  fromDate?: string; // ISO 8601 date string
  toDate?: string; // ISO 8601 date string
  warehouseId?: string; // UUID
  shippingMode?: "SEA" | "AIR";
  customerId?: string; // UUID
  processedById?: string; // UUID
  date?: string; // YYYY-MM-DD for End of Day report
  userId?: string; // UUID for filtering by staff user
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
  paymentSource?: string;
  processedAt: string;
  warehouse: string;
  processedBy: string;
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
  receiverName?: string;
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

export interface DestinationCityTotal {
  cityId: string;
  cityName: string;
  totalWeight: number;
  totalCBM: number;
  totalAmount: number;
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
  destinationCities: DestinationCityTotal[];
}

export interface WarehouseReportResponse {
  warehouses: WarehouseReportItem[];
  totalPackages: number;
  totalCustomers: number;
  totalWeight: number;
  totalCBM: number;
  destinationCityTotals: DestinationCityTotal[];
}

// ===================================
// 8. Debtors Report
// ===================================

export interface DebtorInvoice {
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  currency: string;
  dueDate: string;
  createdAt: string;
  packingListName: string;
  packingListId: string;
}

export interface DebtorPackingList {
  id: string;
  name: string;
  invoiceCount: number;
  outstandingBalance: number;
}

export interface DebtorItem {
  rank: number;
  customerCode: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  warehouse: string;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  outstandingBalance: number;
  invoiceCount: number;
  packingListCount: number;
  lastInvoiceDate: string;
  packingLists: DebtorPackingList[];
  invoices: DebtorInvoice[];
}

export interface DebtorsSummary {
  totalDebtors: number;
  totalOutstanding: number;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  collectionRate: number;
}

export interface DebtorsReportResponse {
  debtors: DebtorItem[];
  summary: DebtorsSummary;
  totalCount: number;
}

// ===================================
// 9. End of Day Report
// ===================================

export interface EndOfDayPaymentByMethod {
  method: string;
  count: number;
  totalGhs: number;
  totalUsd: number;
}

export interface EndOfDayPickupsByUser {
  userId: string;
  userName: string;
  count: number;
  totalQuantity: number;
}

export interface EndOfDayWarehousePayments {
  count: number;
  totalUsd: number;
  totalGhs: number;
  byMethod: EndOfDayPaymentByMethod[];
}

export interface EndOfDayWarehousePickups {
  count: number;
  totalQuantity: number;
  byUser: EndOfDayPickupsByUser[];
}

export interface EndOfDayWarehouseIntakes {
  count: number;
  totalQuantity: number;
  byUser: EndOfDayPickupsByUser[];
}

export interface EndOfDayWarehouse {
  warehouseId: string;
  warehouseName: string;
  payments: EndOfDayWarehousePayments;
  pickups: EndOfDayWarehousePickups;
  intakes: EndOfDayWarehouseIntakes;
}

export interface EndOfDayOverall {
  totalPayments: number;
  totalRevenueUsd: number;
  totalRevenueGhs: number;
  totalPickups: number;
  totalPickupQuantity: number;
  totalIntakes: number;
  totalIntakeQuantity: number;
  totalInvoicesCreated: number;
  totalInvoiceAmount: number;
}

export interface EndOfDayActivityUser {
  userId: string;
  userName: string;
  role: string;
  warehouse: string;
  paymentsProcessed: number;
  paymentsTotalGhs: number;
  paymentsTotalUsd: number;
  packagesReceived: number;
  intakeQuantity: number;
  pickupsReleased: number;
  pickupQuantity: number;
}

export interface EndOfDayReportResponse {
  reportDate: string;
  fromDate: string;
  toDate: string;
  warehouses: EndOfDayWarehouse[];
  overall: EndOfDayOverall;
  activityByUser: EndOfDayActivityUser[];
  generatedAt: string;
}
