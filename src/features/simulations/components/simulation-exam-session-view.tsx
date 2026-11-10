"use client";
import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Trophy,
  Loader2,
  MousePointer2,
} from "lucide-react";
import styles from "./simulation-exam-layout.module.css";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ExamWorkspaceState,
  ExamMediaOwner,
} from "../simulation-exam-types";
import { learningStyles } from "./learning-ui";
import {
  ExamBadge,
  ExamCenterState,
  ExamLoad,
  ExamProgress,
  ExamShell,
  examBody,
  examCard,
  examTitle,
} from "./simulation-exam-ui";
import { SimulationExamPlayer } from "./simulation-exam-player";
import dialogStyles from "./simulation-dialog-layout.module.css";
export function ExamExitDialog({
  open,
  busy = false,
  onClose,
  onConfirm,
  error,
  completed,
  total,
  examTitle = "Thi thử mô phỏng ngẫu nhiên",
}: {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  error?: string | null;
  completed: number;
  total: number;
  examTitle?: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        className={cn(
          dialogStyles.examExitDialog,
          "font-dts max-h-[90vh] overflow-y-auto p-6",
        )}
        onKeyDown={(e) => {
          if (e.code === "Space") e.stopPropagation();
        }}
        onInteractOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#eef2ff] text-[#0758d9]">
          <CircleAlert className="size-6" />
        </div>
        <DialogTitle className="text-center text-[20px] font-bold text-[#0b1427]">
          Thoát bài thi thử?
        </DialogTitle>
        <DialogDescription className="text-center text-[15.5px] leading-6 text-[#475467]">
          Bài thi chưa hoàn thành. Xác nhận thoát sẽ hủy phiên hiện tại và không
          tạo kết quả tổng kết.
        </DialogDescription>
        <div className="rounded-[10px] bg-[#f1f5ff] p-4 text-center text-[15.5px] font-medium text-[#344054]">
          {examTitle}{" "}
          <p className="mt-2">
            Đã hoàn thành {completed}/{total} tình huống
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-[10px] bg-[#eef2ff] p-3 text-[15px] leading-6 text-[#344f79]"
          >
            {error}
          </p>
        )}
        <div className={dialogStyles.actions}>
          <button
            type="button"
            disabled={busy || !onConfirm}
            onClick={onConfirm}
            className={learningStyles.secondary}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}Thoát bài
            thi
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={learningStyles.primary}
          >
            Tiếp tục làm bài
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function SimulationExamSessionView({
  state,
  onBack,
  onRetry,
  onRespond,
  onStart,
  onSkipIntro,
  onRefreshShortcuts,
  onAdvance,
  onHeartbeat,
  onComplete,
  onFault,
  onCancel,
  exitInitiallyOpen = false,
  designPreview = false,
}: {
  state: ExamWorkspaceState;
  onBack?: () => void;
  onRetry?: () => void;
  onStart?: (owner: ExamMediaOwner) => Promise<unknown>;
  onSkipIntro?: (ms: number, owner: ExamMediaOwner) => Promise<unknown>;
  onRefreshShortcuts?: () => Promise<unknown>;
  onAdvance?: (owner: ExamMediaOwner) => Promise<unknown>;
  onHeartbeat?: (
    readMediaTime: () => number,
    owner: ExamMediaOwner,
  ) => Promise<unknown>;
  onRespond?: (
    ms: number,
    id: string,
    owner: ExamMediaOwner,
  ) => Promise<unknown>;
  onComplete?: (ms: number, owner: ExamMediaOwner) => Promise<unknown>;
  onFault?: (owner: ExamMediaOwner) => void;
  onCancel?: () => Promise<void>;
  exitInitiallyOpen?: boolean;
  designPreview?: boolean;
}) {
  const [exit, setExit] = useState(exitInitiallyOpen),
    [cancelBusy, setCancelBusy] = useState(false),
    [cancelError, setCancelError] = useState<string | null>(null);
  const d = state.status === "ready" ? state.data : null,
    s = d?.session;
  const finalizing =
    s?.status === "READY_TO_SUBMIT" || s?.status === "COMPLETED";
  const phase = d?.phase;
  const phaseLabel =
    phase === "ready"
      ? s?.responseRecorded
        ? "Phản ứng đã lưu"
        : "Chưa bắt đầu"
      : ["starting", "restarting"].includes(phase ?? "")
        ? "Đang chuẩn bị"
        : phase === "recorded"
          ? "Đã ghi nhận"
          : phase === "response-pending"
            ? "Đang xác nhận"
            : phase === "video-error"
              ? "Video gián đoạn"
              : phase === "transition"
                ? "Đang chuẩn bị"
                : phase === "response-error"
                  ? "Chờ xác nhận"
                  : phase === "completion-error"
                    ? "Chờ xác nhận"
                    : "Đang thực hiện";
  async function cancel() {
    if (cancelBusy || !onCancel) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      await onCancel();
      setExit(false);
    } catch {
      setCancelError(
        "Chưa thể hủy bài thi. Trạng thái hiện tại được giữ nguyên; vui lòng thử lại.",
      );
    } finally {
      setCancelBusy(false);
    }
  }
  return (
    <ExamShell
      title={
        s?.mode === "PRESET"
          ? `Thi thử mô phỏng – ${s.preset.title}`
          : "Thi thử mô phỏng ngẫu nhiên"
      }
      description={
        s
          ? `Bài thi gồm ${s.policy.totalScenarios} tình huống · Điểm tối đa ${s.policy.maxTotalScore}`
          : "Quan sát video và phản ứng khi phát hiện nguy hiểm."
      }
      back={
        s && s.status !== "CANCELLED"
          ? "Thoát bài thi"
          : s?.mode === "PRESET"
            ? "Quay lại danh sách bộ đề"
            : "Quay lại Ôn luyện"
      }
      onBack={() => {
        if (s && ["IN_PROGRESS", "READY_TO_SUBMIT"].includes(s.status))
          setExit(true);
        else onBack?.();
      }}
      badge={
        s?.status === "IN_PROGRESS" ? (
          <ExamBadge>
            <span className="size-1.5 rounded-full bg-[#0758d9]" />
            Đang làm bài
          </ExamBadge>
        ) : undefined
      }
    >
      {!d || !s ? (
        <ExamLoad state={state} onRetry={onRetry} />
      ) : s.status === "CANCELLED" ? (
        <ExamCenterState
          title="Bài thi đã được hủy"
          message="Phiên thi này không có kết quả tổng kết. Bạn có thể quay lại Ôn luyện để bắt đầu bài mới."
        />
      ) : (
        <div className="space-y-[1cm]">
          <ExamProgress
            completed={s.completedScenarios}
            total={s.policy.totalScenarios}
            current={s.currentPosition}
            positions={s.positions}
            finalizing={finalizing}
          />
          <div className={styles.workspace} data-simulation-layout="session">
            {finalizing ? (
              <ExamCenterState
                title={
                  phase === "submission-error"
                    ? "Chưa thể xác nhận kết quả bài thi"
                    : s.status === "COMPLETED"
                      ? "Đang mở kết quả bài thi"
                      : "Đang tổng kết bài thi"
                }
                message={
                  phase === "submission-error"
                    ? "Bạn đã hoàn thành các tình huống. Hãy thử lại để kiểm tra trạng thái và lấy kết quả đã được xác nhận."
                    : "Vui lòng chờ trong khi hệ thống xử lý và xác nhận kết quả bài thi."
                }
                busy={phase !== "submission-error"}
                onRetry={phase === "submission-error" ? onRetry : undefined}
              />
            ) : (
              <SimulationExamPlayer
                key={`${s.sessionId}:${s.currentPosition}:${d.playback?.playbackEventId ?? "pending"}`}
                playback={d.playback}
                position={s.currentPosition}
                total={s.policy.totalScenarios}
                phase={d.phase}
                recorded={s.responseRecorded}
                blocked={exit || cancelBusy}
                onRespond={onRespond}
                onStart={onStart}
                shortcuts={d.shortcuts}
                onSkipIntro={onSkipIntro}
                onAdvance={onAdvance}
                onHeartbeat={onHeartbeat}
                heartbeatIntervalMs={s.playbackPolicy.heartbeatIntervalMs}
                autoStart={d.autoStart}
                onComplete={onComplete}
                onFault={onFault}
                onRetry={onRetry}
                designPreview={designPreview}
              />
            )}
            <aside className={styles.sidebar}>
              {!finalizing && (
                <section
                  className={cn(examCard, styles.guidanceCard)}
                  data-simulation-card="guidance"
                >
                  <h2 className={examTitle}>
                    <BookOpen className="size-5 shrink-0 text-[#0758d9]" />
                    Hướng dẫn thao tác
                  </h2>
                  <ol className={styles.guidanceSteps}>
                    {[
                      "Quan sát video tình huống hiện tại.",
                      "Nhấn Space hoặc bấm nút khi phát hiện nguy hiểm.",
                      "Sau khi phản ứng được xác nhận, bấm Tiếp theo hoặc xem hết video để chuyển tình huống.",
                    ].map((t, i) => (
                      <li
                        className={cn(examBody, "flex items-start gap-3")}
                        key={t}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf2ff] text-[13px] font-bold text-[#0758d9]">
                          {i + 1}
                        </span>
                        {t}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              <section
                className={cn(
                  examCard,
                  styles.statusCard,
                  ["response-error", "completion-error"].includes(d.phase) &&
                    styles.statusCardWithRetry,
                )}
                data-simulation-card="status"
              >
                <div className={styles.statusHeader}>
                  <h2 className={examTitle}>
                    <ClipboardCheck className="size-5 text-[#0758d9]" />
                    {finalizing
                      ? "Trạng thái bài thi"
                      : "Trạng thái tình huống"}
                  </h2>
                  {!finalizing && <ExamBadge>{phaseLabel}</ExamBadge>}
                </div>
                {finalizing ? (
                  <dl className={styles.finalRows}>
                    <div className="flex items-center justify-between gap-3">
                      <dt>
                        <CheckCircle2 aria-hidden="true" />
                        Tình huống đã hoàn thành
                      </dt>
                      <dd className="font-bold text-[#0758d9]">
                        {s.completedScenarios}/{s.policy.totalScenarios}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <dt>
                        <ClipboardCheck aria-hidden="true" />
                        Tổng kết bài thi
                      </dt>
                      <dd>
                        <ExamBadge>
                          {phase === "submission-error"
                            ? "Chưa xác nhận"
                            : "Đang xử lý"}
                        </ExamBadge>
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <dt>
                        <Trophy aria-hidden="true" />
                        Kết quả tổng kết
                      </dt>
                      <dd>
                        <ExamBadge>Chưa sẵn sàng</ExamBadge>
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <>
                    <p className={cn(examBody, styles.statusDescription)}>
                      {s.responseRecorded
                        ? phase === "video-error"
                          ? "Phản ứng đã được lưu. Bạn có thể chuyển tiếp khi nút Tiếp theo sẵn sàng, hoặc tải lại video."
                          : phase === "ready"
                            ? "Phản ứng đã lưu được giữ nguyên khi tải lại. Bạn không cần ghi nhận lần nữa."
                            : "Đã ghi nhận phản ứng. Có thể bấm Tiếp theo khi được xác nhận."
                        : phase === "video-error"
                          ? "Chưa ghi nhận phản ứng. Tải lại video để tiếp tục tình huống này."
                          : phase === "response-pending"
                            ? "Đang chờ xác nhận phản ứng từ hệ thống."
                            : phase === "response-error"
                              ? "Chưa xác nhận được phản ứng đầu tiên. Kiểm tra và thử lại sẽ giữ thời điểm đã gửi."
                              : phase === "completion-error"
                                ? "Chưa xác nhận được video hoàn thành. Bài thi chưa chuyển sang tình huống tiếp theo."
                                : "Tập trung quan sát và phản ứng khi phát hiện nguy hiểm."}
                    </p>
                    {["response-error", "completion-error"].includes(
                      d.phase,
                    ) && (
                      <button
                        type="button"
                        onClick={onRetry}
                        disabled={d.busy}
                        className={cn(
                          learningStyles.primary,
                          styles.retryButton,
                        )}
                      >
                        Kiểm tra và thử lại
                      </button>
                    )}
                    {d.shortcutNotice && (
                      <div className="mt-4 space-y-3" role="status">
                        <p className={examBody}>{d.shortcutNotice}</p>
                        <button
                          type="button"
                          className={learningStyles.secondary}
                          disabled={d.busy || !onRefreshShortcuts}
                          onClick={() => void onRefreshShortcuts?.()}
                        >
                          Kết nối lại thao tác video
                        </button>
                      </div>
                    )}
                    <div className={styles.reactionCard}>
                      <p className={styles.reactionLabel}>
                        <MousePointer2 className="size-4 text-[#0758d9]" />
                        Phản ứng của bạn
                      </p>
                      <div className={styles.reactionValue}>
                        <ExamBadge>
                          {s.responseRecorded ? (
                            <>
                              <CheckCircle2 className="size-4" />
                              Đã ghi nhận
                            </>
                          ) : phase === "response-pending" ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Đang xác nhận
                            </>
                          ) : (
                            "Chưa ghi nhận"
                          )}
                        </ExamBadge>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </aside>
          </div>
        </div>
      )}
      {s && (
        <ExamExitDialog
          open={exit}
          busy={cancelBusy || d?.busy}
          onClose={() => setExit(false)}
          onConfirm={() => void cancel()}
          error={cancelError}
          completed={s.completedScenarios}
          total={s.policy.totalScenarios}
          examTitle={
            s.mode === "PRESET"
              ? `Thi thử mô phỏng – ${s.preset.title}`
              : undefined
          }
        />
      )}
    </ExamShell>
  );
}
