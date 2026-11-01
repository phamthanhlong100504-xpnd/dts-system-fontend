import type {
  ReviewNeededQuery,
  ReviewReturnContext,
  SimulationListReturnContext,
} from "./simulation-review-types";
import { withBookmarksReturnContext } from "./simulation-bookmarks-navigation";
export const reviewNeededPath = "/practice/simulations/review-needed";
export const defaultReviewQuery: ReviewNeededQuery = {
  chapterId: null,
  sort: "BEST_SCORE_ASC",
  page: 0,
};
type RouteQuery = Record<string, string | string[] | undefined>;
function pageNumber(value: unknown) {
  return typeof value === "string" && /^\d{1,6}$/.test(value)
    ? Number(value)
    : 0;
}
export function parseReviewQuery(query: RouteQuery): ReviewNeededQuery {
  return {
    chapterId:
      typeof query.chapter === "string" && query.chapter.trim()
        ? query.chapter.trim()
        : null,
    sort: "BEST_SCORE_ASC",
    page: pageNumber(query.page),
  };
}
export function reviewNeededUrl(query: ReviewNeededQuery = defaultReviewQuery) {
  const params = new URLSearchParams({
    sort: "BEST_SCORE_ASC",
    page: String(query.page),
  });
  if (query.chapterId) params.set("chapter", query.chapterId);
  return `${reviewNeededPath}?${params}`;
}
export function withReviewReturnContext(
  url: string,
  context?: SimulationListReturnContext,
) {
  if (!context) return url;
  if (context.origin === "bookmarks")
    return withBookmarksReturnContext(url, context);
  const params = new URLSearchParams({
    returnTo: "review-needed",
    reviewSort: "BEST_SCORE_ASC",
    reviewPage: String(context.page),
  });
  if (context.chapterId) params.set("reviewChapter", context.chapterId);
  return `${url}${url.includes("?") ? "&" : "?"}${params}`;
}
export function parseReviewReturnContext(
  query: RouteQuery,
): ReviewReturnContext | undefined {
  if (query.returnTo !== "review-needed") return undefined;
  return {
    origin: "review-needed",
    ...parseReviewQuery({
      chapter: query.reviewChapter,
      page: query.reviewPage,
    }),
  };
}
