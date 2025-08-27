// Warehouse package types for AOSTP Logistics Management

export interface WarehousePackage {
  id: string;
  trackingNumber: string;
  customerName: string;
  warehouseLocation: string;
  daysInWarehouse: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WarehouseAgingSummary {
  location: string;
  totalPackages: number;
  agingBuckets: {
    '0-7': number;
    '8-14': number;
    '15-30': number;
    '31+': number;
  };
}
