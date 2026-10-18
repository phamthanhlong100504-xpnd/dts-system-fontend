"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Clock3,
  FileText,
  Loader2,
} from "lucide-react";

import { MediaImage } from "@/components/ui/media-image";
import { QuestionSessionShell } from "@/features/practice/components/question-session/question-session-shell";
import type {
  ExamQuestion,
  QuestionOption,
} from "@/features/examination/examination-service";
import { cn } from "@/lib/utils";

export type OfficialExamSessionQuestion =
  ExamQuestion & {
    categoryName?: string;
    chapterName?: string;
    isCritical?: boolean;
  };

interface OfficialExamSessionContentProps {
  examTitle: string;

  questions: OfficialExamSessionQuestion[];

  currentIndex: number;

  answers: Record<
    string,
    string[]
  >;

  timeLeft: number | null;

  flaggedQuestionIds: Set<string>;

  isSubmitting?: boolean;

  onExit: () => void;

  onSubmit: () => void;

  onSelectAnswer: (
    questionId: string,
    optionId: string
  ) => void;

  onGoToQuestion: (
    index: number
  ) => void;

  onToggleFlag: (
    questionId: string
  ) => void;
}

interface NormalizedOption {
  id: string;
  label: string;
  text: string;
}

const OPTION_LABELS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

export function OfficialExamSessionContent({
  examTitle,
  questions,
  currentIndex,
  answers,
  timeLeft,
  flaggedQuestionIds,
  isSubmitting = false,
  onExit,
  onSubmit,
  onSelectAnswer,
  onGoToQuestion,
  onToggleFlag,
}: OfficialExamSessionContentProps) {
  const totalQuestions =
    questions.length;

  const currentQuestion =
    questions[currentIndex];

  const answeredCount =
    questions.filter(
      (question, index) => {
        const questionId =
          getQuestionId(
            question,
            index
          );

        return (
          answers[questionId] != null &&
          answers[questionId].length >
            0
        );
      }
    ).length;

  const formattedTime =
    formatTime(timeLeft);

  if (!currentQuestion) {
    return (
      <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
        <OfficialExamSessionHeader
          examTitle={examTitle}
          answeredCount={
            answeredCount
          }
          totalQuestions={
            totalQuestions
          }
          formattedTime={
            formattedTime
          }
          isSubmitting={
            isSubmitting
          }
          onExit={onExit}
          onSubmit={onSubmit}
        />

        <QuestionSessionShell>
          <section className="flex min-h-[420px] items-center justify-center rounded-[16px] border border-[#e3e6ed] bg-white p-8 text-center shadow-[0_4px_14px_rgba(15,23,42,0.035)]">
            <div>
              <FileText className="mx-auto size-8 text-[#98a2b3]" />

              <h2 className="mt-4 text-[18px] font-bold text-[#101828]">
                Đề thi chưa có câu hỏi
              </h2>

              <p className="mt-2 text-[14px] font-medium text-[#475467]">
                Không tìm thấy câu hỏi trong
                phiên thi hiện tại.
              </p>
            </div>
          </section>

          <div />
        </QuestionSessionShell>
      </div>
    );
  }

  const questionId =
    getQuestionId(
      currentQuestion,
      currentIndex
    );

  const options =
    normalizeOptions(
      currentQuestion
    );

  const selectedAnswers =
    answers[questionId] ?? [];

  const isFlagged =
    flaggedQuestionIds.has(
      questionId
    );

  const isMultipleChoice =
    currentQuestion.type ===
      "MULTIPLE_CHOICE" ||
    currentQuestion.type ===
      "MULTIPLE";

  const categoryLabel =
    currentQuestion.categoryName ??
    currentQuestion.chapterName;

  const progressPercent =
    totalQuestions > 0
      ? Math.round(
          (answeredCount /
            totalQuestions) *
            100
        )
      : 0;

  return (
    <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
      <OfficialExamSessionHeader
        examTitle={examTitle}
        answeredCount={
          answeredCount
        }
        totalQuestions={
          totalQuestions
        }
        formattedTime={
          formattedTime
        }
        isSubmitting={
          isSubmitting
        }
        onExit={onExit}
        onSubmit={onSubmit}
      />

      <QuestionSessionShell>
        <section className="flex min-h-[570px] flex-col rounded-[16px] border border-[#dedfea] bg-white px-6 py-7 sm:px-8 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 border-b border-[#eef0f4] pb-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1fr)] xl:items-center">
            <div className="col-start-1 row-start-1 flex flex-nowrap items-center gap-2">
              <span className="shrink-0 whitespace-nowrap rounded-[6px] bg-[#eaf1ff] px-2.5 py-1 text-[12px] font-bold uppercase text-[#0758d9]">
                Câu{" "}
                {currentIndex + 1} /{" "}
                {totalQuestions}
              </span>

              {currentQuestion.isCritical && (
                <span className="shrink-0 whitespace-nowrap rounded-[6px] bg-[#fff2dc] px-2.5 py-1 text-[12px] font-semibold text-[#b54708]">
                  Câu điểm liệt
                </span>
              )}
            </div>

            <div className="col-span-2 row-start-2 flex min-w-0 justify-center text-center xl:col-span-1 xl:col-start-2 xl:row-start-1">
              {categoryLabel && (!currentQuestion.isCritical || !categoryLabel.toLocaleLowerCase("vi-VN").includes("điểm liệt")) && (
                <span className="inline-flex max-w-full items-center justify-center rounded-[7px] bg-[#f1f3fa] px-3 py-1.5 text-[13px] font-medium leading-5 text-[#344054]">
                  {categoryLabel}
                </span>
              )}
            </div>

            <div className="col-start-2 row-start-1 flex justify-end xl:col-start-3">
              <button
                type="button"
                onClick={() =>
                  onToggleFlag(
                    questionId
                  )
                }
                className={cn(
                  "flex min-h-10 shrink-0 items-center gap-1.5 rounded-[8px] border px-3 text-[14px] font-semibold transition",
                  isFlagged
                    ? "border-[#7fa5eb] bg-[#eaf1ff] text-[#0758d9]"
                    : "border-[#dde1e9] bg-white text-[#536078] hover:border-[#bdc7d8] hover:bg-[#f8f9fc]"
                )}
              >
                <Bookmark
                  className={cn(
                    "size-3.5",
                    isFlagged &&
                      "fill-current"
                  )}
                  strokeWidth={1.9}
                />

                {isFlagged
                  ? "Đã đánh dấu"
                  : "Đánh dấu câu này"}
              </button>
            </div>
          </div>

          <div className="py-6">
            <h2 className="max-w-[960px] text-[16px] font-semibold leading-[1.65] tracking-[-0.01em] text-[#101828]">
              {currentQuestion.content ??
                currentQuestion.questionText ??
                "Câu hỏi chưa có nội dung."}
            </h2>

            {(currentQuestion.mediaFileIds?.[0] || currentQuestion.imageUrl) && (
              <div className="mt-5 flex justify-center">
                <MediaImage
                  src={
                    currentQuestion.mediaFileIds?.[0] || currentQuestion.imageUrl!
                  }
                  alt={`Hình minh họa câu ${
                    currentIndex + 1
                  }`}
                  className="max-h-[280px] max-w-full rounded-[10px] border border-[#e5e8ee] object-contain"
                />
              </div>
            )}

            <div className="mt-6 space-y-3">
              {options.length === 0 && (
                <p className="text-[14px] font-medium text-[#475467]">
                  Câu hỏi này chưa có
                  phương án trả lời.
                </p>
              )}

              {options.map(
                (option) => {
                  const isSelected =
                    selectedAnswers.includes(
                      option.id
                    );

                  return (
                    <button
                      key={
                        option.id
                      }
                      type="button"
                      disabled={
                        isSubmitting
                      }
                      onClick={() =>
                        onSelectAnswer(
                          questionId,
                          option.id
                        )
                      }
                      className={cn(
                        "flex min-h-[66px] w-full items-center gap-3.5 rounded-[12px] border px-4 py-3 text-left transition",
                        isSelected
                          ? "border-[#a9bff2] bg-[#f0f3ff] shadow-[0_1px_2px_rgba(7,88,217,0.04)]"
                          : "border-[#eaecf0] bg-white hover:border-[#b7c9ee] hover:bg-[#f9faff]",
                        isSubmitting &&
                          "cursor-not-allowed opacity-70"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center border",
                          isMultipleChoice
                            ? "rounded-[5px]"
                            : "rounded-full",
                          isSelected
                            ? "border-[#0758d9] bg-white"
                            : "border-[#d5d9e2] bg-[#eef1ff]"
                        )}
                      >
                        {isSelected && (
                          <span className="size-1.5 rounded-full bg-[#0758d9]" />
                        )}
                      </span>

                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-[7px] text-[14px] font-medium",
                          isSelected
                            ? "bg-[#e3ebff] text-[#0758d9]"
                            : "bg-[#f0f2fa] text-[#475467]"
                        )}
                      >
                        {
                          option.label
                        }
                      </span>

                      <span
                        className={cn(
                          "min-w-0 flex-1 text-[15px] font-medium leading-[1.55]",
                          isSelected
                            ? "text-[#101828]"
                            : "text-[#344054]"
                        )}
                      >
                        {option.text}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-[#eef0f4] pt-5">
            <button
              type="button"
              disabled={
                currentIndex === 0
              }
              onClick={() =>
                onGoToQuestion(
                  currentIndex - 1
                )
              }
              className="flex min-h-10 items-center gap-2 rounded-[9px] bg-[#f2f4f7] px-4 text-[14px] font-semibold text-[#475467] transition hover:bg-[#e9edf3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="size-3.5" />
              Câu trước
            </button>

            <div className="min-w-[145px] text-center">
              <p className="text-[14px] font-semibold text-[#667085]">
                Đã làm:{" "}
                {answeredCount}/
                {totalQuestions} câu
              </p>

              <div className="mx-auto mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-[#e6eaf0]">
                <div
                  className="h-full rounded-full bg-[#0758d9] transition-[width]"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={
                currentIndex ===
                totalQuestions - 1
              }
              onClick={() =>
                onGoToQuestion(
                  currentIndex + 1
                )
              }
              className="flex min-h-10 items-center gap-2 rounded-[9px] bg-[#0758d9] px-4 text-[14px] font-semibold text-white transition hover:bg-[#064fc3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Câu tiếp theo
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>

        <aside className="self-start lg:sticky lg:top-[96px]">
          <div className="rounded-[16px] border border-[#dfe3eb] bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#101828]">
                  Danh sách câu hỏi
                </h3>

                <p className="mt-1 text-[14px] font-medium text-[#475467]">
                  {answeredCount} /{" "}
                  {totalQuestions} đã trả
                  lời
                </p>
              </div>

              <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-[14px] font-bold text-[#0758d9]">
                {currentIndex + 1} /{" "}
                {totalQuestions}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2.5">
              {questions.map(
                (
                  navQuestion,
                  index
                ) => {
                  const navQuestionId =
                    getQuestionId(
                      navQuestion,
                      index
                    );

                  const isCurrent =
                    index ===
                    currentIndex;

                  const isAnswered =
                    (answers[
                      navQuestionId
                    ]?.length ??
                      0) > 0;

                  const isNavFlagged =
                    flaggedQuestionIds.has(
                      navQuestionId
                    );

                  return (
                    <button
                      key={
                        navQuestionId
                      }
                      type="button"
                      onClick={() =>
                        onGoToQuestion(
                          index
                        )
                      }
                      className={cn(
                        "relative flex size-[38px] items-center justify-center justify-self-center rounded-[9px] border text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/20",
                        isCurrent
                          ? "bg-[#0758d9] text-white shadow-[0_2px_6px_rgba(7,88,217,0.28)]"
                          : isAnswered
                            ? "bg-[#e9efff] text-[#0758d9] hover:bg-[#dfe8ff]"
                            : "bg-[#f0f1f7] text-[#4f5d73] hover:bg-[#e9ebf3]"
                      )}
                    >
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}

                      {!isCurrent &&
                        isAnswered && (
                          <span className="absolute bottom-1 size-1 rounded-full bg-[#0758d9]" />
                        )}

                      {navQuestion.isCritical && (
                        <span
                          className="absolute right-1 top-1 size-1.5 rounded-full bg-[#f59e0b]"
                          title="Câu điểm liệt"
                        />
                      )}

                      {isNavFlagged && (
                        <span
                          className={cn(
                            "absolute left-1 top-1 size-1.5 rounded-full",
                            isCurrent
                              ? "bg-white"
                              : "bg-[#7c3aed]"
                          )}
                          title="Đã đánh dấu"
                        />
                      )}
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e9eaf1] pt-4 text-[14px] font-medium text-[#59667a]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-[#0758d9]" />
                Đang làm
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#0758d9]" />
                Đã trả lời
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-[#e5e7ef]" />
                Chưa làm
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#f59e0b]" />
                Câu điểm liệt
              </span>
            </div>
          </div>
        </aside>
      </QuestionSessionShell>
    </div>
  );
}

function OfficialExamSessionHeader({
  examTitle,
  answeredCount,
  totalQuestions,
  formattedTime,
  isSubmitting,
  onExit,
  onSubmit,
}: {
  examTitle: string;
  answeredCount: number;
  totalQuestions: number;
  formattedTime: string;
  isSubmitting: boolean;
  onExit: () => void;
  onSubmit: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e3e7ee] bg-white">
      <div className="relative flex min-h-[72px] w-full flex-wrap items-center gap-2 px-5 py-2 sm:px-7 lg:px-[1cm]">
        {/* LEFT */}
        <div className="flex flex-1 items-center justify-start">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex h-8 items-center gap-2 rounded-[8px] px-1 text-[14px] font-semibold text-[#667085] transition hover:text-[#101828]"
          >
            <ArrowLeft
              className="size-3.5"
              strokeWidth={2}
            />

            Thoát
          </button>
        </div>

        {/* CENTER - luôn nằm chính giữa header */}
        <div className="order-3 flex w-full min-w-0 items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:top-1/2 sm:order-none sm:w-auto sm:max-w-[38%] sm:-translate-x-1/2 sm:-translate-y-1/2">
          <h1 className="max-w-[260px] truncate whitespace-nowrap text-[15px] sm:max-w-[320px] font-bold text-[#101828]">
            {examTitle}
          </h1>

          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#edf3ff] px-2.5 py-1 text-[14px] font-semibold leading-none text-[#0758d9]">
            Thi chính thức
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex flex-1 items-center justify-end">
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-[14px] font-semibold text-[#344054]">
              {answeredCount}

              <span className="font-medium text-[#98a2b3]">
                {" "}
                / {totalQuestions} câu
              </span>
            </span>

            <div className="flex h-8 min-w-[76px] items-center justify-center gap-1.5 rounded-[9px] bg-[#f3f5fa] px-2.5 text-[14px] font-semibold text-[#344054]">
              <Clock3
                className="size-3.5 text-[#667085]"
                strokeWidth={1.9}
              />

              {formattedTime}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSubmit}
              className="flex min-h-10 min-w-[100px] items-center justify-center rounded-[9px] bg-[#0758d9] px-4 text-[14px] font-bold text-white shadow-[0_2px_5px_rgba(7,88,217,0.16)] transition hover:bg-[#064fc3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Nộp bài"
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function normalizeOptions(
  question: OfficialExamSessionQuestion
): NormalizedOption[] {
  const raw = Array.isArray(
    question.options
  )
    ? (question.options as unknown[])
    : [];

  return raw.map(
    (option, index) => {
      const defaultLabel =
        OPTION_LABELS[index] ??
        String.fromCharCode(
          65 + index
        );

      if (
        typeof option ===
        "string"
      ) {
        return {
          id: defaultLabel,
          label: defaultLabel,
          text: option,
        };
      }

      const item =
        option as QuestionOption;

      const label =
        item.label ??
        defaultLabel;

      return {
        id: String(
          item.id ?? label
        ),
        label,
        text:
          item.text ??
          item.label ??
          "",
      };
    }
  );
}

function getQuestionId(
  question: OfficialExamSessionQuestion,
  index: number
) {
  return String(
    question.questionId ??
      question.id ??
      index + 1
  );
}

function formatTime(
  timeLeft: number | null
) {
  if (timeLeft == null) {
    return "--:--";
  }

  const safeTime =
    Math.max(0, timeLeft);

  const minutes =
    Math.floor(
      safeTime / 60
    );

  const seconds =
    safeTime % 60;

  return `${String(
    minutes
  ).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}