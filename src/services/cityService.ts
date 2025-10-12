// src/services/cityService.ts

import { apiService } from "@/services/api";
import { City, CitiesResponse, CityQueryParams } from "@/types/exchangeRate";

export const cityService = {
  // Get cities with optional filters
  async getCities(params: CityQueryParams = {}): Promise<CitiesResponse> {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", ...filters } = params;
    const res = await apiService.get<CitiesResponse>("/cities", {
      params: { page, limit, sortBy, sortOrder, ...filters },
    });
    return res.data;
  },
};
