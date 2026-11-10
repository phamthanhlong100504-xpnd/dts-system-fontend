"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import { SimulationPresetsView } from "./simulation-presets-view";
import { SimulationExamPreparationView } from "./simulation-exam-preparation-view";
import { ExamExitDialog } from "./simulation-exam-session-view";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
import {
  useSimulationPresets,
  useSimulationPresetPreparation,
} from "../use-simulation-presets";
import { useSimulationNavigation } from "../simulation-navigation-store";
import { invalidateExamCatalogues } from "../simulation-exam-cache";
import { presetCreateIntent } from "../simulation-preset-create-intent";
import { simulationExamRoutes } from "../simulation-exam-source";
import { SimulationExamError } from "../simulation-exam-types";
import { validateExamSession } from "../simulation-exam-validation";
import type { SimulationScope } from "../simulation-learning-types";
export function SimulationPresetsPage({
  presetSetId,
  expectedVersionId,
  retakeFromVersion,
}: {
  presetSetId?: string;
  expectedVersionId?: string;
  retakeFromVersion?: string;
}) {
  return (
    <SimulationLearningBoundary>
      {(scope) =>
        presetSetId ? (
          <BoundPresetPreparation
            key={`${scope.userId}:${scope.licenseClass}:${presetSetId}`}
            scope={scope}
            id={presetSetId}
            expectedVersionId={expectedVersionId}
            retakeFromVersion={retakeFromVersion}
          />
        ) : (
          <BoundPresets
            key={`${scope.userId}:${scope.licenseClass}`}
            scope={scope}
          />
        )
      }
    </SimulationLearningBoundary>
  );
}
function BoundPresets({ scope }: { scope: SimulationScope }) {
  const { state, query } = useSimulationPresets(scope),
    router = useRouter(),
    select = useSimulationNavigation((s) => s.select);
  return (
    <SimulationPresetsView
      state={state}
      onRetry={() => void query.refetch()}
      onBack={() => {
        select(scope.licenseClass, "simulation");
        router.push("/practice");
      }}
      onPrepare={(i) =>
        router.push(
          simulationExamRoutes.preset(i.presetSetId, i.presetVersionId),
        )
      }
      onResumeActive={() => {
        if (state.status === "ready" && state.data.activeSession)
          router.push(
            simulationExamRoutes.session(state.data.activeSession.sessionId),
          );
      }}
      onResume={(i) => {
        if (i.activeSession)
          router.push(simulationExamRoutes.session(i.activeSession.sessionId));
      }}
      onResult={(i) => {
        if (i.latestCompleted)
          router.push(simulationExamRoutes.result(i.latestCompleted.sessionId));
      }}
    />
  );
}
function BoundPresetPreparation({
  scope,
  id,
  expectedVersionId,
  retakeFromVersion,
}: {
  scope: SimulationScope;
  id: string;
  expectedVersionId?: string;
  retakeFromVersion?: string;
}) {
  const { state, query, source } = useSimulationPresetPreparation(scope, id),
    router = useRouter(),
    client = useQueryClient();
  const data = state.status === "ready" ? state.data : null,
    active = data?.activeSession;
  const versionChanged = !!(
    data &&
    expectedVersionId &&
    data.preset.presetVersionId !== expectedVersionId
  );
  const retakeChanged = !!(
    data &&
    retakeFromVersion &&
    data.preset.presetVersionId !== retakeFromVersion
  );
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState<string | null>(null),
    [exit, setExit] = useState(false),
    [cancelError, setCancelError] = useState<string | null>(null),
    [startBlocked, setStartBlocked] = useState(false),
    [pendingCreate, setPendingCreate] = useState(false);
  const lock = useRef(false),
    alive = useRef(true),
    creation = useRef<ReturnType<typeof presetCreateIntent> | null>(null),
    cancelKey = useRef<{ sessionId: string; key: string } | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const startNotice = !data
    ? null
    : pendingCreate
      ? "Yêu cầu tạo trước chưa được xác nhận. Hãy kiểm tra bài đang làm hoặc thử lại đúng yêu cầu trước."
      : !data.canStart
        ? data.unavailableReason
        : versionChanged
          ? "Bộ đề đã có phiên bản mới kể từ khi bạn chọn. Hãy xem phiên bản hiện tại trước khi bắt đầu."
          : retakeChanged
            ? "Bộ đề đã được cập nhật. Lượt thi mới sử dụng phiên bản đang công bố; kết quả trước vẫn được giữ nguyên."
            : startBlocked
              ? "Chưa thể bắt đầu bộ đề này. Hãy tải lại thông tin trước khi thử tiếp."
              : null;
  async function start(retry = false) {
    if (lock.current || !alive.current || !source) return;
    if (
      !retry &&
      (!data ||
        active ||
        !data.canStart ||
        query.isFetching ||
        versionChanged ||
        startBlocked)
    )
      return;
    if (retry && !creation.current) return;
    lock.current = true;
    setBusy(true);
    creation.current ??= presetCreateIntent(scope, data!, crypto.randomUUID());
    const intent = creation.current;
    try {
      const s = await source.create(scope, intent.request);
      if (!alive.current) return;
      intent.accept(s);
      setPendingCreate(false);
      creation.current = null;
      void invalidateExamCatalogues(client, scope.userId);
      if (s.status === "COMPLETED")
        router.push(simulationExamRoutes.result(s.sessionId));
      else if (s.status === "CANCELLED") {
        setNotice(
          "Yêu cầu trước thuộc bài thi đã hủy. Bạn có thể bắt đầu một lượt thi mới.",
        );
        await query.refetch();
      } else router.push(simulationExamRoutes.session(s.sessionId));
    } catch (e) {
      if (!alive.current) return;
      setPendingCreate(true);
      if (
        e instanceof SimulationExamError &&
        e.code === "ACTIVE_SESSION_EXISTS"
      ) {
        await query.refetch();
        if (alive.current)
          setNotice(
            "Bạn có bài thi chưa hoàn thành. Hãy tiếp tục hoặc hủy bài đang làm trước khi bắt đầu bài mới.",
          );
      } else if (
        e instanceof SimulationExamError &&
        ["PRESET_VERSION_CHANGED", "BANK_CHANGED"].includes(e.code)
      ) {
        // Definitive rejected selection: a newly confirmed version is a new intent.
        creation.current = null;
        setPendingCreate(false);
        setStartBlocked(true);
        await query.refetch();
      } else
        setNotice(
          "Chưa thể tạo bài thi theo bộ đề đã chọn. Thử lại giữ cùng yêu cầu để tránh tạo trùng phiên.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function cancel() {
    if (lock.current || !alive.current || !source || !active) return;
    lock.current = true;
    setBusy(true);
    setCancelError(null);
    if (cancelKey.current?.sessionId !== active.sessionId)
      cancelKey.current = {
        sessionId: active.sessionId,
        key: crypto.randomUUID(),
      };
    try {
      let s;
      try {
        s = await source.command(scope, {
          kind: "CANCEL",
          sessionId: active.sessionId,
          position: active.currentPosition,
          playbackEventId: null,
          eventId: cancelKey.current.key,
        });
      } catch {
        s = await source.session(scope, active.sessionId);
      }
      if (!alive.current) return;
      validateExamSession(s, scope, active.sessionId);
      if (s.status !== "CANCELLED") throw Error("Chưa hủy.");
      setExit(false);
      cancelKey.current = null;
      creation.current = null;
      setPendingCreate(false);
      void invalidateExamCatalogues(client, scope.userId);
      await query.refetch();
    } catch {
      if (alive.current)
        setCancelError(
          "Chưa thể hủy bài đang làm. Trạng thái hiện tại được giữ nguyên; vui lòng thử lại.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <>
      <SimulationExamPreparationView
        state={state}
        mode="PRESET"
        busy={busy || query.isFetching}
        busyLabel={busy ? undefined : "Đang kiểm tra bộ đề…"}
        canStart={
          (pendingCreate ||
            (!!data?.canStart && !versionChanged && !startBlocked)) &&
          !query.isFetching
        }
        startNotice={startNotice}
        onAcceptVersion={
          versionChanged && data?.canStart && !pendingCreate
            ? () =>
                router.replace(
                  simulationExamRoutes.preset(
                    id,
                    data.preset.presetVersionId,
                    retakeFromVersion,
                  ),
                )
            : undefined
        }
        onBack={() => router.push(simulationExamRoutes.presets)}
        onRetry={() => {
          if (pendingCreate) {
            void start(true);
            return;
          }
          setStartBlocked(true);
          void query.refetch().then((result) => {
            if (alive.current && !result.isError) setStartBlocked(false);
          });
        }}
        onStart={() => void start(pendingCreate)}
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
        action={
          pendingCreate
            ? {
                label: "Thử lại yêu cầu",
                disabled: busy,
                onClick: () => void start(true),
              }
            : undefined
        }
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
              : "Thi thử mô phỏng ngẫu nhiên"
          }
        />
      )}
    </>
  );
}
