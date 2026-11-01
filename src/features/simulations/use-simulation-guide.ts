"use client";
import { useQuery } from "@tanstack/react-query";
import { getSimulationGuideSource } from "./simulation-guide-service";
import { SimulationGuideError } from "./simulation-guide-types";
import type {
  GuideAdminSnapshot,
  GuideHistory,
  PublishedGuide,
} from "./simulation-guide-types";
import type {
  LearningLoadState,
  SimulationScope,
} from "./simulation-learning-types";
import {
  validatePublishedGuide,
  validateGuideAdmin,
  validateGuideHistory,
} from "./simulation-guide-validation";
import { validateSimulationScope } from "./use-simulation-learning";
export const simulationGuideKeys = {
  root: ["simulation-guide"] as const,
  current: (scope: SimulationScope) =>
    ["simulation-guide", "current", scope.userId, scope.licenseClass] as const,
  admin: (actorId: string) => ["simulation-guide", "admin", actorId] as const,
  history: (actorId: string) =>
    ["simulation-guide", "history", actorId] as const,
};
export type GuideReadState =
  | LearningLoadState<PublishedGuide>
  | { status: "unpublished" };
export function useSimulationGuide(scope: SimulationScope) {
  const source = getSimulationGuideSource();
  const query = useQuery({
    queryKey: simulationGuideKeys.current(scope),
    enabled: !!source,
    queryFn: async () => {
      if (!source) throw new Error("Hướng dẫn chưa sẵn sàng.");
      const data = await source.current(scope);
      validateSimulationScope(scope, data);
      validatePublishedGuide(data);
      return data;
    },
    retry: (count, error) =>
      !(error instanceof SimulationGuideError) && count < 1,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const state: GuideReadState = !source
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? query.error instanceof SimulationGuideError &&
          query.error.code === "UNPUBLISHED"
          ? { status: "unpublished" }
          : {
              status: "error",
              message:
                query.error instanceof Error
                  ? query.error.message
                  : "Không thể tải hướng dẫn mô phỏng.",
            }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi hướng dẫn chưa hợp lệ." };
  return { state, query, source };
}
export function useSimulationGuideAdmin(actorId: string) {
  const source = getSimulationGuideSource();
  const query = useQuery({
    queryKey: simulationGuideKeys.admin(actorId),
    enabled: !!source?.admin && !!actorId,
    queryFn: async () => {
      if (!source?.admin) throw new Error("Quản trị hướng dẫn chưa sẵn sàng.");
      const data = await source.admin(actorId);
      validateGuideAdmin(data, actorId);
      return data;
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });
  const state: LearningLoadState<GuideAdminSnapshot> = !source?.admin
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? {
            status: "error",
            message:
              query.error instanceof Error
                ? query.error.message
                : "Không thể tải nội dung quản trị.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi quản trị chưa hợp lệ." };
  return { state, query, source };
}
export function useSimulationGuideHistory(actorId: string, enabled: boolean) {
  const source = getSimulationGuideSource();
  const query = useQuery({
    queryKey: simulationGuideKeys.history(actorId),
    enabled: enabled && !!source?.history && !!actorId,
    queryFn: async () => {
      if (!source?.history) throw new Error("Lịch sử phiên bản chưa sẵn sàng.");
      const data = await source.history(actorId);
      validateGuideHistory(data, actorId);
      return data;
    },
    retry: false,
    staleTime: 0,
  });
  const state: LearningLoadState<GuideHistory> = !source?.history
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? {
            status: "error",
            message:
              query.error instanceof Error
                ? query.error.message
                : "Không thể tải lịch sử phiên bản.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi lịch sử chưa hợp lệ." };
  return { state, query };
}
