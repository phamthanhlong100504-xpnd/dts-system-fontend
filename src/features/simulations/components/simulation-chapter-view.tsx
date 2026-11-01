"use client";
import {
  Bookmark,
  CheckCircle2,
  Play,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LearningLoadState,
  ScenarioFilter,
  ScenarioListItem,
  SimulationChapterPage,
} from "../simulation-learning-types";
import {
  BackAction,
  LearningNotice,
  LearningShell,
  LearningSkeleton,
  ProgressSummary,
  learningStyles,
  mediaTime,
  roman,
} from "./learning-ui";
export const scenarioFilters: ReadonlyArray<{
  value: ScenarioFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả" },
  { value: "UNPRACTICED", label: "Chưa luyện" },
  { value: "PRACTICED", label: "Đã luyện" },
  { value: "BOOKMARKED", label: "Đã đánh dấu" },
];
export function SimulationChapterView({
  state,
  filter,
  onBack,
  onFilter,
  onOpen,
  onBookmark,
  onStudyAll,
  onPage,
  onRetry,
  bookmarkPendingId,
}: {
  state: LearningLoadState<SimulationChapterPage>;
  filter: ScenarioFilter;
  onBack?: () => void;
  onFilter?: (filter: ScenarioFilter) => void;
  onOpen?: (item: ScenarioListItem) => void;
  onBookmark?: (item: ScenarioListItem) => void;
  onStudyAll?: () => void;
  onPage?: (page: number) => void;
  onRetry?: () => void;
  bookmarkPendingId?: string | null;
}) {
  const data = state.status === "ready" ? state.data : null;

  return (
    <LearningShell
      navigation={
        <BackAction onClick={onBack}>Quay lại Ôn theo chương</BackAction>
      }
    >
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={learningStyles.heading}>
            {data
              ? `Chương ${roman(data.chapter.number)} – ${data.chapter.name}`
              : "Danh sách tình huống"}
          </h1>
          <p className={cn(learningStyles.body, "mt-2")}>
            {data
              ? `${data.chapter.totalScenarios} tình huống mô phỏng${data.chapter.scenarioRangeLabel ? ` · ${data.chapter.scenarioRangeLabel}` : ""}`
              : "Chọn tình huống để luyện tập nhận diện nguy hiểm."}
          </p>
        </div>
        <button
          type="button"
          onClick={onStudyAll}
          disabled={!data?.startScenarioId || !onStudyAll}
          className={cn(learningStyles.primary, "shrink-0")}
        >
          Luyện toàn bộ chương{" "}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </header>
      {data && (
        <ProgressSummary
          label={`Tiến độ chương ${roman(data.chapter.number)}`}
          learned={data.chapter.practicedScenarios}
          total={data.chapter.totalScenarios}
          percent={data.chapter.completionPercent}
        />
      )}
      <section className="mt-[1cm]" aria-label="Danh sách tình huống">
        <div
          className={cn(
            "mb-5 flex flex-col gap-4 xl:flex-row xl:items-center",
            "xl:justify-end",
          )}
        >
          <div
            role="group"
            aria-label="Lọc tình huống"
            className="flex flex-wrap gap-[0.5cm]"
          >
            {scenarioFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => onFilter?.(item.value)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1 rounded-full px-3.5 py-2 text-[14.5px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#0758d9]",
                  filter === item.value
                    ? "bg-[#0758d9] text-white"
                    : "bg-[#eef0f8] text-[#475467] hover:bg-[#e5eaff]",
                )}
              >
                {item.label}
                {data ? ` (${data.filterCounts[item.value]})` : ""}
              </button>
            ))}
          </div>
        </div>
        {state.status === "loading" ? (
          <LearningSkeleton cards={4} />
        ) : state.status === "unavailable" ? (
          <LearningNotice kind="unavailable" />
        ) : state.status === "error" ? (
          <LearningNotice
            kind="error"
            message={state.message}
            onRetry={onRetry}
          />
        ) : (
          data &&
          (data.items.length === 0 ? (
            <LearningNotice
              kind="empty"
              message={
                filter === "ALL"
                  ? "Chương này chưa có tình huống được công bố."
                  : "Không có tình huống phù hợp với bộ lọc đang chọn."
              }
              onRetry={filter !== "ALL" ? () => onFilter?.("ALL") : undefined}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.items.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    learningStyles.card,
                    learningStyles.scenarioCard,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen?.(item)}
                    disabled={!onOpen}
                    aria-label={`Mở tình huống ${String(item.number).padStart(3, "0")}`}
                    className={cn(learningStyles.scenarioThumbnail, "group")}
                  >
                    <ScenarioThumbnail url={item.thumbnailUrl} />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-[#0758d9]">
                        <Play
                          className="ml-0.5 size-4"
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[12px] font-semibold text-white">
                      {mediaTime(item.durationMs)}
                    </span>
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-bold uppercase tracking-[0.025em] text-[#0758d9]">
                        Tình huống {String(item.number).padStart(3, "0")}
                      </span>
                      <button
                        type="button"
                        aria-label={
                          item.isBookmarked
                            ? `Bỏ đánh dấu tình huống ${item.number}`
                            : `Đánh dấu tình huống ${item.number}`
                        }
                        aria-pressed={item.isBookmarked}
                        disabled={!onBookmark || bookmarkPendingId === item.id}
                        onClick={() => onBookmark?.(item)}
                        className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-[7px] text-[#475467] outline-none hover:bg-[#eef2ff] focus-visible:ring-2 focus-visible:ring-[#0758d9] disabled:opacity-40"
                      >
                        <Bookmark
                          className={cn(
                            "size-4",
                            item.isBookmarked &&
                              "fill-[#0758d9] text-[#0758d9]",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <h3
                      className={cn(
                        learningStyles.itemHeading,
                        "mt-2 line-clamp-2",
                      )}
                    >
                      {item.title}
                    </h3>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div className="space-y-3 text-[14.5px] font-medium text-[#475467]">
                        <p>
                          <span className={learningStyles.badge}>
                            {item.isPracticed ? (
                              <CheckCircle2
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <Play className="size-3.5" aria-hidden="true" />
                            )}
                            {item.isPracticed ? "Đã luyện" : "Chưa luyện"}
                          </span>
                        </p>
                        {item.isPracticed && item.bestScore !== null && (
                          <p className="inline-flex items-center gap-[0.5cm] whitespace-nowrap">
                            Điểm cao nhất{" "}
                            <strong className={learningStyles.badge}>
                              {item.bestScore}/{item.maxScore}
                            </strong>
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpen?.(item)}
                        disabled={!onOpen}
                        className={cn(
                          learningStyles.primary,
                          "min-h-9 px-3 py-1.5 text-[14.5px]",
                        )}
                      >
                        {item.isPracticed ? "Ôn lại" : "Luyện ngay"}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))
        )}
        {data && data.totalPages > 1 && (
          <nav
            aria-label="Trang danh sách tình huống"
            className="mt-[1cm] flex flex-wrap items-center justify-end gap-4"
          >
            <button
              type="button"
              aria-label="Trang trước"
              className={learningStyles.secondary}
              disabled={data.page === 0 || !onPage}
              onClick={() => onPage?.(data.page - 1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-[14.5px] font-semibold text-[#475467]">
              Trang {data.page + 1} / {data.totalPages}
            </span>
            <button
              type="button"
              aria-label="Trang tiếp"
              className={learningStyles.secondary}
              disabled={data.page + 1 >= data.totalPages || !onPage}
              onClick={() => onPage?.(data.page + 1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </section>
    </LearningShell>
  );
}
export function ScenarioThumbnail({ url }: { url: string | null }) {
  // Media URLs come from the source adapter. A failed thumbnail does not invent another resource.
  // Signed URLs are rendered unchanged; never resolve them through the legacy media-ID helper.
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      onLoad={(e) => {
        e.currentTarget.style.visibility = "visible";
      }}
      className="size-full object-cover"
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
    />
  ) : (
    <span className="absolute inset-0 flex items-center justify-center text-[#475467]">
      <ImageOff className="size-6" aria-hidden="true" />
    </span>
  );
}
