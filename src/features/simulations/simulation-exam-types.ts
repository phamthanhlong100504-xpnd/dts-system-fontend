import type {
  LearningLoadState,
  ScoringSegment,
  SimulationScope,
} from "./simulation-learning-types";
/** Internal view models. The delivered OpenAPI must be mapped at the source boundary. */
export interface ExamPolicy {
  totalScenarios: number;
  maxScenarioScore: number;
  maxTotalScore: number;
  passingScore: number;
  policyVersion: string;
}
export interface ExamPresetIdentity {
  presetSetId: string;
  presetVersionId: string;
  title: string;
}
export type ExamOrigin =
  | { mode: "RANDOM"; preset?: null }
  | { mode: "PRESET"; preset: ExamPresetIdentity };
export type ExamCreateRequest = { idempotencyKey: string } & (
  | { mode: "RANDOM" }
  | { mode: "PRESET"; presetSetId: string; presetVersionId: string }
);
export interface ExamPreparation {
  preset?: ExamPresetIdentity;
  scope: SimulationScope;
  bankVersion: string;
  policy: ExamPolicy;
  activeSession: ExamSession | null;
}
export type ExamStatus =
  | "IN_PROGRESS"
  | "READY_TO_SUBMIT"
  | "COMPLETED"
  | "CANCELLED";
export type ExamSession = ExamOrigin & {
  scope: SimulationScope;
  sessionId: string;
  status: ExamStatus;
  bankVersion: string;
  policy: ExamPolicy;
  completedScenarios: number;
  currentPosition: number;
  responseRecorded: boolean;
  positions: {
    position: number;
    status: "NOT_STARTED" | "CURRENT" | "COMPLETED";
  }[];
};
export interface ExamPlayback {
  sessionId: string;
  position: number;
  playbackEventId: string;
  videoUrl: string;
  expiresAt: string;
  mimeType: "video/mp4";
  durationMs: number;
  responseRecorded: boolean;
}
export type ExamResult = ExamOrigin & {
  scope: SimulationScope;
  sessionId: string;
  status: "COMPLETED";
  bankVersion: string;
  policy: ExamPolicy;
  completedScenarios: number;
  totalScore: number;
  passed: boolean;
  resultStatus: "PASSED" | "FAILED";
  startedAt: string;
  completedAt: string;
  items: { position: number; score: number; maxScore: number }[];
};
export interface ExamReviewItem {
  position: number;
  scenarioId: string;
  scenarioNumber: number;
  title: string;
  chapterName: string;
  score: number;
  maxScore: number;
  responseRecorded: boolean;
  firstResponseMs: number | null;
  durationMs: number;
  scoringSegments: ScoringSegment[];
  hazardSign: string;
  recognitionTip: string;
  scoringVersion: string;
  playback: ExamPlayback;
}
export interface ExamReview {
  result: ExamResult;
  items: ExamReviewItem[];
}
export type ExamPhase =
  | "playing"
  | "response-pending"
  | "recorded"
  | "response-error"
  | "transition"
  | "video-error"
  | "completion-error"
  | "finalizing"
  | "submission-error";
export interface ExamWorkspace {
  session: ExamSession;
  playback: ExamPlayback | null;
  phase: ExamPhase;
  busy: boolean;
}
export type ExamWorkspaceState = LearningLoadState<ExamWorkspace>;
export type ExamCommand = {
  kind: "REACTION" | "COMPLETE_CURRENT" | "SUBMIT" | "CANCEL";
  sessionId: string;
  position: number;
  playbackEventId: string | null;
  eventId: string;
  mediaTimeMs?: number;
};
export class SimulationExamError extends Error {
  constructor(
    public code:
      | "ACTIVE_SESSION_EXISTS"
      | "NOT_COMPLETED"
      | "ACCESS_DENIED"
      | "CANCELLED"
      | "UNAVAILABLE"
      | "PRESET_UNAVAILABLE"
      | "PRESET_VERSION_CHANGED",
    message: string,
    public sessionId?: string,
  ) {
    super(message);
    this.name = "SimulationExamError";
  }
}
