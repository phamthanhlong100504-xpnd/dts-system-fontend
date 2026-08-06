import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback, useSyncExternalStore } from "react";
import type { IdentitySchemas } from "@/lib/api/types";

type UserInfo = IdentitySchemas["UserInfo"];
type AuthResponse = IdentitySchemas["AuthResponse"];

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  /** Lưu kết quả login/refresh (gồm token + user) */
  setAuth: (auth: AuthResponse) => void;
  setUser: (user: UserInfo) => void;
  logout: () => void;
}

/**
 * Auth store — dùng chung toàn app.
 * Token được persist xuống localStorage để khôi phục sau khi reload.
 * Chỉ lưu state, KHÔNG gọi API ở đây (tránh circular import với api layer).
 *
 * `skipHydration: true` — rất quan trọng với SSR:
 * nếu để zustand tự hydrate đồng bộ từ localStorage ở client, lần render đầu
 * client đã có token trong khi server luôn render chưa đăng nhập → hydration
 * mismatch. Hydrate thủ công sau mount (xem `Providers` + `useHasHydrated`).
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
    { name: "dts-auth", skipHydration: true }
  )
);

/** Selector: trạng thái đã đăng nhập hay chưa (dùng trong component) */
export const isAuthenticatedSelector = (s: AuthState) => !!s.accessToken;

/** Selector: user có quyền quản trị (ROLE_ADMIN / ADMIN) hay không */
export const isAdminSelector = (s: AuthState) =>
  !!s.user?.roles?.some((r) => r === "ROLE_ADMIN" || r === "ADMIN");

/**
 * true khi store đã hydrate xong từ localStorage (chỉ có trên client).
 * Dùng để trì hoãn redirect/guard cho tới khi session được khôi phục.
 *
 * getServerSnapshot=false → server luôn render "chưa hydrate" (khớp HTML server).
 * Ở client: render đầu cũng false (rehydrate chưa chạy, skipHydration),
 * sau đó Providers rehydrate → onFinishHydration → re-render với true.
 * Với SPA navigation: hasHydrated() đã true từ render đầu nên không cần event.
 */
export function useHasHydrated(): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => useAuthStore.persist.onFinishHydration(onChange),
    []
  );
  return useSyncExternalStore(
    subscribe,
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
}

/** Nếu store chưa hydrate, hydrate ngay (localStorage nên đồng bộ). */
function ensureHydrated() {
  if (typeof window === "undefined") return;
  if (!useAuthStore.persist.hasHydrated()) {
    useAuthStore.persist.rehydrate();
  }
}

/** Token hiện tại — kể cả trước khi Providers chạy effect hydrate. */
export function getAccessToken(): string | null {
  ensureHydrated();
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  ensureHydrated();
  return useAuthStore.getState().refreshToken;
}
