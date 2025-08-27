import { apiService } from "./api";
import { ApiResponse } from "@/types/common";
import {
  PaymentSearchParams,
  PaymentHistoryParams,
  PaymentCreatePayload,
  InvoicesResponse,
  PaymentsResponse,
  PaymentResponse,
  ReceiptResponse,
  OutstandingBalanceResponse,
  PaymentStats,
} from "@/types/invoice";

// Payment processing service functions
export const paymentService = {
  // Search invoices by customer or package tracking ID
  async searchInvoices(params: PaymentSearchParams = {}): Promise<InvoicesResponse> {
    const response = await apiService.get<InvoicesResponse>("/payments/search", {
      params,
    });
    return response.data;
  },

  // Get invoices by customer ID
  async getInvoicesByCustomer(customerId: string, params: PaymentSearchParams = {}): Promise<InvoicesResponse> {
    const response = await apiService.get<InvoicesResponse>(`/payments/customer/${customerId}/invoices`, {
      params,
    });
    return response.data;
  },

  // Get invoices by package tracking ID
  async getInvoicesByPackage(trackingId: string, params: PaymentSearchParams = {}): Promise<InvoicesResponse> {
    const response = await apiService.get<InvoicesResponse>(`/payments/package/${trackingId}/invoices`, {
      params,
    });
    return response.data;
  },

  // Get payment history
  async getPaymentHistory(params: PaymentHistoryParams = {}): Promise<PaymentsResponse> {
    const response = await apiService.get<PaymentsResponse>("/payments/history", {
      params,
    });
    return response.data;
  },

  // Get outstanding balance for a customer
  async getOutstandingBalance(customerId: string): Promise<OutstandingBalanceResponse> {
    const response = await apiService.get<OutstandingBalanceResponse>(`/payments/customer/${customerId}/balance`);
    return response.data;
  },

  // Process a new payment
  async makePayment(paymentData: PaymentCreatePayload): Promise<PaymentResponse> {
    const response = await apiService.post<PaymentResponse>("/payments", paymentData);
    return response.data;
  },

  // Generate receipt for a payment
  async generateReceipt(paymentId: string): Promise<ReceiptResponse> {
    const response = await apiService.post<ReceiptResponse>(`/payments/${paymentId}/receipt`);
    return response.data;
  },

  // Get payment by ID
  async getPaymentById(id: string): Promise<PaymentResponse> {
    const response = await apiService.get<PaymentResponse>(`/payments/${id}`);
    return response.data;
  },

  // Get payment statistics
  async getPaymentStats(params: { dateFrom?: string; dateTo?: string; customerId?: string } = {}): Promise<ApiResponse<PaymentStats>> {
    const response = await apiService.get<ApiResponse<PaymentStats>>("/payments/stats", {
      params,
    });
    return response.data;
  },

  // Get exchange rate from system settings
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ApiResponse<{ rate: number }>> {
    const response = await apiService.get<ApiResponse<{ rate: number }>>(`/settings/exchange-rate`, {
      params: { from: fromCurrency, to: toCurrency },
    });
    return response.data;
  },
};
