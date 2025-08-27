// src/types/auth.ts

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface TwoFASetup {
  qrImageDataUrl?: string;
  secret?: string;
  otpauthUrl?: string;
  recoveryCodes?: string[];
}

export interface TwoFAVerifyPayload {
  code: string;
}
