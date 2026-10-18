export interface WrongQuestionsOverview {
  licenseClass: string;

  totalWrongQuestions: number;

  hasWrongQuestions: boolean;
}

export interface WrongQuestionItem {
  questionId: number;

  sourceQuestionId?: number;

  chapterId: number;

  questionText: string;

  options?: unknown;

  selectedAnswer?: string;

  correctAnswer: string;

  isCritical: boolean;

  explanation?: string;

  imageUrl?: string;

  mediaFileId?: string;

  lastWrongAt?: string;
}