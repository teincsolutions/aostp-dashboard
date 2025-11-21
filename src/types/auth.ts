// src/types/auth.ts

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface TwoFASetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  otpAuthUrl: string;
  correlationId: string;
  recoveryCodes?: string[];
}

export interface TwoFAVerifyPayload {
  code: string;
}
