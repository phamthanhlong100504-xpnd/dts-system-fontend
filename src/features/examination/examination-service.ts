import { examinationApi } from "@/lib/api";

export type ExamSessionStatus = "IN_PROGRESS" | "READY" | "SUBMISSION_GRACE" | "SUBMITTED" | "EXPIRED";
export interface ExamRule {
  requireFullscreen: boolean;
  preventTabSwitch: boolean;
  maxTabSwitchCount: number;
  allowPause?: boolean;
  allowResume?: boolean;
  navigationMode?: "FREE" | "SEQUENTIAL";
  allowSkip?: boolean;
  reviewMode?: string;
  autoSubmit?: boolean;
  resultReleaseMode?: string;
}
export interface ExamSession {
  id?: string;
  sessionId: string;
  examId?: string;
  examVersionId: string;
  version: number;
  attemptNo?: number;
  status: ExamSessionStatus;
  startedAt: string;
  expiredAt?: string | null;
  durationSeconds?: number;
  remainingSeconds?: number;
  answeredQuestions?: number;
  totalQuestions?: number;
  currentPosition?: number;
  serverNow?: string;
  examRule?: ExamRule;
  markedQuestionIds?: string[];
}
export interface StartExamSessionRequest { examId?: string; examVersionId?: string }
export interface StartExamSessionResponse extends ExamSession { resumedExisting: boolean }
export interface QuestionOption { id: string; text: string; label?: string }
export interface SelectedAnswer { type: "single_choice" | "multiple_choice" | "true_false"; value: string | null }
export interface ExamQuestion {
  questionId: string;
  id?: string;
  content: string;
  type: string;
  options: QuestionOption[];
  isCritical?: boolean;
  mediaFileIds?: string[];
  display?: {position: number; sectionCode?: string; sectionTitle?: string; marked?: boolean};
  selectedAnswer?: SelectedAnswer | null;
  questionText?: string;
  imageUrl?: string;
}
export interface ExamPaper {
  sessionId: string;
  status: ExamSessionStatus;
  remainingSeconds: number;
  version: number;
  currentPosition: number;
  serverNow: string;
  questions: ExamQuestion[];
}
export interface SubmitAnswerPayload {
  version: number;
  answers: Array<{questionId: string; selectedAnswer: SelectedAnswer}>;
}
export interface VersionedResult { version: number; status?: ExamSessionStatus }
export interface ExamResultSummary {
  totalQuestions: number;
  answeredQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  unansweredQuestions: number;
  score: number;
  result: "PASS" | "FAIL";
}
export interface ExamResult {
  sessionId: string;
  status: ExamSessionStatus;
  submittedAt?: string;
  resultPublished: boolean;
  resultReleaseMode?: string;
  releaseAt?: string | null;
  summary?: ExamResultSummary | null;
  answers?: unknown[] | null;
}

export function startExamSession(payload: StartExamSessionRequest) {
  return examinationApi.post<StartExamSessionResponse>("/v1/exam-sessions", payload);
}
export function getExamSession(sessionId: string) {
  return examinationApi.get<ExamSession>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}`);
}
export function getExamPaper(sessionId: string) {
  return examinationApi.get<ExamPaper>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/paper`);
}
export function saveAnswer(sessionId: string, payload: SubmitAnswerPayload) {
  return examinationApi.post<VersionedResult & { savedAt: string; updatedQuestions: number }>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/answers`, payload);
}
export function markExamQuestion(sessionId: string, questionId: string, version: number, marked: boolean) {
  return examinationApi.patch<VersionedResult>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/questions/${encodeURIComponent(questionId)}/mark`, {version, marked});
}
export function navigateExamQuestion(sessionId: string, targetPosition: number, version: number) {
  return examinationApi.patch<VersionedResult>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/navigation`, {version, targetPosition});
}
export function reportExamViolation(sessionId: string, eventId: string, eventType: "TAB_SWITCH" | "FULLSCREEN_EXIT") {
  return examinationApi.post<VersionedResult>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/violations`, {eventId, eventType});
}
export function pauseExamSession(sessionId: string) {
  return examinationApi.patch<ExamSession>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/pause`);
}
export function resumeExamSession(sessionId: string) {
  return examinationApi.patch<ExamSession>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/resume`);
}

/** An idempotency key is client request metadata, never a source of business data. */
export function getSubmitKey(sessionId: string): string {
  const storageKey = `dts:official:submit-key:${sessionId}`;
  if (typeof window === "undefined") throw new Error("Submit requires a browser.");
  try {
    const old = window.sessionStorage.getItem(storageKey);
    if (old) return old;
    const key = crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, key);
    return key;
  } catch {
    // Avoid generating a new key for each retry within the same browser tab.
    const keys = fallbackSubmitKeys;
    if (!keys.has(sessionId)) keys.set(sessionId, crypto.randomUUID());
    return keys.get(sessionId)!;
  }
}
const fallbackSubmitKeys = new Map<string,string>();

export function submitExam(sessionId: string) {
  return examinationApi.post<ExamResult & {version?:number}>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/submit`, undefined, {headers:{"Idempotency-Key":getSubmitKey(sessionId)}});
}
export function getExamResult(sessionId: string) {
  return examinationApi.get<ExamResult>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/result`);
}
export function getExamReview(sessionId: string) {
  return examinationApi.get<{questions: Array<Record<string, unknown>>; totalQuestions?: number; correctCount?: number}>(`/v1/exam-sessions/${encodeURIComponent(sessionId)}/review`);
}
export function getAvailableExams() {
  return examinationApi.get<{items: unknown[]}>("/v1/student/exams?tab=OPEN&page=0&size=20");
}
