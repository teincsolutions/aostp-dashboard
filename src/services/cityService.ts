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

  // Create a new city
  async createCity(payload: { name: string; country: string }): Promise<City> {
    const res = await apiService.post<City>("/cities", payload);
    return res.data;
  },

  // Update an existing city
  async updateCity(id: string, payload: { name?: string; country?: string }): Promise<City> {
    const res = await apiService.patch<City>(`/cities/${id}`, payload);
    return res.data;
  },

  // Delete a city
  async deleteCity(id: string): Promise<void> {
    await apiService.delete(`/cities/${id}`);
  },
};
