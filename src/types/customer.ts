// src/types/customer.ts

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
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
  city: string;
  country: string;
  idType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVER_LICENSE';
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
  city: string;
  country: string;
  idType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVER_LICENSE';
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
  city?: string;
  country?: string;
  idType?: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVER_LICENSE';
  idNumber?: string;
  preferredChannel?: string;
  isActive?: boolean;
}

export interface CustomerStats {
  totalPackages: number;
  totalInvoices: number;
  totalPayments: number;
  outstandingBalance: number;
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
