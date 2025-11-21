import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
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

// Main authentication hook - combines Zustand + React Query + Services
export const useAuth = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      return await AuthService.login(credentials);
    },
    onSuccess: (data) => {
      // Update Zustand store
      authStore.login(data.user, data.tokens);
      // Update React Query cache
      queryClient.setQueryData(authKeys.user, data.user);
    },
  });

  // 2FA Login mutation
  const twoFactorLoginMutation = useMutation({
    mutationFn: async (
      credentials: TwoFactorLoginRequest
    ): Promise<LoginResponse> => {
      return await AuthService.loginWithTwoFactor(credentials);
    },
    onSuccess: (data) => {
      // Update Zustand store
      authStore.login(data.user, data.tokens);
      // Update React Query cache
      queryClient.setQueryData(authKeys.user, data.user);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const tokens = authStore.tokens;
      if (tokens?.refreshToken) {
        await AuthService.logout(tokens.refreshToken);
      }
    },
    onSettled: () => {
      // Always clear local state, even if API call fails
      authStore.logout();
      queryClient.clear();
    },
  });

  // Logout all devices mutation
  const logoutAllMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await AuthService.logoutAll();
    },
    onSuccess: () => {
      authStore.logout();
      queryClient.clear();
    },
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async (): Promise<AuthTokens> => {
      const request: RefreshTokenRequest = {
        refreshToken: authStore.tokens?.refreshToken || "",
      };
      return await AuthService.refreshToken(request);
    },
    onSuccess: (tokens) => {
      authStore.refreshTokens(tokens);
    },
    onError: (error: unknown) => {
      // Check if error is network-related
      const axiosError = error as AxiosError;
      const isNetworkError =
        axiosError?.code === "ECONNREFUSED" ||
        axiosError?.code === "ENOTFOUND" ||
        axiosError?.code === "ECONNRESET" ||
        axiosError?.code === "ETIMEDOUT" ||
        axiosError?.message?.includes("Network Error") ||
        !navigator.onLine;

      // Check for 401 unauthorized (invalid refresh token or user not available)
      const is401Error = axiosError?.response?.status === 401;

      // Check if user is disabled
      const currentUser = authStore.user;
      const isUserDisabled = currentUser && !currentUser.isActive;

      // Always logout on 401 errors (invalid token/user not available)
      if (is401Error) {
        authStore.logout();
        queryClient.clear();
      }
      // For other errors, only logout if it's not a network error and user is not disabled
      else if (!isNetworkError && !isUserDisabled) {
        authStore.logout();
        queryClient.clear();
      }
    },
  });

  return {
    // Zustand state
    user: authStore.user,
    tokens: authStore.tokens,
    isAuthenticated: authStore.isAuthenticated,
    isHydrated: authStore.isHydrated,
    // Authentication functions
    login: loginMutation.mutateAsync,
    twoFactorLogin: twoFactorLoginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    logoutAll: logoutAllMutation.mutateAsync,
    refreshToken: refreshTokenMutation.mutateAsync,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingInTwoFactor: twoFactorLoginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isLoggingOutAll: logoutAllMutation.isPending,
    isRefreshingToken: refreshTokenMutation.isPending,

    // Error states
    loginError: loginMutation.error,
    twoFactorLoginError: twoFactorLoginMutation.error,
    logoutError: logoutMutation.error,
    logoutAllError: logoutAllMutation.error,
    refreshTokenError: refreshTokenMutation.error,
  };
};

// 2FA specific hook
export const useTwoFactor = () => {
  // Enable 2FA mutation
  const enableMutation = useMutation({
    mutationFn: async (): Promise<TwoFactorSetup> => {
      return await AuthService.enableTwoFactor();
    },
  });

  // Verify 2FA mutation
  const verifyMutation = useMutation({
    mutationFn: async (request: TwoFactorVerifyRequest): Promise<void> => {
      return await AuthService.verifyTwoFactor(request);
    },
  });

  // Disable 2FA mutation
  const disableMutation = useMutation({
    mutationFn: async (request: TwoFactorDisableRequest): Promise<void> => {
      return await AuthService.disableTwoFactor(request);
    },
  });

  // Request backup code mutation
  const backupCodeMutation = useMutation({
    mutationFn: async (): Promise<{ code: string }> => {
      return await AuthService.requestBackupCode();
    },
  });

  return {
    // 2FA functions
    enableTwoFactor: enableMutation.mutateAsync,
    verifyTwoFactor: verifyMutation.mutateAsync,
    disableTwoFactor: disableMutation.mutateAsync,
    requestBackupCode: backupCodeMutation.mutateAsync,

    // Loading states
    isEnabling: enableMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isDisabling: disableMutation.isPending,
    isRequestingCode: backupCodeMutation.isPending,

    // Error states
    enableError: enableMutation.error,
    verifyError: verifyMutation.error,
    disableError: disableMutation.error,
    backupCodeError: backupCodeMutation.error,

    // Data
    twoFactorSetup: enableMutation.data,
  };
};

// Get current user query hook
export const useCurrentUser = () => {
  const authStore = useAuthStore();

  return useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      // In a real app, you might fetch user profile from API
      // For now, return user from Zustand store
      return authStore.user;
    },
    enabled: authStore.isAuthenticated, // Only run if user is authenticated
  });
};
