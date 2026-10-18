import matrixResource from "@/features/admin/data/exam-matrix-policy.json";
import type { ExamStructureSection } from "@/features/admin/admin-examination-service";
import type { OfficialBankChapter } from "@/features/admin/official-bank-service";

export interface OfficialMatrixTopic {
  code: string;
  sourceChapterIds: number[];
  questionCount: number;
}

export interface OfficialMatrixPolicy {
  id: string;
  bankVersion: string;
  validFrom: string;
  validUntilExclusive: string;
  licenseClass: string;
  totalQuestions: number;
  durationMinutes: number;
  passingCorrectAnswers: number;
  criticalQuestionCount: number;
  topics: OfficialMatrixTopic[];
}

type DataRecord = Record<string, unknown>;
const object = (value: unknown): DataRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as DataRecord : {};
const string = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const positiveInt = (value: unknown): boolean => Number.isInteger(value) && (value as number) > 0;
const nonnegativeInt = (value: unknown): boolean => Number.isInteger(value) && (value as number) >= 0;

export function getOfficialMatrixPolicy(license: string): OfficialMatrixPolicy | null {
  const root = object(matrixResource);
  if (!Array.isArray(root.profiles)) throw new Error("Bảng cơ cấu đề thi chưa hợp lệ.");
  const bankVersion = string(root.bankVersion);
  const id = string(root.id);
  const validFrom = string(root.validFrom);
  const validUntilExclusive = string(root.validUntilExclusive);
  if (!bankVersion || !id || !/^\d{4}-\d{2}-\d{2}$/.test(validFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(validUntilExclusive)) {
    throw new Error("Bảng cơ cấu đề thi thiếu thông tin phiên bản hoặc thời gian áp dụng.");
  }
  const profiles = root.profiles.map(object).filter((profile) =>
    Array.isArray(profile.licenseClasses) && profile.licenseClasses.includes(license));
  if (profiles.length === 0) return null;
  if (profiles.length !== 1) throw new Error(`Có nhiều hơn một cơ cấu đề thi cho hạng ${license}.`);
  const profile = profiles[0];
  if (!positiveInt(profile.totalQuestions) || !positiveInt(profile.durationMinutes) ||
    !positiveInt(profile.passingCorrectAnswers) || !nonnegativeInt(profile.criticalQuestionCount) ||
    !Array.isArray(profile.topics)) throw new Error("Thông số cơ cấu đề thi không hợp lệ.");

  const topics: OfficialMatrixTopic[] = profile.topics.map((row: unknown) => {
    const topic = object(row);
    if (!string(topic.code) || !positiveInt(topic.questionCount) || !Array.isArray(topic.sourceChapterIds) ||
      !topic.sourceChapterIds.length || !topic.sourceChapterIds.every(positiveInt)) {
      throw new Error("Nhóm câu hỏi trong cơ cấu đề thi không hợp lệ.");
    }
    return { code: string(topic.code), questionCount: topic.questionCount as number, sourceChapterIds: topic.sourceChapterIds as number[] };
  });
  const sourceIds = topics.flatMap((t) => t.sourceChapterIds);
  if (new Set(sourceIds).size !== sourceIds.length || new Set(topics.map((t) => t.code)).size !== topics.length ||
    topics.reduce((sum, t) => sum + t.questionCount, 0) + (profile.criticalQuestionCount as number) !== profile.totalQuestions) {
    throw new Error("Cơ cấu câu hỏi không khớp tổng số câu hoặc chương nguồn bị trùng.");
  }
  return {
    id, bankVersion, validFrom, validUntilExclusive, licenseClass: license,
    totalQuestions: profile.totalQuestions as number,
    durationMinutes: profile.durationMinutes as number,
    passingCorrectAnswers: profile.passingCorrectAnswers as number,
    criticalQuestionCount: profile.criticalQuestionCount as number,
    topics,
  };
}

export function isOfficialMatrixCurrentlyValid(policy: OfficialMatrixPolicy): boolean {
  // Same date zone as DTS Examination. Dates are ISO formatted for lexical comparison.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const take = (name: string) => parts.find((part) => part.type === name)?.value ?? "";
  const today = `${take("year")}-${take("month")}-${take("day")}`;
  return policy.validFrom <= today && today < policy.validUntilExclusive;
}

export function buildOfficialMatrixSections(
  policy: OfficialMatrixPolicy,
  chapters: OfficialBankChapter[],
): ExamStructureSection[] {
  const chapterBySource = new Map<number, OfficialBankChapter>();
  for (const chapter of chapters) {
    const numeric = Number(chapter.sourceChapterId);
    if (!Number.isInteger(numeric) || numeric < 1 || chapterBySource.has(numeric)) {
      throw new Error("Danh sách chương chưa có mã chương nguồn duy nhất; không thể tạo ma trận chính thức.");
    }
    chapterBySource.set(numeric, chapter);
  }
  const sections: ExamStructureSection[] = policy.topics.map((topic, index) => {
    const matching = topic.sourceChapterIds.map((source) => {
      const chapter = chapterBySource.get(source);
      if (!chapter) throw new Error(`Chưa tìm thấy chương nguồn ${source} trong ngân hàng ${policy.bankVersion}.`);
      return chapter;
    });
    return {
      code: topic.code,
      title: matching.map((chapter) => chapter.title).join(" / "),
      questionCount: topic.questionCount,
      score: 1,
      order: index + 1,
      chapterIds: matching.map((chapter) => chapter.id),
      criticalQuestionCount: 0,
    };
  });
  if (policy.criticalQuestionCount > 0) sections.push({
    code: "CRITICAL",
    title: "Câu điểm liệt",
    questionCount: policy.criticalQuestionCount,
    score: 1,
    order: sections.length + 1,
    chapterIds: [], // Examination requires a separate, unrestricted section.
    criticalQuestionCount: policy.criticalQuestionCount,
  });
  return sections;
}

/** Ensure a saved section really matches official quotas; never trust totals alone. */
export function matchesOfficialMatrix(
  actual: ExamStructureSection[],
  expected: ExamStructureSection[],
): boolean {
  if (actual.length !== expected.length) return false;
  const signature = (s: ExamStructureSection): string => JSON.stringify({
    chapters: [...(s.chapterIds ?? [])].sort(),
    count: s.questionCount,
    critical: s.criticalQuestionCount,
    score: s.score,
  });
  const expectedSignatures = expected.map(signature).sort();
  return actual.map(signature).sort().every((value, index) => value === expectedSignatures[index]);
}
