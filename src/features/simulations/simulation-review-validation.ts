import type {
  ReviewNeededPage,
  ReviewNeededQuery,
} from "./simulation-review-types";
function count(value: number) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("Số liệu cần ôn lại không hợp lệ.");
}
/** Reject inconsistent responses rather than silently filtering or inventing totals in the browser. */
export function validateReviewNeededPage(
  data: ReviewNeededPage,
  query: ReviewNeededQuery,
) {
  if (
    !data ||
    !Array.isArray(data.chapters) ||
    !Array.isArray(data.items) ||
    data.sort !== "BEST_SCORE_ASC" ||
    data.chapterId !== query.chapterId
  )
    throw new Error("Danh sách cần ôn không khớp bộ lọc được yêu cầu.");
  for (const n of [
    data.practicedScenarios,
    data.totalNeedReview,
    data.filteredCount,
    data.page,
    data.totalPages,
  ])
    count(n);
  if (
    data.totalNeedReview > data.practicedScenarios ||
    data.filteredCount > data.totalNeedReview ||
    (data.practicedScenarios === 0 && data.totalNeedReview !== 0) ||
    (data.filteredCount > 0 && data.totalPages === 0) ||
    data.items.length > data.filteredCount
  )
    throw new Error("Thống kê cần ôn không nhất quán.");
  const chapters = new Set<string>();
  let total = 0;
  for (const c of data.chapters) {
    if (
      !c.id ||
      chapters.has(c.id) ||
      !c.name ||
      !Number.isSafeInteger(c.number) ||
      c.number < 1
    )
      throw new Error("Danh mục chương mô phỏng không hợp lệ.");
    chapters.add(c.id);
    count(c.needReviewCount);
    total += c.needReviewCount;
  }
  if (total !== data.totalNeedReview)
    throw new Error("Tổng theo chương không khớp toàn ngân hàng.");
  if (query.chapterId && !chapters.has(query.chapterId))
    throw new Error("Chương được lọc không thuộc ngân hàng mô phỏng.");
  const expected = query.chapterId
    ? data.chapters.find((c) => c.id === query.chapterId)!.needReviewCount
    : data.totalNeedReview;
  if (data.filteredCount !== expected)
    throw new Error("Số lượng đã lọc không khớp thống kê backend.");
  const ids = new Set<string>();
  let lastScore = -1,
    lastNumber = -1;
  for (const item of data.items) {
    if (
      !item.id ||
      ids.has(item.id) ||
      !chapters.has(item.chapterId) ||
      (query.chapterId && item.chapterId !== query.chapterId) ||
      !item.title ||
      !item.chapterName ||
      item.isPracticed !== true ||
      item.maxScore !== 5 ||
      !Number.isInteger(item.bestScore) ||
      item.bestScore < 0 ||
      item.bestScore >= item.maxScore ||
      !Number.isFinite(item.durationMs) ||
      item.durationMs <= 0 ||
      !Number.isSafeInteger(item.number) ||
      item.number < 1 ||
      typeof item.isBookmarked !== "boolean"
    )
      throw new Error(
        "Backend trả tình huống chưa luyện hoặc điểm không thuộc danh sách cần ôn.",
      );
    if (
      item.bestScore < lastScore ||
      (item.bestScore === lastScore && item.number <= lastNumber)
    )
      throw new Error("Thứ tự điểm/mã tình huống không ổn định.");
    ids.add(item.id);
    lastScore = item.bestScore;
    lastNumber = item.number;
  }
}
