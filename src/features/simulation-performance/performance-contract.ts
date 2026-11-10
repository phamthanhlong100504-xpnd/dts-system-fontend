import { z } from "zod";
import type { LicenseOption } from "@/config/license";

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const percent = z.number().finite().min(0).max(100);
const instant = z.string().datetime({ offset: true });
const label = z.string().trim().min(1);
const bank = label.max(96);
export const performancePeriod = z.enum([
  "7D",
  "30D",
  "ALL",
  "THIS_WEEK",
  "THIS_MONTH",
  "ALL_TIME",
]);
export type PerformancePeriod = z.infer<typeof performancePeriod>;
export type LearningModule = "theory" | "simulation";
export const syncSchema = z.object({
  sequence: count,
  asOf: instant.nullable(),
  receivedAt: instant.nullable(),
  complete: z.boolean(),
  bankReady: z.boolean(),
  bankVersion: bank.nullable(),
  status: z.enum(["READY", "BACKFILLING", "SYNCING", "STALE"]),
  contiguousSequence: count,
  pendingThrough: count,
});
const base = {
  performanceMode: z.literal("COMBINED"),
  licenseClass: label,
  sourceWatermark: count,
  syncStatus: syncSchema,
  dataStatus: z.enum([
    "READY",
    "BACKFILLING",
    "SYNCING",
    "STALE",
    "CATALOG_PENDING",
  ]),
  simulationReady: z.boolean(),
};
export const referenceSchema = z.object({
  sourceType: z.enum([
    "PRACTICE_SESSION",
    "EXAM_SESSION",
    "SIMULATION_SESSION",
  ]),
  sourceId: z.string().uuid(),
  licenseClass: label,
  resultPath: z.string().nullable(),
  reviewPath: z.string().nullable().optional(),
  resultApiPath: z.string().nullable().optional(),
  reviewApiPath: z.string().nullable().optional(),
});
export type ResultReference = z.infer<typeof referenceSchema>;
export function resultReferencePath(
  ref: ResultReference,
  available: boolean,
  license: string,
): string | null {
  if (!available || ref.licenseClass !== license) return null;
  const expected =
    ref.sourceType === "SIMULATION_SESSION"
      ? `/practice/simulations/exams/${ref.sourceId}/result`
      : ref.sourceType === "PRACTICE_SESSION"
        ? `/practice/result/${ref.sourceId}`
        : `/examination/result/${ref.sourceId}`;
  return ref.resultPath === expected ? expected : null;
}
export function validateReference(
  ref: ResultReference,
  license: string,
  sourceId: string,
  sourceType: string,
) {
  if (
    ref.licenseClass !== license ||
    ref.sourceId !== sourceId ||
    ref.sourceType !== sourceType
  )
    throw Error("Tham chiếu kết quả không khớp nguồn hoặc hạng GPLX.");
  if (ref.resultPath !== null && !resultReferencePath(ref, true, license))
    throw Error("Đường dẫn kết quả không hợp lệ.");
  if (sourceType === "SIMULATION_SESSION") {
    const root = `/practice/simulations/exams/${sourceId}`;
    if (ref.reviewPath != null && ref.reviewPath !== `${root}/review`)
      throw Error("Đường dẫn xem lại không hợp lệ.");
    for (const [value, action] of [
      [ref.resultApiPath, "result"],
      [ref.reviewApiPath, "review"],
    ] as const) {
      if (
        value != null &&
        value !==
          `/api/practice/v1/simulation-exams/sessions/${sourceId}/${action}?licenseClass=${encodeURIComponent(license)}`
      )
        throw Error("API kết quả không khớp nguồn.");
    }
  }
}
const simulationActivity = z.enum(["SIM_RANDOM_EXAM", "SIM_PRESET_EXAM"]);
const outcome = z.enum(["PASSED", "FAILED"]);
const historyRow = z.object({
  resultId: z.string().uuid(),
  sessionId: z.string().uuid(),
  sourceType: z.literal("SIMULATION_SESSION"),
  sourceId: z.string().uuid(),
  module: z.literal("SIMULATION"),
  activityType: simulationActivity,
  displayTitle: label,
  licenseClass: label,
  score: count.max(50),
  maxScore: z.literal(50),
  sourceScore: count.max(50),
  sourceMaxScore: z.literal(50),
  result: outcome,
  startedAt: instant,
  completedAt: instant,
  durationSeconds: count.nullable(),
  bankVersion: bank,
  scoringVersion: label,
  presetSetId: z.string().uuid().nullable(),
  presetVersionId: z.string().uuid().nullable(),
  resultAvailable: z.boolean(),
  reviewAvailable: z.boolean(),
  sourceResult: referenceSchema,
});
export const historySchema = z.object({
  ...base,
  module: z.literal("SIMULATION"),
  asOf: instant,
  page: count,
  size: count.min(1).max(100),
  sort: z.enum(["completedAt,desc", "completedAt,asc"]),
  totalElements: count.nullable(),
  totalPages: count.nullable(),
  content: z.array(historyRow),
});
export type SimulationHistory = z.infer<typeof historySchema>;
const expScope = z.object({
  licenseClass: label,
  from: instant.nullable(),
  to: instant,
  asOf: instant,
  sourceWatermark: count,
  creditFingerprint: label,
  ruleVersion: label,
});
const recentRow = z.object({
  module: z.enum(["THEORY", "SIMULATION"]),
  sourceType: referenceSchema.shape.sourceType,
  sourceId: z.string().uuid(),
  resultId: z.string().uuid(),
  activityType: label,
  displayTitle: label,
  licenseClass: label,
  sourceScore: z.number().finite().nonnegative(),
  sourceMaxScore: z.number().finite().positive(),
  normalizedScore: percent,
  result: outcome,
  completedAt: instant,
  resultAvailable: z.boolean(),
  reviewAvailable: z.boolean(),
  presetSetId: z.string().uuid().nullable(),
  presetVersionId: z.string().uuid().nullable(),
  sourceResult: referenceSchema,
});
const periodBase = {
  ...base,
  period: performancePeriod,
  timezone: z.literal("Asia/Ho_Chi_Minh"),
  from: instant.nullable(),
  to: instant,
  asOf: instant,
  ruleVersion: label,
  expScope,
};
export const analyticsSchema = z.object({
  ...periodBase,
  scoreBasis: z.literal("NORMALIZED_PERCENT_100"),
  partial: z.boolean(),
  summary: z.object({
    averageScore: percent.nullable(),
    maxScore: z.literal(100),
    passRate: percent.nullable(),
    totalExp: count.nullable(),
    attempts: count.nullable(),
    theoryAttempts: count,
    simulationAttempts: count.nullable(),
    theoryExp: count,
    simulationExp: count.nullable(),
    scoreBasis: z.literal("NORMALIZED_PERCENT_100"),
  }),
  recentResults: z.array(recentRow),
  scoreTrend: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      averageScore: percent.nullable(),
      score: percent.nullable(),
      attempts: count,
    }),
  ),
  scoreTrendTruncated: z.boolean(),
  scoreTrendTotalDays: count,
  scoreTrendLimit: count.positive(),
});
export type CombinedAnalytics = z.infer<typeof analyticsSchema>;
const rankEntry = z.object({
  userId: z.string().uuid(),
  rank: count.positive().nullable(),
  rankingScore: count.nullable(),
  theoryExp: count,
  simulationExp: count.nullable(),
  lastCreditedAt: instant.nullable(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  profileStatus: z.enum(["AVAILABLE", "PENDING", "UNAVAILABLE"]),
});
export const rankingSchema = z.object({
  ...periodBase,
  currentUser: rankEntry,
  items: z.array(rankEntry),
  page: count,
  size: count.min(1).max(100),
  totalPages: count.nullable(),
  totalParticipants: count.nullable(),
});
export type CombinedRanking = z.infer<typeof rankingSchema>;
const progressCounts = {
  totalScenarios: count.nullable(),
  practicedScenarios: count.nullable(),
  completionPercent: percent.nullable(),
  perfectScenarios: count.nullable(),
  needReviewCount: count.nullable(),
  bookmarkedScenarios: count.nullable(),
  bookmarkCount: count.nullable(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).nullable(),
};
const chapter = z.object({
  ...progressCounts,
  chapterId: count.positive(),
  chapterName: label,
  lastStudiedAt: instant.nullable(),
  navigation: z.object({
    targetKind: z.literal("SIMULATION_CHAPTER"),
    chapterId: count.positive(),
    bankVersion: bank,
    path: z.string(),
  }),
});
export const progressSchema = z.object({
  ...base,
  ...progressCounts,
  bankVersion: bank.nullable(),
  module: z.literal("SIMULATION"),
  progressScope: z.literal("USER_BANK_VERSION_SHARED_LICENSES"),
  achievementScope: label,
  asOf: instant.nullable(),
  chapters: z.array(chapter),
});
export type SimulationProgress = z.infer<typeof progressSchema>;
export type PerformanceSnapshot =
  SimulationHistory | CombinedAnalytics | CombinedRanking | SimulationProgress;

/** Read capability, never infer COMBINED from bank readiness or a hardcoded license list. */
export function resolvePerformanceMode(
  license: LicenseOption,
): "LEGACY_THEORY" | "COMBINED" {
  if (
    license.performanceMode === undefined &&
    license.simulationEnabled !== true
  )
    return "LEGACY_THEORY";
  if (
    license.performanceMode === "LEGACY_THEORY" &&
    license.simulationEnabled !== true
  )
    return "LEGACY_THEORY";
  if (
    license.performanceMode === "COMBINED" &&
    license.simulationEnabled === true &&
    license.learningModules?.includes("THEORY") &&
    license.learningModules.includes("SIMULATION") &&
    license.performancePolicyVersion
  )
    return "COMBINED";
  throw Error("Chưa nhận được chính sách tổng hợp hợp lệ cho hạng GPLX này.");
}
export function sameExpScope(
  a: CombinedAnalytics,
  b: CombinedRanking,
): boolean {
  return [
    "licenseClass",
    "from",
    "to",
    "asOf",
    "sourceWatermark",
    "ruleVersion",
    "creditFingerprint",
  ].every(
    (key) =>
      a.expScope[key as keyof typeof a.expScope] ===
      b.expScope[key as keyof typeof b.expScope],
  );
}
