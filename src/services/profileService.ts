// src/services/profileService.ts

import { apiService } from "@/services/api";
import { MyProfile, UpdateMyProfilePayload, SessionInfo } from "@/types/profile";

// Get current user's profile
export const getMyProfile = async (): Promise<MyProfile> => {
  const res = await apiService.get("/api/v1/users/me");
  return res.data;
};

// Update current user's profile
export const updateMyProfile = async (payload: UpdateMyProfilePayload): Promise<MyProfile> => {
  const res = await apiService.patch("/api/v1/users/me", payload);
  return res.data;
};

// Enable 2FA (returns QR or secret)
export const enable2FA = async (): Promise<{ qrCode: string; secret: string }> => {
  const res = await apiService.post("/api/v1/auth/2fa/enable");
  return res.data;
};

// Verify and enable 2FA (token required)
export const verify2FA = async (token: string): Promise<MyProfile> => {
  const res = await apiService.post("/api/v1/auth/2fa/verify", { token });
  return res.data;
};

// Disable 2FA (token required)
export const disable2FA = async (token: string): Promise<MyProfile> => {
  const res = await apiService.post("/api/v1/auth/2fa/disable", { token });
  return res.data;
};

// Get active sessions (if endpoint exists)
export const getSessions = async (): Promise<SessionInfo[]> => {
  const res = await apiService.get("/api/v1/auth/sessions");
  return res.data;
};
