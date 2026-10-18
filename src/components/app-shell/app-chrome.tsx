"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/app-shell/app-header";
import { SiteHeader } from "@/components/site-header";
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

function matchesRoute(
  pathname: string,
  route: string
) {
  return (
    pathname === route ||
    pathname.startsWith(
      `${route}/`
    )
  );
}

function isAuthRoute(
  pathname: string
) {
  return AUTH_ROUTES.some(
    (route) =>
      matchesRoute(
        pathname,
        route
      )
  );
}

function isOfficialExamSessionRoute(
  pathname: string
) {
  return /^\/examination\/[^/]+\/run(?:\/|$)/.test(
    pathname
  );
}

function isFocusedSessionRoute(
  pathname: string
) {
  return (
    FOCUSED_SESSION_ROUTES.some(
      (route) =>
        matchesRoute(
          pathname,
          route
        )
    ) ||
    isOfficialExamSessionRoute(
      pathname
    )
  );
}

export function AppChrome() {
  const pathname =
    usePathname();

  const hydrated =
    useHasHydrated();

  const isAuthenticated =
    useAuthStore(
      isAuthenticatedSelector
    );

  if (pathname === "/") {
    return null;
  }

  if (
    pathname.startsWith(
      "/admin"
    )
  ) {
    return null;
  }

  if (
    isFocusedSessionRoute(
      pathname
    )
  ) {
    return null;
  }

  if (
    isAuthRoute(
      pathname
    )
  ) {
    return <SiteHeader />;
  }

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <AppHeader />;
  }

  return <SiteHeader />;
}