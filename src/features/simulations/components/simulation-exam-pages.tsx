"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import type { SimulationScope } from "../simulation-learning-types";
import type { ExamReview } from "../simulation-exam-types";
import { invalidateExamCatalogues } from "../simulation-exam-cache";
import { SimulationExamError } from "../simulation-exam-types";
import { simulationExamRoutes } from "../simulation-exam-source";
import {
  simulationExamKeys,
  useSimulationExamRead,
  useSimulationExamSession,
} from "../use-simulation-exam";
import {
  validateExamPlayback,
  validateExamSession,
} from "../simulation-exam-validation";
import { useSimulationNavigation } from "../simulation-navigation-store";
import { SimulationExamPreparationView } from "./simulation-exam-preparation-view";
import {
  SimulationExamSessionView,
  ExamExitDialog,
} from "./simulation-exam-session-view";
import { SimulationExamResultView } from "./simulation-exam-result-view";
import { SimulationExamReviewView } from "./simulation-exam-review-view";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
function useExamBack(scope: SimulationScope) {
  const router = useRouter(),
    select = useSimulationNavigation((s) => s.select);
  return () => {
    select(scope.licenseClass, "simulation");
    router.push("/practice");
  };
}
export function SimulationExamPage({
  screen = "preparation",
  sessionId = "",
  position = 1,
}: {
  screen?: "preparation" | "session" | "result" | "review";
  sessionId?: string;
  position?: number;
}) {
  return (
    <SimulationLearningBoundary
      readOnly={screen === "result" || screen === "review"}
    >
      {(scope) => (
        <BoundExam
          key={`${scope.userId}:${scope.licenseClass}:${sessionId}:${screen}`}
          scope={scope}
          screen={screen}
          sessionId={sessionId}
          position={position}
        />
      )}
    </SimulationLearningBoundary>
  );
}
function BoundExam({
  scope,
  screen,
  sessionId,
  position,
}: {
  scope: SimulationScope;
  screen: string;
  sessionId: string;
  position: number;
}) {
  if (screen === "session")
    return <BoundSession scope={scope} id={sessionId} />;
  if (screen === "preparation") return <BoundPreparation scope={scope} />;
  return (
    <BoundResult
      scope={scope}
      id={sessionId}
      screen={screen}
      position={position}
    />
  );
}
function BoundPreparation({ scope }: { scope: SimulationScope }) {
  const { state, query, source } = useSimulationExamRead(scope, "preparation"),
    router = useRouter(),
    back = useExamBack(scope),
    client = useQueryClient();
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState<string | null>(null),
    [exit, setExit] = useState(false),
    [cancelError, setCancelError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const lock = useRef(false),
    creationKey = useRef<string | null>(null),
    creationBank = useRef<string | undefined>(undefined),
    cancelKey = useRef<string | null>(null);
  const ready =
    state.status === "ready" && state.data.kind === "preparation"
      ? { status: "ready" as const, data: state.data.data }
      : state.status === "ready"
        ? { status: "error" as const, message: "Phản hồi chưa hợp lệ." }
        : state;
  const active = ready.status === "ready" ? ready.data.activeSession : null;
  async function start() {
    if (lock.current || !source || ready.status !== "ready" || active) return;
    lock.current = true;
    setBusy(true);
    creationKey.current ??= crypto.randomUUID();
    creationBank.current ??= ready.data.bankVersion;
    try {
      const s = await source.create(scope, {
        mode: "RANDOM",
        idempotencyKey: creationKey.current,
        bankVersion: creationBank.current,
      });
      if (!alive.current) return;
      validateExamSession(s, scope);
      if (s.mode !== "RANDOM") throw Error("Phiên chưa hợp lệ.");
      void invalidateExamCatalogues(client, scope.userId);
      if (s.status === "COMPLETED") {
        router.push(simulationExamRoutes.result(s.sessionId));
        return;
      }
      if (s.status === "CANCELLED") {
        creationKey.current = null;
        creationBank.current = undefined;
        await query.refetch();
        setNotice(
          "Yêu cầu trước đã thuộc bài thi bị hủy. Bấm bắt đầu để tạo bài mới.",
        );
        return;
      }
      void invalidateExamCatalogues(client, scope.userId);
      router.push(simulationExamRoutes.session(s.sessionId));
    } catch (e) {
      if (!alive.current) return;
      if (
        e instanceof SimulationExamError &&
        e.code === "ACTIVE_SESSION_EXISTS"
      ) {
        await query.refetch();
        setNotice(
          "Bạn đang có bài thi chưa hoàn thành. Hãy tiếp tục hoặc hủy bài đang làm trước khi tạo bài mới.",
        );
      } else if (
        e instanceof SimulationExamError &&
        e.code === "ACCESS_DENIED"
      ) {
        setNotice(e.message);
      } else if (
        e instanceof SimulationExamError &&
        e.code === "BANK_CHANGED"
      ) {
        creationKey.current = null;
        creationBank.current = undefined;
        await query.refetch();
        setNotice(
          "Ngân hàng đã thay đổi. Đã tải lại thông tin; hãy kiểm tra trước khi bắt đầu bài mới.",
        );
      } else
        setNotice(
          "Chưa thể tạo bài thi. Thử lại sẽ tiếp tục cùng yêu cầu tạo bài để tránh tạo trùng phiên.",
        );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function cancel() {
    if (lock.current || !source || !active) return;
    lock.current = true;
    setBusy(true);
    setCancelError(null);
    cancelKey.current ??= crypto.randomUUID();
    try {
      let s;
      try {
        s = await source.command(scope, {
          kind: "CANCEL",
          sessionId: active.sessionId,
          position: active.currentPosition,
          playbackEventId: null,
          eventId: cancelKey.current,
        });
      } catch {
        s = await source.session(scope, active.sessionId);
      }
      if (!alive.current) return;
      validateExamSession(s, scope, active.sessionId);
      if (s.status !== "CANCELLED") throw Error("Chưa hủy.");
      setExit(false);
      creationKey.current = null;
      void invalidateExamCatalogues(client, scope.userId);
      creationBank.current = undefined;
      cancelKey.current = null;
      await query.refetch();
    } catch {
      setCancelError(
        "Chưa thể hủy bài đang làm. Trạng thái hiện tại được giữ nguyên; vui lòng thử lại.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <SimulationExamPreparationView
        state={ready}
        busy={busy}
        onBack={back}
        onRetry={() => void query.refetch()}
        onStart={() => void start()}
        onResume={
          active
            ? () => router.push(simulationExamRoutes.session(active.sessionId))
            : undefined
        }
        onCancelActive={() => setExit(true)}
      />
      <SimulationFeedbackModal
        key={notice ?? "no-notice"}
        message={notice}
        onDismiss={() => setNotice(null)}
      />
      {active && (
        <ExamExitDialog
          open={exit}
          busy={busy}
          onClose={() => setExit(false)}
          onConfirm={() => void cancel()}
          error={cancelError}
          completed={active.completedScenarios}
          total={active.policy.totalScenarios}
          examTitle={
            active.mode === "PRESET"
              ? `Thi thử mô phỏng – ${active.preset.title}`
              : undefined
          }
        />
      )}
    </>
  );
}
function BoundSession({ scope, id }: { scope: SimulationScope; id: string }) {
  const { state, controller } = useSimulationExamSession(scope, id),
    router = useRouter(),
    back = useExamBack(scope);
  const status = state.status === "ready" ? state.data.session.status : null,
    phase = state.status === "ready" ? state.data.phase : null,
    busy = state.status === "ready" && state.data.busy;
  useEffect(() => {
    if (status === "COMPLETED") router.replace(simulationExamRoutes.result(id));
    if (status === "READY_TO_SUBMIT" && phase === "finalizing" && !busy)
      void controller?.submit().catch(() => {});
  }, [status, phase, busy, controller, id, router]);
  useEffect(() => {
    if (!status || !["IN_PROGRESS", "READY_TO_SUBMIT"].includes(status)) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);
  return (
    <SimulationExamSessionView
      state={state}
      onBack={() => {
        if (state.status === "ready" && state.data.session.mode === "PRESET")
          router.push(simulationExamRoutes.presets);
        else back();
      }}
      onRetry={() => {
        if (state.status === "error") void controller?.load();
        else void controller?.retry().catch(() => {});
      }}
      onRefreshShortcuts={() =>
        controller?.refreshCapabilities() ?? Promise.resolve()
      }
      onSkipIntro={(ms, owner) =>
        controller?.skipIntro(ms, owner) ??
        Promise.reject(Error("Phiên chưa sẵn sàng."))
      }
      onAdvance={(owner) =>
        controller?.advanceAfterReaction(owner) ??
        Promise.reject(Error("Phiên chưa sẵn sàng."))
      }
      onStart={(owner) => controller?.start(owner) ?? Promise.resolve()}
      onHeartbeat={(readMediaTime, owner) =>
        controller?.heartbeat(readMediaTime, owner) ?? Promise.resolve()
      }
      onRespond={(ms, event, owner) =>
        controller?.respond(ms, event, owner) ?? Promise.resolve()
      }
      onComplete={(ms, owner) =>
        controller?.complete(ms, owner) ?? Promise.resolve()
      }
      onFault={(owner) => controller?.mediaFault(owner)}
      onCancel={async () => {
        await controller?.cancel();
        if (
          controller?.state.status === "ready" &&
          controller.state.data.session.status === "CANCELLED"
        )
          router.push(
            controller.state.data.session.mode === "PRESET"
              ? simulationExamRoutes.presets
              : simulationExamRoutes.preparation,
          );
      }}
    />
  );
}
function BoundResult({
  scope,
  id,
  screen,
  position,
}: {
  scope: SimulationScope;
  id: string;
  screen: string;
  position: number;
}) {
  const kind = screen === "review" ? "review" : "result",
    { state, query, source } = useSimulationExamRead(scope, kind, id),
    router = useRouter(),
    back = useExamBack(scope);
  if (kind === "result") {
    const ready =
      state.status === "ready" && state.data.kind === "result"
        ? { status: "ready" as const, data: state.data.data }
        : state.status === "ready"
          ? { status: "error" as const, message: "Kết quả chưa sẵn sàng." }
          : state;
    return (
      <SimulationExamResultView
        state={ready}
        onBack={() => {
          if (ready.status === "ready" && ready.data.mode === "PRESET")
            router.push(simulationExamRoutes.presets);
          else back();
        }}
        onRetry={() => void query.refetch()}
        onNew={() => {
          if (ready.status === "ready" && ready.data.mode === "PRESET")
            router.push(
              simulationExamRoutes.preset(
                ready.data.preset.presetSetId,
                undefined,
                ready.data.preset.presetVersionId,
              ),
            );
          else router.push(simulationExamRoutes.preparation);
        }}
        onReview={(n) => router.push(simulationExamRoutes.review(id, n))}
      />
    );
  }
  const ready =
    state.status === "ready" && state.data.kind === "review"
      ? { status: "ready" as const, data: state.data.data }
      : state.status === "ready"
        ? { status: "error" as const, message: "Chi tiết chưa sẵn sàng." }
        : state;
  return (
    <BoundReviewMedia
      scope={scope}
      id={id}
      position={position}
      state={ready}
      source={source}
      onRetry={() => void query.refetch()}
    />
  );
}
function BoundReviewMedia({
  scope,
  id,
  position,
  state,
  source,
  onRetry,
}: {
  scope: SimulationScope;
  id: string;
  position: number;
  state: import("../simulation-learning-types").LearningLoadState<ExamReview>;
  source: ReturnType<typeof useSimulationExamRead>["source"];
  onRetry: () => void;
}) {
  const router = useRouter();
  const data = state.status === "ready" ? state.data : null;
  const item = data?.items.find((i) => i.position === position);
  const playback = useQuery({
    queryKey: [
      ...simulationExamKeys.scope(scope),
      "review-playback",
      id,
      position,
      data?.result.bankVersion ?? "pending",
      data?.result.scoringVersion ?? "pending",
    ],
    enabled: !!source && !!item,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!source || !item) throw Error("Không có tình huống xem lại.");
      const p = await source.reviewPlayback(scope, id, position);
      validateExamPlayback(p, {
        sessionId: id,
        currentPosition: position,
        responseRecorded: item.responseRecorded,
      } as Parameters<typeof validateExamPlayback>[1]);
      if (p.durationMs !== item.durationMs)
        throw Error("Thời lượng xem lại không khớp.");
      return p;
    },
  });
  return (
    <SimulationExamReviewView
      state={state}
      position={position}
      selectedPlayback={playback.data ?? null}
      playbackLoading={playback.isPending || playback.isFetching}
      mediaError={playback.isError}
      onBack={() => router.push(simulationExamRoutes.result(id))}
      onChoose={(n) => router.replace(simulationExamRoutes.review(id, n))}
      onRetry={onRetry}
      onRenew={() => void playback.refetch()}
    />
  );
}
