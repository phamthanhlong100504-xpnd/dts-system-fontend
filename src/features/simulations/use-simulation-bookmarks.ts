"use client";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/envelope";
import { getSimulationLearningSource } from "./simulation-learning-source";
import {
  simulationLearningKeys,
  validateSimulationScope,
} from "./use-simulation-learning";
import { validateBookmarksPage } from "./simulation-bookmarks-validation";
import type {
  LearningLoadState,
  SimulationScope,
} from "./simulation-learning-types";
import type {
  BookmarksPage,
  BookmarksQuery,
  BookmarksOverview,
} from "./simulation-bookmarks-types";
export function useSimulationBookmarks(
  scope: SimulationScope,
  criteria: BookmarksQuery,
) {
  const source = getSimulationLearningSource();
  const pinned = {
    ...scope,
    bankVersion: criteria.bankVersion ?? scope.bankVersion,
  };
  const query = useQuery({
    queryKey: simulationLearningKeys.read(
      pinned,
      "bookmarks",
      criteria.chapterId ?? "all",
      criteria.sort,
      criteria.page,
      12,
      criteria.datasetVersion ?? "latest",
    ),
    enabled: !!source?.bookmarks,
    queryFn: async () => {
      if (!source?.bookmarks)
        throw new Error("Nội dung đã đánh dấu chưa sẵn sàng.");
      const data = await source.bookmarks(pinned, criteria);
      validateSimulationScope(pinned, data);
      validateBookmarksPage(data, criteria);
      return data;
    },
    retry: (attempts, error) =>
      !(error instanceof ApiError && error.status && error.status < 500) &&
      attempts < 1,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (current) => {
      const expires = current.state.data?.items
        .map((item) => Date.parse(item.thumbnailExpiresAt ?? ""))
        .filter(Number.isFinite);
      return expires?.length
        ? Math.min(
            60000,
            Math.max(10000, Math.min(...expires) - Date.now() - 5000),
          )
        : false;
    },
    refetchOnMount: "always",
  });
  const state: LearningLoadState<BookmarksPage> = !source?.bookmarks
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? {
            status: "error",
            message:
              query.error instanceof Error
                ? query.error.message
                : "Không thể tải tình huống đã đánh dấu.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi đánh dấu chưa hợp lệ." };
  return { state, query, source };
}
export function useSimulationBookmarksOverview(scope: SimulationScope) {
  const source = getSimulationLearningSource();
  const query = useQuery({
    queryKey: simulationLearningKeys.read(scope, "bookmarks-overview"),
    enabled: !!source?.bookmarksOverview,
    queryFn: async (): Promise<BookmarksOverview> => {
      if (!source?.bookmarksOverview)
        throw new Error("Tổng quan đánh dấu chưa sẵn sàng.");
      const data = await source.bookmarksOverview(scope);
      validateSimulationScope(scope, data);
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });
  return { query, enabled: !!source?.bookmarksOverview };
}
