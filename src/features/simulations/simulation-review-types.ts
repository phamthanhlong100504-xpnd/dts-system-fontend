import type {
  ScenarioListItem,
  SimulationDataScope,
} from "./simulation-learning-types";
/** UI port for Card 02. Final DTOs are mapped only after backend handoff. */
export interface ReviewNeededQuery {
  chapterId: string | null;
  sort: "BEST_SCORE_ASC";
  page: number;
}
export type SimulationListReturnContext =
  | ReviewReturnContext
  | import("./simulation-bookmarks-types").BookmarksReturnContext;
export interface ReviewReturnContext extends ReviewNeededQuery {
  origin: "review-needed";
}
export interface ReviewChapter {
  id: string;
  number: number;
  name: string;
  needReviewCount: number;
}
export interface ReviewScenario extends ScenarioListItem {
  isPracticed: true;
  bestScore: number;
  chapterNumber: number;
  chapterName: string;
}
export interface ReviewNeededPage {
  scope: SimulationDataScope;
  practicedScenarios: number;
  totalNeedReview: number;
  chapters: ReviewChapter[];
  chapterId: string | null;
  sort: "BEST_SCORE_ASC";
  filteredCount: number;
  items: ReviewScenario[];
  page: number;
  totalPages: number;
}
