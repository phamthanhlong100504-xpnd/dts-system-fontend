import type {
  BookmarksQuery,
  BookmarksReturnContext,
} from "./simulation-bookmarks-types";
export const bookmarksPath = "/practice/simulations/bookmarks";
export const defaultBookmarksQuery: BookmarksQuery = {
  chapterId: null,
  sort: "SCENARIO_ASC",
  page: 0,
};
type RouteQuery = Record<string, string | string[] | undefined>;
export function parseBookmarksQuery(query: RouteQuery): BookmarksQuery {
  return {
    chapterId:
      typeof query.chapter === "string" && query.chapter.trim()
        ? query.chapter.trim()
        : null,
    sort: "SCENARIO_ASC",
    page:
      typeof query.page === "string" && /^\d{1,6}$/.test(query.page)
        ? Number(query.page)
        : 0,
    ...(typeof query.bank === "string" && query.bank
      ? { bankVersion: query.bank }
      : {}),
    ...(typeof query.dataset === "string" && query.dataset
      ? { datasetVersion: query.dataset }
      : {}),
  };
}
export function bookmarksUrl(query: BookmarksQuery = defaultBookmarksQuery) {
  const params = new URLSearchParams({
    sort: "SCENARIO_ASC",
    page: String(query.page),
  });
  if (query.chapterId) params.set("chapter", query.chapterId);
  if (query.bankVersion) params.set("bank", query.bankVersion);
  if (query.datasetVersion) params.set("dataset", query.datasetVersion);
  return `${bookmarksPath}?${params}`;
}
export function withBookmarksReturnContext(
  url: string,
  context: BookmarksReturnContext,
) {
  const params = new URLSearchParams({
    returnTo: "bookmarks",
    bookmarkSort: "SCENARIO_ASC",
    bookmarkPage: String(context.page),
  });
  if (context.chapterId) params.set("bookmarkChapter", context.chapterId);
  if (context.bankVersion) params.set("bookmarkBank", context.bankVersion);
  return `${url}${url.includes("?") ? "&" : "?"}${params}`;
}
export function parseBookmarksReturnContext(
  query: RouteQuery,
): BookmarksReturnContext | undefined {
  if (query.returnTo !== "bookmarks") return undefined;
  return {
    origin: "bookmarks",
    ...parseBookmarksQuery({
      chapter: query.bookmarkChapter,
      page: query.bookmarkPage,
      bank: query.bookmarkBank,
    }),
  };
}
