import { apiService } from "./api";
import { ApiResponse } from "@/types/common";
import { ExchangeRate } from "@/types/exchangeRate";
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
import { Payment } from "@/types/payment";

// Payment processing service functions
export const paymentService = {
  // Search invoices by customer or package tracking ID
  async searchInvoices(
    params: PaymentSearchParams = {}
  ): Promise<InvoicesResponse> {
    const response = await apiService.get<InvoicesResponse>(
      "/payments/search",
      {
        params,
      }
    );
    return response.data;
  },

  // Get invoices by customer ID
  async getInvoicesByCustomer(
    customerId: string,
    params: PaymentSearchParams = {}
  ): Promise<InvoicesResponse> {
    const response = await apiService.get<InvoicesResponse>(
      `/payments/customer/${customerId}/invoices`,
      {
        params,
      }
    );
    return response.data;
  },

  // Get payments by customer ID
  async getPaymentsByCustomer(
    customerId: string,
    params: PaymentHistoryParams = {}
  ): Promise<PaymentsResponse> {
    const response = await apiService.get<PaymentsResponse>(
      `/payments/customer/${customerId}`,
      {
        params,
      }
    );
    return response.data;
  },

  // Get invoices by package tracking ID
  async getInvoicesByPackage(
    trackingId: string,
    params: PaymentSearchParams = {}
  ): Promise<InvoicesResponse> {
    const response = await apiService.get<InvoicesResponse>(
      `/payments/package/${trackingId}/invoices`,
      {
        params,
      }
    );
    return response.data;
  },

  // Get payment history
  async getPaymentHistory(
    params: PaymentHistoryParams = {}
  ): Promise<PaymentsResponse> {
    const response = await apiService.get<PaymentsResponse>(
      "/payments/history",
      {
        params,
      }
    );
    return response.data;
  },

  // Get all payments records with filtering
  async getAllPayments(
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      customerId?: string;
      paymentMethod?: string;
      currency?: string;
      dateFrom?: string;
      dateTo?: string;
      packingListId?: string;
      warehouseId?: string;
    } = {}
  ): Promise<PaymentsResponse> {
    const response = await apiService.get<PaymentsResponse>("/payments", {
      params,
    });
    return response.data;
  },

  // Get outstanding balance for a customer
  async getOutstandingBalance(
    customerId: string
  ): Promise<OutstandingBalanceResponse> {
    const response = await apiService.get<OutstandingBalanceResponse>(
      `/payments/customer/${customerId}/balance`
    );
    return response.data;
  },

  // Process a new payment
  async makePayment(paymentData: PaymentCreatePayload): Promise<Payment> {
    const response = await apiService.post<Payment>("/payments", paymentData);
    return response.data;
  },

  // Get payment receipt URL
  async getPaymentReceipt(paymentId: string): Promise<{ url: string }> {
    const response = await apiService.get<{ url: string }>(
      `/payments/${paymentId}/receipt`
    );
    return response.data;
  },

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiService.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  // Get payment statistics
  async getPaymentStats(
    params: { dateFrom?: string; dateTo?: string; customerId?: string } = {}
  ): Promise<PaymentStats> {
    const response = await apiService.get<PaymentStats>("/payments/stats", {
      params,
    });
    return response.data;
  },

  // Get exchange rate from system settings
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRate[]> {
    const response = await apiService.get<ExchangeRate[]>(
      `/settings/exchange-rate`,
      {
        params: { from: fromCurrency, to: toCurrency },
      }
    );
    return response.data;
  },

  // Delete a payment by ID
  async deletePayment(id: string): Promise<void> {
    return await apiService.delete(`/payments/${id}`);
  },
};
