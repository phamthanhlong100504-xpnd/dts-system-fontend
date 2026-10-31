import type {
  BookmarksPage,
  BookmarksQuery,
} from "./simulation-bookmarks-types";
import type {
  ReviewNeededPage,
  ReviewNeededQuery,
} from "./simulation-review-types";
import type {
  ScenarioFilter,
  SimulationCommand,
  SimulationChapterPage,
  SimulationOverview,
  SimulationScenarioPage,
  SimulationScope,
} from "./simulation-learning-types";
/** Boundary for the final backend integration, not an OpenAPI definition.
 * Implement only after the real contract is handed over. Never load local JSON here.
 */
export interface SimulationLearningSource {
  bookmarks?: (
    scope: SimulationScope,
    query: BookmarksQuery,
  ) => Promise<BookmarksPage>;
  reviewNeeded?: (
    scope: SimulationScope,
    query: ReviewNeededQuery,
  ) => Promise<ReviewNeededPage>;
  overview: (scope: SimulationScope) => Promise<SimulationOverview>;
  chapter: (
    scope: SimulationScope,
    chapterId: string,
    filter: ScenarioFilter,
    page: number,
  ) => Promise<SimulationChapterPage>;
  scenario: (
    scope: SimulationScope,
    scenarioId: string,
    attemptId?: string,
    intent?: "REVIEW_NEW" | "BOOKMARK_NEW" | "RESTORE",
  ) => Promise<SimulationScenarioPage>;
  command?: (
    scope: SimulationScope,
    command: SimulationCommand,
  ) => Promise<SimulationScenarioPage>;
  bookmark?: (
    scope: SimulationScope,
    scenarioId: string,
    bookmarked: boolean,
  ) => Promise<{ scenarioId: string; bookmarked: boolean }>;
}
export function getSimulationLearningSource(): SimulationLearningSource | null {
  // Explicitly unconfigured. No guessed endpoint or success response in production.
  return null;
}
