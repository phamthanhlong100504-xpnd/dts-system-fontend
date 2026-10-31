/** Presentation contract only. The final backend DTO is mapped at the source boundary. */
export interface SimulationScope {
  userId: string;
  licenseClass: string;
}
export interface SimulationDataScope extends SimulationScope {
  bankVersion: string;
}
export type LearningLoadState<T> =
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };
export type ScenarioFilter = "ALL" | "UNPRACTICED" | "PRACTICED" | "BOOKMARKED";
export type ChapterStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export interface SimulationChapter {
  id: string;
  number: number;
  name: string;
  totalScenarios: number;
  practicedScenarios: number;
  completionPercent: number;
  status: ChapterStatus;
  scenarioRangeLabel?: string | null;
}
export interface SimulationOverview {
  scope: SimulationDataScope;
  totalScenarios: number;
  practicedScenarios: number;
  completionPercent: number;
  chapters: SimulationChapter[];
}
export interface ScenarioListItem {
  id: string;
  number: number;
  title: string;
  chapterId: string;
  durationMs: number;
  thumbnailUrl: string | null;
  isPracticed: boolean;
  bestScore: number | null;
  maxScore: number;
  isBookmarked: boolean;
}
export interface SimulationChapterPage {
  scope: SimulationDataScope;
  chapter: SimulationChapter;
  items: ScenarioListItem[];
  filterCounts: Record<ScenarioFilter, number>;
  page: number;
  totalPages: number;
  filteredCount: number;
  startScenarioId: string | null;
}
export type PracticePhase =
  | "ready"
  | "starting"
  | "playing"
  | "response-pending"
  | "recorded"
  | "completing"
  | "completed"
  | "video-error"
  | "save-error";
export interface ScoringSegment {
  startMs: number;
  endMs: number;
  score: number;
}
export interface SavedSimulationResult {
  status: "COMPLETED";
  attemptId: string;
  bankVersion: string;
  scoringVersion: string;
  score: number;
  maxScore: number;
  responseRecorded: boolean;
  firstResponseMs: number | null;
  durationMs: number;
  scoringSegments: ScoringSegment[];
  hazardSign: string;
  recognitionTip: string;
}
export interface SimulationScenarioPage {
  scope: SimulationDataScope;
  scenario: {
    id: string;
    number: number;
    title: string;
    chapterId: string;
    chapterNumber: number;
    chapterName: string;
    positionLabel: string;
    durationMs: number;
    isBookmarked: boolean;
  };
  phase: PracticePhase;
  attemptId: string | null;
  playbackEventId: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
  responseRecorded: boolean;
  firstResponseMs: number | null;
  result: SavedSimulationResult | null;
  policy: {
    allowPause: boolean;
    allowSeek: boolean;
    allowFullscreen: boolean;
    allowHintsWhilePlaying: boolean;
  };
  hintPreview: { hazardSign: string; recognitionTip: string } | null;
  previousScenarioId: string | null;
  nextScenarioId: string | null;
}
export type SimulationCommandKind =
  | "START"
  | "RESPONSE"
  | "COMPLETE"
  | "RENEW_PLAYBACK"
  | "RECONCILE_RESULT"
  | "NEW_ATTEMPT";
export interface SimulationCommand {
  kind: SimulationCommandKind;
  scenarioId: string;
  attemptId: string | null;
  playbackEventId: string | null;
  eventId: string;
  mediaTimeMs?: number;
}
export interface ScenarioActions {
  start?: () => Promise<void>;
  respond?: (mediaTimeMs: number, eventId: string) => Promise<void>;
  complete?: () => Promise<void>;
  renewPlayback?: () => Promise<void>;
  reconcileResult?: () => Promise<void>;
  newAttempt?: () => Promise<void>;
  bookmark?: () => void;
  previous?: () => void;
  next?: () => void;
}
