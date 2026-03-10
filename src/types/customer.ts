// src/types/customer.ts

import { City } from "./exchangeRate";
import { Invoice } from "./invoice";
import { Package } from "./package";
import { Payment } from "./payment";
import { Warehouse } from "./warehouse";

export enum CustomerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface Customer {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  address?: string;
  cityRef?: City;
  warehouse?: Warehouse;
  warehouseId?: string;
  cityId?: string;
  idType: "NATIONAL_ID" | "PASSPORT" | "DRIVER_LICENSE";
  idNumber: string;
  preferredChannel?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    packages: number;
    invoices: number;
    payments: number;
  };
}

export interface CustomerCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  address?: string;
  cityId?: string;
  warehouseId?: string;
  idType: "NATIONAL_ID" | "PASSPORT" | "DRIVER_LICENSE";
  idNumber: string;
  preferredChannel?: string;
}

export interface CustomerUpdatePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  alternatePhone?: string;
  address?: string;
  cityId?: string;
  warehouseId?: string;
  idType?: "NATIONAL_ID" | "PASSPORT" | "DRIVER_LICENSE";
  idNumber?: string;
  preferredChannel?: string;
  isActive?: boolean;
}

export interface CustomerForceDeletePayload {
  confirmName: string;
}

export interface CustomerForceDeleteSummary {
  packageDeliveries: number;
  payments: number;
  notifications: number;
  invoices: number;
  packageItems: number;
  packages: number;
}

export interface CustomerForceDeleteResponse {
  deleted: boolean;
  summary: CustomerForceDeleteSummary;
}

export interface CustomerStats {
  totalPackages: number;
  pendingPackages: number;
  deliveredPackages: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalPayments: number;
  totalSpent: number;
}

export interface CustomerStatsResponse {
  customer: Customer & {
    packages: Package[]; // We'll use the Package type from package.ts if needed
    invoices: Invoice[]; // We'll use the Invoice type from invoice.ts if needed
    payments: Payment[]; // We'll use the Payment type from payment.ts if needed
  };
  stats: CustomerStats;
  correlationId: string;
}

export enum IdType {
  NATIONAL_ID = "NATIONAL_ID",
  PASSPORT = "PASSPORT",
  DRIVERS_LICENSE = "DRIVER_LICENSE",
  VOTER_ID = "VOTER_ID",
}

export enum PreferredChannel {
  SMS = "SMS",
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
}
