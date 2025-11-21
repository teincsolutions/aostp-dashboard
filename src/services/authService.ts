import { User } from "@/types/user";
import { apiService } from "./api";
import {
  LoginRequest,
  LoginResponse,
  TwoFactorLoginRequest,
  RefreshTokenRequest,
  AuthTokens,
  TwoFactorSetup,
  TwoFactorVerifyRequest,
  TwoFactorDisableRequest,
} from "@/types/common";

const BASE_URL = "/auth";

export async function getMe(): Promise<User> {
  const response = await apiService.get(`${BASE_URL}/me`);
  return response.data;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiService.post(`${BASE_URL}/login`, credentials);
  const apiData = response.data;
  return {
    user: apiData.user,
    tokens: {
      accessToken: apiData.accessToken,
      refreshToken: apiData.refreshToken,
      expiresIn: parseExpiresIn(apiData.expiresIn),
    },
    requiresTwoFactor: apiData.requiresTwoFactor,
  };
}

export async function loginWithTwoFactor(
  credentials: TwoFactorLoginRequest
): Promise<LoginResponse> {
  const response = await apiService.post(`${BASE_URL}/login/2fa`, credentials);
  const apiData = response.data;
  return {
    user: apiData.user,
    tokens: {
      accessToken: apiData.accessToken,
      refreshToken: apiData.refreshToken,
      expiresIn: parseExpiresIn(apiData.expiresIn),
    },
    requiresTwoFactor: false,
  };
}

export async function refreshToken(
  request: RefreshTokenRequest
): Promise<AuthTokens> {
  const response = await apiService.post(`${BASE_URL}/refresh`, request);
  const apiData = response.data;
  return {
    accessToken: apiData.accessToken,
    refreshToken: apiData.refreshToken,
    expiresIn: parseExpiresIn(apiData.expiresIn),
  };
}

function parseExpiresIn(expiresIn: string): number {
  if (typeof expiresIn === "number") {
    return expiresIn;
  }
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}

export async function logout(refreshToken: string): Promise<void> {
  await apiService.post(`${BASE_URL}/logout`, { refreshToken });
}

export async function logoutAll(): Promise<void> {
  await apiService.post(`${BASE_URL}/logout-all`, {});
}

export async function enableTwoFactor(): Promise<TwoFactorSetup> {
  const response = await apiService.post(`${BASE_URL}/2fa/enable`, {});
  return response.data;
}

export async function verifyTwoFactor(
  request: TwoFactorVerifyRequest
): Promise<void> {
  await apiService.post(`${BASE_URL}/2fa/verify`, request);
}

export async function disableTwoFactor(
  request: TwoFactorDisableRequest
): Promise<void> {
  await apiService.post(`${BASE_URL}/2fa/disable`, request);
}

export async function requestBackupCode(): Promise<{ code: string }> {
  const response = await apiService.post(`${BASE_URL}/2fa/backup-code`, {});
  return response.data;
}

// Named exports for hooks/services (must be outside the class)
export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  await apiService.post("/auth/change-password", payload);
};

export const requestPasswordReset = async (email: string) => {
  await apiService.post("/auth/forgot-password", { email });
};

export const enable2FA = async () => {
  const res = await apiService.post("/auth/2fa/enable", {});
  return res.data;
};

export const verify2FA = async (payload: { token: string }) => {
  await apiService.post("/auth/2fa/verify", payload);
};

export const disable2FA = async (payload: { token: string }) => {
  await apiService.post("/auth/2fa/disable", payload);
};

export const get2FARecoveryCodes = async () => {
  const res = await apiService.get("/auth/2fa/recovery-codes");
  return res.data;
};

export const regenerate2FARecoveryCodes = async () => {
  const res = await apiService.post("/auth/2fa/recovery-codes/regenerate", {});
  return res.data;
};
