// src/types/package.ts
import { City } from "./exchangeRate";
import { PackingList } from "./packingList";
import { Warehouse } from "./warehouse";

export interface PackagePhotoInput {
  url: string;
  key: string;
}

export interface PackagePhoto {
  id: string;
  url: string;
  key: string;
  uploadedAt: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  preferredChannel?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackagePayload {
  customerId: string;
  trackingCode: string; // Required for package operations
  description?: string;
  weight?: number; // Optional - added during package management before packing lists
  cbm?: number; // Optional - added during package management before packing lists
  quantity: number;
  shippingMode: ShippingMode;
  airShippingType?: AirType | null;
  warehouseId: string;
  notes?: string;
  photos?: PackagePhotoInput[];
  pickupCode?: string;
}

export type UpdatePackagePayload = Partial<
  Omit<CreatePackagePayload, "customerId" | "trackingCode">
> & {
  destinationCityId?: string | null;
  shippingCurrency?: Currency;
  shippingRate?: number | null;
  shippingCost?: number | null;
};

// Allow updating customer on package edit
export type UpdatePackagePayloadWithCustomer = UpdatePackagePayload & {
  customerId?: string;
};

export interface Receipt {
  id: string;
  packageId: string;
  url: string;
  createdAt: string;
}

// Package Status enum for package-dependent logic and UI
export enum PackageStatus {
  RECEIVED = "RECEIVED",
  RELEASED = "RELEASED",
}

// Package status for packages table
export enum PackageStatusPackages {
  RECEIVED = "RECEIVED",
  ASSIGNED = "ASSIGNED",
  SHIPPED = "SHIPPED",
  ARRIVED = "ARRIVED",
  RELEASED = "RELEASED",
}

export enum ShippingMode {
  AIR = "AIR",
  SEA = "SEA",
}

export enum AirType {
  NORMAL_AIR = "NORMAL_AIR",
  EXPRESS_AIR = "EXPRESS_AIR",
  BATTERY_GOODS = "BATTERY_GOODS",
  PHONES = "PHONES",
}

export enum Currency {
  USD = "USD",
  GHS = "GHS",
}

// Updated Package Items based on new structure
export interface PackageItem {
  id: string;
  intakeTrackingCode: string;
  customerId: string;
  warehouseId: string;
  description?: string;
  notes?: string;
  quantity: number;
  weight: number;
  dimensions?: any; // Probably an object with height, width, length
  cbm: number;
  shippingMode: ShippingMode;
  airShippingType?: AirType | null;
  status: string; // RECEIVED, etc.
  intakeDate: string;
  packageId?: string | null;
  intakePhotos: PackagePhoto[];
  customer?: Customer;
  warehouse?: Warehouse;
  correlationId?: string;
  destinationCityId: string | null;
  shippingCurrency: Currency;
  shippingRate: number | null;
  shippingCost: number | null;
}

// Updated Package interface based on new API structure
export interface Package {
  id: string;
  trackingCode: string;
  customerId: string;
  warehouseId: string;
  description: string;
  weight: number | null;
  cbm: number | null;
  quantity: number;
  shippingMode: ShippingMode;
  airShippingType?: AirType | null;
  isConsolidated: boolean;
  status: PackageStatusPackages; // RECEIVED, etc.
  receivedDate: string;
  daysInWarehouse: number;
  notes: string;
  packingListId: string | null;
  invoiceId: string | null;
  paymentStatus: string;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  photos: PackagePhoto[];
  packingList?: PackingList;
  invoice?: any;
  warehouse: Warehouse;
  items?: PackageItem[];
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  correlationId?: string;
  destinationCityId: string | null;
  destinationCity?: City;
  shippingCurrency: Currency;
  shippingRate: number | null;
  shippingCost: number | null;
  pickupCode?: string;
}

// Package Delivery types
export interface PackageDelivery {
  id: string;
  deliveryId: string;
  customerId: string;
  invoiceId: string;
  packageId: string;
  receiverName?: string;
  quantity: number;
  releaseDate: string;
  notes?: string;
  photos: string[];
  warehouseId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  invoice?: {
    id: string;
    invoiceNumber: string;
    packingList?: {
      container?: {
        containerNumber: string;
        destinationCity: string;
      };
    };
  };
  package?: {
    id: string;
    trackingCode: string;
    description?: string;
    warehouse?: Warehouse;
  };
}

export interface CreatePackageDeliveryPayload {
  invoiceIds: string[];
  trackingCodes?: string[]; // Optional - if omitted, all packages from invoices will be picked up
  receiverName?: string;
  quantity: number; // Required - must be at least 1
  notes?: string;
  photos?: string[];
}

export interface GetPackageDeliveriesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  customerId?: string;
  invoiceId?: string;
  packageId?: string;
  trackingCode?: string;
  warehouseId?: string;
  packingListId?: string;
  deliveryId?: string;
  receiverName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PackageDeliveriesResponse {
  data: PackageDelivery[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PackageDeliveryResponse {
  success: boolean;
  count: number;
  deliveries: PackageDelivery[];
}
