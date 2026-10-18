"use client";

import { useQuery } from "@tanstack/react-query";
import { getHistoryList } from "./history-service";
import type { HistoryListParams } from "./history-types";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";

export const historyKeys = {
  all: ["screen13", "history"] as const,
  list: (userId: string, params: HistoryListParams) =>
    [...historyKeys.all, userId, "list", params.licenseClass ?? "ALL",
      params.activityType, params.result, params.period,
      params.from ?? "", params.to ?? "", params.page, params.size] as const,
};

export function useHistoryList(params: HistoryListParams) {
  const authReady = useHasHydrated();
  const token = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id ?? state.user?.username ?? "");
  return useQuery({
    queryKey: historyKeys.list(userId, params),
    queryFn: () => getHistoryList(params),
    enabled: authReady && Boolean(token && userId),
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
