"use client";

import { useState } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import type {
  Question,
  QuestionOption,
} from "@/features/practice/practice-service";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labels = ["A", "B", "C", "D"];

interface ChapterQuestionCardProps {
  question: Question;
  index: number; // 0-based
}

/**
 * 1 câu trong mục Ôn tập theo chương — bấm chọn đáp án được.
 * Sau khi chọn: tô màu đáp án đúng (xanh) / chọn sai (đỏ),
 * hiện feedback "đáp án đúng + giải thích chi tiết", rồi khóa câu.
 */
export function ChapterQuestionCard({
  question,
  index,
}: ChapterQuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correctAnswer = question.correctAnswer ?? "";
  const isCorrect = answered && selected === correctAnswer;
  const hasExplanation = !!question.explanation?.trim();

  return (
    <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Câu {index + 1}
        </span>
        {question.isCritical && (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Điểm liệt
          </Badge>
        )}
      </div>

      <p className="text-lg font-medium leading-relaxed">
        {question.questionText}
      </p>

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
          const isSelected = selected === label;
          const isCorrectOpt = answered && correctAnswer === label;
          const isWrongSelected = answered && isSelected && !isCorrect;

          return (
            <button
              key={label ?? i}
              type="button"
              onClick={() => {
                if (!answered) setSelected(label);
              }}
              disabled={answered}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                !answered && "hover:border-primary/60 hover:bg-primary/5",
                !answered && isSelected && "border-primary bg-primary/5",
                !answered && !isSelected && "border-border",
                answered && isCorrectOpt &&
                  "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium",
                answered && isWrongSelected &&
                  "border-destructive/60 bg-destructive/10 text-destructive dark:text-red-400 font-medium",
                answered && !isCorrectOpt && !isWrongSelected &&
                  "border-border opacity-60"
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
                <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
              )}
              {answered && isWrongSelected && (
                <X className="ml-auto h-4 w-4 shrink-0 text-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            isCorrect
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-destructive/40 bg-destructive/10"
          )}
        >
          <p
            className={cn(
              "flex items-center gap-1.5 font-semibold",
              isCorrect
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-destructive dark:text-red-400"
            )}
          >
            {isCorrect ? (
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
              {correctAnswer}
            </span>
            {selected !== correctAnswer && (
              <>
                {" "}· Bạn chọn:{" "}
                <span className="font-semibold text-destructive">
                  {selected}
                </span>
              </>
            )}
          </p>
          {hasExplanation && (
            <div className="mt-3 rounded-xl bg-muted/50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Giải thích chi tiết
              </p>
              <p className="whitespace-pre-line leading-relaxed text-foreground/90">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
