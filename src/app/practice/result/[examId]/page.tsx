"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultQuestionCard } from "@/features/practice/components/result/result-question-card";
import { ResultSummary } from "@/features/practice/components/result/result-summary";
import type { ExamAnswerResult } from "@/features/practice/practice-service";
import {
  useExamResult,
  useRetryExamAndGo,
} from "@/features/practice/use-practice";
import { cn } from "@/lib/utils";

type ResultFilter =
  | "all"
  | "wrong"
  | "critical"
  | "unanswered";

function formatElapsedTime(
  startedAt?: string,
  completedAt?: string
) {
  if (!startedAt || !completedAt) {
    return "—";
  }

  const startedTime =
    new Date(startedAt).getTime();

  const completedTime =
    new Date(completedAt).getTime();

  if (
    Number.isNaN(startedTime) ||
    Number.isNaN(completedTime)
  ) {
    return "—";
  }

  const totalSeconds =
    Math.max(
      0,
      Math.round(
        (completedTime - startedTime) /
          1000
      )
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function StudentExamResultPage() {
  const router =
    useRouter();

  const { examId } =
    useParams<{
      examId: string;
    }>();

  const resultQuery =
    useExamResult(examId);

  const retryAndGo =
    useRetryExamAndGo();

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<ResultFilter>(
      "all"
    );

  const result =
    resultQuery.data;

  if (resultQuery.isLoading) {
    return (
      <RequireAuth>
        <div className="font-dts min-h-screen bg-[#f7f6fb]">
          <div className="w-full px-6 py-8 lg:px-[38px]">
            <Skeleton className="h-8 w-36" />

            <Skeleton className="mx-auto mt-6 h-[360px] w-full max-w-[860px] rounded-[18px]" />

            <div className="mx-auto mt-12 w-full max-w-[1240px]">
              <Skeleton className="h-10 w-64" />

              <Skeleton className="mt-5 h-[420px] rounded-[16px]" />
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (
    resultQuery.isError ||
    !result
  ) {
    return (
      <RequireAuth>
        <div className="font-dts flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f7f6fb] px-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto size-9 text-[#d92d20]" />

            <h1 className="mt-4 text-[20px] font-bold text-[#101828]">
              Không thể tải kết quả
            </h1>

            <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467]">
              Kết quả bài làm hiện chưa thể
              hiển thị. Bạn có thể quay lại
              trang Ôn luyện và thử lại.
            </p>

            <Button
              type="button"
              className="mt-5 bg-[#0758d9] hover:bg-[#064fc3]"
              onClick={() =>
                router.push(
                  "/practice"
                )
              }
            >
              Quay về Ôn luyện
            </Button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  const answers:
    ExamAnswerResult[] =
    result.answers ?? [];

  const isPassed =
    result.passed === true;

  const correctCount =
    result.correctCount ?? 0;

  const totalQuestions =
    result.totalQuestions ?? 0;

  const answeredWrongCount =
    result.answeredWrongCount ?? 0;

  const unansweredCount =
    result.unansweredCount ?? 0;

  const criticalCount =
    answers.filter(
      (answer) =>
        answer.isCritical === true
    ).length;

  const criticalWrongCount =
    answers.filter(
      (answer) =>
        answer.isCritical === true &&
        answer.isCorrect !== true
    ).length;

  const filteredAnswers =
    answers
      .map(
        (
          answer,
          originalIndex
        ) => ({
          answer,
          originalIndex,
        })
      )
      .filter(
        ({ answer }) => {
          if (
            activeFilter ===
            "wrong"
          ) {
            return (
              Boolean(
                answer.selectedAnswer
              ) &&
              answer.isCorrect !== true
            );
          }

          if (
            activeFilter ===
            "critical"
          ) {
            return (
              answer.isCritical === true
            );
          }

          if (
            activeFilter ===
            "unanswered"
          ) {
            return !answer.selectedAnswer;
          }

          return true;
        }
      );

  const timeSpent =
    formatElapsedTime(
      result.startedAt,
      result.completedAt
    );

  function scrollToResultDetail() {
    window.requestAnimationFrame(
      () => {
        document
          .getElementById(
            "result-detail"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }
    );
  }

  return (
    <RequireAuth>
      <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
        <main className="w-full px-6 pb-14 pt-6 lg:px-[38px]">
          <div>
            <Link
              href="/practice"
              className="-ml-2 inline-flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[14.5px] font-semibold text-[#344054] transition hover:bg-[#eef1f7] hover:text-[#101828]"
            >
              <ArrowLeft className="size-4" />

              Quay về Ôn luyện
            </Link>
          </div>

          <div className="mt-5">
            <ResultSummary
              passed={isPassed}
              correctCount={
                correctCount
              }
              wrongCount={
                answeredWrongCount
              }
              totalQuestions={
                totalQuestions
              }
              criticalWrongCount={
                criticalWrongCount
              }
              timeSpent={
                timeSpent
              }
              retryPending={
                retryAndGo.isPending
              }
              onRetry={() => {
                retryAndGo.mutate(
                  examId
                );
              }}
              onNextExam={() => {
                router.push(
                  "/practice/exams"
                );
              }}
              onViewWrong={() => {
                setActiveFilter(
                  "wrong"
                );

                scrollToResultDetail();
              }}
            />
          </div>

          <section
            id="result-detail"
            className="mx-auto mt-12 w-full max-w-[1240px] scroll-mt-24"
          >
            <div>
              <h2 className="text-[24px] font-bold tracking-[-0.015em] text-[#101828]">
                Chi tiết bài làm
              </h2>

              <p className="mt-1 text-[14.5px] font-medium leading-6 text-[#475467]">
                Xem lại toàn bộ đáp án,
                đối chiếu câu chọn và giải
                thích chi tiết từng câu.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ResultFilterButton
                active={
                  activeFilter ===
                  "all"
                }
                onClick={() =>
                  setActiveFilter(
                    "all"
                  )
                }
              >
                Tất cả ({answers.length})
              </ResultFilterButton>

              <ResultFilterButton
                active={
                  activeFilter ===
                  "wrong"
                }
                tone="danger"
                disabled={
                  answeredWrongCount === 0
                }
                onClick={() =>
                  setActiveFilter(
                    "wrong"
                  )
                }
              >
                Câu sai (
                {answeredWrongCount})
              </ResultFilterButton>

              <ResultFilterButton
                active={
                  activeFilter ===
                  "critical"
                }
                tone="blue"
                disabled={
                  criticalCount === 0
                }
                onClick={() =>
                  setActiveFilter(
                    "critical"
                  )
                }
              >
                Câu điểm liệt (
                {criticalCount})
              </ResultFilterButton>

              <ResultFilterButton
                active={
                  activeFilter ===
                  "unanswered"
                }
                disabled={
                  unansweredCount === 0
                }
                onClick={() =>
                  setActiveFilter(
                    "unanswered"
                  )
                }
              >
                Chưa trả lời (
                {unansweredCount})
              </ResultFilterButton>
            </div>

            <div className="mt-5 space-y-4">
              {answers.length === 0 ? (
                <EmptyResultMessage>
                  Không có dữ liệu chi tiết
                  cho bài này.
                </EmptyResultMessage>
              ) : filteredAnswers.length ===
                0 ? (
                <EmptyResultMessage>
                  Không có câu hỏi phù hợp
                  với bộ lọc này.
                </EmptyResultMessage>
              ) : (
                filteredAnswers.map(
                  ({
                    answer,
                    originalIndex,
                  }) => (
                    <ResultQuestionCard
                      key={
                        answer.questionId ??
                        originalIndex
                      }
                      answer={
                        answer
                      }
                      index={
                        originalIndex
                      }
                      totalQuestions={
                        totalQuestions
                      }
                    />
                  )
                )
              )}
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}

function ResultFilterButton({
  active,
  disabled = false,
  tone = "neutral",
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  tone?:
    | "neutral"
    | "danger"
    | "blue";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-[14.5px] font-semibold transition",
        active &&
          "border-[#0758d9] bg-[#0758d9] text-white shadow-[0_1px_3px_rgba(7,88,217,0.14)]",
        !active &&
          tone === "danger" &&
          "border-[#e2e5ec] bg-white text-[#b42318] hover:border-[#f0b9b5] hover:bg-[#fff7f6]",
        !active &&
          tone === "blue" &&
          "border-[#e2e5ec] bg-white text-[#344054] hover:border-[#b7c9ed] hover:bg-[#f5f8ff]",
        !active &&
          tone === "neutral" &&
          "border-[#e2e5ec] bg-white text-[#344054] hover:bg-[#f7f8fb]",
        disabled &&
          "cursor-not-allowed border-transparent bg-transparent text-[#c0c6d0] shadow-none hover:border-transparent hover:bg-transparent"
      )}
    >
      {!active &&
        !disabled &&
        tone === "danger" && (
          <span className="size-1.5 rounded-full bg-[#d92d20]" />
        )}

      {!active &&
        !disabled &&
        tone === "blue" && (
          <span className="size-1.5 rounded-full bg-[#0758d9]" />
        )}

      {!active &&
        disabled && (
          <span className="size-1.5 rounded-full bg-[#cbd1dc]" />
        )}

      {children}
    </button>
  );
}

function EmptyResultMessage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-[#e1e4eb] bg-white px-6 py-10 text-center">
      <p className="text-[14.5px] font-medium text-[#475467]">
        {children}
      </p>
    </div>
  );
}