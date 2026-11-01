

export type LearningProgressStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "UNKNOWN";

export interface LearningProgressOverallApi {
  totalQuestions: number;
  learnedQuestions: number;
  completionPercent: number;
  status: string;
}

export interface LearningProgressReviewApi {
  needReviewCount: number;
}

export interface LearningProgressCriticalApi {
  totalQuestions: number;
  criticalStudiedQuestions: number;
  completionPercent: number;
  status: string;
}

export interface LearningChapterProgressApi {
  chapterId: number;

  chapterName?: string | null;

  totalQuestions: number;
  learnedQuestions: number;
  completionPercent: number;
  status: string;

  needReviewCount: number;
  criticalStudiedQuestions: number;

  lastStudiedAt: string | null;
}

export interface LearningProgressOverviewApi {
  licenseClass: string;
  bankVersion: string;

  overall: LearningProgressOverallApi;
  review: LearningProgressReviewApi;
  critical: LearningProgressCriticalApi;

  chapters: LearningChapterProgressApi[];
}

export interface LearningProgressOverall {
  studiedQuestions: number;
  totalQuestions: number;
  progressPercent: number;
  remainingQuestions: number;
}

export interface LearningProgressReview {
  needReviewCount: number;
}

export interface LearningProgressCritical {
  studiedQuestions: number;
  totalQuestions: number;
}

export interface LearningChapterProgress {
  chapterId: number;
  chapterName: string;

  studiedQuestions: number;
  totalQuestions: number;

  progressPercent: number;
  status: LearningProgressStatus;
}

export interface LearningProgressOverview {
  licenseClass: string;
  bankVersion?: string;

  overall: LearningProgressOverall;
  review: LearningProgressReview;
  critical: LearningProgressCritical;

  chapters: LearningChapterProgress[];
}
