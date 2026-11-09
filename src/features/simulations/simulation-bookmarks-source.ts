import type { ApiClient } from "@/lib/api/http";
import type { SimulationScope } from "./simulation-learning-types";
import type {
  BookmarksOverview,
  BookmarksPage,
  BookmarksQuery,
} from "./simulation-bookmarks-types";
import {
  validateBookmarksOverview,
  validateBookmarksPage,
} from "./simulation-bookmarks-validation";
import {
  parseWire,
  wireBookmarksOverview,
  wireBookmarksPage,
} from "./simulation-wire";

export function createSimulationBookmarksSource(
  api: ApiClient,
  assertSession: (scope: SimulationScope) => void,
) {
  function match(scope: SimulationScope, value: BookmarksOverview) {
    if (
      value.scope.userId !== scope.userId ||
      value.scope.licenseClass !== scope.licenseClass ||
      (scope.bankVersion && value.scope.bankVersion !== scope.bankVersion)
    )
      throw new Error(
        "Dữ liệu đánh dấu không khớp tài khoản, hạng hoặc ngân hàng.",
      );
    validateBookmarksOverview(value);
  }
  const params = (scope: SimulationScope) => ({
    licenseClass: scope.licenseClass,
    ...(scope.bankVersion ? { bankVersion: scope.bankVersion } : {}),
  });
  const chapters = (
    items: {
      chapterId: number;
      chapterNumber: number;
      chapterName: string;
      bookmarkedCount: number;
    }[],
  ) =>
    items.map((c) => ({
      id: String(c.chapterId),
      number: c.chapterNumber,
      name: c.chapterName,
      bookmarkedCount: c.bookmarkedCount,
    }));
  return {
    bookmarksOverview: async (
      scope: SimulationScope,
    ): Promise<BookmarksOverview> => {
      assertSession(scope);
      const value = parseWire(
        wireBookmarksOverview,
        await api.get<unknown>("/v1/simulations/bookmarks/overview", {
          params: params(scope),
          headers: { "Cache-Control": "no-cache" },
        }),
      );
      assertSession(scope);
      const model = { ...value, chapters: chapters(value.chapters) };
      match(scope, model);
      return model;
    },
    bookmarks: async (
      scope: SimulationScope,
      criteria: BookmarksQuery,
    ): Promise<BookmarksPage> => {
      const pinned = {
        ...scope,
        bankVersion: criteria.bankVersion ?? scope.bankVersion,
      };
      if (
        !Number.isInteger(criteria.page) ||
        criteria.page < 0 ||
        criteria.page > 10000 ||
        criteria.sort !== "SCENARIO_ASC" ||
        (criteria.chapterId !== null && !/^[1-6]$/.test(criteria.chapterId)) ||
        (criteria.bankVersion !== undefined && !criteria.bankVersion.trim()) ||
        (criteria.datasetVersion !== undefined &&
          !/^[a-f0-9]{64}$/.test(criteria.datasetVersion))
      )
        throw new Error("Bộ lọc hoặc phiên dữ liệu đánh dấu không hợp lệ.");
      assertSession(pinned);
      const value = parseWire(
        wireBookmarksPage,
        await api.get<unknown>("/v1/simulations/bookmarks", {
          params: {
            ...params(pinned),
            sort: criteria.sort,
            page: criteria.page,
            size: 12,
            ...(criteria.chapterId
              ? { chapterId: Number(criteria.chapterId) }
              : {}),
            ...(criteria.datasetVersion
              ? { expectedDatasetVersion: criteria.datasetVersion }
              : {}),
          },
          headers: { "Cache-Control": "no-cache" },
        }),
      );
      assertSession(pinned);
      const model: BookmarksPage = {
        ...value,
        chapters: chapters(value.chapters),
        chapterId: value.chapterId === null ? null : String(value.chapterId),
        page: value.page.number,
        pageSize: value.page.size,
        totalPages: value.page.totalPages,
        items: value.items.map((i) => ({
          ...i,
          id: i.scenarioId,
          number: i.scenarioNumber,
          chapterId: String(i.chapterId),
        })),
      };
      match(pinned, model);
      if (value.page.totalElements !== model.filteredCount)
        throw new Error("Phân trang đánh dấu không khớp dữ liệu backend.");
      validateBookmarksPage(model, criteria);
      return model;
    },
  };
}
