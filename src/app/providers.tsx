
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { fetchMe } from "@/features/auth/auth-service";
import {
  useAuthStore,
  useHasHydrated,
} from "@/stores/auth-store";
import { useExamStore } from "@/stores/exam-store";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const FOCUSED_ROUTES = [
  "/practice/exam",
  "/practice/chapter",
  "/practice/wrong/review",
  "/practice/critical-questions/review",
];

function matchesRoute(
  pathname: string,
  route: string
): boolean {
  return (
    pathname === route ||
    pathname.startsWith(`${route}/`)
  );
}

function canSyncLicense(pathname: string): boolean {
  // Screen 01 tự xác nhận với Identity.
  if (!pathname || pathname === "/") return false;

  // Không gọi API đồng bộ trên màn đăng nhập hoặc quản trị.
  if (matchesRoute(pathname, "/admin")) return false;

  if (
    AUTH_ROUTES.some((route) =>
      matchesRoute(pathname, route)
    )
  ) {
    return false;
  }

  // Không thay đổi hạng trong phiên làm bài.
  if (
    FOCUSED_ROUTES.some((route) =>
      matchesRoute(pathname, route)
    )
  ) {
    return false;
  }

  if (
    /^\/examination\/[^/]+\/run(?:\/|$)/.test(pathname)
  ) {
    return false;
  }

  return true;
}

function LicenseSessionSync() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const authHydrated = useHasHydrated();
  const licenseHydrated = useLicenseHasHydrated();

  const accessToken = useAuthStore(
    (state) => state.accessToken
  );

  const username = useAuthStore(
    (state) => state.user?.username
  );

  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const inFlightKeyRef = useRef<string | null>(null);
  const requestSequenceRef = useRef(0);

  const lastCheckRef = useRef<{
    key: string;
    at: number;
  } | null>(null);

  const syncLicense = useCallback(() => {
    const currentPath = pathnameRef.current;

    if (
      !authHydrated ||
      !licenseHydrated ||
      !canSyncLicense(currentPath)
    ) {
      return;
    }

    // Không chạy polling trên tab đang ẩn.
    if (document.visibilityState === "hidden") {
      return;
    }

    const auth = useAuthStore.getState();
    const currentUsername = auth.user?.username;
    const token = auth.accessToken;

    if (!currentUsername || !token) return;

    const key = `${currentUsername}:${token}`;

    // Không gọi trùng request đang chạy.
    if (inFlightKeyRef.current === key) {
      return;
    }

    const now = Date.now();

    // Hạn chế nhiều sự kiện focus/navigation gần nhau.
    if (
      lastCheckRef.current?.key === key &&
      now - lastCheckRef.current.at < 5_000
    ) {
      return;
    }

    const startingUserLicense =
      auth.user?.selectedLicenseClass;

    const startingCachedLicense =
      useLicenseStore.getState().selectedLicense;

    const requestSequence =
      ++requestSequenceRef.current;

    inFlightKeyRef.current = key;
    lastCheckRef.current = { key, at: now };

    void fetchMe()
      .then((profile) => {
        // Bỏ kết quả của request đã bị thay thế.
        if (
          requestSequence !== requestSequenceRef.current
        ) {
          return;
        }

        // Người dùng có thể đã vào phiên thi trong lúc request chạy.
        if (!canSyncLicense(pathnameRef.current)) {
          return;
        }

        const latestAuth = useAuthStore.getState();
        const latestLicense = useLicenseStore.getState();

        if (
          !latestAuth.accessToken ||
          latestAuth.user?.username !== currentUsername
        ) {
          return;
        }

        // Không dùng response cũ ghi đè việc đổi hạng
        // vừa được thực hiện tại thiết bị hiện tại.
        if (
          latestAuth.user.selectedLicenseClass !==
            startingUserLicense ||
          latestLicense.selectedLicense !==
            startingCachedLicense
        ) {
          return;
        }

        const selectedLicenseClass =
          profile.selectedLicenseClass;

        if (
          selectedLicenseClass !== null &&
          typeof selectedLicenseClass !== "string"
        ) {
          return;
        }

        // Làm mới hồ sơ cho các component đang dùng useMe().
        queryClient.setQueryData(
          ["auth", "me"],
          profile
        );

        const changed =
          latestAuth.user.selectedLicenseClass !==
            selectedLicenseClass ||
          latestLicense.selectedLicense !==
            selectedLicenseClass;

        if (!changed) {
          if (selectedLicenseClass === null) {
            router.replace("/");
          }

          return;
        }

        // Cập nhật license-store.
        if (selectedLicenseClass === null) {
          latestLicense.clearSelectedLicense();
        } else {
          latestLicense.setSelectedLicense(
            selectedLicenseClass
          );
        }

        // Cập nhật auth-store.
        latestAuth.setUser({
          ...latestAuth.user,
          selectedLicenseClass,
        });

        // Các query phụ thuộc hạng GPLX cũ phải lấy lại dữ liệu.
        void queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] !== "auth",
        });

        // Người dùng chưa chọn hạng -> Screen 01.
        if (selectedLicenseClass === null) {
          router.replace("/");
        }
      })
      .catch(() => {
        // Lỗi mạng/API: không xóa GPLX đang lưu.
        // Nếu interceptor đã xác định phiên không hợp lệ
        // và xóa token thì chuyển sang đăng nhập.
        if (!useAuthStore.getState().accessToken) {
          router.replace("/login");
        }
      })
      .finally(() => {
        if (
          requestSequence === requestSequenceRef.current
        ) {
          inFlightKeyRef.current = null;
        }
      });
  }, [
    authHydrated,
    licenseHydrated,
    queryClient,
    router,
  ]);

  // Đồng bộ khi chuyển route, đăng nhập hoặc refresh token.
  useEffect(() => {
    syncLicense();
  }, [
    pathname,
    accessToken,
    username,
    syncLicense,
  ]);

  // Đồng bộ khi quay lại tab và khi tab đang hoạt động.
  useEffect(() => {
    const onFocus = () => {
      syncLicense();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncLicense();
      }
    };

    window.addEventListener("focus", onFocus);

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    const intervalId = window.setInterval(
      syncLicense,
      60_000
    );

    return () => {
      window.removeEventListener(
        "focus",
        onFocus
      );

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );

      window.clearInterval(intervalId);
    };
  }, [syncLicense]);

  return null;
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Khôi phục các store từ localStorage sau khi mount.
  // Các store dùng skipHydration để tránh hydration mismatch.
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useExamStore.persist.rehydrate();
    useLicenseStore.persist.rehydrate();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <LicenseSessionSync />

        {children}

        <Toaster
          position="top-right"
          richColors
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
