import type {
  BookmarksPage,
  BookmarksQuery,
} from "./simulation-bookmarks-types";
function count(n: number) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("Số liệu đánh dấu không hợp lệ.");
}
/** Validate, never infer bookmark eligibility, best scores or totals on the client. */
export function validateBookmarksPage(
  data: BookmarksPage,
  query: BookmarksQuery,
) {
  if (
    !data ||
    !Array.isArray(data.chapters) ||
    !Array.isArray(data.items) ||
    data.sort !== query.sort ||
    data.chapterId !== query.chapterId
  )
    throw new Error("Danh sách đã đánh dấu không khớp bộ lọc được yêu cầu.");
  for (const n of [
    data.totalBookmarked,
    data.filteredCount,
    data.page,
    data.totalPages,
  ])
    count(n);
  if (
    data.filteredCount > data.totalBookmarked ||
    data.items.length > data.filteredCount ||
    (data.filteredCount > 0 && data.totalPages === 0) ||
    (data.filteredCount === 0 && data.totalPages > 1)
  )
    throw new Error("Thống kê đánh dấu không nhất quán.");
  const chapters = new Map<string, BookmarksPage["chapters"][number]>();
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
    count(c.bookmarkedCount);
    total += c.bookmarkedCount;
    chapters.set(c.id, c);
  }
  if (total !== data.totalBookmarked)
    throw new Error("Tổng đánh dấu theo chương không khớp toàn ngân hàng.");
  if (query.chapterId && !chapters.has(query.chapterId))
    throw new Error("Chương được lọc không thuộc ngân hàng mô phỏng.");
  if (
    data.filteredCount !==
    (query.chapterId
      ? chapters.get(query.chapterId)!.bookmarkedCount
      : data.totalBookmarked)
  )
    throw new Error("Số lượng đã lọc không khớp thống kê backend.");
  const ids = new Set<string>();
  let number = -1;
  for (const item of data.items) {
    const chapter = chapters.get(item.chapterId);
    if (
      !item.id ||
      ids.has(item.id) ||
      !chapter ||
      (query.chapterId && item.chapterId !== query.chapterId) ||
      item.chapterNumber !== chapter.number ||
      !item.chapterName ||
      !item.title ||
      item.isBookmarked !== true ||
      item.maxScore !== 5 ||
      !Number.isSafeInteger(item.number) ||
      item.number < 1 ||
      !Number.isFinite(item.durationMs) ||
      item.durationMs <= 0 ||
      typeof item.isPracticed !== "boolean"
    )
      throw new Error("Tình huống đã đánh dấu không hợp lệ.");
    if (
      item.isPracticed
        ? !Number.isInteger(item.bestScore) ||
          item.bestScore === null ||
          item.bestScore < 0 ||
          item.bestScore > item.maxScore
        : item.bestScore !== null
    )
      throw new Error("Trạng thái luyện và điểm cao nhất không nhất quán.");
    if (item.number <= number)
      throw new Error("Thứ tự mã tình huống đánh dấu không ổn định.");
    ids.add(item.id);
    number = item.number;
  }
}
