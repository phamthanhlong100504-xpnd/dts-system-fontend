"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CarFront } from "lucide-react";

import {
  isAuthenticatedSelector,
  useAuthStore,
  useHasHydrated,
} from "@/stores/auth-store";

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const FOCUSED_SESSION_ROUTES = [
  "/practice/exam",
  "/practice/chapter",
  "/practice/wrong/review",
  "/practice/critical-questions/review",
];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => matchesRoute(pathname, route));
}

function isOfficialExamSessionRoute(pathname: string) {
  return /^\/examination\/[^/]+\/run(?:\/|$)/.test(pathname);
}

function isFocusedSessionRoute(pathname: string) {
  return (
    FOCUSED_SESSION_ROUTES.some((route) =>
      matchesRoute(pathname, route)
    ) ||
    isOfficialExamSessionRoute(pathname)
  );
}

export function AppFooter() {
  const pathname = usePathname();
  const hydrated = useHasHydrated();

  const isAuthenticated = useAuthStore(
    isAuthenticatedSelector
  );

  if (pathname === "/") {
    return null;
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

  if (isFocusedSessionRoute(pathname)) {
    return null;
  }

  if (isAuthRoute(pathname)) {
    return null;
  }

  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <footer className="font-dts w-full border-t border-[#dde2ea] bg-[#F2F3FF]">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1480px] flex-col gap-4 px-6 py-4 text-[14.5px] font-medium text-[#27364f] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="flex size-6 items-center justify-center rounded-[6px] bg-[#0758d9] text-white">
              <CarFront
                className="size-3.5"
                strokeWidth={2.3}
              />
            </span>

            <span className="font-semibold text-[#101828]">
              DTS Lái xe
            </span>
          </div>

          <span className="hidden h-4 w-px bg-[#cfd5df] sm:block" />

          <span className="text-[#475467]">
            © {new Date().getFullYear()} Nền tảng ôn thi sát hạch lái xe.
          </span>
        </div>

        <nav
          aria-label="Liên kết cuối trang"
          className="flex items-center gap-5 whitespace-nowrap sm:ml-auto md:gap-6 lg:gap-7"
        >
          <FooterItem>Quy chế</FooterItem>

          <FooterSeparator />

          <FooterItem>Hướng dẫn</FooterItem>

          <FooterSeparator />

          <FooterItem>Hỗ trợ</FooterItem>
        </nav>
      </div>
    </footer>
  );
}

function FooterItem({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="cursor-pointer whitespace-nowrap transition hover:text-[#0758d9]">
      {children}
    </span>
  );
}

function FooterSeparator() {
  return (
    <span
      aria-hidden="true"
      className="text-[#b8bfca]"
    >
      ·
    </span>
  );
}