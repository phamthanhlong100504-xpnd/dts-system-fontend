"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";
import { getResultAnalytics } from "./result-analytics-service";
import type { ResultAnalyticsPeriod } from "./result-analytics-types";
export const resultAnalyticsKeys = {
  all: ["result", "analytics"] as const,
  detail: (userId: string, licenseClass: string, period: ResultAnalyticsPeriod) =>
    [...resultAnalyticsKeys.all, userId, licenseClass, period] as const,
};
export function useResultAnalytics(licenseClass: string, period: ResultAnalyticsPeriod) {
  const ready = useHasHydrated();
  const token = useAuthStore(s => s.accessToken);
  const userId = useAuthStore(s => s.user?.id ?? s.user?.username ?? "");
  return useQuery({
    queryKey: resultAnalyticsKeys.detail(userId, licenseClass, period),
    queryFn: () => getResultAnalytics(licenseClass, period),
    enabled: ready && Boolean(token && userId && licenseClass),
    staleTime: 15_000, refetchOnMount: "always", refetchOnWindowFocus: true, retry: 1,
  });
}
