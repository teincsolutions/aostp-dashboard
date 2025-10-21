// src/hooks/useExchangeRate.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exchangeRateService } from "@/services/exchangeRateService";
import { ExchangeRate, ExchangeRateCreatePayload } from "@/types/exchangeRate";
import { handleError } from "@/utils/forms/errorUtils";

export function useExchangeRate() {
  const queryClient = useQueryClient();

  // Active rate
  const {
    data: activeRate,
    isLoading: activeLoading,
    error: activeError,
    refetch: refetchActive,
  } = useQuery<ExchangeRate>({
    queryKey: ["exchangeRate", "active"],
    queryFn: () => exchangeRateService.getActiveRate(),
  });

  // History (paginated)
  function useRateHistory(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return useQuery<{ data: ExchangeRate[]; total: number }>({
      queryKey: ["exchangeRate", "history", params],
      queryFn: () => exchangeRateService.getRateHistory(params),
    });
  }

  // Set new active rate
  const {
    mutate: setActiveRate,
    isPending: setPending,
    error: setError,
    isSuccess: setSuccess,
    reset: resetSet,
  } = useMutation({
    mutationFn: (payload: ExchangeRateCreatePayload) =>
      exchangeRateService.setActiveRate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeRate", "active"] });
      queryClient.invalidateQueries({ queryKey: ["exchangeRate", "history"] });
    },
  });

  // Delete exchange rate
  const { mutate: deleteExchangeRate, isPending: deletePending } = useMutation({
    mutationFn: (id: string) => exchangeRateService.deleteExchangeRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeRate", "active"] });
      queryClient.invalidateQueries({ queryKey: ["exchangeRate", "history"] });
    },
    onError: (error) => {
      handleError(error);
    },
  });

  return {
    activeRate,
    activeLoading,
    activeError,
    refetchActive,
    useRateHistory,
    setActiveRate,
    setPending,
    setError,
    setSuccess,
    resetSet,
    deleteExchangeRate,
    deletePending,
  };
}
