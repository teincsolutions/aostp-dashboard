// src/hooks/useCities.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Hook for city mutations
export const useCityMutations = () => {
  const queryClient = useQueryClient();

  const createCityMutation = useMutation({
    mutationFn: cityService.createCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all });
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; country?: string } }) =>
      cityService.updateCity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all });
    },
  });

  const deleteCityMutation = useMutation({
    mutationFn: cityService.deleteCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all });
    },
  });

  return {
    createCity: createCityMutation.mutateAsync,
    updateCity: updateCityMutation.mutateAsync,
    deleteCity: deleteCityMutation.mutateAsync,
    isCreating: createCityMutation.isPending,
    isUpdating: updateCityMutation.isPending,
    isDeleting: deleteCityMutation.isPending,
  };
};
