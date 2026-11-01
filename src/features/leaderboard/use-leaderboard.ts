"use client";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboardList } from "./leaderboard-service";
import type { LeaderboardParams } from "./leaderboard-types";
import { useAuthStore, useHasHydrated } from "@/stores/auth-store";

export const leaderboardKeys = {
  all: ["result", "leaderboard"] as const,
  list: (userId: string, params: LeaderboardParams) =>
    [...leaderboardKeys.all, userId, params.licenseClass, params.period, params.page, params.size] as const,
};
export function useLeaderboardList(params: LeaderboardParams) {
  const ready = useHasHydrated();
  const userId = useAuthStore((state) => state.user?.id ?? state.user?.username ?? "");
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: leaderboardKeys.list(userId, params),
    queryFn: () => getLeaderboardList(params),
    enabled: ready && Boolean(userId && token && params.licenseClass),
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
