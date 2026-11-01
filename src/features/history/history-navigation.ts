import type { HistoryListItem } from "./history-types";
import type { ResultHistoryDetail } from "@/features/result/result-service";

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const PRACTICE_PATH = new RegExp(`^/practice/result/(${UUID})$`);
const OFFICIAL_PATH = new RegExp(`^/examination/result/(${UUID})$`);

/** Chỉ nhận pathname kết quả nguồn có thật; từ chối URL khác origin và ID không khớp. */
export function resolveHistoryResultPath(
  result: HistoryListItem | ResultHistoryDetail
): string | null {
  if (result.resultAvailable !== true || !result.sourceResult || !result.sourceId) return null;
  const { sourceType, sourceId, resultPath } = result.sourceResult;
  if (sourceType !== result.sourceType || sourceId !== result.sourceId) return null;
  if (result.activityType === "OFFICIAL_EXAM" && sourceType !== "EXAM_SESSION") return null;
  if ((result.activityType === "PRESET_EXAM" || result.activityType === "RANDOM_EXAM")
      && sourceType !== "PRACTICE_SESSION") return null;
  const matcher = sourceType === "PRACTICE_SESSION" ? PRACTICE_PATH
    : sourceType === "EXAM_SESSION" ? OFFICIAL_PATH : null;
  if (!matcher) return null;
  const match = matcher.exec(resultPath);
  return match && match[1].toLowerCase() === sourceId.toLowerCase() ? resultPath : null;
}
