"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";

/**
 * Guard: nếu chưa đăng nhập → redirect về /login.
 * Đặt quanh các trang cần xác thực.
 *
 * Chỉ redirect sau khi store đã hydrate (useHasHydrated) — nếu không, lần render
 * đầu (chưa có token) sẽ bắn user đã đăng nhập đi login mỗi lần reload.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useHasHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return null;
  }

  return <>{children}</>;
}
