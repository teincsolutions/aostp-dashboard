// src/services/shippingRateService.ts

import { apiService } from "@/services/api";
import { ShippingRate, ShippingRateCreatePayload } from "@/types/exchangeRate";
import { ShippingMode, AirShippingType } from "@/types/exchangeRate";

export const shippingRateService = {
  // Get active shipping rates
  async getActiveRates(): Promise<ShippingRate[]> {
    const res = await apiService.get<ShippingRate[]>("/shipping-rates/active");
    return res.data;
  },

  // Get shipping rate history
  async getRateHistory(params: {
    page?: number;
    limit?: number;
    shippingMode?: ShippingMode;
    airShippingType?: AirShippingType;
  }): Promise<{ data: ShippingRate[]; total: number }> {
    const { page = 1, limit = 10, ...filters } = params;
    const res = await apiService.get<{ data: ShippingRate[]; total: number }>(
      `/shipping-rates/history`,
      {
        params: { page, limit, ...filters },
      }
    );
    return res.data;
  },

  // Set new shipping rate
  async setShippingRate(payload: ShippingRateCreatePayload): Promise<ShippingRate> {
    const res = await apiService.post<ShippingRate>("/shipping-rates", {
      ...payload,
      currency: payload.currency || "USD",
    });
    return res.data;
  },

  // Update shipping rate
  async updateShippingRate(id: string, payload: Partial<ShippingRateCreatePayload>): Promise<ShippingRate> {
    const res = await apiService.put<ShippingRate>(`/shipping-rates/${id}`, payload);
    return res.data;
  },

  // Deactivate shipping rate
  async deactivateShippingRate(id: string): Promise<void> {
    await apiService.delete(`/shipping-rates/${id}`);
  },
};
