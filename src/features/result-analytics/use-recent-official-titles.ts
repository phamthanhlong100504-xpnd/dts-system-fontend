"use client";

import { useQueries } from "@tanstack/react-query";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";
import { getHistoryDetail } from "@/features/result/result-service";
import { getOfficialExamDetail } from "@/features/examination/official-exam-detail-service";
import type { AnalyticsRecentResult } from "@/features/result-performance/result-performance-contract";
import { resolveRecentOfficialTitle } from "./recent-official-title";

export function useRecentOfficialTitles(items: AnalyticsRecentResult[], licenseClass: string): Record<string, string> {
  const ready = useHasHydrated();
  const token = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id ?? state.user?.username ?? "");
  const missing = items.slice(0, 5).filter((item) =>
    item.activityType === "OFFICIAL_EXAM" && !item.title?.trim() && item.resultAvailable &&
    item.licenseClass === licenseClass && item.sourceResult?.sourceType === "EXAM_SESSION");
  const queries = useQueries({
    queries: missing.map((item) => ({
      queryKey: ["result", "analytics-official-title", userId, licenseClass, item.resultId, item.sourceResult.sourceId],
      queryFn: () => resolveRecentOfficialTitle(item, licenseClass, {
        history: getHistoryDetail,
        exam: getOfficialExamDetail,
      }),
      enabled: ready && Boolean(token && userId && licenseClass),
      staleTime: 60_000,
      refetchOnMount: "always" as const,
      refetchOnWindowFocus: true,
      retry: false as const,
    })),
  });
  const titles: Record<string, string> = {};
  queries.forEach((query, index) => {
    if (query.data) titles[missing[index].resultId] = query.data;
  });
  return titles;
}
