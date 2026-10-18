import { resultApi } from "@/lib/api";
import type { ResultAnalyticsData, ResultAnalyticsPeriod } from "./result-analytics-types";

export async function getResultAnalytics(licenseClass: string, period: ResultAnalyticsPeriod): Promise<ResultAnalyticsData> {
  if (!licenseClass) throw new Error("Chưa chọn hạng GPLX");
  const params = new URLSearchParams({ licenseClass, period });
  const response = await resultApi.get<ResultAnalyticsData>(`/v1/results/me/analytics?${params.toString()}`);
  if (response.licenseClass !== licenseClass || response.period !== period || !response.summary ||
      !["READY", "SOURCE_POLICY_PENDING"].includes(response.dataStatus) ||
      !Array.isArray(response.scoreTrend) || !Array.isArray(response.recentResults)) {
    throw new Error("DTS Result trả dữ liệu Analytics không đúng scope/contract");
  }
  return response;
}
