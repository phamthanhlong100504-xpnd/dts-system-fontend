
export type UUID = string;
export type InstantString = string;
export type VietnamDate = string; // YYYY-MM-DD in Asia/Ho_Chi_Minh

export const LICENSE_CLASSES = [
  "A1", "A", "B1", "B", "C1", "C", "D1", "D2", "D",
  "BE", "C1E", "CE", "D1E", "D2E", "DE", "A2", "B2", "E", "F",
] as const;
export type LicenseClass = (typeof LICENSE_CLASSES)[number];

export type LeaderboardPeriod = "THIS_WEEK" | "THIS_MONTH" | "ALL_TIME";
export type AnalyticsPeriod = "7D" | "30D" | "ALL";
export type ProfileStatus = "AVAILABLE" | "PENDING" | "UNAVAILABLE";
export type ActivityType = "RANDOM_EXAM" | "PRESET_EXAM" | "OFFICIAL_EXAM";
export type ExamOutcome = "PASSED" | "FAILED";
export type ReviewReason = "SOURCE_POLICY_REQUIRED" | "REVIEW_NOT_ALLOWED";

/** Optional bridge for the existing Screen14 tab values. */
export const LEADERBOARD_PERIOD_MAP = {
  WEEK: "THIS_WEEK", MONTH: "THIS_MONTH", ALL: "ALL_TIME",
} as const satisfies Record<"WEEK" | "MONTH" | "ALL", LeaderboardPeriod>;

export interface LeaderboardParams {
  licenseClass: LicenseClass;
  period?: LeaderboardPeriod; // default THIS_MONTH
  page?: number; // integer 0..2147483647
  size?: number; // integer 1..100, default 10
}

export interface LeaderboardEntry {
  userId: UUID;
  displayName: string | null;
  avatarUrl: string | null; // current backend always returns null
  profileStatus: ProfileStatus;
  rank: number | null; // null for currentUser without a ranked positive score
  rankingScore: number; // integer EXP; not a percentage or an exam score
  lastCreditedAt: InstantString | null;
}

export interface LeaderboardResponse {
  licenseClass: LicenseClass;
  period: LeaderboardPeriod;
  timezone: "Asia/Ho_Chi_Minh";
  asOf: InstantString;
  from: InstantString | null;
  to: InstantString | null; // calendar end; ALL_TIME => null
  currentUser: LeaderboardEntry;
  items: LeaderboardEntry[]; // ranked items have non-null rank/lastCreditedAt
  totalParticipants: number;
  page: number;
  size: number;
  totalPages: number;
  ruleVersion: "EXP_2026_01";
  questionCaptureStartedAt: InstantString | null;
}

export interface AnalyticsParams {
  licenseClass: LicenseClass;
  period?: AnalyticsPeriod; // default 30D
}

export interface AnalyticsSummary {
  averageScore: number | null;
  maxScore: number | null;
  scoreBasis: "NORMALIZED_CORRECT_COUNT";
  passRate: number; // percent 0..100, already calculated by backend
  accuracyRate: number; // weighted percent 0..100, already calculated
  attempts: number;
  correctCount: number;
  questionCount: number;
}

export interface AnalyticsTrendPoint {
  date: VietnamDate;
  score: number | null;
  averageScore: number | null; // same numeric value as score
  attempts: number;
}

export interface SourceResult {
  sourceType: "PRACTICE_SESSION" | "EXAM_SESSION";
  sourceId: UUID;
  resultPath: string; // existing frontend route, not an API path
}

export interface AnalyticsRecentResult {
  resultId: UUID; // Result history ID; different from sourceResult.sourceId
  title: string | null;
  activityType: ActivityType;
  licenseClass: LicenseClass;
  result: ExamOutcome;
  score: number | null; // normalized to the current source-owned question scale
  maxScore: number | null;
  sourceScore: number; // original grade, preserve its original unit
  sourceMaxScore: number;
  correctCount: number;
  questionCount: number;
  completedAt: InstantString;
  resultAvailable: boolean;
  reviewAvailable: boolean | null;
  reasonCode: ReviewReason | null;
  sourceResult: SourceResult;
}

export interface ResultAnalyticsResponse {
  licenseClass: LicenseClass;
  period: AnalyticsPeriod;
  timezone: "Asia/Ho_Chi_Minh";
  asOf: InstantString;
  from: InstantString | null; // ALL => null
  to: InstantString; // all analytics periods: same instant as asOf
  dataStatus: "READY" | "SOURCE_POLICY_PENDING";
  trendMode: "DAILY_AVERAGE";
  scoreTrendTruncated: boolean;
  scoreTrendTotalDays: number;
  scoreTrendLimit: 3660;
  summary: AnalyticsSummary;
  scoreTrend: AnalyticsTrendPoint[];
  recentResults: AnalyticsRecentResult[];
}

/** Result's controller errors. Gateway/401 errors may have a different body. */
export interface ResultApiErrorBody {
  code: string;
  message: string;
  details: string[];
  traceId: string | null;
  timestamp: InstantString;
}
