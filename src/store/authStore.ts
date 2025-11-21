import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthTokens } from "@/types/common";

interface AuthState {
  // State
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setTokens: (tokens: AuthTokens | null) => void;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  refreshTokens: (tokens: AuthTokens) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isHydrated: false,

      setTokens: (tokens) => set({ tokens }),

      login: (tokens) =>
        set({
          tokens,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          tokens: null,
          isAuthenticated: false,
        }),

      refreshTokens: (tokens) => set({ tokens }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
