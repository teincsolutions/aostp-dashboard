// src/hooks/useSettings.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/services/settingsService";
import { AppSettings, UpdateSettingsPayload } from "@/types/settings";

export const SETTINGS_QUERY_KEY = ["settings"];

export function useSettings() {
  const queryClient = useQueryClient();

  // Fetch settings
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AppSettings>({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: getSettings,
  });

  // Update settings
  const {
    mutate: updateSettingsMutate,
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError,
    isSuccess: isUpdateSuccess,
    reset: resetUpdate,
  } = useMutation<AppSettings, Error, UpdateSettingsPayload>({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });

  return {
    settings,
    isLoading,
    isError,
    error,
    refetch,
    updateSettingsMutate,
    isUpdating,
    isUpdateError,
    updateError,
    isUpdateSuccess,
    resetUpdate,
  };
}
