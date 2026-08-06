import { practiceApi } from "@/lib/api";

/** Thống kê câu hỏi — khớp shape thực tế `GET /v1/questions/stats` trả về */
export interface QuestionStats {
  total?: number;
  byChapter?: Record<string, number>;
}

/** Tên + khoảng số câu của 6 chương (dữ liệu tĩnh từ bộ 600 câu Cục CSGT 2025) */
export const CHAPTER_META: Record<
  string,
  { name: string; range: string }
> = {
  "1": { name: "Quy định chung và quy tắc giao thông đường bộ", range: "1–180" },
  "2": { name: "Văn hóa giao thông, đạo đức người lái xe, kỹ năng PCCC và cứu hộ, cứu nạn", range: "181–205" },
  "3": { name: "Kỹ thuật lái xe", range: "206–263" },
  "4": { name: "Cấu tạo và sửa chữa", range: "264–300" },
  "5": { name: "Báo hiệu đường bộ", range: "301–485" },
  "6": { name: "Giải thế sa hình và kỹ năng xử lý tình huống giao thông", range: "486–600" },
};

/** Shape thực tế câu hỏi — spec OpenAPI khai `options` lỏng (Record), thực tế là mảng {label, text} */
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
}

export async function getQuestionStats() {
  const data = await practiceApi.get<unknown>("/v1/questions/stats");
  return data as QuestionStats;
}

export async function getQuestionsByChapter(chapterId: number) {
  const data = await practiceApi.get<unknown>(
    `/v1/questions/chapter/${chapterId}`
  );
  return data as Question[];
}

export async function getCriticalQuestions() {
  const data = await practiceApi.get<unknown>("/v1/questions/critical");
  return data as Question[];
}

/* ==================== EXAM / PRACTICE SESSION ==================== */

export type ExamMode = "EXAM" | "PRACTICE";

/** Hạng bằng + các mức cấu hình đề (được chọn trong dialog bắt đầu) */
export const EXAM_TYPES = ["A1", "A2", "B1", "B2", "C", "D", "E", "F"] as const;
export const QUESTION_COUNTS = [10, 15, 20, 25, 40, 50] as const;
export const EXAM_DURATIONS = [5, 10, 15, 20, 45, 60] as const;

export interface StartExamRequest {
  examType: string;
  totalQuestions?: number; // 1–60, mặc định 25
  durationMinutes?: number; // 5–120, mặc định 20
  mode?: ExamMode; // "EXAM" | "PRACTICE", mặc định "EXAM"
}

export interface ExamSessionResponse {
  examId?: string;
  examType?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "TIMEOUT" | string;
  totalQuestions?: number;
  answeredCount?: number;
  durationMinutes?: number;
  expiresAt?: string;
  mode?: ExamMode;
  questions?: Question[];
  startedAt?: string;
}

export interface SubmitAnswerRequest {
  /** int dạng string, ví dụ "123" */
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D";
}

export interface SubmitAnswerResponse {
  status?: string;
  /** PRACTICE mode trả về boolean; EXAM mode trả về null (che đáp án) */
  isCorrect?: boolean | null;
  correctAnswer?: string | null;
  explanation?: string | null;
}

export interface ExamAnswerResult {
  questionId?: number;
  questionText?: string;
  options?: QuestionOption[];
  imageUrl?: string;
  correctAnswer?: string;
  /** "" nếu chưa trả lời */
  selectedAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface ExamResultResponse {
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
  examType?: string;
  score?: number;
  correctCount?: number;
  totalQuestions?: number;
  completedAt?: string;
}

export async function startExam(payload: StartExamRequest) {
  const data = await practiceApi.post<unknown>("/v1/exams", payload);
  return data as ExamSessionResponse;
}

export async function getExamSession(examId: string) {
  const data = await practiceApi.get<unknown>(`/v1/exams/${examId}`);
  return data as ExamSessionResponse;
}

export async function submitAnswer(examId: string, payload: SubmitAnswerRequest) {
  const data = await practiceApi.post<unknown>(
    `/v1/exams/${examId}/answers`,
    payload
  );
  return data as SubmitAnswerResponse;
}

export async function finishExam(examId: string) {
  const data = await practiceApi.post<unknown>(`/v1/exams/${examId}/finish`);
  return data as ExamResultResponse;
}

export async function getExamResult(examId: string) {
  const data = await practiceApi.get<unknown>(`/v1/exams/${examId}/result`);
  return data as ExamResultResponse;
}

export async function getExamHistory(page: number, size: number) {
  const data = await practiceApi.get<unknown>(
    `/v1/exams/history?page=${page}&size=${size}&sort=startedAt,desc`
  );
  return data as PageResponse<ExamHistoryEntry>;
}

export async function getLeaderboard(examType: string, period: string) {
  const typeParam = examType ? `examType=${examType}&` : "";
  const data = await practiceApi.get<unknown>(
    `/v1/exams/leaderboard?${typeParam}period=${period}`
  );
  return data as LeaderboardEntry[];
}
