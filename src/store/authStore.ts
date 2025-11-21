import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthTokens } from "@/types/common";

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
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

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: (tokens) => set({ tokens }),

      login: (user, tokens) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        }),

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      refreshTokens: (tokens) => set({ tokens }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
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
