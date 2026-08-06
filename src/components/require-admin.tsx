"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import {
  isAdminSelector,
  isAuthenticatedSelector,
  useAuthStore,
  useHasHydrated,
} from "@/stores/auth-store";

/**
 * Guard cho trang admin: chưa đăng nhập → redirect /login;
 * đã đăng nhập nhưng không phải admin → màn 403.
 *
 * Chỉ redirect sau khi store đã hydrate (useHasHydrated) — xem require-auth.tsx.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const isAuthenticated = useAuthStore(isAuthenticatedSelector);
  const isAdmin = useAuthStore(isAdminSelector);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  if (!isAdmin) {
    return (
      <div className="container flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-semibold">Truy cập bị từ chối</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bạn không có quyền quản trị để xem trang này.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
