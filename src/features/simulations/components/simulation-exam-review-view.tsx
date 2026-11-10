"use client";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  List,
  MousePointer2,
  Trophy,
} from "lucide-react";
import styles from "./simulation-exam-layout.module.css";
import textStyles from "./simulation-text-layout.module.css";
import { cn } from "@/lib/utils";
import type { LearningLoadState } from "../simulation-learning-types";
import type { ExamReview, ExamPlayback } from "../simulation-exam-types";
import { learningStyles, mediaTime, reactionTime } from "./learning-ui";
import { ScoringTimeline } from "./scoring-timeline";
import { SimulationExamPlayer } from "./simulation-exam-player";
import { SimulationHintCard } from "./simulation-hint-card";
import {
  ExamBadge,
  ExamLoad,
  ExamPositions,
  ExamShell,
  examBody,
  examCard,
  examTitle,
} from "./simulation-exam-ui";
export function SimulationExamReviewView({
  state,
  position,
  onBack,
  onChoose,
  onRetry,
  onRenew,
  selectedPlayback = null,
  playbackLoading = false,
  mediaError = false,
  designPreview = false,
}: {
  state: LearningLoadState<ExamReview>;
  position: number;
  onBack?: () => void;
  onChoose?: (n: number) => void;
  onRetry?: () => void;
  onRenew?: () => void;
  selectedPlayback?: ExamPlayback | null;
  playbackLoading?: boolean;
  mediaError?: boolean;
  designPreview?: boolean;
}) {
  const r = state.status === "ready" ? state.data : null,
    i = r?.items.find((x) => x.position === position);
  return (
    <ExamShell
      showIntro={false}
      title="Chi tiết tình huống đã thi"
      description="Xem lại video, thời điểm phản ứng và phân tích kết quả từng tình huống."
      back="Quay lại kết quả bài thi"
      onBack={onBack}
      badge={
        r ? (
          <ExamBadge>
            {r.result.mode === "PRESET"
              ? r.result.preset.title
              : "Bài thi đã hoàn thành"}{" "}
            · {r.result.totalScore}/{r.result.policy.maxTotalScore} điểm
          </ExamBadge>
        ) : undefined
      }
    >
      {!r || !i ? (
        <ExamLoad
          state={
            state.status === "ready"
              ? {
                  status: "error",
                  message: "Không tìm thấy tình huống trong bài thi này.",
                }
              : state
          }
          onRetry={onRetry}
        />
      ) : (
        <>
          <section
            className={cn(
              examCard,
              "mb-[1cm] flex flex-wrap items-center gap-4",
            )}
          >
            <ExamBadge>
              Tình huống {String(i.position).padStart(2, "0")} /{" "}
              {r.result.policy.totalScenarios}
            </ExamBadge>
            <div
              className={cn("min-w-0 flex-1", textStyles.headingDescription)}
            >
              <h2 className="text-[18px] font-bold text-[#172335]">
                Tình huống {String(i.scenarioNumber).padStart(3, "0")}:{" "}
                {i.title}
              </h2>
              <p className={examBody}>
                {i.chapterName} · Video {mediaTime(i.durationMs)}
              </p>
            </div>
            <ExamBadge>
              {i.score}/{i.maxScore} điểm
            </ExamBadge>
          </section>
          <div className={styles.workspace} data-simulation-layout="review">
            <SimulationExamPlayer
              key={i.position}
              playback={selectedPlayback}
              phase={
                mediaError
                  ? "video-error"
                  : playbackLoading
                    ? "transition"
                    : "recorded"
              }
              position={i.position}
              total={r.result.policy.totalScenarios}
              recorded={i.responseRecorded}
              review
              onReviewNext={
                i.position < r.items.length && onChoose
                  ? () => onChoose(i.position + 1)
                  : undefined
              }
              onRetry={onRenew}
              designPreview={designPreview}
            />
            <aside className={styles.sidebar}>
              <section
                className={cn(examCard, styles.resultCard)}
                data-simulation-card="review-result"
              >
                <div className={styles.resultHeader}>
                  <h2 className={examTitle}>
                    <Trophy className="size-5 text-[#0758d9]" />
                    Kết quả tình huống
                  </h2>
                  <ExamBadge>Đã hoàn thành</ExamBadge>
                </div>
                <div className={styles.scorePanel}>
                  <p className="text-[12.5px] font-bold uppercase tracking-wide text-[#475467]">
                    Điểm tình huống
                  </p>
                  <p className="text-[31px] font-semibold text-[#0758d9]">
                    {i.score}
                    <span className="ml-1 text-[17px] font-semibold text-[#475467]">
                      / {i.maxScore} điểm
                    </span>
                  </p>
                  <p className={cn(examBody, "inline-flex items-center gap-2")}>
                    <CheckCircle2 className="size-4 text-[#0758d9]" />
                    Kết quả đã được lưu
                  </p>
                </div>
                <dl className={styles.resultRows}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <dt className="inline-flex items-center gap-2 text-[#475467]">
                      <Clock3 className="size-4 text-[#0758d9]" />
                      Thời điểm phản ứng
                    </dt>
                    <dd>
                      <ExamBadge>
                        {i.firstResponseMs === null
                          ? "Không có"
                          : reactionTime(i.firstResponseMs)}
                      </ExamBadge>
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <dt className="inline-flex items-center gap-2 text-[#475467]">
                      <MousePointer2 className="size-4 text-[#0758d9]" />
                      Phản ứng
                    </dt>
                    <dd>
                      <ExamBadge>
                        {i.responseRecorded
                          ? "Đã ghi nhận"
                          : "Không có phản ứng"}
                      </ExamBadge>
                    </dd>
                  </div>
                </dl>
              </section>
              <section
                className={cn(examCard, styles.positionsCard)}
                data-simulation-card="review-positions"
              >
                <h2 className={styles.positionsTitle}>
                  Các tình huống trong bài thi
                </h2>
                <ExamPositions
                  compact
                  positions={r.items.map((x) => ({
                    position: x.position,
                    status: "COMPLETED",
                  }))}
                  current={position}
                  onChoose={onChoose}
                  label="Chọn tình huống xem lại"
                />
              </section>
            </aside>
          </div>
          <ScoringTimeline result={i} />
          <div className="mt-[1cm] grid gap-5 md:grid-cols-2">
            <SimulationHintCard
              title="Dấu hiệu nguy hiểm"
              text={i.hazardSign}
              warning
            />
            <SimulationHintCard
              title="Gợi ý nhận diện"
              text={i.recognitionTip}
            />
          </div>
          <nav
            aria-label="Điều hướng xem lại bài thi"
            className="mt-[1cm] flex flex-wrap items-center justify-between gap-3"
          >
            <button
              type="button"
              className={learningStyles.secondary}
              disabled={position <= 1 || !onChoose}
              onClick={() => onChoose?.(position - 1)}
            >
              <ArrowLeft className="size-4" />
              Tình huống trước
            </button>
            <button
              type="button"
              className={learningStyles.back}
              onClick={onBack}
            >
              <List className="size-4" />
              Quay lại bảng kết quả bài thi
            </button>
            <button
              type="button"
              className={learningStyles.primary}
              disabled={position >= r.result.policy.totalScenarios || !onChoose}
              onClick={() => onChoose?.(position + 1)}
            >
              Tình huống tiếp theo <ArrowRight className="size-4" />
            </button>
          </nav>
        </>
      )}
    </ExamShell>
  );
}
