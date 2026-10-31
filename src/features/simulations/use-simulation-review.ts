"use client";
import { useQuery } from "@tanstack/react-query";
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
} from "./simulation-review-types";
export function useSimulationReview(
  scope: SimulationScope,
  criteria: ReviewNeededQuery,
) {
  const source = getSimulationLearningSource();
  const query = useQuery({
    queryKey: simulationLearningKeys.read(
      scope,
      "review-needed",
      criteria.chapterId ?? "all",
      criteria.sort,
      criteria.page,
    ),
    enabled: !!source?.reviewNeeded,
    queryFn: async () => {
      if (!source?.reviewNeeded)
        throw new Error("Nội dung cần ôn lại chưa sẵn sàng.");
      const data = await source.reviewNeeded(scope, criteria);
      validateSimulationScope(scope, data);
      validateReviewNeededPage(data, criteria);
      return data;
    },
    retry: 1,
    staleTime: 15000,
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
