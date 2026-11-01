"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import type { SimulationScope } from "../simulation-learning-types";
import type { ExamPlayback, ExamReview } from "../simulation-exam-types";
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
    <SimulationLearningBoundary>
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
    try {
      const s = await source.create(scope, {
        mode: "RANDOM",
        idempotencyKey: creationKey.current,
      });
      if (!alive.current) return;
      validateExamSession(s, scope);
      if (
        s.mode !== "RANDOM" ||
        !["IN_PROGRESS", "READY_TO_SUBMIT"].includes(s.status)
      )
        throw Error("Phiên chưa hợp lệ.");
      client.removeQueries({ queryKey: simulationExamKeys.scope(scope) });
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
      void controller?.submit();
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
        else void controller?.retry();
      }}
      onRespond={(ms, event) =>
        controller?.respond(ms, event) ?? Promise.resolve()
      }
      onComplete={() => controller?.complete() ?? Promise.resolve()}
      onFault={() => controller?.mediaFault()}
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
  const [renewed, setRenewed] = useState<{
      position: number;
      playback: ExamPlayback;
    } | null>(null),
    [notice, setNotice] = useState<string | null>(null),
    renewLock = useRef(false);
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
  const data: ExamReview | null = ready.status === "ready" ? ready.data : null;
  async function renew() {
    if (renewLock.current || !source || !data) return;
    renewLock.current = true;
    try {
      const current = data.items.find((i) => i.position === position);
      if (!current) throw Error("Không có tình huống.");
      const p = await source.reviewPlayback(scope, id, position);
      validateExamPlayback(p, {
        sessionId: id,
        currentPosition: position,
        responseRecorded: current.responseRecorded,
      } as Parameters<typeof validateExamPlayback>[1]);
      if (p.durationMs !== current.durationMs)
        throw Error("Snapshot thay đổi.");
      setRenewed({ position, playback: p });
    } catch {
      setNotice(
        "Không thể tải lại video xem lại. Kết quả bài thi được giữ nguyên.",
      );
    } finally {
      renewLock.current = false;
    }
  }
  const shown =
    ready.status === "ready" && renewed && renewed.position === position
      ? {
          status: "ready" as const,
          data: {
            ...ready.data,
            items: ready.data.items.map((i) =>
              i.position === position
                ? { ...i, playback: renewed.playback }
                : i,
            ),
          },
        }
      : ready;
  return (
    <>
      <SimulationExamReviewView
        state={shown}
        position={position}
        onBack={() => router.push(simulationExamRoutes.result(id))}
        onChoose={(n) => router.replace(simulationExamRoutes.review(id, n))}
        onRetry={() => void query.refetch()}
        onRenew={() => void renew()}
      />
      <SimulationFeedbackModal
        key={notice ?? "no-notice"}
        message={notice}
        onDismiss={() => setNotice(null)}
      />
    </>
  );
}
