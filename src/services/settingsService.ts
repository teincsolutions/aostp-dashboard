// src/services/settingsService.ts

import { apiService } from "@/services/api";
import { AppSettings, UpdateSettingsPayload } from "@/types/settings";

/**
 * Fetch app-level settings.
 */
export const getSettings = async (): Promise<AppSettings> => {
  const res = await apiService.get<AppSettings>("/settings");
  return res.data;
};

/**
 * Update app-level settings.
 */
export const updateSettings = async (
  payload: UpdateSettingsPayload
): Promise<AppSettings> => {
  const res = await apiService.patch<AppSettings>("/settings", payload);
  return res.data;
};
