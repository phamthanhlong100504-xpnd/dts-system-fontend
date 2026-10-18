export type OfficialExamTab = "OPEN" | "UPCOMING" | "PARTICIPATED";
export type OfficialExamAvailability = "OPEN" | "UPCOMING" | "CLOSED" | "UNKNOWN";
export type OfficialExamParticipationStatus = "NOT_STARTED" | "IN_PROGRESS" | "READY" | "SUBMISSION_GRACE" | "SUBMITTED" | "EXPIRED" | "PARTICIPATED" | "UNKNOWN";

/** Student-facing Examination contract. Null attempts means unlimited. */
export interface OfficialExamListItem {
  examId: string;
  examVersionId?: string;
  title: string;
  licenseClass?: string;
  examType?: string;
  bankVersion?: string;
  questionsCount?: number;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  maxAttempts?: number | null;
  usedAttempts?: number;
  remainingAttempts?: number | null;
  activeSessionId?: string | null;
  availability: OfficialExamAvailability;
  participationStatus: OfficialExamParticipationStatus;
  canStart: boolean;
  canResume?: boolean;
  reasonCode?: string | null;
  retryAvailableAt?: string | null;
}

export interface OfficialExamListResult {
  items: OfficialExamListItem[];
  total: number;
  page?: number;
  size?: number;
  totalPages?: number;
  selectedLicenseClass?: string;
  serverTime?: string;
}

export interface OfficialExamListParams {
  tab: OfficialExamTab;
  licenseClass: string;
  page?: number;
  size?: number;
}
