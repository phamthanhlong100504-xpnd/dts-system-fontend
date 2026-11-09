"use client";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { getSimulationExamSource } from "./simulation-exam-source";
import { SimulationExamError } from "./simulation-exam-types";
import { SimulationExamController } from "./simulation-exam-controller";
import type {
  LearningLoadState,
  SimulationScope,
} from "./simulation-learning-types";
import {
  validateExamPreparation,
  validateExamResult,
  validateExamReview,
} from "./simulation-exam-validation";
import { invalidateExamCatalogues } from "./simulation-exam-cache";
export const simulationExamKeys = {
  scope: (s: SimulationScope) =>
    ["simulation-exam", s.userId, s.licenseClass] as const,
};
export function useSimulationExamRead(
  scope: SimulationScope,
  kind: "preparation" | "result" | "review",
  id = "",
) {
  useExamCacheIsolation();
  const source = getSimulationExamSource();
  const query = useQuery({
    queryKey: [
      ...simulationExamKeys.scope(scope),
      kind,
      id,
      ...(kind === "preparation" ? [scope.bankVersion ?? "current"] : []),
    ],
    enabled: !!source,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!source) throw Error("Thi thử chưa sẵn sàng.");
      if (kind === "preparation") {
        const data = await source.preparation(scope);
        validateExamPreparation(data, scope);
        return { kind, data } as const;
      }
      if (kind === "result") {
        const data = await source.result(scope, id);
        validateExamResult(data, scope, id);
        return { kind, data } as const;
      }
      const data = await source.review(scope, id);
      validateExamReview(data, scope, id);
      return { kind, data } as const;
    },
  });
  const state: LearningLoadState<NonNullable<typeof query.data>> = !source
    ? { status: "unavailable" }
    : query.isPending
      ? { status: "loading" }
      : query.isError
        ? {
            status: "error",
            message:
              query.error instanceof SimulationExamError
                ? query.error.message
                : "Không thể tải nội dung bài thi. Hãy kiểm tra kết nối và thử lại.",
          }
        : query.data
          ? { status: "ready", data: query.data }
          : { status: "error", message: "Phản hồi chưa hợp lệ." };
  return { state, query, source };
}
const unavailable = { status: "unavailable" } as const;
const noopSubscribe = () => () => {};
export function useSimulationExamSession(scope: SimulationScope, id: string) {
  useExamCacheIsolation();
  const source = getSimulationExamSource();
  const controller = useMemo(
    () =>
      source
        ? new SimulationExamController(
            source,
            { userId: scope.userId, licenseClass: scope.licenseClass },
            id,
          )
        : null,
    [source, scope.userId, scope.licenseClass, id],
  );
  const state = useSyncExternalStore(
    controller?.subscribe ?? noopSubscribe,
    controller?.snapshot ?? (() => unavailable),
    () => unavailable,
  );
  useEffect(() => {
    if (controller) {
      controller.activate();
      void controller.load();
    }
    return () => controller?.dispose();
  }, [controller]);
  const client = useQueryClient(),
    refreshed = useRef("");
  const terminal =
    state.status === "ready" &&
    ["COMPLETED", "CANCELLED"].includes(state.data.session.status)
      ? `${id}:${state.data.session.status}`
      : "";
  useEffect(() => {
    if (terminal && refreshed.current !== terminal) {
      refreshed.current = terminal;
      void invalidateExamCatalogues(client, scope.userId);
    }
  }, [client, scope.userId, terminal]);
  return { state, controller };
}
export function useExamCacheIsolation() {
  const client = useQueryClient();
  useEffect(
    () =>
      useAuthStore.subscribe((next, previous) => {
        if (!next.accessToken || next.user?.id !== previous.user?.id)
          client.removeQueries({ queryKey: ["simulation-exam"] });
      }),
    [client],
  );
}
