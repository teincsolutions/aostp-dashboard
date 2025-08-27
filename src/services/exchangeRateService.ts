// src/services/exchangeRateService.ts

import { apiService } from "@/services/api";
import { ExchangeRate, ExchangeRateCreatePayload } from "@/types/exchangeRate";

export const exchangeRateService = {
  async getActiveRate(): Promise<ExchangeRate> {
    const res = await apiService.get<ExchangeRate>("/api/v1/exchange-rates/current/USD/GHS");
    return res.data;
  },

  async getRateHistory(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ data: ExchangeRate[]; total: number }> {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = params;
    const res = await apiService.get<{ data: ExchangeRate[]; total: number }>(
      `/api/v1/exchange-rates`,
      {
        params: {
          page,
          limit,
          sortBy,
          sortOrder,
          fromCurrency: "USD",
          toCurrency: "GHS",
        },
      }
    );
    return res.data;
  },

  async setActiveRate(payload: ExchangeRateCreatePayload): Promise<ExchangeRate> {
    const res = await apiService.post<ExchangeRate>("/api/v1/exchange-rates", {
      ...payload,
      fromCurrency: "USD",
      toCurrency: "GHS",
    });
    return res.data;
  },
};
