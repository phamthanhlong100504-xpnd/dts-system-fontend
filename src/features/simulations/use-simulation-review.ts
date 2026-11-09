"use client";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/envelope";
import { getSimulationLearningSource } from "./simulation-learning-source";
import {
  simulationLearningKeys,
  validateSimulationScope,
} from "./use-simulation-learning";
import { validateReviewNeededPage } from "./simulation-review-validation";
import type {
  LearningLoadState,
  SimulationScope,
} from "./simulation-learning-types";
import type {
  ReviewNeededPage,
  ReviewNeededQuery,
  ReviewNeededOverview,
} from "./simulation-review-types";
export function useSimulationReview(
  scope: SimulationScope,
  criteria: ReviewNeededQuery,
) {
  const source = getSimulationLearningSource();
  const pinned = {
    ...scope,
    bankVersion: criteria.bankVersion ?? scope.bankVersion,
  };
  const query = useQuery({
    queryKey: simulationLearningKeys.read(
      pinned,
      "review-needed",
      criteria.chapterId ?? "all",
      criteria.sort,
      criteria.page,
      12,
      criteria.datasetVersion ?? "latest",
    ),
    enabled: !!source?.reviewNeeded,
    queryFn: async () => {
      if (!source?.reviewNeeded)
        throw new Error("Nội dung cần ôn lại chưa sẵn sàng.");
      const data = await source.reviewNeeded(pinned, criteria);
      validateSimulationScope(pinned, data);
      validateReviewNeededPage(data, criteria);
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
  const state: LearningLoadState<ReviewNeededPage> = !source?.reviewNeeded
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? {
            status: "error",
            message:
              query.error instanceof Error
                ? query.error.message
                : "Không thể tải tình huống cần ôn lại.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi cần ôn chưa hợp lệ." };
  return { state, query, source };
}
export function useSimulationReviewOverview(scope: SimulationScope) {
  const source = getSimulationLearningSource();
  const query = useQuery({
    queryKey: simulationLearningKeys.read(scope, "review-overview"),
    enabled: !!source?.reviewOverview,
    queryFn: async (): Promise<ReviewNeededOverview> => {
      if (!source?.reviewOverview)
        throw new Error("Tổng quan cần ôn chưa sẵn sàng.");
      const data = await source.reviewOverview(scope);
      validateSimulationScope(scope, data);
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });
  return { query, enabled: !!source?.reviewOverview };
}
