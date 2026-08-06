"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import type { ExamMode, Question, QuestionOption } from "@/features/practice/practice-service";
import type { AnswerFeedback } from "@/stores/exam-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labels = ["A", "B", "C", "D"];

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  mode: ExamMode;
  /** EXAM: đáp án đang chọn (local) */
  selectedAnswer?: string;
  /** PRACTICE: feedback sau khi nộp câu này */
  feedback?: AnswerFeedback | null;
  disabled?: boolean;
  onSelect: (label: string) => void;
}

/**
 * Hiển thị 1 câu hỏi + các đáp án bấm được.
 * - EXAM: chọn tự do, không lộ đáp án cho tới khi nộp bài.
 * - PRACTICE: sau khi chọn → hiện feedback (đúng/sai + đáp án đúng + giải thích), khóa lựa chọn.
 */
export function QuestionCard({
  question,
  index,
  total,
  mode,
  selectedAnswer,
  feedback,
  disabled,
  onSelect,
}: QuestionCardProps) {
  const answered = !!feedback;
  const hasExplanation = !!feedback?.explanation?.trim();

  return (
    <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Câu {index + 1}/{total}
        </span>
        {question.isCritical && (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Điểm liệt
          </Badge>
        )}
      </div>

      <p className="text-lg font-medium leading-relaxed">{question.questionText}</p>

      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt=""
          className="mt-2 max-h-52 rounded-lg border"
        />
      )}

      <div className="space-y-2">
        {(question.options ?? []).map((opt: QuestionOption, i: number) => {
          const label = opt.label ?? labels[i] ?? String.fromCharCode(65 + i);
          const isSelected = selectedAnswer === label;
          const isCorrectOpt = answered && feedback!.correctAnswer === label;
          const isWrongSelected =
            answered && isSelected && !feedback!.isCorrect;

          return (
            <button
              key={label ?? i}
              type="button"
              onClick={() => onSelect(label)}
              disabled={disabled || answered}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                !answered && "hover:border-primary/60 hover:bg-primary/5",
                !answered && isSelected && "border-primary bg-primary/5",
                !answered && !isSelected && "border-border",
                answered && isCorrectOpt &&
                  "border-emerald-500 bg-emerald-50 text-emerald-900",
                answered && isWrongSelected &&
                  "border-destructive bg-destructive/5 text-destructive",
                answered && !isCorrectOpt && !isWrongSelected &&
                  "border-border opacity-70"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  answered && isCorrectOpt && "bg-emerald-500 text-white",
                  answered && isWrongSelected && "bg-destructive text-white",
                  !answered && isSelected && "bg-primary text-primary-foreground",
                  !answered && !isSelected && "bg-muted text-muted-foreground"
                )}
              >
                {label}
              </span>
              <span className="leading-relaxed">{opt.text}</span>
              {answered && isCorrectOpt && (
                <Check className="ml-auto h-4 w-4 shrink-0" />
              )}
              {answered && isWrongSelected && (
                <X className="ml-auto h-4 w-4 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {mode === "PRACTICE" && feedback && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            feedback.isCorrect
              ? "border-emerald-500/40 bg-emerald-50/60"
              : "border-destructive/40 bg-destructive/5"
          )}
        >
          <p
            className={cn(
              "flex items-center gap-1.5 font-semibold",
              feedback.isCorrect ? "text-emerald-700" : "text-destructive"
            )}
          >
            {feedback.isCorrect ? (
              <>
                <Check className="h-4 w-4" /> Chính xác!
              </>
            ) : (
              <>
                <X className="h-4 w-4" /> Sai.
              </>
            )}
          </p>
          <p className="mt-1 text-muted-foreground">
            Đáp án đúng:{" "}
            <span className="font-semibold text-foreground">
              {feedback.correctAnswer}
            </span>
          </p>
          {hasExplanation && (
            <p className="mt-2 whitespace-pre-line leading-relaxed">
              {feedback.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
