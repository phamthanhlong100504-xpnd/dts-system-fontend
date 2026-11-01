import {
  getHistory,
  type ResultHistoryItem,
} from "@/features/result/result-service";
import type { HistoryListItem, HistoryListParams, HistoryListResult } from "./history-types";

/** Lịch sử hợp nhất do DTS Result lưu trong database, lọc trước phân trang. */
export async function getHistoryList(params: HistoryListParams): Promise<HistoryListResult> {
  const response = await getHistory({
    targetType: "EXAM",
    activityType: params.activityType === "ALL" ? undefined : params.activityType,
    licenseClass: params.licenseClass && params.licenseClass !== "ALL"
      ? params.licenseClass : undefined,
    result: params.result === "ALL" ? undefined : params.result,
    from: params.from,
    to: params.to,
    page: params.page,
    size: params.size,
    sort: "completedAt,desc",
  });

  if (!Array.isArray(response.content)) {
    throw new Error("DTS Result trả về danh sách lịch sử không hợp lệ.");
  }

  return {
    items: response.content.map(mapHistoryItem),
    page: response.number,
    size: response.size,
    total: response.totalElements,
    totalPages: response.totalPages,
  };
}

function mapHistoryItem(item: ResultHistoryItem): HistoryListItem {
  // Giữ 0, null và các cờ quyền từ response; không suy luận score -> số câu.
  return { ...item, resultId: item.id, title: item.displayTitle };
}
