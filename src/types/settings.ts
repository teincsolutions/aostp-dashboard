// src/types/settings.ts

export interface NotificationDefaults {
  emailRequired: boolean;
  smsDefault: boolean;
  whatsappDefault: boolean;
}

export interface UIPreferences {
  tableDensity: "default" | "compact";
}

export interface FeatureFlags {
  enableExperimental?: boolean; // placeholder, read-only if not implemented
}

export interface AppSettings {
  notificationDefaults: NotificationDefaults;
  uiPreferences: UIPreferences;
  featureFlags: FeatureFlags;
}

export interface UpdateSettingsPayload {
  notificationDefaults?: NotificationDefaults;
  uiPreferences?: UIPreferences;
  featureFlags?: FeatureFlags;
}
