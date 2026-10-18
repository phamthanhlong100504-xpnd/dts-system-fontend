export type ChapterLearningStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface ChapterLearningProgress {
  chapterId: number;

  order: number;

  title: string;
  licenseClass: string;

  totalQuestions: number;
  learnedQuestions: number;

  status: ChapterLearningStatus;
  completionPercent: number;

  lastQuestionId?: number | null;
  resumeQuestionId?: number | null;
  lastStudiedAt?: string | null;
}

export interface ChapterLearningOverview {
  licenseClass: string;
  bankVersion: string;

  totalQuestions: number;
  learnedQuestions: number;
  completionPercent: number;

  chapters: ChapterLearningProgress[];
}