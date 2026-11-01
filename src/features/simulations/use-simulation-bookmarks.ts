"use client";
import { useQuery } from "@tanstack/react-query";
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
} from "./simulation-bookmarks-types";
export function useSimulationBookmarks(
  scope: SimulationScope,
  criteria: BookmarksQuery,
) {
  const source = getSimulationLearningSource();
  const query = useQuery({
    queryKey: simulationLearningKeys.read(
      scope,
      "bookmarks",
      criteria.chapterId ?? "all",
      criteria.sort,
      criteria.page,
    ),
    enabled: !!source?.bookmarks,
    queryFn: async () => {
      if (!source?.bookmarks)
        throw new Error("Nội dung đã đánh dấu chưa sẵn sàng.");
      const data = await source.bookmarks(scope, criteria);
      validateSimulationScope(scope, data);
      validateBookmarksPage(data, criteria);
      return data;
    },
    retry: 1,
    staleTime: 15000,
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
                : "Không thể tải danh sách đã đánh dấu.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi đánh dấu chưa hợp lệ." };
  return { state, query, source };
}
