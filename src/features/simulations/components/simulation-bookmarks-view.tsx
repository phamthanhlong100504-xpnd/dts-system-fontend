"use client";
import {
  ArrowDownWideNarrow,
  BookOpen,
  CloudOff,
  Filter,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
import { cn } from "@/lib/utils";
import type { LearningLoadState } from "../simulation-learning-types";
import type {
  BookmarksPage,
  BookmarksQuery,
  BookmarkedScenario,
} from "../simulation-bookmarks-types";
import {
  BackAction,
  LearningNotice,
  LearningShell,
  learningStyles,
  roman,
} from "./learning-ui";
import {
  ScenarioCollectionCard,
  CollectionMessage,
  CollectionSkeleton,
} from "./simulation-collection-ui";
export function SimulationBookmarksView({
  state,
  criteria,
  onBack,
  onChapter,
  onOpen,
  onBookmark,
  onStartChapters,
  onRetry,
  onPage,
  bookmarkPendingId,
  notice,
  onDismissNotice,
}: {
  state: LearningLoadState<BookmarksPage>;
  criteria: BookmarksQuery;
  onBack?: () => void;
  onChapter?: (id: string | null) => void;
  onOpen?: (item: BookmarkedScenario) => void;
  onBookmark?: (item: BookmarkedScenario) => void;
  onStartChapters?: () => void;
  onRetry?: () => void;
  onPage?: (page: number) => void;
  bookmarkPendingId?: string | null;
  notice?: string | null;
  onDismissNotice?: () => void;
}) {
  const data = state.status === "ready" ? state.data : null;
  const selectedChapter = data?.chapters.find(
    (c) => c.id === criteria.chapterId,
  );
  return (
    <LearningShell
      navigation={<BackAction onClick={onBack}>Quay lại Ôn luyện</BackAction>}
    >
      <header className="mb-[1cm]">
        <h1 className={learningStyles.heading}>Tình huống đã đánh dấu</h1>
        <p className={cn(learningStyles.body, "mt-2")}>
          Xem lại những tình huống mô phỏng bạn đã lưu để luyện tập khi cần.
        </p>
      </header>
      <SimulationFeedbackModal
        key={notice ?? "no-notice"}
        message={notice}
        onDismiss={onDismissNotice}
      />

      {state.status === "loading" ? (
        <CollectionSkeleton label="Đang tải tình huống đã đánh dấu" />
      ) : state.status === "error" ? (
        <CollectionMessage
          icon={<CloudOff className="size-7" />}
          title="Không thể tải danh sách đã đánh dấu"
          description={state.message}
          action="Thử lại"
          onAction={onRetry}
        />
      ) : state.status === "unavailable" ? (
        <LearningNotice kind="unavailable" />
      ) : (
        data && (
          <>
            {data.totalBookmarked > 0 && (
              <>
                <section
                  aria-label="Tổng số đã đánh dấu toàn ngân hàng"
                  className="flex items-center gap-4 rounded-[18px] border border-[#dce2ee] bg-[#eef2ff] px-6 py-5"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-white text-[#0758d9]">
                    <Bookmark className="size-5" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-[1cm]">
                    <p className="text-[16px] font-bold text-[#172335]">
                      <strong>{data.totalBookmarked}</strong> tình huống đã đánh
                      dấu
                    </p>
                    <p className="text-[15.5px] font-medium leading-6 text-[#475467]">
                      Các tình huống bạn đã lưu để dễ dàng tìm và luyện lại.
                    </p>
                  </div>
                </section>
                <section
                  className="mt-[1cm]"
                  aria-label="Danh sách đã đánh dấu"
                >
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-[18px] font-bold text-[#0b1427]">
                        Danh sách đã đánh dấu
                      </h2>
                      {criteria.chapterId && (
                        <p className="mt-1 text-[14.5px] font-medium text-[#475467]">
                          {data.filteredCount} tình huống trong chương đã chọn
                        </p>
                      )}
                    </div>
                    <div className="flex max-w-full flex-wrap items-center gap-3">
                      <label className="flex min-w-0 items-center gap-2 rounded-[10px] border border-[#d8e0f1] bg-white px-3 text-[#475467]">
                        <BookOpen className="size-4 shrink-0" />
                        <select
                          aria-label="Lọc chương mô phỏng"
                          value={criteria.chapterId ?? ""}
                          onChange={(e) => onChapter?.(e.target.value || null)}
                          className="min-h-10 min-w-0 max-w-[280px] bg-transparent py-2 text-[14.5px] font-semibold text-[#344054] outline-none"
                        >
                          <option value="">Tất cả chương</option>
                          {data.chapters.map((c) => (
                            <option key={c.id} value={c.id}>
                              Chương {roman(c.number)} · {c.name} (
                              {c.bookmarkedCount})
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[10px] border border-[#d8e0f1] bg-white px-3 text-[14.5px] font-semibold text-[#344054]">
                        <ArrowDownWideNarrow className="size-4" />
                        Tình huống tăng dần
                      </span>
                    </div>
                  </div>
                  {data.filteredCount === 0 ? (
                    <CollectionMessage
                      icon={<Filter className="size-7" />}
                      title={`Không có tình huống đã đánh dấu${selectedChapter ? ` trong Chương ${roman(selectedChapter.number)}` : ""}`}
                      description={`Bạn vẫn có ${data.totalBookmarked} tình huống đã đánh dấu ở các chương khác. Hãy chọn chương khác hoặc xem tất cả.`}
                      action="Xem tất cả tình huống"
                      onAction={() => onChapter?.(null)}
                    />
                  ) : data.items.length === 0 ? (
                    <CollectionMessage
                      icon={<Bookmark className="size-7" />}
                      title="Danh sách đã được cập nhật"
                      description="Quay về trang đầu để xem các tình huống đã đánh dấu hiện tại."
                      action="Về trang đầu"
                      onAction={() => onPage?.(0)}
                    />
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {data.items.map((item) => (
                        <ScenarioCollectionCard
                          key={item.id}
                          item={item}
                          onOpen={onOpen}
                          onBookmark={onBookmark}
                          bookmarkPendingId={bookmarkPendingId}
                        />
                      ))}
                    </div>
                  )}
                  {data.totalPages > 1 && (
                    <nav
                      aria-label="Trang tình huống đã đánh dấu"
                      className="mt-[1cm] flex flex-wrap items-center justify-end gap-4"
                    >
                      <button
                        type="button"
                        aria-label="Trang trước"
                        disabled={data.page === 0 || !onPage}
                        onClick={() => onPage?.(data.page - 1)}
                        className={learningStyles.secondary}
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="text-[14.5px] font-semibold text-[#475467]">
                        Trang {data.page + 1} / {data.totalPages}
                      </span>
                      <button
                        type="button"
                        aria-label="Trang tiếp"
                        disabled={data.page + 1 >= data.totalPages || !onPage}
                        onClick={() => onPage?.(data.page + 1)}
                        className={learningStyles.secondary}
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </nav>
                  )}
                </section>
              </>
            )}
            {data.totalBookmarked === 0 && (
              <CollectionMessage
                icon={<Bookmark className="size-7" />}
                title="Bạn chưa đánh dấu tình huống nào"
                description="Bạn có thể đánh dấu những tình huống muốn xem lại trong lúc ôn tập. Các tình huống đã lưu sẽ xuất hiện tại đây để bạn dễ dàng tìm lại."
                action="Ôn theo chương"
                onAction={onStartChapters}
              />
            )}
          </>
        )
      )}
    </LearningShell>
  );
}
