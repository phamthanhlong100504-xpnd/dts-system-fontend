import type { ResultAnalyticsResponse, AnalyticsRecentResult, AnalyticsTrendPoint, AnalyticsSummary } from "@/features/result-performance/result-performance-contract";
export type ResultAnalyticsPeriod = "7D" | "30D" | "ALL";
export type ResultAnalyticsData = ResultAnalyticsResponse;
export type ResultAnalyticsRecentItem = AnalyticsRecentResult;
export type ResultAnalyticsTrendPoint = AnalyticsTrendPoint;
export type ResultAnalyticsSummary = AnalyticsSummary;
