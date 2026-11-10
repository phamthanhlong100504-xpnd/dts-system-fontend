"use client";
import { useState } from "react";
import {
  Activity,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MousePointer2,
  Eye,
  Flag,
  Lightbulb,
  List,
  Loader2,
  RotateCcw,
} from "lucide-react";
import styles from "./simulation-practice-layout.module.css";
import dialogStyles from "./simulation-dialog-layout.module.css";
import { SimulationHintCard } from "./simulation-hint-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
import { cn } from "@/lib/utils";
import textStyles from "./simulation-text-layout.module.css";
import type {
  LearningLoadState,
  ScenarioActions,
  SimulationScenarioPage,
} from "../simulation-learning-types";
import {
  BackAction,
  LearningNotice,
  LearningShell,
  learningStyles,
  reactionTime,
  roman,
} from "./learning-ui";
import { ScoringTimeline } from "./scoring-timeline";
import { SimulationVideoPlayer } from "./simulation-video-player";
const scenarioColumns = styles.workspace;
const phaseLabels: Record<SimulationScenarioPage["phase"], string> = {
  ready: "Chưa bắt đầu",
  starting: "Đang chuẩn bị",
  playing: "Đang luyện",
  "response-pending": "Đang xác nhận",
  recorded: "Đã ghi nhận",
  completing: "Đang lưu kết quả",
  completed: "Đã hoàn thành",
  "video-error": "Video gián đoạn",
  "save-error": "Chưa xác nhận kết quả",
};
export function SimulationScenarioView({
  state,
  actions = {},
  onBack,
  onRetry,
  bookmarkPending = false,
  notice,
  onDismissNotice,
  exitOpen = false,
  onCancelExit,
  onConfirmExit,
  initialHintsOpen = false,
  returnLabel = "Danh sách tình huống",
}: {
  state: LearningLoadState<SimulationScenarioPage>;
  actions?: ScenarioActions;
  onBack?: () => void;
  onRetry?: () => void;
  bookmarkPending?: boolean;
  notice?: string | null;
  onDismissNotice?: () => void;
  exitOpen?: boolean;
  onCancelExit?: () => void;
  onConfirmExit?: () => void;
  initialHintsOpen?: boolean;
  returnLabel?: string;
}) {
  const [hintOpen, setHintOpen] = useState(initialHintsOpen);
  const [failedPlayback, setFailedPlayback] = useState<string | null>(null);
  const data = state.status === "ready" ? state.data : null;
  const playbackKey = data
    ? `${data.scenario.id}:${data.attemptId ?? "ready"}`
    : "";
  // Browser media errors are transient presentation state, never a completed attempt.
  const displayPhase =
    data &&
    failedPlayback === playbackKey &&
    !["completed", "save-error", "completing"].includes(data.phase)
      ? "video-error"
      : (data?.phase ?? "ready");
  // Do not expose an old/unsaved score or timeline in pending/error variants.
  const result =
    data?.phase === "completed" &&
    data.result?.status === "COMPLETED" &&
    data.result.attemptId === data.attemptId
      ? data.result
      : null;
  const StatusIcon = result ? Trophy : Activity;
  const hintsAllowed =
    !!data?.hintPreview &&
    (displayPhase === "ready" || data.policy.allowHintsWhilePlaying) &&
    !["completing", "save-error", "video-error"].includes(displayPhase);
  return (
    <LearningShell
      navigation={
        <BackAction onClick={onBack}>
          {returnLabel === "Danh sách tình huống"
            ? "Quay lại danh sách tình huống"
            : `Quay lại ${returnLabel.toLowerCase()}`}
        </BackAction>
      }
    >
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                learningStyles.badge,
                "whitespace-normal rounded-[7px] px-3 py-1.5 font-bold uppercase tracking-[0.025em]",
              )}
            >
              {data
                ? `Chương ${roman(data.scenario.chapterNumber)} · ${data.scenario.chapterName}`
                : "Luyện tập mô phỏng"}
            </p>
            <div
              className={cn(
                "mt-3",
                textStyles.headingDescription,
                textStyles.pageIntro,
              )}
            >
              <h1 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#0b1427]">
                {data?.scenario.title ?? "Tình huống mô phỏng"}
              </h1>
              <p className="inline-flex items-center gap-2 text-[15.5px] font-medium text-[#475467]">
                <Eye className="size-4" aria-hidden="true" />
                Quan sát video và nhấn Space khi phát hiện nguy hiểm.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!data || !actions.bookmark || bookmarkPending}
            onClick={actions.bookmark}
            aria-pressed={data?.scenario.isBookmarked ?? false}
            className={learningStyles.secondary}
          >
            <Bookmark
              className={cn(
                "size-4",
                data?.scenario.isBookmarked && "fill-current",
              )}
              aria-hidden="true"
            />
            {bookmarkPending
              ? "Đang lưu…"
              : data?.scenario.isBookmarked
                ? "Đã đánh dấu"
                : "Đánh dấu"}
          </button>
        </div>
      </header>
      <SimulationFeedbackModal
        key={notice ?? "no-notice"}
        message={notice}
        onDismiss={onDismissNotice}
      />

      {!data ? (
        <>
          <div className={cn(scenarioColumns, styles.emptyWorkspace)}>
            <div className="flex aspect-video items-center justify-center rounded-[14px] bg-[#101522] xl:col-start-1 xl:row-start-1">
              <PlayPlaceholder loading={state.status === "loading"} />
            </div>
            <button
              type="button"
              disabled
              className={cn(
                learningStyles.primary,
                "min-h-12 w-full opacity-50 xl:col-start-1 xl:row-start-2",
              )}
            >
              <Flag className="size-4" />
              Phát hiện nguy hiểm
            </button>
            <PracticeHelp
              spacious
              className="mt-2 h-full xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:mt-0"
            />
          </div>
          {state.status !== "loading" && (
            <div className="mt-[1cm]">
              <LearningNotice
                kind={state.status === "error" ? "error" : "unavailable"}
                onRetry={state.status === "error" ? onRetry : undefined}
                message={state.status === "error" ? state.message : undefined}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className={scenarioColumns}>
            <SimulationVideoPlayer
              layout="lesson"
              key={data.scenario.id}
              model={data}
              actions={actions}
              onPlaybackFault={() => setFailedPlayback(playbackKey)}
              onPlaybackRecovered={() => setFailedPlayback(null)}
            />
            <aside className={styles.sidebar}>
              {!result && <PracticeHelp />}
              <section
                className={cn(
                  learningStyles.card,
                  styles.statusCard,
                  !result &&
                    displayPhase !== "save-error" &&
                    styles.statusCardWithReaction,
                  result && styles.resultCard,
                )}
              >
                <div className={styles.statusHeader}>
                  <h2 className="inline-flex items-center gap-2 whitespace-nowrap text-[18px] font-bold text-[#172335]">
                    <StatusIcon
                      className="size-[18px] shrink-0 text-[#0758d9]"
                      aria-hidden="true"
                    />
                    {result ? "Kết quả lượt luyện" : "Trạng thái lượt luyện"}
                  </h2>
                  {displayPhase !== "save-error" && (
                    <span
                      className={cn(learningStyles.badge, styles.phaseBadge)}
                    >
                      {phaseLabels[displayPhase]}
                    </span>
                  )}
                </div>
                {result ? (
                  <>
                    <div
                      className={cn(
                        learningStyles.inset,
                        styles.scorePanel,
                        "my-[1cm] flex min-h-[180px] flex-1 flex-col items-center justify-center gap-3 px-4 py-[0.7cm] text-center",
                      )}
                    >
                      <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#475467]">
                        Điểm lượt luyện
                      </p>
                      <p className="mt-2 text-[32px] font-bold tracking-[-0.03em] text-[#0758d9]">
                        {result.score}
                        <span className="ml-1 text-[18px] font-semibold text-[#475467]">
                          / {result.maxScore} điểm
                        </span>
                      </p>
                      <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-[14.5px] font-medium text-[#475467]">
                        <CheckCircle2 className="size-3.5 text-[#0758d9]" />
                        Kết quả đã được lưu
                      </p>
                    </div>
                    <dl className={cn(styles.resultRows, "text-[15.5px]")}>
                      <ResultLine
                        icon="time"
                        label="Thời điểm phản ứng"
                        value={
                          result.firstResponseMs === null
                            ? "Không có"
                            : reactionTime(result.firstResponseMs)
                        }
                      />
                      <ResultLine
                        icon="reaction"
                        label="Phản ứng"
                        value={
                          result.responseRecorded
                            ? "Đã ghi nhận"
                            : "Không có phản ứng"
                        }
                      />
                    </dl>
                  </>
                ) : displayPhase === "save-error" ? (
                  <div className="mt-4 flex flex-1 flex-col items-center text-center">
                    <div className="flex flex-1 flex-col items-center justify-center">
                      <CircleAlert
                        className="mx-auto size-7 text-[#d92d20]"
                        aria-hidden="true"
                      />
                      <h3 className="mt-3 text-center text-[18px] font-bold text-[#172335]">
                        Chưa xác nhận kết quả
                      </h3>
                      <p className="mt-2 text-[15.5px] font-medium leading-6 text-[#475467]">
                        Hãy kiểm tra trạng thái lượt luyện trước khi tiếp tục.
                        Điểm và tiến độ sẽ hiển thị sau khi kết quả được xác
                        nhận.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!actions.reconcileResult}
                      onClick={() =>
                        void actions.reconcileResult?.().catch(() => undefined)
                      }
                      className={cn(
                        learningStyles.primary,
                        "mt-[1cm] w-fit max-w-full self-center",
                      )}
                    >
                      <RotateCcw className="size-4" />
                      Kiểm tra và thử lại
                    </button>
                  </div>
                ) : (
                  <>
                    <p
                      className={cn(
                        styles.statusDescription,
                        "text-[15.5px] font-medium leading-6 text-[#475467]",
                      )}
                    >
                      {displayPhase === "video-error"
                        ? "Video bị gián đoạn; lượt luyện chưa được tính hoàn thành."
                        : displayPhase === "completing"
                          ? "Đang xác nhận kết quả. Vui lòng đợi trước khi chuyển tình huống."
                          : "Xem video và ghi nhận thời điểm phát hiện nguy hiểm. Video tiếp tục sau khi nhận phản ứng."}
                    </p>
                    <div
                      className={cn(
                        learningStyles.inset,
                        styles.reactionCard,
                        "px-4 py-5 text-[15.5px] font-medium text-[#475467]",
                      )}
                    >
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-[15.5px] font-semibold text-[#475467]">
                        <MousePointer2
                          className="size-4 shrink-0 text-[#0758d9]"
                          aria-hidden="true"
                        />
                        Phản ứng của bạn
                      </span>
                      <p
                        className={cn(
                          styles.reactionValue,
                          "text-center font-semibold text-[#172335]",
                        )}
                      >
                        <span
                          className={cn(learningStyles.badge, "text-[14.5px]")}
                        >
                          {" "}
                          {data.phase === "response-pending"
                            ? "Đang xác nhận…"
                            : data.responseRecorded
                              ? `Đã ghi nhận${data.firstResponseMs !== null ? ` · ${reactionTime(data.firstResponseMs)}` : ""}`
                              : "Chưa ghi nhận"}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </section>
            </aside>
          </div>
          {!result && (
            <section className={cn(learningStyles.card, "mt-[1cm] px-5 py-5")}>
              <div className={styles.hintHeader}>
                <div className="min-w-0">
                  <div className="min-w-0">
                    <h2 className={styles.hintTitle}>
                      <span className={styles.hintIcon}>
                        <Lightbulb className="size-5" aria-hidden="true" />
                      </span>
                      Hướng dẫn nhận diện tình huống
                    </h2>
                    <p
                      className={cn(
                        styles.hintDescription,
                        "text-[15.5px] font-medium text-[#475467]",
                      )}
                    >
                      Xem dấu hiệu và gợi ý khi chế độ luyện tập cho phép.
                    </p>
                  </div>
                  {hintOpen && hintsAllowed && data.hintPreview && (
                    <div
                      className={cn(
                        styles.hintDetails,
                        "text-[15.5px] font-medium leading-6 text-[#475467]",
                      )}
                    >
                      <p>
                        <strong className="font-semibold text-[#172335]">
                          Dấu hiệu nguy hiểm:{" "}
                        </strong>
                        {data.hintPreview.hazardSign}
                      </p>
                      <p>
                        <strong className="font-semibold text-[#172335]">
                          Gợi ý nhận diện:{" "}
                        </strong>
                        {data.hintPreview.recognitionTip}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setHintOpen(!hintOpen)}
                  disabled={!hintsAllowed}
                  aria-expanded={hintOpen && hintsAllowed}
                  className={cn(
                    learningStyles.secondary,
                    styles.hintToggle,
                    "shrink-0",
                  )}
                >
                  {hintOpen && hintsAllowed ? "Ẩn gợi ý" : "Xem gợi ý"}
                </button>
              </div>
            </section>
          )}

          {result && (
            <>
              <ScoringTimeline result={result} />
              <div className="mt-[1cm] grid gap-5 md:grid-cols-2">
                <SimulationHintCard
                  title="Dấu hiệu nguy hiểm"
                  text={result.hazardSign}
                  warning
                />
                <SimulationHintCard
                  title="Gợi ý nhận diện"
                  text={result.recognitionTip}
                />
              </div>
            </>
          )}
          <nav
            aria-label="Điều hướng tình huống"
            className={cn(
              learningStyles.card,
              "mt-[1cm] flex flex-wrap items-center justify-between gap-3 px-4 py-4",
            )}
          >
            <button
              type="button"
              disabled={!data.previousScenarioId || !actions.previous}
              onClick={actions.previous}
              className={learningStyles.back}
            >
              <ArrowLeft className="size-4" />
              Tình huống trước
            </button>
            <button
              type="button"
              onClick={onBack}
              className={learningStyles.back}
            >
              <List className="size-4" />
              {returnLabel}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              {result && (
                <button
                  type="button"
                  disabled={!actions.newAttempt}
                  onClick={() =>
                    void actions.newAttempt?.().catch(() => undefined)
                  }
                  className={learningStyles.secondary}
                >
                  <RotateCcw className="size-4" />
                  Luyện lại
                </button>
              )}
              <button
                type="button"
                disabled={!result || !data.nextScenarioId || !actions.next}
                onClick={actions.next}
                className={learningStyles.primary}
              >
                Tình huống tiếp theo
                <ArrowRight className="size-4" />
              </button>
            </div>
          </nav>
        </>
      )}
      <Dialog
        open={exitOpen}
        onOpenChange={(open) => {
          if (!open) onCancelExit?.();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={cn("font-dts", dialogStyles.practiceExitDialog)}
        >
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#eef2ff] text-[#0758d9]">
            <CircleAlert className="size-6" />
          </div>
          <DialogTitle className="text-center text-[20px] font-bold text-[#0b1427]">
            Thoát lượt luyện?
          </DialogTitle>
          <DialogDescription className="text-center text-[15.5px] leading-6 text-[#475467]">
            Lượt luyện đang diễn ra chưa được xác nhận hoàn thành. Bạn có muốn
            rời trang này?
          </DialogDescription>
          <div className={dialogStyles.actions}>
            <button
              type="button"
              onClick={onConfirmExit}
              className={learningStyles.secondary}
            >
              Thoát lượt luyện
            </button>
            <button
              type="button"
              onClick={onCancelExit}
              className={learningStyles.primary}
            >
              Ở lại luyện tiếp
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </LearningShell>
  );
}
export function PracticeHelp({
  className,
  spacious = false,
}: { className?: string; spacious?: boolean } = {}) {
  return (
    <section
      className={cn(
        learningStyles.card,
        styles.helpCard,
        spacious && styles.spaciousHelp,
        className,
      )}
    >
      <h2 className="inline-flex items-center gap-2 whitespace-nowrap text-[18px] font-bold text-[#172335]">
        <Lightbulb className="size-[18px] text-[#0758d9]" aria-hidden="true" />
        Hướng dẫn luyện tập
      </h2>
      <ol
        className={cn(
          "text-[15.5px] font-medium leading-6 text-[#475467]",
          styles.helpSteps,
        )}
      >
        {[
          "Xem video và quan sát giao thông.",
          "Nhấn Space khi phát hiện dấu hiệu nguy hiểm.",
          "Hoàn thành lượt luyện để xem điểm và nhận xét.",
        ].map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-[13px] font-bold text-[#0758d9]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
function ResultLine({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "time" | "reaction";
}) {
  const Icon = icon === "time" ? Clock3 : MousePointer2;
  return (
    <div className={styles.resultRow}>
      <dt className="inline-flex items-center gap-2 whitespace-nowrap text-[14.5px] font-medium text-[#475467]">
        <Icon className="size-4 shrink-0 text-[#0758d9]" aria-hidden="true" />
        {label}
      </dt>
      <dd className={cn(learningStyles.badge, "ml-auto text-[14.5px]")}>
        {value}
      </dd>
    </div>
  );
}
function PlayPlaceholder({ loading }: { loading: boolean }) {
  return (
    <div
      role={loading ? "status" : undefined}
      className="flex flex-col items-center gap-3 text-[#c9d2e3]"
    >
      {loading ? (
        <Loader2 className="size-9 animate-spin" />
      ) : (
        <Flag className="size-8" />
      )}
      <p className="text-[15.5px] font-semibold">
        {loading ? "Đang tải tình huống…" : "Video chưa sẵn sàng"}
      </p>
    </div>
  );
}
