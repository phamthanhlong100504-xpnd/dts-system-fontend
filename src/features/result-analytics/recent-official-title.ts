import type { AnalyticsRecentResult } from "@/features/result-performance/result-performance-contract";
import type { ResultHistoryDetail } from "@/features/result/result-service";
import type { OfficialExamDetail } from "@/features/examination/official-exam-detail-types";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Readers = {
  history: (resultId: string) => Promise<ResultHistoryDetail>;
  exam: (examId: string, licenseClass: string, examVersionId?: string) => Promise<OfficialExamDetail>;
};

/** Display-only enrichment for legacy rows; the Result snapshot remains unchanged. */
export async function resolveRecentOfficialTitle(
  item: AnalyticsRecentResult,
  licenseClass: string,
  readers: Readers,
): Promise<string | null> {
  const storedTitle = item.title?.trim();
  if (storedTitle) return storedTitle;
  if (item.activityType !== "OFFICIAL_EXAM" || item.licenseClass !== licenseClass ||
      !item.resultAvailable || !uuid.test(item.resultId) ||
      item.sourceResult?.sourceType !== "EXAM_SESSION" || !uuid.test(item.sourceResult.sourceId)) return null;

  try {
    const detail = await readers.history(item.resultId);
    if (detail.id !== item.resultId || detail.activityType !== "OFFICIAL_EXAM" ||
        detail.sourceType !== "EXAM_SESSION" || detail.sourceId !== item.sourceResult.sourceId ||
        detail.licenseClass !== licenseClass || !detail.resultAvailable || detail.targetType !== "EXAM") return null;
    const snapshotTitle = detail.displayTitle?.trim();
    if (snapshotTitle) return snapshotTitle;
    if (!uuid.test(detail.targetId)) return null;

    const rawVersion = detail.metadata?.examVersionId;
    if (rawVersion != null && (typeof rawVersion !== "string" || !uuid.test(rawVersion))) return null;
    const versionId = typeof rawVersion === "string" ? rawVersion : undefined;
    const exam = await readers.exam(detail.targetId, licenseClass, versionId);
    if (exam.examId !== detail.targetId || (versionId && exam.examVersionId !== versionId) ||
        (exam.licenseClass && exam.licenseClass !== licenseClass)) return null;
    return exam.title?.trim() || null;
  } catch {
    // Optional title lookup must not hide the analytics or grant access to a result.
    return null;
  }
}
