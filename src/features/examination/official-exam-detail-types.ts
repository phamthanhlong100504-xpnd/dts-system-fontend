export interface OfficialExamRuleSummary {
  durationSeconds?: number;
  allowRetry?: boolean;
  maxRetry?: number;
  requireFullscreen?: boolean;
  preventTabSwitch?: boolean;
  maxTabSwitchCount?: number;
  allowPause?: boolean;
  allowResume?: boolean;
  autoSubmit?: boolean;
  allowSkip?: boolean;
  navigationMode?: "FREE" | "SEQUENTIAL";
  reviewMode?: "NONE" | "CURRENT_SECTION" | "ALL";
  resultReleaseMode?: "IMMEDIATE" | "AFTER_SUBMIT" | "AFTER_EXAM_END" | "MANUAL";
  showAnswerAfterSubmit?: boolean;
  showExplanationAfterSubmit?: boolean;
  showQuestionScoreAfterSubmit?: boolean;
}
export interface OfficialExamDetail {
  examId: string;
  examVersionId?: string;
  title: string;
  licenseClass?: string;
  questionsCount?: number;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  maxAttempts?: number | null;
  usedAttempts?: number;
  remainingAttempts?: number | null;
  activeSessionId?: string | null;
  canStart: boolean;
  canResume?: boolean;
  reasonCode?: string | null;
  retryAvailableAt?: string | null;
  instructions?: string | null;
  rule?: OfficialExamRuleSummary;
  grading?: {totalScore: number; passScore: number; gradingMethod: string; passingCorrectAnswers: number; criticalQuestionCount: number};
  serverTime?: string;
}
