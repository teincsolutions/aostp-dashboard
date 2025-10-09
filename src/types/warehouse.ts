// Warehouse package types for AOSTP Logistics Management

export interface Warehouse {
  id: string;
  name: string;
  warehouseId: string; // Auto-generated ID like WH001, WH002
  location: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseCreatePayload {
  name: string;
  location: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
}

export interface WarehouseUpdatePayload {
  name?: string;
  location?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
}

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
