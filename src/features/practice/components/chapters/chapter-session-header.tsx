
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

interface ChapterSessionHeaderProps {
  chapterId: number;
  chapterTitle: string;
  currentPosition: number;
  totalQuestions: number;
  onChangeChapter: () => void;
}

export function ChapterSessionHeader({
  chapterId,
  chapterTitle,
  currentPosition,
  totalQuestions,
  onChangeChapter,
}: ChapterSessionHeaderProps) {
  const searchParams = useSearchParams();

  const fromProgress =
    searchParams.get("from") === "progress";

  const returnHref = fromProgress
    ? "/progress"
    : "/practice/chapters";

  const returnLabel = fromProgress
    ? "Quay lại Tiến độ học tập"
    : "Quay lại danh sách chương";

  return (
    <header className="font-dts border-b border-[#e8ebf1] bg-white">
      <div
        className="
          grid
          min-h-[78px]
          w-full
          grid-cols-[1fr_minmax(340px,520px)_1fr]
          items-center
          gap-6
          px-5
          lg:px-[1cm]
        "
      >
        <div className="flex justify-start">
          <Link
            href={returnHref}
            className="
              inline-flex
              items-center
              gap-2
              rounded-[8px]
              py-2
              text-[13.5px]
              font-medium
              text-[#475467]
              transition
              hover:text-[#0758d9]
            "
          >
            <ChevronLeft
              className="size-4"
              strokeWidth={2}
            />

            {returnLabel}
          </Link>
        </div>

        <div className="min-w-0 text-center">
          <div className="flex items-center justify-center gap-2.5">
            <h1 className="text-[15.5px] font-bold text-[#27364f]">
              Chương{" "}
              {toRoman(chapterId)}
            </h1>

            <span
              className="
                rounded-[7px]
                bg-[#eef2ff]
                px-2.5
                py-1
                text-[13.5px]
                font-semibold
                text-[#0758d9]
              "
            >
              Luyện tập có giải thích
            </span>
          </div>

          <p
            className="
              mx-auto
              mt-1.5
              max-w-[500px]
              truncate
              text-[13.5px]
              font-medium
              text-[#98a2b3]
            "
          >
            {chapterTitle}
          </p>
        </div>

        <div className="flex items-center justify-end gap-5">
          <span
            className="
              whitespace-nowrap
              text-[13.5px]
              font-semibold
              text-[#475467]
            "
          >
            {currentPosition}
            {" / "}
            {totalQuestions} câu
          </span>

          <button
            type="button"
            onClick={onChangeChapter}
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-[10px]
              border
              border-[#dfe3ea]
              bg-[#f8f9fc]
              px-4
              text-[13.5px]
              font-semibold
              text-[#475467]
              transition
              hover:border-[#c8d1df]
              hover:bg-[#f2f4f8]
              hover:text-[#344054]
            "
          >
            <BookOpen
              className="size-4"
              strokeWidth={1.9}
            />

            Đổi chương

            <ChevronDown
              className="size-3.5"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

function toRoman(value: number) {
  const romanMap: Array<
    [number, string]
  > = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining = Math.max(
    1,
    Math.floor(value)
  );

  let result = "";

  for (const [number, symbol] of romanMap) {
    while (remaining >= number) {
      result += symbol;
      remaining -= number;
    }
  }

  return result;
}
