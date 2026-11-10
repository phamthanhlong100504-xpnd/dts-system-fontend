"use client";
import {
  validateChapter,
  validateOverview,
  validateScenarioSnapshot,
} from "./simulation-learning-validation";
import type {
  SimulationOverview,
  SimulationChapterPage,
  SimulationScenarioPage,
} from "./simulation-learning-types";
import { useQuery } from "@tanstack/react-query";
import type {
  LearningLoadState,
  SimulationDataScope,
  SimulationScope,
} from "./simulation-learning-types";
import {
  getSimulationLearningSource,
  type SimulationLearningSource,
} from "./simulation-learning-source";
export const simulationLearningKeys = {
  scope: (scope: SimulationScope) =>
    ["simulation-learning", scope.userId, scope.licenseClass] as const,
  read: (
    scope: SimulationScope,
    view: string,
    ...args: ReadonlyArray<string | number>
  ) =>
    [
      "simulation-learning",
      scope.userId,
      scope.licenseClass,
      view,
      scope.bankVersion ?? "current",
      ...args,
    ] as const,
};
export function validateSimulationScope(
  scope: SimulationScope,
  data: { scope: SimulationDataScope },
) {
  if (
    !data ||
    !data.scope ||
    data.scope.userId !== scope.userId ||
    data.scope.licenseClass !== scope.licenseClass ||
    !data.scope.bankVersion
  )
    throw new Error(
      "Dữ liệu mô phỏng không khớp tài khoản, hạng GPLX hoặc phiên bản ngân hàng.",
    );
}
export function useSimulationRead<T extends { scope: SimulationDataScope }>(
  scope: SimulationScope,
  view: string,
  args: ReadonlyArray<string | number>,
  read: (source: SimulationLearningSource) => Promise<T>,
  options?: { gcTime?: number; refetchOnWindowFocus?: boolean },
) {
  const source = getSimulationLearningSource();
  const query = useQuery({
    queryKey: simulationLearningKeys.read(scope, view, ...args),
    enabled: !!source,
    gcTime: options?.gcTime,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
    queryFn: async () => {
      if (!source) throw new Error("Nội dung mô phỏng chưa sẵn sàng.");
      const data = await read(source);
      validateSimulationScope(scope, data);
      if (view === "overview")
        validateOverview(data as unknown as SimulationOverview);
      if (view === "chapter")
        validateChapter(data as unknown as SimulationChapterPage);
      if (view === "scenario")
        validateScenarioSnapshot(data as unknown as SimulationScenarioPage);
      return data;
    },
    retry: 1,
    staleTime: 15000,
    refetchInterval:
      view === "chapter"
        ? (current) => {
            const data = current.state.data as unknown as
              SimulationChapterPage | undefined;
            const expires = data?.items
              .map((item) => Date.parse(item.thumbnailExpiresAt ?? ""))
              .filter(Number.isFinite);
            return expires?.length
              ? Math.min(
                  60000,
                  Math.max(10000, Math.min(...expires) - Date.now() - 5000),
                )
              : false;
          }
        : false,
    refetchOnMount: view === "scenario" ? false : "always",
  });
  const state: LearningLoadState<T> = !source
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? {
            status: "error",
            message:
              query.error instanceof Error
                ? query.error.message
                : "Không thể tải nội dung mô phỏng.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi mô phỏng chưa hợp lệ." };
  return { state, source, query };
}
