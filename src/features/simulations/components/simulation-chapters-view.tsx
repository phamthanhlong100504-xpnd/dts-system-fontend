"use client";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import textStyles from "./simulation-text-layout.module.css";
import type {
  LearningLoadState,
  SimulationChapter,
  SimulationOverview,
} from "../simulation-learning-types";
import {
  BackAction,
  LearningNotice,
  LearningShell,
  LearningSkeleton,
  ProgressSummary,
  learningStyles,
  roman,
} from "./learning-ui";
export function SimulationChaptersView({
  licenseClass,
  state,
  onBack,
  onOpenChapter,
  onRetry,
}: {
  licenseClass: string;
  state: LearningLoadState<SimulationOverview>;
  onBack?: () => void;
  onOpenChapter?: (chapter: SimulationChapter) => void;
  onRetry?: () => void;
}) {
  const data = state.status === "ready" ? state.data : null;
  return (
    <LearningShell
      navigation={<BackAction onClick={onBack}>Quay lại Ôn luyện</BackAction>}
    >
      <header
        className={cn(
          "mb-6",
          textStyles.headingDescription,
          textStyles.pageIntro,
        )}
      >
        <h1 className={learningStyles.heading}>Ôn theo chương</h1>
        <p className={learningStyles.body}>
          Hạng{" "}
          <strong className="font-semibold text-[#27364f]">
            {licenseClass}
          </strong>{" "}
          ·{" "}
          {data
            ? `Luyện tập ${data.totalScenarios} tình huống mô phỏng giao thông theo ${data.chapters.length} chương.`
            : "Luyện tập các tình huống mô phỏng giao thông theo từng chương."}
        </p>
      </header>
      {state.status === "loading" ? (
        <LearningSkeleton />
      ) : state.status === "unavailable" ? (
        <LearningNotice kind="unavailable" />
      ) : state.status === "error" ? (
        <LearningNotice
          kind="error"
          message={state.message}
          onRetry={onRetry}
        />
      ) : (
        data && (
          <>
            <ProgressSummary
              label="Tiến độ luyện tập"
              learned={data.practicedScenarios}
              total={data.totalScenarios}
              percent={data.completionPercent}
            />
            {data.chapters.length === 0 ? (
              <div className="mt-7">
                <LearningNotice
                  kind="empty"
                  message="Chưa có chương mô phỏng được công bố cho hạng đang chọn."
                />
              </div>
            ) : (
              <div className="mt-[1cm] grid grid-cols-1 gap-[0.9cm] lg:grid-cols-2">
                {data.chapters.map((chapter) => {
                  const completed = chapter.status === "COMPLETED";
                  return (
                    <article
                      key={chapter.id}
                      className={cn(
                        learningStyles.card,
                        "flex min-h-[238px] flex-col p-5 transition hover:border-[#d7dce6]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            learningStyles.badge,
                            "rounded-[7px] px-3 py-1.5 font-bold uppercase tracking-[0.03em]",
                          )}
                        >
                          Chương {roman(chapter.number)}
                        </span>
                        <span className={learningStyles.badge}>
                          {completed ? (
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Đã luyện hết
                            </span>
                          ) : chapter.status === "IN_PROGRESS" ? (
                            "Đang luyện"
                          ) : (
                            "Chưa bắt đầu"
                          )}
                        </span>
                      </div>
                      <h2 className="mt-4 text-[18px] font-bold leading-[1.45] text-[#0b1427]">
                        {chapter.name}
                      </h2>
                      <p className="mt-1 text-[15.5px] font-medium leading-5 text-[#475467]">
                        {chapter.totalScenarios} tình huống
                        {chapter.scenarioRangeLabel
                          ? ` · ${chapter.scenarioRangeLabel}`
                          : ""}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3 text-[15.5px] font-medium text-[#344054]">
                        <span>
                          {chapter.practicedScenarios} /{" "}
                          {chapter.totalScenarios} tình huống đã luyện
                        </span>
                        <strong className="text-[#0758d9]">
                          {chapter.completionPercent}%
                        </strong>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Tiến độ chương ${roman(chapter.number)}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={chapter.completionPercent}
                        className={cn(learningStyles.progressTrack, "mt-3")}
                      >
                        <div
                          className={learningStyles.progressFill}
                          style={{ width: `${chapter.completionPercent}%` }}
                        />
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-end gap-4 pt-5">
                        <button
                          type="button"
                          disabled={!onOpenChapter}
                          onClick={() => onOpenChapter?.(chapter)}
                          className={
                            completed
                              ? learningStyles.secondary
                              : learningStyles.primary
                          }
                        >
                          {completed
                            ? "Ôn lại"
                            : chapter.status === "IN_PROGRESS"
                              ? "Tiếp tục ôn"
                              : "Bắt đầu ôn"}
                          {completed ? (
                            <RotateCcw className="size-4" aria-hidden="true" />
                          ) : (
                            <ArrowRight className="size-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )
      )}
    </LearningShell>
  );
}
