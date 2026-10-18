import { practiceApi } from "@/lib/api";

export interface QuestionStats {
  total?: number;
  byChapter?: Record<string, number>;
}

export const CHAPTER_META: Record<string, { name: string; range: string }> = {
  "1": {
    name: "Quy định chung và quy tắc giao thông đường bộ",
    range: "1–180",
  },
  "2": {
    name: "Văn hóa giao thông, đạo đức người lái xe",
    range: "181–205",
  },
  "3": {
    name: "Kỹ thuật lái xe",
    range: "206–263",
  },
  "4": {
    name: "Cấu tạo và sửa chữa",
    range: "264–300",
  },
  "5": {
    name: "Báo hiệu đường bộ",
    range: "301–485",
  },
  "6": {
    name: "Giải thế sa hình và kỹ năng xử lý tình huống giao thông",
    range: "486–600",
  },
};

export interface QuestionOption {
  label?: string;
  text?: string;
}

export interface Question {
  id?: number;
  chapter?: number;
  questionText?: string;
  options?: QuestionOption[];
  isCritical?: boolean;
  imageUrl?: string;
  mediaFileId?: string;
  correctAnswer?: string | null;
  explanation?: string | null;
}

function licenseQuery(licenseClass?: string) {
  const normalizedLicense = licenseClass?.trim().toUpperCase();

  if (!normalizedLicense) {
    return "";
  }

  return `?licenseClass=${encodeURIComponent(normalizedLicense)}`;
}

/* ==================== QUESTION BANK ==================== */

export async function getQuestionStats(licenseClass?: string) {
  const data = await practiceApi.get<unknown>(
    `/v1/questions/stats${licenseQuery(licenseClass)}`
  );

  return data as QuestionStats;
}

export async function getQuestionsByChapter(
  chapterId: number,
  licenseClass?: string
) {
  const data = await practiceApi.get<unknown>(
    `/v1/questions/chapter/${chapterId}${licenseQuery(licenseClass)}`
  );

  return data as Question[];
}

export async function getCriticalQuestions(licenseClass?: string) {
  const data = await practiceApi.get<unknown>(
    `/v1/questions/critical${licenseQuery(licenseClass)}`
  );

  return data as Question[];
}

/* ==================== EXAM / PRACTICE SESSION ==================== */

export type ExamMode = "EXAM" | "PRACTICE";

export type ExamStatus =
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "TIMEOUT";

export const EXAM_TYPES = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C",
  "D",
  "E",
  "F",
] as const;

export const QUESTION_COUNTS = [10, 15, 20, 25, 40, 50] as const;

export const EXAM_DURATIONS = [5, 10, 15, 20, 45, 60] as const;

export interface ExamConfigResponse {
  examType: string;
  totalQuestions: number;
  durationMinutes: number;
  passingScore: number;
  criticalQuestionCount: number;
}

export interface StartExamRequest {
  examType: string;
  mode?: ExamMode;

  /** @deprecated Backend ExamMatrix là source of truth. */
  totalQuestions?: number;

  /** @deprecated Backend ExamMatrix là source of truth. */
  durationMinutes?: number;

  /** @deprecated Backend tự xác định identity của user. */
  fullName?: string;
}

export interface PracticeAnswerFeedback {
  selectedAnswer?: string;
  isCorrect?: boolean | null;
  correctAnswer?: string | null;
  explanation?: string | null;
}

export interface ExamSessionResponse {
  examId?: string;
  examType?: string;
  status?: ExamStatus;

  totalQuestions?: number;
  answeredCount?: number;
  durationMinutes?: number;

  expiresAt?: string | null;

  mode?: ExamMode;
  questions?: Question[];
  startedAt?: string;

  answers?: Record<string, string>;

  answerFeedback?: Record<string, PracticeAnswerFeedback>;

  remainingTimeMs?: number | null;

  currentQuestionId?: number | null;

  serverTime?: string;
}

export interface ActiveExamResponse {
  examId: string;
  examType: string;
  mode: ExamMode;
  status: ExamStatus;

  totalQuestions: number;
  answeredCount: number;
  durationMinutes: number;

  startedAt: string;
  expiresAt: string | null;
}

export interface PauseExamRequest {
  currentQuestionId: number;
}

export interface UpdateExamCursorRequest {
  currentQuestionId: number;
}

export interface ExamFlagsResponse {
  examId: string;
  flaggedQuestionIds: number[];
}

export interface UpdateExamFlagRequest {
  flagged: boolean;
}

export interface SubmitAnswerRequest {
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D";
}

export interface SubmitAnswerResponse {
  status?: string;
  isCorrect?: boolean | null;
  correctAnswer?: string | null;
  explanation?: string | null;
}

export interface ExamAnswerResult {
  questionId?: number;
  questionText?: string;
  options?: QuestionOption[];

  imageUrl?: string;
  mediaFileId?: string;

  correctAnswer?: string;

  /** "" nếu chưa trả lời */
  selectedAnswer?: string;

  isCorrect?: boolean;
  isCritical?: boolean;
  explanation?: string;
}

export interface ExamResultResponse {
  examId?: string;
  examType?: string;
  status?: ExamStatus;

  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;

  /** Số câu user đã chọn đáp án nhưng trả lời sai. */
  answeredWrongCount?: number;

  /** Số câu user chưa chọn đáp án. */
  unansweredCount?: number;

  score?: number;
  passed?: boolean;

  mode?: ExamMode;
  durationMinutes?: number;

  answers?: ExamAnswerResult[];

  startedAt?: string;
  completedAt?: string;
}

export interface ExamHistoryEntry {
  examId?: string;
  examType?: string;
  status?: string;

  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  score?: number;
  passed?: boolean;

  mode?: ExamMode;
  durationMinutes?: number;

  startedAt?: string;
  completedAt?: string;
}

export interface PageResponse<T> {
  content?: T[];

  totalPages?: number;
  totalElements?: number;

  number?: number;
  size?: number;

  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface LeaderboardEntry {
  userId?: string;
  username?: string;
  fullName?: string;

  examType?: string;

  score?: number;
  correctCount?: number;
  totalQuestions?: number;

  completedAt?: string;
}

/* ==================== EXAM API ==================== */

export async function getExamConfig(examType: string) {
  const normalizedExamType = examType.trim().toUpperCase();

  const data = await practiceApi.get<unknown>(
    `/v1/exams/config?examType=${encodeURIComponent(normalizedExamType)}`
  );

  return data as ExamConfigResponse;
}

export async function startExam(payload: StartExamRequest) {
  const body = {
    examType: payload.examType.trim().toUpperCase(),
    mode: payload.mode ?? "EXAM",
  };

  const data = await practiceApi.post<unknown>(
    "/v1/exams",
    body
  );

  return data as ExamSessionResponse;
}

export async function getActiveExam(
  licenseClass: string
): Promise<ActiveExamResponse | null> {
  const normalizedLicense =
    licenseClass.trim().toUpperCase();

  if (!normalizedLicense) {
    return null;
  }

  const data = await practiceApi.get<unknown>(
    `/v1/exams/active?examType=${encodeURIComponent(normalizedLicense)}`
  );

  return data as ActiveExamResponse | null;
}

export async function getExamSession(examId: string) {
  const data = await practiceApi.get<unknown>(
    `/v1/exams/${examId}`
  );

  return data as ExamSessionResponse;
}

export async function updateExamCursor(
  examId: string,
  payload: UpdateExamCursorRequest
) {
  const data = await practiceApi.put<unknown>(
    `/v1/exams/${examId}/cursor`,
    payload
  );

  return data as Partial<ExamSessionResponse> | null;
}

export async function getExamFlags(examId: string) {
  const data = await practiceApi.get<unknown>(
    `/v1/exams/${examId}/flags`
  );

  return data as ExamFlagsResponse;
}

export async function updateExamFlag(
  examId: string,
  questionId: number,
  payload: UpdateExamFlagRequest
) {
  const data = await practiceApi.put<unknown>(
    `/v1/exams/${examId}/questions/${questionId}/flag`,
    payload
  );

  return data as ExamFlagsResponse;
}

export async function pauseExam(
  examId: string,
  payload: PauseExamRequest
) {
  const data = await practiceApi.post<unknown>(
    `/v1/exams/${examId}/pause`,
    payload
  );

  return data as ExamSessionResponse;
}

export async function resumeExam(examId: string) {
  const data = await practiceApi.post<unknown>(
    `/v1/exams/${examId}/resume`
  );

  return data as ExamSessionResponse;
}

export async function submitAnswer(
  examId: string,
  payload: SubmitAnswerRequest
) {
  const data = await practiceApi.post<unknown>(
    `/v1/exams/${examId}/answers`,
    payload
  );

  return data as SubmitAnswerResponse;
}

export async function finishExam(examId: string) {
  const data = await practiceApi.post<unknown>(
    `/v1/exams/${examId}/finish`
  );

  return data as ExamResultResponse;
}

export async function getExamResult(examId: string) {
  const data = await practiceApi.get<unknown>(
    `/v1/exams/${examId}/result`
  );

  return data as ExamResultResponse;
}

export async function retryExam(examId: string) {
  const data = await practiceApi.post<unknown>(
    `/v1/exams/${examId}/retry`
  );

  return data as ExamSessionResponse;
}

export async function getExamHistory(
  page: number,
  size: number
) {
  const data = await practiceApi.get<unknown>(
    `/v1/exams/history?page=${page}&size=${size}&sort=startedAt,desc`
  );

  return data as PageResponse<ExamHistoryEntry>;
}

export async function getLeaderboard(
  examType: string,
  period: string
) {
  const typeParam = examType
    ? `examType=${encodeURIComponent(examType)}&`
    : "";

  const data = await practiceApi.get<unknown>(
    `/v1/exams/leaderboard?${typeParam}period=${encodeURIComponent(period)}`
  );

  return data as LeaderboardEntry[];
}