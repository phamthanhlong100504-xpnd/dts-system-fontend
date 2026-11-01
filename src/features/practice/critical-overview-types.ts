export interface CriticalQuestionsOverview {
  licenseClass: string;
  totalQuestions: number;
  learnedQuestions: number;
  completionPercent: number;
  currentPosition: number;
  hasProgress: boolean;
  completed: boolean;
  lastStudiedAt?: string | null;
}