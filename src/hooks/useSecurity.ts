// src/hooks/useSecurity.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  requestPasswordReset,
  enable2FA,
  verify2FA,
  disable2FA,
  get2FARecoveryCodes,
  regenerate2FARecoveryCodes,
} from "@/services/authService";
import {
  ChangePasswordPayload,
  TwoFAVerifyPayload,
} from "@/types/auth";

export const useSecurity = () => {
  const queryClient = useQueryClient();

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  // Request password reset
  const requestPasswordResetMutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });

  // Enable 2FA
  const enable2FAMutation = useMutation({
    mutationFn: () => enable2FA(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  // Verify 2FA
  const verify2FAMutation = useMutation({
    mutationFn: (payload: TwoFAVerifyPayload) => verify2FA(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  // Disable 2FA
  const disable2FAMutation = useMutation({
    mutationFn: () => disable2FA(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  // Get 2FA recovery codes
  const getRecoveryCodesMutation = useMutation({
    mutationFn: () => get2FARecoveryCodes(),
  });

  // Regenerate 2FA recovery codes
  const regenerateRecoveryCodesMutation = useMutation({
    mutationFn: () => regenerate2FARecoveryCodes(),
  });

  return {
    changePassword: changePasswordMutation,
    requestPasswordReset: requestPasswordResetMutation,
    enable2FA: enable2FAMutation,
    verify2FA: verify2FAMutation,
    disable2FA: disable2FAMutation,
    get2FARecoveryCodes: getRecoveryCodesMutation,
    regenerate2FARecoveryCodes: regenerateRecoveryCodesMutation,
  };
};
