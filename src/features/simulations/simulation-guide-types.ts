import type {
  SimulationDataScope,
  SimulationScope,
} from "./simulation-learning-types";
export interface GuideItem {
  key: string;
  title: string;
  description: string;
}
export interface GuideMode {
  badge: string;
  title: string;
  items: GuideItem[];
}
/** Editable plain text only. This does not contain scoring rules, bank counts, URLs or permissions. */
export interface GuideContent {
  title: string;
  description: string;
  overview: { description: string };
  steps: { title: string; items: GuideItem[] };
  scoring: {
    title: string;
    description: string;
    illustrationTitle: string;
    illustrationNote: string;
    items: GuideItem[];
    important: string;
  };
  recognition: { title: string; items: GuideItem[]; policy: GuideItem };
  comparison: { title: string; practice: GuideMode; exam: GuideMode };
  notes: { title: string; items: GuideItem[] };
  cta: { title: string; description: string; buttonLabel: string };
}
export interface GuideBankInfo {
  bankVersion: string;
  chapterCount: number;
  scenarioCount: number;
  /** Explanatory labels only; never real scoring windows or playback timestamps. */
  scoringLabels: [string, string, string, string, string, string, string];
  mockExam: { available: boolean; notice: string };
}
export interface GuideRevision {
  pageKey: "SIMULATION_GUIDE";
  schemaVersion: 1;
  revision: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  content: GuideContent;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string | null;
  publishedBy: string | null;
  sectionOrder: readonly [
    "OVERVIEW",
    "PRACTICE_STEPS",
    "SCORING",
    "RECOGNITION",
    "MODE_COMPARISON",
    "PRACTICE_NOTES",
    "CTA",
  ];
}
export type GuideContentPolicy =
  "MOCK_EXAM_UNAVAILABLE_V1" | "MOCK_EXAM_RELEASED_V1";
export interface PublishedGuide {
  scope: SimulationDataScope;
  document: GuideRevision;
  bank: GuideBankInfo;
  contentPolicy: GuideContentPolicy;
}
export interface GuideAdminSnapshot {
  actorId: string;
  revision: number;
  draft: GuideRevision | null;
  published: GuideRevision | null;
  /** Structure supplied by backend when there is no draft/published document. */
  template: GuideContent | null;
  bank: GuideBankInfo;
  preview: GuideRevision;
  contentPolicy: GuideContentPolicy;
}
export interface GuideSaveRequest {
  expectedRevision: number;
  schemaVersion: 1;
  content: GuideContent;
}
export interface GuideHistory {
  actorId: string;
  versions: GuideRevision[];
}
export type GuideErrorCode =
  | "UNPUBLISHED"
  | "CONFLICT"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "UNAVAILABLE"
  | "UNKNOWN"
  | "BANK_CHANGED"
  | "UNCERTAIN";
export class SimulationGuideError extends Error {
  constructor(
    public code: GuideErrorCode,
    message: string,
    public status?: number,
    public apiCode?: string,
    public traceId?: string,
  ) {
    super(message);
    this.name = "SimulationGuideError";
  }
}
export interface SimulationGuideSource {
  current: (scope: SimulationScope) => Promise<PublishedGuide>;
  admin?: (actorId: string) => Promise<GuideAdminSnapshot>;
  saveDraft?: (
    actorId: string,
    request: GuideSaveRequest,
  ) => Promise<GuideAdminSnapshot>;
  publish?: (
    actorId: string,
    request: { expectedRevision: number },
  ) => Promise<GuideAdminSnapshot>;
  history?: (actorId: string) => Promise<GuideHistory>;
  preview?: (actorId: string) => Promise<GuideRevision>;
  version?: (actorId: string, revision: number) => Promise<GuideRevision>;
}
