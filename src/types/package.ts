// src/types/package.ts

export interface PackagePhoto {
  url: string;
  key: string;
}

export interface PackageIntakePayload {
  customerId: string;
  trackingCode: string;
  description?: string;
  weight: number;
  cbm: number;
  quantity: number;
  value: number;
  shippingMode: "SEA" | "AIR";
  airShippingType?: string;
  warehouseLocation: string;
  notes?: string;
  photos: PackagePhoto[];
}

export interface PackageIntake {
  id: string;
  trackingCode: string;
  customerId: string;
  customerName: string;
  description?: string;
  weight: number;
  cbm: number;
  quantity: number;
  value: number;
  shippingMode: "SEA" | "AIR";
  airShippingType?: string;
  warehouseLocation: string;
  notes?: string;
  photos: PackagePhoto[];
  status: string;
  createdAt: string;
  onViewReceipt?: (id: string) => void;
}

export interface Receipt {
  id: string;
  packageId: string;
  url: string;
  createdAt: string;
}

export enum ShipmentType {
  AIR = "AIR",
  SEA = "SEA",
}

export enum PackageStatus {
  RECEIVED = "RECEIVED",
  PACKED = "PACKED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
}

export interface Package {
  id: string;
  trackingNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
  description?: string;
  weight: number;
  cbm: number;
  shipmentType: ShipmentType;
  status: PackageStatus;
  createdAt: string;
  // Add other fields as needed
}
