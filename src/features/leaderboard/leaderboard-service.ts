import { resultApi } from "@/lib/api";
import { LEADERBOARD_PERIOD_MAP, type LeaderboardResponse } from "@/features/result-performance/result-performance-contract";
import type { LeaderboardParams, LeaderboardResult } from "./leaderboard-types";

export async function getLeaderboardList(params: LeaderboardParams): Promise<LeaderboardResult> {
  if (!params.licenseClass || !Number.isInteger(params.page) || params.page < 0 ||
      !Number.isInteger(params.size) || params.size < 1 || params.size > 100) {
    throw new Error("Thông số bảng xếp hạng không hợp lệ");
  }
  const search = new URLSearchParams({
    licenseClass: params.licenseClass,
    period: LEADERBOARD_PERIOD_MAP[params.period],
    page: String(params.page), size: String(params.size),
  });
  const response = await resultApi.get<LeaderboardResponse>(`/v1/leaderboards?${search.toString()}`);
  if (response.licenseClass !== params.licenseClass || response.period !== LEADERBOARD_PERIOD_MAP[params.period] ||
      !response.currentUser || !Array.isArray(response.items) ||
      !Number.isInteger(response.totalParticipants) || !Number.isInteger(response.totalPages)) {
    throw new Error("DTS Result trả dữ liệu bảng xếp hạng không đúng scope/contract");
  }
  return {
    ...response,
    items: response.items.map((item) => ({
      ...item, isCurrentUser: item.userId === response.currentUser.userId,
    })),
  };
}
