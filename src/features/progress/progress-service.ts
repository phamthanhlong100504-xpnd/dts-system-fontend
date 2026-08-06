import { progressApi } from "@/lib/api";
import type { ProgressSchemas } from "@/lib/api";

export async function getDashboard() {
  return progressApi.get<ProgressSchemas["DashboardResponse"]>(
    "/v1/progress/dashboard"
  );
}

export async function getStreaks() {
  return progressApi.get<unknown>("/v1/progress/streaks");
}

export async function getRecent(limit = 10) {
  return progressApi.get<unknown>(`/v1/progress/recent?limit=${limit}`);
}
