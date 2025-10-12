// src/hooks/useCities.ts

import { useQuery } from "@tanstack/react-query";
import { cityService } from "@/services/cityService";
import { CityQueryParams, City } from "@/types/exchangeRate";

// Query keys for React Query
export const cityKeys = {
  all: ["cities"] as const,
  lists: () => [...cityKeys.all, "list"] as const,
  list: (params: CityQueryParams) => [...cityKeys.lists(), params] as const,
};

// Hook for fetching cities with pagination and filters
export const useCities = (params: CityQueryParams = {}) => {
  return useQuery({
    queryKey: cityKeys.list(params),
    queryFn: () => cityService.getCities(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData,
  });
};
