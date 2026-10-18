"use client";

import { Dialog as DrawerPrimitive } from "radix-ui";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";

import { useChapterLearningOverview } from "@/features/practice/use-chapter-overview";
import { cn } from "@/lib/utils";

interface ChapterSelectorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenseClass: string;
  currentChapterId: number;
  onSelectChapter: (chapterId: number) => void;
}

export function ChapterSelectorDrawer({
  open,
  onOpenChange,
  licenseClass,
  currentChapterId,
  onSelectChapter,
}: ChapterSelectorDrawerProps) {
  const normalizedLicense = licenseClass.trim().toUpperCase();

  const overviewQuery =
    useChapterLearningOverview(normalizedLicense);

  const chapters =
    overviewQuery.data?.chapters ?? [];

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-[#101828]/10 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DrawerPrimitive.Content className="font-dts fixed inset-y-0 right-0 z-50 flex w-[420px] max-w-[92vw] flex-col border-l border-[#e4e7ec] bg-white shadow-[-10px_0_30px_rgba(15,23,42,0.08)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-start justify-between gap-4 border-b border-[#eef0f4] px-5 py-5">
            <div>
              <DrawerPrimitive.Title className="text-[18px] font-bold leading-none text-[#101828]">
                Chọn chương
              </DrawerPrimitive.Title>

              <DrawerPrimitive.Description className="mt-2.5 text-[13px] font-medium leading-5 text-[#667085]">
                Chuyển nhanh sang nội dung bạn muốn ôn.
              </DrawerPrimitive.Description>
            </div>

            <DrawerPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Đóng"
                className="flex size-9 shrink-0 items-center justify-center rounded-[9px] text-[#667085] transition hover:bg-[#f2f4f7] hover:text-[#101828]"
              >
                <X className="size-4.5" />
              </button>
            </DrawerPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {overviewQuery.isLoading && (
              <div className="space-y-3">
                <ChapterSkeleton />
                <ChapterSkeleton />
                <ChapterSkeleton />
                <ChapterSkeleton />
                <ChapterSkeleton />
              </div>
            )}

            {overviewQuery.isError && (
              <div className="rounded-[12px] border border-[#fecdca] bg-[#fff6f5] px-4 py-4">
                <p className="text-[13px] font-semibold text-[#b42318]">
                  Không tải được danh sách chương.
                </p>

                <button
                  type="button"
                  onClick={() => void overviewQuery.refetch()}
                  className="mt-2 text-[13px] font-semibold text-[#0758d9]"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!overviewQuery.isLoading &&
              !overviewQuery.isError &&
              chapters.length === 0 && (
                <div className="rounded-[12px] border border-[#e4e7ec] bg-[#f9fafb] px-4 py-4 text-[13px] font-medium text-[#667085]">
                  Không có chương phù hợp với hạng{" "}
                  {normalizedLicense}.
                </div>
              )}

            {!overviewQuery.isLoading &&
              !overviewQuery.isError &&
              chapters.length > 0 && (
                <div className="space-y-[0.6cm]">
                  {chapters.map((chapter) => {
                    const current =
                      chapter.chapterId ===
                      currentChapterId;

                    const completed =
                      chapter.status ===
                      "COMPLETED";

                    return (
                      <ChapterDrawerCard
                        key={chapter.chapterId}
                        chapterId={chapter.chapterId}
                        title={chapter.title}
                        totalQuestions={
                          chapter.totalQuestions
                        }
                        learnedQuestions={
                          chapter.learnedQuestions
                        }
                        completionPercent={
                          chapter.completionPercent
                        }
                        current={current}
                        completed={completed}
                        onClick={() =>
                          onSelectChapter(
                            chapter.chapterId
                          )
                        }
                      />
                    );
                  })}
                </div>
              )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

function ChapterDrawerCard({
  chapterId,
  title,
  totalQuestions,
  learnedQuestions,
  completionPercent,
  current,
  completed,
  onClick,
}: {
  chapterId: number;
  title: string;
  totalQuestions: number;
  learnedQuestions: number;
  completionPercent: number;
  current: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  const safePercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(completionPercent)
    )
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-[14px] border bg-white px-4 py-4 text-left transition",
        current
          ? "border-[#0758d9] shadow-[0_0_0_1px_rgba(7,88,217,0.04)]"
          : "border-[#e4e7ec] hover:border-[#b9c9f7] hover:shadow-[0_3px_10px_rgba(15,23,42,0.04)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[13px] font-bold uppercase tracking-[0.02em]",
              current
                ? "text-[#0758d9]"
                : "text-[#667085]"
            )}
          >
            Chương {toRoman(chapterId)}
          </p>

          <p className="mt-2 line-clamp-2 text-[14px] font-bold leading-[1.5] text-[#101828]">
            {title}
          </p>
        </div>

        {current ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#eef2ff] px-2.5 py-1.5 text-[11px] font-semibold text-[#0758d9]">
            Đang học
            <CheckCircle2 className="size-3.5" />
          </span>
        ) : completed ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ecfdf3] px-2.5 py-1.5 text-[11px] font-semibold text-[#027a48]">
            Đã học hết
            <Check className="size-3.5" />
          </span>
        ) : (
          <ChevronRight className="mt-1 size-4 shrink-0 text-[#98a2b3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#667085]" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-[#667085]">
          {learnedQuestions} / {totalQuestions} câu đã học
        </span>

        <span
          className={cn(
            "text-[12px] font-semibold",
            completed
              ? "text-[#027a48]"
              : current
                ? "text-[#0758d9]"
                : "text-[#667085]"
          )}
        >
          {safePercent}%
        </span>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e9edf5]">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            completed
              ? "bg-[#12b76a]"
              : "bg-[#0758d9]"
          )}
          style={{
            width: `${safePercent}%`,
          }}
        />
      </div>
    </button>
  );
}

function ChapterSkeleton() {
  return (
    <div className="h-[122px] animate-pulse rounded-[14px] border border-[#e4e7ec] bg-[#f8f9fc]" />
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