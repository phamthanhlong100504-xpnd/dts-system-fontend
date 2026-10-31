/** Internal presentation model. Map the final backend contract into this shape.
 * No endpoint, scoring rule, sample result or license whitelist is assumed here.
 */
export type SimulationHubAction =
  | "random" | "presets" | "chapters" | "review" | "bookmarks" | "guide" | "resume";

export interface SimulationHubSummary {
  bankVersion: string;
  totalScenarios: number;
  chapterCount: number;
  scenariosPerExam: number;
  maxTotalScore: number;
  publishedPresetCount: number;
  completedPresetCount: number;
  practicedScenarios: number;
  needReviewCount: number;
  bookmarkedCount: number;
  resume?: {
    title: string;
    description: string;
    completedScenarios: number;
    totalScenarios: number;
    completionPercent: number;
  } | null;
}

export type SimulationHubState =
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: SimulationHubSummary };

export type SimulationHubActions = Partial<Record<SimulationHubAction, () => void>>;
