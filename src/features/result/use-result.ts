"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getHistory,
  getOverview,
  getProgressByType,
  getRecentResults,
  getResumeTarget,
  getStatistics,
  getSummaries,
  getSummaryStatus,
  type ResultHistoryParams,
  type ResultStatisticsParams,
  type ResultSummaryListParams,
} from "./result-service";

export const resultKeys = {
  overview: ["result", "overview"] as const,
  statistics: (params: ResultStatisticsParams) =>
    ["result", "statistics", params] as const,
  summaries: (params: ResultSummaryListParams | undefined) =>
    ["result", "summaries", params] as const,
  summaryStatus: ["result", "summary-status"] as const,
  progress: (targetType: string) => ["result", "progress", targetType] as const,
  resume: ["result", "resume"] as const,
  history: (params: ResultHistoryParams | undefined) =>
    ["result", "history", params] as const,
  recent: (limit: number) => ["result", "recent", limit] as const,
};

export function useResultOverview() {
  return useQuery({
    queryKey: resultKeys.overview,
    queryFn: getOverview,
    staleTime: 30_000,
  });
}

export function useResultStatistics(params?: ResultStatisticsParams) {
  return useQuery({
    queryKey: resultKeys.statistics(params ?? {}),
    queryFn: () => getStatistics(params),
    staleTime: 30_000,
  });
}

export function useResultSummaries(params?: ResultSummaryListParams) {
  return useQuery({
    queryKey: resultKeys.summaries(params),
    queryFn: () => getSummaries(params),
    staleTime: 30_000,
  });
}

export function useSummaryStatus() {
  return useQuery({
    queryKey: resultKeys.summaryStatus,
    queryFn: getSummaryStatus,
    staleTime: 30_000,
  });
}

export function useResultProgress(targetType: string) {
  return useQuery({
    queryKey: resultKeys.progress(targetType),
    queryFn: () => getProgressByType(targetType),
    staleTime: 30_000,
  });
}

export function useResumeTarget() {
  return useQuery({
    queryKey: resultKeys.resume,
    queryFn: getResumeTarget,
    staleTime: 30_000,
  });
}

export function useResultHistory(params?: ResultHistoryParams) {
  return useQuery({
    queryKey: resultKeys.history(params),
    queryFn: () => getHistory(params),
    staleTime: 30_000,
  });
}

export function useRecentResults(limit = 10) {
  return useQuery({
    queryKey: resultKeys.recent(limit),
    queryFn: () => getRecentResults(limit),
    staleTime: 30_000,
  });
}
