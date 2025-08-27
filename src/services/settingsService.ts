// src/services/settingsService.ts

import { apiService } from "@/services/api";
import { AppSettings, UpdateSettingsPayload } from "@/types/settings";

/**
 * Fetch app-level settings.
 */
export const getSettings = async (): Promise<AppSettings> => {
  const res = await apiService.get<AppSettings>("/api/v1/settings");
  return res.data;
};

/**
 * Update app-level settings.
 */
export const updateSettings = async (
  payload: UpdateSettingsPayload
): Promise<AppSettings> => {
  const res = await apiService.patch<AppSettings>("/api/v1/settings", payload);
  return res.data;
};
