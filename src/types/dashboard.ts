// Dashboard KPIs
export interface Kpis {
  customersTotal: number;
  packagesTotal: number;
  seaTotal: number;
  airTotal: number;
  activeContainers: number;
  outstandingInvoicesCount: number;
  outstandingInvoicesAmount: number;
}

// Chart series point
export interface SeriesPoint {
  x: string | number | Date;
  y: number;
}

// Packages by status
export interface PackagesByStatusItem {
  status: string;
  count: number;
}

// Invoice table row
export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customer: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
  createdAt: string;
}

// Aging package table row
export interface AgingPackageRow {
  id: string;
  trackingNumber: string;
  customer: string;
  daysInWarehouse: number;
  status: string;
  createdAt: string;
}

// Dashboard filters
export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}
