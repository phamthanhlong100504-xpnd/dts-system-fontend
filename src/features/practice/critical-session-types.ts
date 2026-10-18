export type CriticalQuestionSessionMode =
  | "CONTINUE"
  | "REVIEW";

export type CriticalQuestionSessionStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "SUPERSEDED";

export interface CriticalQuestionSessionOption {
  label: string;
  text: string;
}

export interface CriticalQuestionSessionQuestion {
  questionId: number;
  position: number;
  chapterId: number;
  questionText: string;
  options: CriticalQuestionSessionOption[];
  isCritical: boolean;
  imageUrl?: string | null;
  mediaFileId?: string | null;
  bookmarked: boolean;
  learnedBeforeSession: boolean;
}

export interface CriticalQuestionSessionAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  answeredAt: string;
}

export interface CriticalQuestionSession {
  sessionId: string;
  licenseClass: string;
  bankVersion: string;
  mode: CriticalQuestionSessionMode;
  status: CriticalQuestionSessionStatus;
  totalQuestions: number;
  answeredQuestions: number;
  currentPosition: number;
  currentQuestionId: number;
  questions: CriticalQuestionSessionQuestion[];
  answers: Record<string, CriticalQuestionSessionAnswer>;
  startedAt: string;
  completedAt?: string | null;
}

export interface StartCriticalQuestionSessionRequest {
  licenseClass: string;
  mode: CriticalQuestionSessionMode;
  restart: boolean;
}

export interface SubmitCriticalQuestionAnswerRequest {
  licenseClass: string;
  sessionId: string;
  questionId: number;
  selectedAnswer: string;
}

export interface SaveCriticalQuestionCursorRequest {
  questionId: number;
}

export interface SetCriticalQuestionBookmarkRequest {
  licenseClass: string;
  bookmarked: boolean;
}

export interface CriticalQuestionBookmarkResponse {
  chapterId: number;
  questionId: number;
  licenseClass: string;
  bookmarked: boolean;
}