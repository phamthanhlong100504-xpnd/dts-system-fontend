import type {
  ExamMode,
  ExamSessionResponse,
} from "@/features/practice/practice-service";

export type PresetExamStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type PresetExamUserStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED";

export type PresetExamAttemptStatus =
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "TIMEOUT";

export interface PresetExamLatestAttempt {
  sessionId: string;

  status: PresetExamAttemptStatus;

  correctCount?: number | null;

  totalQuestions?: number | null;

  passed?: boolean | null;

  startedAt?: string | null;
  completedAt?: string | null;
}

export interface PresetExamSet {
  id: string;
  code: string;
  title: string;
  licenseClass: string;

  totalQuestions: number;
  durationSeconds: number;

  status: PresetExamStatus;
  order: number;

  userStatus: PresetExamUserStatus;
  attemptCount: number;

  latestAttempt?: PresetExamLatestAttempt | null;
}

export interface PresetExamSetList {
  licenseClass: string;
  total: number;
  items: PresetExamSet[];
}

export type PresetExamFilter =
  | "ALL"
  | "NOT_STARTED"
  | "PASSED"
  | "FAILED";

export interface StartPresetExamRequest {
  presetExamSetId: string;
  mode: ExamMode;
}

export type StartPresetExamResponse =
  ExamSessionResponse;

export interface PresetExamCounts {
  total: number;
  notStarted: number;
  passed: number;
  failed: number;
  inProgress: number;
  completed: number;
}

export function getPresetExamCounts(
  items: PresetExamSet[]
): PresetExamCounts {
  const notStarted = items.filter(
    (item) =>
      item.userStatus ===
      "NOT_STARTED"
  ).length;

  const passed = items.filter(
    (item) =>
      item.userStatus ===
      "PASSED"
  ).length;

  const failed = items.filter(
    (item) =>
      item.userStatus ===
      "FAILED"
  ).length;

  const inProgress = items.filter(
    (item) =>
      item.userStatus ===
      "IN_PROGRESS"
  ).length;

  return {
    total: items.length,
    notStarted,
    passed,
    failed,
    inProgress,
    completed:
      passed + failed,
  };
}

export function filterPresetExams(
  items: PresetExamSet[],
  filter: PresetExamFilter
) {
  if (filter === "ALL") {
    return items;
  }

  return items.filter(
    (item) =>
      item.userStatus === filter
  );
}

export function formatPresetExamDuration(
  durationSeconds: number
) {
  if (
    !Number.isFinite(
      durationSeconds
    ) ||
    durationSeconds <= 0
  ) {
    return "—";
  }

  const minutes =
    Math.ceil(
      durationSeconds / 60
    );

  return `${minutes} phút`;
}