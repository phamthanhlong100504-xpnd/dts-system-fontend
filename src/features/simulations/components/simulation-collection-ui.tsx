"use client";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Play,
  RotateCcw,
  LoaderCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScenarioListItem } from "../simulation-learning-types";
import { learningStyles, mediaTime, roman } from "./learning-ui";
import { ScenarioThumbnail } from "./simulation-chapter-view";
export interface ScenarioCollectionItem extends ScenarioListItem {
  chapterNumber: number;
  chapterName: string;
}
/** Shared Card02/Card03 frame. Business eligibility and ordering belong to the backend. */
export function ScenarioCollectionCard<T extends ScenarioCollectionItem>({
  item,
  onOpen,
  onBookmark,
  bookmarkPendingId,
  showPracticeStatus = true,
  replayIcon = false,
}: {
  item: T;
  onOpen?: (item: T) => void;
  onBookmark?: (item: T) => void;
  bookmarkPendingId?: string | null;
  showPracticeStatus?: boolean;
  replayIcon?: boolean;
}) {
  return (
    <article
      key={item.id}
      className={cn(learningStyles.card, learningStyles.scenarioCard)}
    >
      <button
        type="button"
        disabled={!onOpen}
        onClick={() => onOpen?.(item)}
        aria-label={`${item.isPracticed ? "Ôn lại" : "Luyện ngay"} tình huống ${item.number}`}
        className={learningStyles.scenarioThumbnail}
      >
        <ScenarioThumbnail url={item.thumbnailUrl} />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-[#0758d9]">
            {replayIcon ? (
              <RotateCcw className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </span>
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[12px] font-semibold text-white">
          {mediaTime(item.durationMs)}
        </span>
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className="whitespace-nowrap rounded-[7px] bg-[#edf3ff] px-2 py-1 text-[13px] font-bold text-[#0758d9]">
            Tình huống {String(item.number).padStart(3, "0")}
          </span>
          <button
            type="button"
            aria-label={`${item.isBookmarked ? "Bỏ đánh dấu" : "Đánh dấu"} tình huống ${item.number}`}
            aria-pressed={item.isBookmarked}
            aria-busy={bookmarkPendingId === item.id}
            disabled={!onBookmark || bookmarkPendingId === item.id}
            onClick={() => onBookmark?.(item)}
            className="flex size-8 shrink-0 items-center justify-center rounded-[7px] text-[#475467] outline-none hover:bg-[#eef2ff] focus-visible:ring-2 focus-visible:ring-[#0758d9] disabled:opacity-40"
          >
            {bookmarkPendingId === item.id ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Bookmark
                className={cn(
                  "size-4",
                  item.isBookmarked && "fill-[#0758d9] text-[#0758d9]",
                )}
              />
            )}
          </button>
        </div>
        <h3 className={cn(learningStyles.itemHeading, "mt-2")}>{item.title}</h3>
        <p
          title={item.chapterName}
          className="mt-1 truncate text-[14.5px] font-medium text-[#475467]"
        >
          Chương {roman(item.chapterNumber)} · {item.chapterName}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium text-[#344054]">
            {showPracticeStatus && (
              <span className={learningStyles.badge}>
                {item.isPracticed ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
                {item.isPracticed ? "Đã luyện" : "Chưa luyện"}
              </span>
            )}
            {item.isPracticed && (
              <span className="inline-flex items-center gap-[0.5cm] whitespace-nowrap">
                Điểm cao nhất{" "}
                <strong className={learningStyles.badge}>
                  {item.bestScore}/{item.maxScore}
                </strong>
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={!onOpen}
            onClick={() => onOpen?.(item)}
            className={cn(learningStyles.primary, "ml-auto")}
          >
            {item.isPracticed ? "Ôn lại" : "Luyện ngay"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
export function CollectionMessage({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: string;
  onAction?: () => void;
}) {
  return (
    <section
      className={cn(
        learningStyles.card,
        "mx-auto flex min-h-[320px] w-full max-w-[720px] flex-col items-center justify-center px-6 py-10 text-center sm:px-10",
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-[14px] bg-[#eef2ff] text-[#0758d9]">
        {icon}
      </span>
      <h2 className="mt-5 text-[18px] font-bold leading-7 text-[#172335]">
        {title}
      </h2>
      <p className="mt-3 max-w-[580px] text-[15.5px] font-medium leading-7 text-[#475467]">
        {description}
      </p>
      <button
        type="button"
        disabled={!onAction}
        onClick={onAction}
        className={cn(learningStyles.primary, "mt-6")}
      >
        {action}
        <ArrowRight className="size-4" />
      </button>
    </section>
  );
}
export function CollectionSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <div className={cn(learningStyles.card, "h-[100px] animate-pulse p-6")}>
        <div className="h-5 w-52 rounded bg-[#e8ebf5]" />
        <div className="mt-3 h-4 w-3/4 rounded bg-[#eef0f7]" />
      </div>
      <div
        className="mt-[1cm] flex flex-wrap items-center justify-between gap-4"
        aria-hidden="true"
      >
        <div className="h-6 w-52 animate-pulse rounded bg-[#e8ebf5]" />
        <div className="flex gap-3">
          <div className="h-10 w-40 animate-pulse rounded-[10px] bg-[#e8ebf5]" />
          <div className="h-10 w-36 animate-pulse rounded-[10px] bg-[#e8ebf5]" />
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(learningStyles.card, "flex animate-pulse gap-4 p-5")}
          >
            <div className="aspect-video w-[160px] max-w-[40%] rounded-[10px] bg-[#e8ebf5]" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 rounded bg-[#e8ebf5]" />
              <div className="h-5 w-full rounded bg-[#eef0f7]" />
              <div className="h-4 w-2/3 rounded bg-[#eef0f7]" />
              <div className="ml-auto h-10 w-24 rounded-[10px] bg-[#e8ebf5]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
