// Warehouse package types for AOSTP Logistics Management

import { Package } from "./package";

export interface Warehouse {
  id: string;
  name: string;
  warehouseId: string; // Auto-generated ID like WH001, WH002
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseCreatePayload {
  name: string;
  location: string;
}

export interface WarehouseUpdatePayload {
  name?: string;
  location?: string;
}

export interface WarehousePackage extends Package {
  id: string;
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
