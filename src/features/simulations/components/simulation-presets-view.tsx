"use client";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  ListOrdered,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import styles from "./simulation-exam-layout.module.css";
import textStyles from "./simulation-text-layout.module.css";
import { cn } from "@/lib/utils";
import type { LearningLoadState } from "../simulation-learning-types";
import type {
  SimulationPresetItem,
  SimulationPresetPage,
} from "../simulation-preset-types";
import { learningStyles } from "./learning-ui";
import {
  ExamBadge,
  ExamLoad,
  ExamShell,
  examBody,
  examCard,
  examTitle,
} from "./simulation-exam-ui";
export function SimulationPresetsView({
  state,
  onBack,
  onRetry,
  onPrepare,
  onResume,
  onResult,
}: {
  state: LearningLoadState<SimulationPresetPage>;
  onBack?: () => void;
  onRetry?: () => void;
  onPrepare?: (item: SimulationPresetItem) => void;
  onResume?: (item: SimulationPresetItem) => void;
  onResult?: (item: SimulationPresetItem) => void;
}) {
  const d = state.status === "ready" ? state.data : null,
    policy = d?.items[0]?.policy;
  return (
    <ExamShell
      title="Bộ đề thi thử mô phỏng"
      description="Lựa chọn bộ đề có sẵn để luyện phản xạ với các tình huống mô phỏng giao thông."
      onBack={onBack}
    >
      {!d ? (
        <ExamLoad state={state} onRetry={onRetry} />
      ) : (
        <div className="space-y-[1cm]">
          <section className={examCard}>
            <div className={textStyles.headingDescription}>
              <h2 className={examTitle}>
                <BookOpen className="size-5 text-[#0758d9]" />
                Thi thử theo bộ đề có sẵn
              </h2>
              <p className={cn(examBody, "max-w-[900px]")}>
                Các tình huống được sắp xếp cố định theo từng bộ đề. Chọn bộ đề
                để làm bài và xem kết quả sau khi hoàn thành.
              </p>
            </div>
            <div className={styles.introGrid}>
              <ExamBadge className={styles.introItem}>
                <Layers3 className="size-4" />
                {d.totalPublishedSets} bộ đề đã công bố
              </ExamBadge>
              {policy && (
                <>
                  <ExamBadge className={styles.introItem}>
                    <FileText className="size-4" />
                    {policy.totalScenarios} tình huống mỗi đề
                  </ExamBadge>
                  <ExamBadge className={styles.introItem}>
                    <Trophy className="size-4" />
                    {policy.maxTotalScore} điểm tối đa
                  </ExamBadge>
                </>
              )}
              <ExamBadge className={styles.introItem}>
                <ListOrdered className="size-4" />
                Thứ tự tình huống cố định
              </ExamBadge>
            </div>
          </section>
          <section aria-label="Danh sách bộ đề">
            <div className={textStyles.headingDescription}>
              <h2 className={examTitle}>Danh sách bộ đề</h2>
              <p className={examBody}>
                Chọn một bộ đề để bắt đầu hoặc tiếp tục bài thi thử.
              </p>
            </div>
            {!d.items.length ? (
              <div
                className={cn(
                  examCard,
                  "mt-5 flex min-h-[260px] flex-col items-center justify-center py-[1cm] text-center",
                )}
              >
                <span className="flex size-12 items-center justify-center rounded-[12px] bg-[#eef2ff] text-[#0758d9]">
                  <Layers3 className="size-6" />
                </span>
                <div className={textStyles.headingDescription}>
                  <h3 className={styles.presetTitle}>
                    Chưa có bộ đề được công bố
                  </h3>
                  <p className={cn(examBody, "max-w-[500px]")}>
                    Bộ đề sẽ xuất hiện tại đây khi được phát hành. Bạn có thể
                    quay lại Ôn luyện để tiếp tục học.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBack}
                  className={cn(learningStyles.secondary, "mt-6")}
                >
                  Quay lại Ôn luyện
                </button>
              </div>
            ) : (
              <div className={styles.presetGrid}>
                {d.items.map((item) => (
                  <PresetCard
                    key={item.presetSetId}
                    item={item}
                    onPrepare={onPrepare}
                    onResume={onResume}
                    onResult={onResult}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </ExamShell>
  );
}
function PresetCard({
  item: i,
  onPrepare,
  onResume,
  onResult,
}: {
  item: SimulationPresetItem;
  onPrepare?: (item: SimulationPresetItem) => void;
  onResume?: (item: SimulationPresetItem) => void;
  onResult?: (item: SimulationPresetItem) => void;
}) {
  const latest = i.latestCompleted,
    active = i.activeSession,
    older = latest && latest.presetVersionId !== i.presetVersionId;
  return (
    <article className={cn(examCard, styles.presetCard)} aria-label={i.title}>
      <div className={textStyles.headingDescription}>
        <div className={styles.presetHeader}>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center bg-[#eef2ff] text-[#0758d9]",
              styles.presetIcon,
            )}
          >
            <FileText className="size-5" />
          </span>
          <h3 className={styles.presetTitle}>{i.title}</h3>
          <ExamBadge>
            {active ? (
              <>
                <Clock3 className="size-3.5" />
                Đang làm
              </>
            ) : latest ? (
              <>
                <CheckCircle2 className="size-3.5" />
                Đã làm
              </>
            ) : (
              "Chưa làm"
            )}
          </ExamBadge>
        </div>
        <p className={styles.presetSubtitle}>
          {i.policy.totalScenarios} tình huống · Điểm tối đa{" "}
          {i.policy.maxTotalScore}
        </p>
      </div>
      <div className={styles.presetBody}>
        {active && (
          <div>
            <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium text-[#475467]">
              <Clock3 className="size-4 shrink-0 text-[#0758d9]" />
              Đã hoàn thành {active.completedScenarios}/{active.totalScenarios}{" "}
              tình huống
            </p>
            {active.presetVersionId !== i.presetVersionId && (
              <p className="mt-[0.7cm] text-[14.5px] leading-6 text-[#475467]">
                Bài đang làm dùng phiên bản trước.
              </p>
            )}
          </div>
        )}
        {latest && (
          <div className={styles.presetLatest}>
            <p className={styles.presetLatestText}>
              <Trophy aria-hidden="true" />
              {older ? "Kết quả phiên bản trước" : "Kết quả gần nhất"}:{" "}
              <strong>
                {latest.score}/{latest.maxTotalScore} điểm
              </strong>
            </p>
            <ExamBadge tone={latest.passed ? "green" : "red"}>
              {latest.passed ? "Đạt" : "Không đạt"}
            </ExamBadge>
          </div>
        )}
      </div>
      <div
        className={cn(
          styles.presetActions,
          latest && styles.presetActionsWithResult,
        )}
      >
        {latest && (
          <button
            type="button"
            className={learningStyles.secondary}
            disabled={!onResult}
            onClick={() => onResult?.(i)}
          >
            Xem kết quả
          </button>
        )}
        {active ? (
          <button
            type="button"
            className={learningStyles.primary}
            disabled={!onResume}
            onClick={() => onResume?.(i)}
          >
            <Play className="size-4" />
            Tiếp tục
          </button>
        ) : (
          <button
            type="button"
            className={learningStyles.primary}
            disabled={!onPrepare}
            onClick={() => onPrepare?.(i)}
          >
            {latest ? <RotateCcw className="size-4" /> : null}
            {latest ? "Làm lại" : "Bắt đầu"}
            {!latest && <ArrowRight className="size-4" />}
          </button>
        )}
      </div>
    </article>
  );
}
