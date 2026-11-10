import type {
  BookmarksPage,
  BookmarksQuery,
  BookmarksOverview,
} from "./simulation-bookmarks-types";
import type {
  ReviewNeededPage,
  ReviewNeededOverview,
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
import { simulationHttpSource } from "./simulation-learning-service";
/** Boundary for the final backend integration, not an OpenAPI definition.
 * Implement only after the real contract is handed over. Never load local JSON here.
 */
export interface SimulationLearningSource {
  bookmarksOverview?: (scope: SimulationScope) => Promise<BookmarksOverview>;
  reviewOverview?: (scope: SimulationScope) => Promise<ReviewNeededOverview>;
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
  cursor?: (
    scope: SimulationScope,
    chapterId: string,
    scenarioId: string,
    expectedRevision: number,
    eventId: string,
  ) => Promise<{
    scenarioId: string | null;
    sourceAttemptId: string | null;
    revision: number;
  }>;
}
export function getSimulationLearningSource(): SimulationLearningSource | null {
  // Only handed-over Card01/02/03 capabilities are configured.
  return simulationHttpSource;
}
