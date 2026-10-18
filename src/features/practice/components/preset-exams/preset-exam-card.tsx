"use client";

import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type {
  PresetExamSet,
} from "@/features/practice/preset-exam-types";

import {
  formatPresetExamDuration,
} from "@/features/practice/preset-exam-types";

import { cn } from "@/lib/utils";

interface PresetExamCardProps {
  exam: PresetExamSet;

  onStart: (
    exam: PresetExamSet
  ) => void;

  onResume?: (
    exam: PresetExamSet
  ) => void;

  pending?: boolean;
}

export function PresetExamCard({
  exam,
  onStart,
  onResume,
  pending = false,
}: PresetExamCardProps) {
  const isNotStarted =
    exam.userStatus ===
    "NOT_STARTED";

  const isInProgress =
    exam.userStatus ===
    "IN_PROGRESS";

  const isPassed =
    exam.userStatus ===
    "PASSED";

  const isFailed =
    exam.userStatus ===
    "FAILED";

  const latestAttempt =
    exam.latestAttempt;

  const correctCount =
    latestAttempt?.correctCount;

  const attemptTotal =
    latestAttempt?.totalQuestions ??
    exam.totalQuestions;

  const hasScore =
    typeof correctCount ===
      "number" &&
    typeof attemptTotal ===
      "number";

  function handleAction() {
    if (
      isInProgress &&
      onResume
    ) {
      onResume(exam);
      return;
    }

    onStart(exam);
  }

  return (
    <article
      className="
        flex
        min-h-[230px]
        flex-col
        rounded-[18px]
        border
        border-[#e2e5ec]
        bg-white
        px-5
        pt-5
        pb-[0.8cm]
        shadow-[0_4px_14px_rgba(31,41,55,0.04)]
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-[#d5dae5]
        hover:shadow-[0_8px_22px_rgba(31,41,55,0.065)]
      "
    >
      {/* Exam code */}
      <div>
        <span
          className="
            inline-flex
            min-h-7
            items-center
            justify-center
            rounded-[7px]
            bg-[#e9efff]
            px-2.5
            text-[11px]
            font-bold
            uppercase
            tracking-[0.02em]
            text-[#0758d9]
          "
        >
          ĐỀ {exam.code}
        </span>
      </div>

      {/* Title */}
      <h3
        className="
          mt-4
          line-clamp-2
          text-[17px]
          font-bold
          leading-[1.45]
          text-[#101828]
        "
      >
        {exam.title}
      </h3>

      {/* Meta */}
      <div
        className="
          mt-2.5
          flex
          flex-wrap
          items-center
          gap-x-3
          gap-y-1.5
          text-[13px]
          font-medium
          text-[#667085]
        "
      >
        <span className="inline-flex items-center gap-1.5">
          <FileText
            className="size-4"
            strokeWidth={1.9}
          />

          {exam.totalQuestions} câu
        </span>

        <span
          aria-hidden="true"
          className="size-1 rounded-full bg-[#c6cad4]"
        />

        <span className="inline-flex items-center gap-1.5">
          <Clock3
            className="size-4"
            strokeWidth={1.9}
          />

          {formatPresetExamDuration(
            exam.durationSeconds
          )}
        </span>
      </div>

      <div className="flex-1" />

      {/* Last attempt / status */}
      <div
        className="
          mt-5
          flex
          min-h-[48px]
          items-center
          justify-between
          gap-3
          rounded-[11px]
          bg-[#f1f3ff]
          px-4
          py-3
        "
      >
        {isNotStarted && (
          <>
            <span className="text-[13px] font-medium text-[#5d6678]">
              Chưa từng làm
            </span>

            <span className="text-[14px] font-semibold text-[#98a2b3]">
              —
            </span>
          </>
        )}

        {isInProgress && (
          <>
            <div className="min-w-0">
              <span className="text-[13px] font-medium text-[#5d6678]">
                Trạng thái:
              </span>

              <span className="ml-1.5 text-[13px] font-bold text-[#0758d9]">
                Đang làm
              </span>
            </div>

            <StatusBadge
              tone="progress"
              label="Đang làm"
            />
          </>
        )}

        {(isPassed ||
          isFailed) && (
          <>
            <div className="min-w-0">
              <span className="text-[13px] font-medium text-[#5d6678]">
                Lần gần nhất:
              </span>

              {hasScore ? (
                <span className="ml-1.5 text-[15px] font-bold text-[#101828]">
                  {correctCount} /{" "}
                  {attemptTotal}
                </span>
              ) : (
                <span className="ml-1.5 text-[14px] font-semibold text-[#98a2b3]">
                  —
                </span>
              )}
            </div>

            {isPassed ? (
              <StatusBadge
                tone="passed"
                label="Đạt"
              />
            ) : (
              <StatusBadge
                tone="failed"
                label="Chưa đạt"
              />
            )}
          </>
        )}
      </div>

      {/* Action */}
      <Button
        type="button"
        disabled={pending}
        onClick={handleAction}
        className={cn(
          `
            mt-[0.8cm]
            h-10
            w-fit
            self-center
            rounded-[10px]
            px-5
            text-[13.5px]
            font-semibold
            shadow-none
            transition
          `,

          (isNotStarted ||
            isInProgress) &&
            `
              bg-[#0758d9]
              text-white
              shadow-[0_2px_5px_rgba(7,88,217,0.14)]
              hover:bg-[#064fc3]
            `,

          (isPassed ||
            isFailed) &&
            `
              border
              border-[#ccd7ff]
              bg-[#eef2ff]
              text-[#0758d9]
              hover:border-[#b9c8ff]
              hover:bg-[#e4eaff]
            `
        )}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />

            Đang xử lý...
          </>
        ) : isInProgress ? (
          <>
            <Play
              className="size-4"
              fill="currentColor"
              strokeWidth={1.8}
            />

            Tiếp tục làm bài
          </>
        ) : isNotStarted ? (
          <>
            <Play
              className="size-4"
              fill="currentColor"
              strokeWidth={1.8}
            />

            Bắt đầu làm bài
          </>
        ) : (
          <>
            <RotateCcw
              className="size-4"
              strokeWidth={2}
            />

            Làm lại đề
          </>
        )}
      </Button>
    </article>
  );
}

function StatusBadge({
  tone,
  label,
}: {
  tone:
    | "passed"
    | "failed"
    | "progress";

  label: string;
}) {
  return (
    <span
      className={cn(
        `
          inline-flex
          shrink-0
          items-center
          gap-1.5
          rounded-full
          px-2.5
          py-1
          text-[11.5px]
          font-semibold
        `,

        tone ===
          "passed" &&
          "bg-[#dcf7e8] text-[#087443]",

        tone ===
          "failed" &&
          "bg-[#ffe1df] text-[#b42318]",

        tone ===
          "progress" &&
          "bg-[#dce8ff] text-[#0758d9]"
      )}
    >
      {tone ===
        "passed" && (
        <CheckCircle2
          className="size-3.5"
          strokeWidth={2.4}
        />
      )}

      {tone ===
        "failed" && (
        <XCircle
          className="size-3.5"
          strokeWidth={2.4}
        />
      )}

      {tone ===
        "progress" && (
        <span className="size-1.5 rounded-full bg-current" />
      )}

      {label}
    </span>
  );
}