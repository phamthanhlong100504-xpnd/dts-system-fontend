
"use client";

import { ArrowRight, Check } from "lucide-react";

import type {
  LearningChapterProgress,
  LearningProgressStatus,
} from "@/features/progress-learning/progress-learning-types";
import { cn } from "@/lib/utils";

interface ProgressLearningChaptersProps {
  chapters: LearningChapterProgress[];
  onOpenChapter: (
    chapter: LearningChapterProgress
  ) => void;
}

export function ProgressLearningChapters({
  chapters,
  onOpenChapter,
}: ProgressLearningChaptersProps) {
  return (
    <section className="mt-9">
      <div>
        <h2 className="text-[20px] font-bold leading-[1.3] tracking-[-0.02em] text-[#101828]">
          Tiến độ theo chương
        </h2>

        <p className="mt-2 text-[14px] font-medium leading-6 text-[#667085]">
          Tiếp tục những nội dung bạn chưa học hết.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-[0.6cm]">
        {chapters.map((chapter) => (
          <ChapterProgressRow
            key={chapter.chapterId}
            chapter={chapter}
            onOpen={() => onOpenChapter(chapter)}
          />
        ))}
      </div>
    </section>
  );
}

interface ChapterProgressRowProps {
  chapter: LearningChapterProgress;
  onOpen: () => void;
}

function ChapterProgressRow({
  chapter,
  onOpen,
}: ChapterProgressRowProps) {
  const action = getChapterAction(chapter.status);

  const completed =
    chapter.status === "COMPLETED";

  const notStarted =
    chapter.status === "NOT_STARTED";

  const percent = clampPercent(
    chapter.progressPercent
  );

  return (
    <article
      className={cn(
        "grid w-full grid-cols-1",
        "gap-[0.6cm]",
        "rounded-[18px]",
        "border border-[#e3e5ec]",
        "bg-white",
        "p-[0.6cm]",
        "shadow-[0_3px_12px_rgba(31,41,55,0.035)]",
        "transition-shadow",
        "hover:shadow-[0_6px_18px_rgba(31,41,55,0.05)]",
        "lg:min-h-[165px]",
        "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px]",
        "lg:items-stretch",
        "lg:gap-x-6"
      )}
    >
      {/* CỘT TRÁI: NHÃN CHƯƠNG VÀ TÊN NỘI DUNG */}
      <div className="flex min-w-0 flex-col items-start">
        <span
          className="
            inline-flex
            min-h-7
            shrink-0
            items-center
            rounded-[7px]
            bg-[#eaf0ff]
            px-3
            text-[11px]
            font-bold
            uppercase
            tracking-[0.03em]
            text-[#0758d9]
          "
        >
          CHƯƠNG {toRoman(chapter.chapterId)}
        </span>

        <h3
          className="
            mt-[1.5cm]
            w-full
            text-[16px]
            font-bold
            leading-[1.45]
            text-[#101828]
          "
        >
          {chapter.chapterName}
        </h3>
      </div>

      <div className="relative flex min-w-0 flex-col justify-center lg:h-full">
        {/* THÔNG TIN PHÍA TRÊN THANH */}
        <div
          className="
            mb-3
            flex
            flex-wrap
            items-center
            justify-between
            gap-x-3
            gap-y-2
            lg:absolute
            lg:bottom-[calc(50%+12px)]
            lg:left-0
            lg:right-[calc(2cm-1.5rem)]
            lg:mb-0
          "
        >
          <div className="flex flex-wrap items-center gap-2">
            {notStarted ? (
              <span className="text-[13px] font-medium text-[#667085]">
                {chapter.totalQuestions} câu · Chưa bắt đầu
              </span>
            ) : (
              <>
                <span className="text-[13px] font-medium text-[#475467]">
                  <strong className="font-semibold text-[#27364f]">
                    {chapter.studiedQuestions}
                    {" / "}
                    {chapter.totalQuestions}
                  </strong>{" "}
                  câu đã học
                </span>

                {completed && (
                  <span
                    className="
                      inline-flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-full
                      bg-[#dff7ff]
                      px-2.5
                      py-1
                      text-[11px]
                      font-semibold
                      text-[#087ea4]
                    "
                  >
                    <Check
                      className="size-3.5"
                      strokeWidth={2.2}
                    />
                    Đã học hết câu
                  </span>
                )}
              </>
            )}
          </div>

          <span className="shrink-0 text-[13px] font-bold text-[#0758d9]">
            {Math.round(percent)}%
          </span>
        </div>

        {/* THANH TIẾN ĐỘ CĂN GIỮA CHIỀU CAO CARD */}
        <div
          className="
            mt-3
            h-2
            w-full
            overflow-hidden
            rounded-full
            bg-[#e8ebf5]
            lg:absolute
            lg:left-0
            lg:right-[calc(2cm-1.5rem)]
            lg:top-1/2
            lg:mt-0
            lg:w-auto
            lg:-translate-y-1/2
          "
          role="progressbar"
          aria-label={`Tiến độ ${chapter.chapterName}`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="
              h-full
              rounded-full
              bg-[#2f6eea]
              transition-[width]
              duration-300
            "
            style={{
              width: `${percent}%`,
            }}
          />
        </div>
      </div>

      {/* CỘT PHẢI: NÚT Ở GÓC DƯỚI */}
      <div className="flex items-end justify-end">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "inline-flex",
            "h-10",
            "w-[120px]",
            "shrink-0",
            "items-center",
            "justify-center",
            "gap-2",
            "rounded-[10px]",
            "px-3",
            "text-[13px]",
            "font-semibold",
            "transition-colors",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-[#0758d9]/30",
            action.primary
              ? "bg-[#0758d9] text-white hover:bg-[#064fc3]"
              : "bg-[#e5eaff] text-[#0758d9] hover:bg-[#dbe3ff]"
          )}
        >
          {action.label}

          <ArrowRight
            className="size-4 shrink-0"
            strokeWidth={2}
          />
        </button>
      </div>
    </article>
  );
}

function getChapterAction(
  status: LearningProgressStatus
): {
  label: string;
  primary: boolean;
} {
  switch (status) {
    case "NOT_STARTED":
      return {
        label: "Bắt đầu",
        primary: true,
      };

    case "IN_PROGRESS":
      return {
        label: "Tiếp tục",
        primary: true,
      };

    case "COMPLETED":
      return {
        label: "Ôn lại",
        primary: false,
      };

    default:
      return {
        label: "Xem",
        primary: false,
      };
  }
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function toRoman(value: number): string {
  const romanMap: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
  };

  return romanMap[value] ?? String(value);
}
