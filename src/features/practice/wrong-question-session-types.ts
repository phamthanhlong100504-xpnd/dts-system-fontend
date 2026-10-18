export type WrongQuestionSessionStatus = "IN_PROGRESS" | "COMPLETED";

export interface WrongQuestionSessionOption {
  label: string;
  text: string;
}

export interface WrongQuestionSessionQuestion {
  questionId: number;
  position: number;

  chapterId: number;
  chapterTitle?: string;

  questionText: string;
  options: WrongQuestionSessionOption[];

  isCritical: boolean;

  correctAnswer: string;
  explanation?: string;

  imageUrl?: string;
  mediaFileId?: string;

  previousWrongAnswer?: string;
  lastWrongAt?: string;

  bookmarked?: boolean;
}

export interface WrongQuestionSessionAnswer {
  questionId?: number;
  selectedAnswer: string;
  isCorrect: boolean;
  answeredAt?: string;
}

export interface WrongQuestionReviewSession {
  sessionId: string;

  licenseClass: string;
  bankVersion: string;

  status: WrongQuestionSessionStatus;

  totalQuestions: number;

  currentPosition: number;
  currentQuestionId: number;

  questions: WrongQuestionSessionQuestion[];

  answers: Record<string, WrongQuestionSessionAnswer>;

  answeredQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  remainingCount: number;

  startedAt?: string;
  completedAt?: string;
}

export interface StartWrongQuestionSessionRequest {
  licenseClass: string;
}

export type StartWrongQuestionSessionResponse = WrongQuestionReviewSession;

export interface SaveWrongQuestionCursorRequest {
  questionId: number;
}

export interface SubmitWrongQuestionAnswerRequest {
  questionId: number;
  selectedAnswer: string;
}

export interface SubmitWrongQuestionAnswerResponse {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  answeredAt?: string;
}

export type FinishWrongQuestionSessionResponse = WrongQuestionReviewSession;

export interface SetWrongQuestionBookmarkRequest {
  licenseClass: string;
  bookmarked: boolean;
}