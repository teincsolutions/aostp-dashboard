// Payment Processing types for AOSTP Logistics Management System

import { ApiResponse, PaginatedResponse } from "./common";
import { Package } from "./package";
import { PackingList } from "./packingList";
import { Payment } from "./payment";

// Invoice status enum
export enum InvoiceStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
}

// Payment method enum
export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
  CARD = "CARD",
  DIRECT_MOMO_TRANSFER = "DIRECT_MOMO_TRANSFER",
}

// Currency enum
export enum Currency {
  USD = "USD",
  GHS = "GHS",
}

// Invoice interface (auto-generated from Packing Lists)
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  packingListId: string;
  packingList: PackingList;
  package: Package;
  totalAmount: number;
  localAmount: number;
  paidAmount: number;
  balance: number;
  currency: Currency;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

// Receipt interface
export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  customerId: string;
  customer: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  totalAmount: number;
  paidAmount: number;
  balance: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  reference?: string;
  invoiceDetails: Array<{
    invoiceNumber: string;
    amount: number;
    balance: number;
  }>;
  generatedAt: string;
}

// Payment create payload
export interface PaymentCreatePayload {
  customerId: string;
  exchangeRateId: string | null;
  invoiceIds: string[];
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}

// Search parameters
export interface PaymentSearchParams {
  search?: string; // customer name, phone, or package tracking ID
  page?: number;
  limit?: number;
}

// Outstanding balance interface
export interface OutstandingBalance {
  customerId: string;
  customer: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  totalOutstanding: number;
  currency: Currency;
  invoiceCount: number;
  oldestInvoiceDate: string;
}

// Payment history parameters
export interface PaymentHistoryParams {
  customerId?: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

// Service response types
export interface InvoicesResponse extends PaginatedResponse<Invoice> {
  correlationId: string;
}

export interface InvoiceResponse extends ApiResponse<Invoice> {
  correlationId: string;
}

export interface PaymentsResponse extends PaginatedResponse<Payment> {
  correlationId: string;
}

export interface PaymentResponse extends ApiResponse<Payment> {
  correlationId: string;
}

export interface ReceiptResponse extends ApiResponse<Receipt> {
  correlationId: string;
}

export interface OutstandingBalanceResponse
  extends ApiResponse<OutstandingBalance> {
  correlationId: string;
}

// Payment statistics interface
export interface PaymentStats {
  totals: {
    count: number;
    totalAmount: number;
    totalLocalAmount: number;
    averageAmount: number;
  };
  byPaymentMethod: {
    _count: {
      id: number;
    };
    _sum: {
      amount: number;
      localAmount: number;
    };
    paymentMethod: PaymentMethod;
  }[];

  byCurrency: {
    _count: {
      id: number;
    };
    _sum: {
      amount: number;
      localAmount: number;
    };
    currency: Currency;
  }[];
}
