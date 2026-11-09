"use client";
import {
  ArrowDownWideNarrow,
  BookOpen,
  CheckCircle2,
  CloudOff,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
import { cn } from "@/lib/utils";
import textStyles from "./simulation-text-layout.module.css";
import type { LearningLoadState } from "../simulation-learning-types";
import type {
  ReviewNeededPage,
  ReviewNeededQuery,
  ReviewScenario,
} from "../simulation-review-types";
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
export function SimulationReviewNeededView({
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
  state: LearningLoadState<ReviewNeededPage>;
  criteria: ReviewNeededQuery;
  onBack?: () => void;
  onChapter?: (id: string | null) => void;
  onOpen?: (item: ReviewScenario) => void;
  onBookmark?: (item: ReviewScenario) => void;
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
      <header
        className={cn(
          "mb-[1cm]",
          textStyles.headingDescription,
          textStyles.pageIntro,
        )}
      >
        <h1 className={learningStyles.heading}>Tình huống cần ôn lại</h1>
        <div className={textStyles.introRow}>
          <p className={cn(learningStyles.body, "min-w-0 flex-1")}>
            Luyện tập lại những tình huống chưa từng đạt điểm tối đa để cải
            thiện phản xạ.
          </p>
          {data && data.totalNeedReview > 0 && (
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
                      Chương {roman(c.number)} · {c.name} ({c.needReviewCount})
                    </option>
                  ))}
                </select>
              </label>
              <span className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[10px] border border-[#d8e0f1] bg-white px-3 text-[14.5px] font-semibold text-[#344054]">
                <ArrowDownWideNarrow className="size-4" />
                Điểm thấp trước
              </span>
            </div>
          )}
        </div>
        {data && criteria.chapterId && (
          <p className="mt-3 text-[14.5px] font-medium text-[#475467]">
            {data.filteredCount} tình huống trong chương đã chọn
          </p>
        )}
      </header>
      <SimulationFeedbackModal
        key={notice ?? "no-notice"}
        message={notice}
        onDismiss={onDismissNotice}
      />

      {state.status === "loading" ? (
        <CollectionSkeleton label="Đang tải tình huống cần ôn lại" />
      ) : state.status === "error" ? (
        <CollectionMessage
          icon={<CloudOff className="size-7" />}
          title="Không thể tải dữ liệu luyện tập"
          description={state.message}
          action="Thử lại"
          onAction={onRetry}
        />
      ) : state.status === "unavailable" ? (
        <LearningNotice kind="unavailable" />
      ) : (
        data && (
          <>
            {data.totalNeedReview > 0 && (
              <>
                <section aria-label="Danh sách cần ôn lại">
                  {data.filteredCount === 0 ? (
                    <CollectionMessage
                      icon={<Filter className="size-7" />}
                      title={`Không có tình huống cần ôn lại${selectedChapter ? ` trong Chương ${roman(selectedChapter.number)}` : ""}`}
                      description={`Bạn vẫn còn ${data.totalNeedReview} tình huống cần ôn ở các chương khác. Hãy chọn chương khác hoặc xem tất cả.`}
                      action="Xem tất cả tình huống"
                      onAction={() => onChapter?.(null)}
                    />
                  ) : data.items.length === 0 ? (
                    <CollectionMessage
                      icon={<RotateCcw className="size-7" />}
                      title="Danh sách đã được cập nhật"
                      description="Quay về trang đầu để xem các tình huống cần ôn hiện tại."
                      action="Về trang đầu"
                      onAction={() => onPage?.(0)}
                    />
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {data.items.map((item) => (
                        <ScenarioCollectionCard
                          key={item.id}
                          item={item}
                          showPracticeStatus={false}
                          replayIcon
                          onOpen={onOpen}
                          onBookmark={onBookmark}
                          bookmarkPendingId={bookmarkPendingId}
                        />
                      ))}
                    </div>
                  )}
                  {data.totalPages > 1 && (
                    <nav
                      aria-label="Trang tình huống cần ôn"
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
            {data.totalNeedReview === 0 &&
              (data.practicedScenarios === 0 ? (
                <CollectionMessage
                  icon={<BookOpen className="size-7" />}
                  title="Bạn chưa có kết quả luyện tập"
                  description="Hãy bắt đầu luyện các tình huống mô phỏng theo chương. Sau khi hoàn thành, những tình huống chưa từng đạt điểm tối đa sẽ xuất hiện tại đây."
                  action="Ôn theo chương"
                  onAction={onStartChapters}
                />
              ) : (
                <CollectionMessage
                  icon={<CheckCircle2 className="size-7" />}
                  title="Hiện không có tình huống cần ôn lại"
                  description="Các tình huống bạn đã luyện đều từng đạt điểm tối đa 5/5. Bạn có thể tiếp tục luyện những tình huống khác hoặc ôn lại theo chương."
                  action="Tiếp tục ôn theo chương"
                  onAction={onStartChapters}
                />
              ))}
          </>
        )
      )}
    </LearningShell>
  );
}
