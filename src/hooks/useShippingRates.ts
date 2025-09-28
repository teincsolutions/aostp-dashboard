// src/hooks/useShippingRates.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shippingRateService } from "@/services/shippingRateService";
import { ShippingRate, ShippingRateCreatePayload, ShippingMode, AirShippingType } from "@/types/exchangeRate";

export function useShippingRates() {
  const queryClient = useQueryClient();

  // Active shipping rates
  const {
    data: activeRates,
    isLoading: activeRatesLoading,
    refetch: refetchActive,
  } = useQuery<ShippingRate[]>({
    queryKey: ["shippingRates", "active"],
    queryFn: () => shippingRateService.getActiveRates(),
  });

  // Rate history (paginated)
  function useRateHistory(params: {
    page?: number;
    limit?: number;
    shippingMode?: ShippingMode;
    airShippingType?: AirShippingType;
  }) {
    return useQuery<{ data: ShippingRate[]; total: number }>({
      queryKey: ["shippingRates", "history", params],
      queryFn: () => shippingRateService.getRateHistory(params),
    });
  }

  // Set new shipping rate
  const {
    mutate: setShippingRate,
    isPending: setPending,
    error: setError,
    isSuccess: isSetSuccess,
    reset: resetSet,
  } = useMutation({
    mutationFn: (payload: ShippingRateCreatePayload) =>
      shippingRateService.setShippingRate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippingRates"] });
    },
  });

  // Update shipping rate
  const {
    mutate: updateShippingRate,
    isPending: updatePending,
    error: updateError,
    isSuccess: isUpdateSuccess,
    reset: resetUpdate,
  } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ShippingRateCreatePayload> }) =>
      shippingRateService.updateShippingRate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippingRates"] });
    },
  });

  // Deactivate shipping rate
  const {
    mutate: deactivateShippingRate,
    isPending: deactivatePending,
  } = useMutation({
    mutationFn: (id: string) => shippingRateService.deactivateShippingRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippingRates"] });
    },
  });

  return {
    activeRates,
    activeRatesLoading,
    refetchActive,
    useRateHistory,
    setShippingRate,
    setPending,
    setError,
    isSetSuccess,
    resetSet,
    updateShippingRate,
    updatePending,
    updateError,
    isUpdateSuccess,
    resetUpdate,
    deactivateShippingRate,
    deactivatePending,
  };
}
