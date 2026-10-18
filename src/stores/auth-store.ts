import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback, useSyncExternalStore } from "react";
import type { IdentitySchemas } from "@/lib/api/types";

type GeneratedUserInfo = IdentitySchemas["UserInfo"];
type GeneratedAuthResponse = IdentitySchemas["AuthResponse"];

export type AuthUser = GeneratedUserInfo & {
  selectedLicenseClass?: string | null;
};

type AuthResponse = Omit<GeneratedAuthResponse, "user"> & {
  user?: AuthUser;
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** Lưu kết quả login/refresh (gồm token + user). */
  setAuth: (auth: AuthResponse) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * Auth store — dùng chung toàn app.
 * Token/user được persist xuống localStorage để khôi phục sau reload.
 *
 * `skipHydration: true` để tránh hydration mismatch giữa server và client.
 * Providers sẽ rehydrate thủ công sau khi mount.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setAuth: (auth) =>
        set({
          accessToken: auth.accessToken ?? null,
          refreshToken: auth.refreshToken ?? null,
          user: auth.user ?? null,
        }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        }),
    }),
    {
      name: "dts-auth",
      skipHydration: true,
    }
  )
);

export const isAuthenticatedSelector = (state: AuthState) =>
  Boolean(state.accessToken);

export const isAdminSelector = (state: AuthState) =>
  Boolean(
    state.user?.roles?.some(
      (role) => role === "ROLE_ADMIN" || role === "ADMIN"
    )
  );

export function useHasHydrated(): boolean {
  const subscribe = useCallback(
    (onChange: () => void) =>
      useAuthStore.persist.onFinishHydration(onChange),
    []
  );

  return useSyncExternalStore(
    subscribe,
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
}

function ensureHydrated() {
  if (typeof window === "undefined") return;

  if (!useAuthStore.persist.hasHydrated()) {
    useAuthStore.persist.rehydrate();
  }
}

export function getAccessToken(): string | null {
  ensureHydrated();
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  ensureHydrated();
  return useAuthStore.getState().refreshToken;
}