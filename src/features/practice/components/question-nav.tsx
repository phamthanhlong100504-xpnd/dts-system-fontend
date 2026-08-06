"use client";

import { cn } from "@/lib/utils";

interface QuestionNavProps {
  total: number;
  currentIndex: number;
  isAnswered: (index: number) => boolean;
  onJump: (index: number) => void;
}

/** Lưới số câu hỏi để nhảy nhanh (dùng cho EXAM). */
export function QuestionNav({
  total,
  currentIndex,
  isAnswered,
  onJump,
}: QuestionNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: total }, (_, i) => {
        const answered = isAnswered(i);
        const current = i === currentIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Câu ${i + 1}`}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              answered
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground",
              current && "ring-2 ring-primary ring-offset-1",
              !answered && !current && "hover:border-primary/50"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
