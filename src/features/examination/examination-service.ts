import { examinationApi } from "@/lib/api";

export interface ExamSession {
  id: string;
  examId: string;
  userId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  completedAt?: string;
  durationSeconds?: number;
}

export interface StartExamSessionRequest {
  examId: string;
}

export interface QuestionOption {
  id?: number;
  label?: string;
  text?: string;
}

export interface ExamQuestion {
  id?: string;
  questionId?: string;
  questionText?: string;
  content?: string;
  options: QuestionOption[];
  imageUrl?: string;
  type?: string;
  questionType?: string;
}

export interface SubmitAnswerPayload {
  answers: {
    questionId: string;
    selectedAnswer: {
      type: string;
      value: string | string[];
    };
  }[];
}

export async function startExamSession(payload: StartExamSessionRequest) {
  const data = await examinationApi.post<unknown>("/v1/exam-sessions", payload);
  return data as ExamSession;
}

export async function getExamSession(sessionId: string) {
  const data = await examinationApi.get<unknown>(`/v1/exam-sessions/${sessionId}`);
  return data as ExamSession;
}

export async function getExamPaper(sessionId: string) {
  const data = await examinationApi.get<any>(`/v1/exam-sessions/${sessionId}/paper`);
  return (data.questions || []) as ExamQuestion[];
}

export async function saveAnswer(sessionId: string, payload: SubmitAnswerPayload) {
  const data = await examinationApi.post<unknown>(`/v1/exam-sessions/${sessionId}/answers`, payload);
  return data;
}

export async function submitExam(sessionId: string) {
  const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  const data = await examinationApi.post<unknown>(`/v1/exam-sessions/${sessionId}/submit`, undefined, {
    headers: {
      'Idempotency-Key': idempotencyKey
    }
  });
  return data;
}

export async function getExamResult(sessionId: string) {
  const data = await examinationApi.get<unknown>(`/v1/exam-sessions/${sessionId}/result`);
  return data;
}

export async function getAvailableExams() {
  const data = await examinationApi.get<unknown>("/v1/exams?status=PUBLISHED");
  return data as any;
}
