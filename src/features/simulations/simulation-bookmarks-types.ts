import type {
  ScenarioListItem,
  SimulationDataScope,
} from "./simulation-learning-types";
/** UI port only; map official backend DTOs here after handoff. */
export interface BookmarksQuery {
  chapterId: string | null;
  sort: "SCENARIO_ASC";
  page: number;
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
}
export interface BookmarksPage {
  scope: SimulationDataScope;
  totalBookmarked: number;
  chapters: BookmarkedChapter[];
  chapterId: string | null;
  sort: "SCENARIO_ASC";
  filteredCount: number;
  items: BookmarkedScenario[];
  page: number;
  totalPages: number;
}
