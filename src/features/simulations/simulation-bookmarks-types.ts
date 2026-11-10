import type {
  ScenarioListItem,
  SimulationDataScope,
} from "./simulation-learning-types";
/** Card03 UI models mapped from the handed-over backend contract. */
export interface BookmarksQuery {
  chapterId: string | null;
  sort: "SCENARIO_ASC";
  page: number;
  bankVersion?: string;
  datasetVersion?: string;
}
export interface BookmarksReturnContext extends BookmarksQuery {
  origin: "bookmarks";
}
export interface BookmarkedChapter {
  id: string;
  number: number;
  name: string;
  bookmarkedCount: number;
}
export interface BookmarkedScenario extends ScenarioListItem {
  isBookmarked: true;
  chapterNumber: number;
  chapterName: string;
  completedAttemptCount: number;
}
export interface BookmarksOverview {
  scope: SimulationDataScope;
  scoringVersion: string;
  datasetVersion: string;
  totalBookmarked: number;
  chapters: BookmarkedChapter[];
}
export interface BookmarksPage extends BookmarksOverview {
  chapterId: string | null;
  sort: "SCENARIO_ASC";
  filteredCount: number;
  items: BookmarkedScenario[];
  page: number;
  pageSize: number;
  totalPages: number;
}
