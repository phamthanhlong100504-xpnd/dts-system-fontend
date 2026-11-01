"use client";

import { cn } from "@/lib/utils";

export type AnswerOptionState =
  | "neutral"
  | "selected"
  | "correct"
  | "wrong"
  | "disabled";

interface AnswerOptionProps {
  label: string;
  text: string;
  state: AnswerOptionState;

  disabled?: boolean;

  selectedLabel?: string;

  feedbackLabel?: string;

  showFeedbackBadge?: boolean;

  subtleStatusIndicator?: boolean;

  onClick?: () => void;
}

export function AnswerOption({
  label,
  text,
  state,
  disabled = false,
  selectedLabel,
  feedbackLabel,
  showFeedbackBadge = true,
  subtleStatusIndicator = false,
  onClick,
}: AnswerOptionProps) {
  const isSelected =
    state === "selected";

  const isCorrect =
    state === "correct";

  const isWrong =
    state === "wrong";

  const isDisabled =
    state === "disabled";

  const wrongBadge =
    feedbackLabel ??
    (selectedLabel
      ? "Bạn đã chọn"
      : undefined);

  const correctBadge =
    feedbackLabel ??
    "Đáp án đúng";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[60px] w-full items-center gap-3.5 rounded-[12px] border px-4 py-3 text-left transition",

        state === "neutral" &&
          "border-[#e3e3ee] bg-[#f5f4fb] hover:border-[#abc3ee] hover:bg-[#f1f4ff]",

        isSelected &&
          "border-[#0758d9] bg-[#f3f6ff] ring-1 ring-[#0758d9]/15",

        isCorrect &&
          "border-[#18a566] bg-[#effaf4]",

        isWrong &&
          "border-[#e34848] bg-[#fff3f2]",

        isDisabled &&
          "border-[#e5e6ed] bg-[#f6f6f8] opacity-60",

        disabled &&
          "cursor-default"
      )}
    >
      {/* A / B / C / D */}
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[12.5px] font-bold",

          state === "neutral" &&
            "bg-[#e8edff] text-[#56647a]",

          isSelected &&
            "bg-[#e3ebff] text-[#0758d9]",

          isCorrect &&
            (
              subtleStatusIndicator
                ? "bg-[#dcf7e8] text-[#087443]"
                : "bg-[#079455] text-white"
            ),

          isWrong &&
            (
              subtleStatusIndicator
                ? "bg-[#ffe5e3] text-[#b42318]"
                : "bg-[#c9252d] text-white"
            ),

          isDisabled &&
            "bg-[#eceef4] text-[#98a2b3]"
        )}
      >
        {label}
      </span>

      {/* Answer text */}
      <span
        className={cn(
          "min-w-0 flex-1 text-[14.5px] font-medium leading-6",

          state === "neutral" &&
            "text-[#27364f]",

          isSelected &&
            "font-semibold text-[#101828]",

          isCorrect &&
            "font-semibold text-[#126b46]",

          isWrong &&
            "font-semibold text-[#9f1f25]",

          isDisabled &&
            "text-[#98a2b3]"
        )}
      >
        {text}
      </span>

      {/* Wrong feedback badge */}
      {showFeedbackBadge &&
        isWrong &&
        wrongBadge && (
          <span className="shrink-0 rounded-full bg-[#ffe1df] px-2.5 py-1 text-[10.5px] font-semibold text-[#b42318]">
            {wrongBadge}
          </span>
        )}

      {/* Correct feedback badge */}
      {showFeedbackBadge &&
        isCorrect && (
          <span className="shrink-0 rounded-full bg-[#dff7e9] px-2.5 py-1 text-[10.5px] font-semibold text-[#087443]">
            {correctBadge}
          </span>
        )}
    </button>
  );
}