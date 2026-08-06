"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";

/** Root: đã đăng nhập → /practice, chưa → /login. Chờ hydrate rồi mới redirect. */
export default function Home() {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useHasHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated) {
      router.replace(token ? "/practice" : "/login");
    }
  }, [hydrated, token, router]);

  return null;
}
