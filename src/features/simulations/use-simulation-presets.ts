"use client";
import { useQuery } from "@tanstack/react-query";
import { getSimulationExamSource } from "./simulation-exam-source";
import type {
  LearningLoadState,
  SimulationScope,
} from "./simulation-learning-types";
import type {
  SimulationPresetPage,
  SimulationPresetPreparation,
} from "./simulation-preset-types";
import {
  validatePresetPage,
  validatePresetPreparation,
} from "./simulation-preset-validation";
import {
  useExamCacheIsolation,
  simulationExamKeys,
} from "./use-simulation-exam";
export function useSimulationPresets(scope: SimulationScope) {
  useExamCacheIsolation();
  const source = getSimulationExamSource();
  const query = useQuery({
    queryKey: [
      ...simulationExamKeys.scope(scope),
      "presets",
      scope.bankVersion ?? "current",
    ],
    enabled: !!source?.presets,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!source?.presets) throw Error("Bộ đề chưa sẵn sàng.");
      const data = await source.presets(scope);
      validatePresetPage(data, scope);
      return data;
    },
  });
  const state: LearningLoadState<SimulationPresetPage> = !source?.presets
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? {
            status: "error",
            message: "Không thể tải danh sách bộ đề. Vui lòng thử lại.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Danh sách bộ đề chưa hợp lệ." };
  return { state, query, source };
}
export function useSimulationPresetPreparation(
  scope: SimulationScope,
  id: string,
) {
  useExamCacheIsolation();
  const source = getSimulationExamSource();
  const query = useQuery({
    queryKey: [
      ...simulationExamKeys.scope(scope),
      "preset-preparation",
      id,
      scope.bankVersion ?? "current",
    ],
    enabled: !!source?.presetPreparation,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!source?.presetPreparation) throw Error("Bộ đề chưa sẵn sàng.");
      const data = await source.presetPreparation(scope, id);
      validatePresetPreparation(data, scope, id);
      return data;
    },
  });
  const state: LearningLoadState<SimulationPresetPreparation> =
    !source?.presetPreparation
      ? { status: "unavailable" }
      : query.isPending
        ? { status: "loading" }
        : query.isError
          ? {
              status: "error",
              message:
                "Không thể mở bộ đề. Bộ đề có thể đã thay đổi hoặc ngừng công bố; hãy quay lại danh sách hoặc thử lại.",
            }
          : query.data
            ? { status: "ready", data: query.data }
            : { status: "error", message: "Thông tin bộ đề chưa hợp lệ." };
  return { state, query, source };
}
