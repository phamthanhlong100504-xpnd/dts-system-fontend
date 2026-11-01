import { resultApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Types: dts-result service (hand-written từ DTO Java, chưa có OpenAPI) */
/* ------------------------------------------------------------------ */

export interface ResultOverview {
  completedPrograms: number;
  inProgressPrograms: number;
  completedChapters: number;
  completedLessons: number;
  totalExamsTaken: number;
  passedExams: number;
  failedExams: number;
  averageScore: number | null;
  bestScore: number | null;
  totalLearningTimeSeconds: number;
  totalAttempts: number;
  lastActivityAt: string | null;
}

export interface ScoreTrendPoint {
  date: string; // YYYY-MM-DD
  averageScore: number | null;
}
export interface StudyTimeTrendPoint {
  date: string; // YYYY-MM-DD
  durationSeconds: number;
}
export interface AttemptTrendPoint {
  date: string; // YYYY-MM-DD
  attempts: number;
}
export interface CompletionTrendPoint {
  date: string; // YYYY-MM-DD
  completed: number;
}

export interface ResultStatistics {
  scoreTrend: ScoreTrendPoint[];
  studyTimeTrend: StudyTimeTrendPoint[];
  attemptTrend: AttemptTrendPoint[];
  completionTrend: CompletionTrendPoint[];
}

export interface ResultSummary {
  targetType: string;
  targetId: string;
  status: string;
  attemptCount: number;
  bestScore: number | null;
  latestScore: number | null;
  averageScore: number | null;
  progress: number | null;
  lastActivityAt: string | null;
}

export interface ResultSummaryDetail {
  targetType: string;
  targetId: string;
  status: string;
  attemptCount: number;
  completionCount: number;
  bestScore: number | null;
  latestScore: number | null;
  averageScore: number | null;
  progress: number | null;
  totalDurationSeconds: number | null;
  lastActivityAt: string | null;
  completedAt: string | null;
  summarySnapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface ResultStatusCounts {
  completed: number;
  inProgress: number;
  notStarted: number;
}

export interface ResultProgress {
  targetType: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number | null;
  averageProgress: number | null;
}

export interface ResumeTarget {
  targetType: string;
  targetId: string;
  progress: number | null;
  lastActivityAt: string | null;
}

export type ResultExamActivityType = "PRESET_EXAM" | "RANDOM_EXAM" | "OFFICIAL_EXAM";
export type ResultHistorySourceType = "PRACTICE_SESSION" | "EXAM_SESSION";
export type ResultHistoryOutcome = "PASSED" | "FAILED";
export type ResultHistoryReasonCode = "SOURCE_POLICY_REQUIRED" | "REVIEW_NOT_ALLOWED";

export interface ResultSourceReference {
  sourceType: ResultHistorySourceType;
  sourceId: string;
  resultPath: string;
}

export interface ResultHistoryItem {
  id: string;
  targetType: string;
  targetId: string;
  sourceType: ResultHistorySourceType | null;
  sourceId: string | null;
  activityType: ResultExamActivityType | null;
  displayTitle: string | null;
  licenseClass: string | null;
  correctCount: number | null;
  questionCount: number | null;
  resultAvailable: boolean | null;
  reviewAvailable: boolean | null;
  reasonCode: ResultHistoryReasonCode | null;
  sourceResult: ResultSourceReference | null;
  attemptNo: number | null;
  result: ResultHistoryOutcome;
  score: number | null;
  maxScore: number | null;
  progress: number | null;
  durationSeconds: number | null;
  startedAt: string | null;
  completedAt: string;
}

export interface ResultHistoryDetail extends ResultHistoryItem {
  resultSnapshot: Record<string, string | number | boolean>;
  metadata: Record<string, string | number | boolean>;
}

export interface RecentResultActivity {
  targetType: string;
  targetId: string;
  sourceId: string;
  result: string;
  score: number | null;
  completedAt: string | null;
}

/** JSON shape của Spring Data `Page<T>` (dts-result trả về trực tiếp, không bọc envelope) */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/* ------------------------------------------------------------------ */
/* Service: gọi qua gateway (/api/result → dts-result:8080)             */
/* ------------------------------------------------------------------ */

export async function getOverview() {
  return resultApi.get<ResultOverview>("/v1/results/me/overview");
}

export type StatisticsInterval = "DAY" | "WEEK" | "MONTH";

export interface ResultStatisticsParams {
  from?: string;
  to?: string;
  interval?: StatisticsInterval;
}

export async function getStatistics(params?: ResultStatisticsParams) {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  q.set("interval", params?.interval ?? "DAY");
  const qs = q.toString();
  return resultApi.get<ResultStatistics>(
    `/v1/results/me/statistics${qs ? `?${qs}` : ""}`
  );
}

export interface ResultSummaryListParams {
  targetType?: string;
  status?: string;
  page?: number;
  size?: number;
}

export async function getSummaries(params?: ResultSummaryListParams) {
  const q = new URLSearchParams();
  if (params?.targetType) q.set("targetType", params.targetType);
  if (params?.status) q.set("status", params.status);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.size != null) q.set("size", String(params.size));
  const qs = q.toString();
  return resultApi.get<SpringPage<ResultSummary>>(
    `/v1/results/me/summaries${qs ? `?${qs}` : ""}`
  );
}

export async function getSummaryDetail(targetType: string, targetId: string) {
  return resultApi.get<ResultSummaryDetail>(
    `/v1/results/me/summaries/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`
  );
}

export async function getSummaryStatus() {
  return resultApi.get<ResultStatusCounts>("/v1/results/me/summaries/status");
}

export async function getProgressByType(targetType: string) {
  return resultApi.get<ResultProgress>(
    `/v1/results/me/summaries/progress?targetType=${encodeURIComponent(targetType)}`
  );
}

/**
 * Mục tiêu "tiếp tục" gần nhất. Backend trả 200 body rỗng khi không có
 * → guard để trả `null` thay vì chuỗi rỗng.
 */
export async function getResumeTarget(): Promise<ResumeTarget | null> {
  const data = await resultApi.get<ResumeTarget | "">("/v1/results/me/summaries/resume");
  return data && typeof data === "object" ? data : null;
}

export interface ResultHistoryParams {
  targetType?: string;
  targetId?: string;
  activityType?: ResultExamActivityType;
  licenseClass?: string;
  result?: ResultHistoryOutcome;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export async function getHistory(params?: ResultHistoryParams) {
  const q = new URLSearchParams();
  if (params?.targetType) q.set("targetType", params.targetType);
  if (params?.targetId) q.set("targetId", params.targetId);
  if (params?.activityType) q.set("activityType", params.activityType);
  if (params?.licenseClass) q.set("licenseClass", params.licenseClass);
  if (params?.result) q.set("result", params.result);
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.size != null) q.set("size", String(params.size));
  for (const sort of typeof params?.sort === "string" ? [params.sort] : params?.sort ?? []) {
    q.append("sort", sort);
  }
  const qs = q.toString();
  return resultApi.get<SpringPage<ResultHistoryItem>>(
    `/v1/results/me/history${qs ? `?${qs}` : ""}`
  );
}

export async function getHistoryDetail(resultId: string) {
  return resultApi.get<ResultHistoryDetail>(
    `/v1/results/me/history/${encodeURIComponent(resultId)}`
  );
}

export async function getRecentResults(limit = 10) {
  return resultApi.get<RecentResultActivity[]>(`/v1/results/me/recent?limit=${limit}`);
}
