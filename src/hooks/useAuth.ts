import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { LoginRequest, LoginResponse } from "@/types/common";
import {
  changePassword,
  requestPasswordReset,
  enable2FA,
  verify2FA,
  disable2FA,
  get2FARecoveryCodes,
  getMe,
  login,
  logout,
  loginWithTwoFactor,
  regenerate2FARecoveryCodes,
} from "@/services/authService";
import { ChangePasswordPayload, TwoFAVerifyPayload } from "@/types/auth";
import { useWarehouseStore } from "@/store/warehouseStore";

// Error type for axios-like errors
interface AxiosError {
  code?: string;
  message?: string;
  response?: {
    status?: number;
  };
}

// Query keys for React Query
export const authKeys = {
  user: ["auth", "user"] as const,
  token: ["auth", "token"] as const,
} as const;
export const useAuth = () => {
  const queryClient = useQueryClient();
  const { tokens, login: loginSession, logout: logoutSession } = useAuthStore();
  const { setSelectedWarehouseId } = useWarehouseStore();
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      return await getMe();
    },
    enabled: !!tokens?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation<LoginResponse, AxiosError, LoginRequest>({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      // Only store tokens if 2FA is not required
      if (!data.requiresTwoFactor && data.tokens) {
        loginSession(data.tokens);
        queryClient.invalidateQueries({ queryKey: authKeys.user });
      }
      // If requiresTwoFactor is true, the UI will handle showing 2FA form
    },
  });

  const logoutMutation = useMutation<void, AxiosError>({
    mutationFn: async () => {
      return await logout(tokens?.refreshToken || "");
    },
    onSuccess: () => {
      logoutSession();
      setSelectedWarehouseId(null);
      queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });

  const twoFactorLoginMutation = useMutation<
    LoginResponse,
    AxiosError,
    {
      email: string;
      password: string;
      token: string;
    }
  >({
    mutationFn: ({ email, password, token }) =>
      loginWithTwoFactor({ email, password, token }),
    onSuccess: (data) => {
      // After successful 2FA, tokens should always be present
      if (data.tokens) {
        loginSession(data.tokens);
        queryClient.invalidateQueries({ queryKey: authKeys.user });
      }
    },
  });

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user });
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
      queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });

  // Verify 2FA
  const verify2FAMutation = useMutation({
    mutationFn: (payload: TwoFAVerifyPayload) => verify2FA(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });

  // Disable 2FA
  const disable2FAMutation = useMutation({
    mutationFn: (payload: { token: string }) => disable2FA(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });

  // Get 2FA recovery codes
  const getRecoveryCodesMutation = useMutation({
    mutationFn: () => get2FARecoveryCodes(),
  });

  const regenerate2FARecoveryCodesMutation = useMutation({
    mutationFn: () => regenerate2FARecoveryCodes(),
  });

  // Regenerate 2FA recovery codes
  return {
    user,
    isUserLoading,
    isAuthenticated: !!tokens?.accessToken,
    login: loginMutation.mutateAsync,
    logout: logoutMutation,
    twoFactorLogin: twoFactorLoginMutation.mutateAsync,
    changePassword: changePasswordMutation,
    requestPasswordReset: requestPasswordResetMutation,
    enable2FA: enable2FAMutation,
    verify2FA: verify2FAMutation,
    disable2FA: disable2FAMutation,
    get2FARecoveryCodes: getRecoveryCodesMutation,
    regenerate2FARecoveryCodes: regenerate2FARecoveryCodesMutation,
  };
};
