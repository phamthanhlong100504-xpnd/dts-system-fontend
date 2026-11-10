import type { ApiClient } from "@/lib/api/http";
import type { SimulationScope } from "./simulation-learning-types";
import type {
  ReviewNeededOverview,
  ReviewNeededPage,
  ReviewNeededQuery,
} from "./simulation-review-types";
import { validateReviewNeededPage } from "./simulation-review-validation";
import {
  parseWire,
  wireReviewOverview,
  wireReviewPage,
} from "./simulation-wire";

export function createSimulationReviewSource(
  api: ApiClient,
  assertSession: (scope: SimulationScope) => void,
) {
  function match(scope: SimulationScope, value: ReviewNeededOverview) {
    if (
      value.scope.userId !== scope.userId ||
      value.scope.licenseClass !== scope.licenseClass ||
      (scope.bankVersion && value.scope.bankVersion !== scope.bankVersion)
    )
      throw new Error(
        "Dữ liệu cần ôn không khớp tài khoản, hạng hoặc ngân hàng.",
      );
    const ids = new Set(value.chapters.map((c) => c.id));
    if (
      ids.size !== value.chapters.length ||
      value.chapters.reduce((sum, c) => sum + c.needReviewCount, 0) !==
        value.totalNeedReview ||
      value.totalNeedReview > value.practicedScenarios
    )
      throw new Error("Thống kê cần ôn không nhất quán.");
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
      needReviewCount: number;
    }[],
  ) =>
    items.map((c) => ({
      id: String(c.chapterId),
      number: c.chapterNumber,
      name: c.chapterName,
      needReviewCount: c.needReviewCount,
    }));
  return {
    reviewOverview: async (
      scope: SimulationScope,
    ): Promise<ReviewNeededOverview> => {
      assertSession(scope);
      const value = parseWire(
        wireReviewOverview,
        await api.get<unknown>("/v1/simulations/review-needed/overview", {
          params: params(scope),
        }),
      );
      assertSession(scope);
      const model = { ...value, chapters: chapters(value.chapters) };
      match(scope, model);
      return model;
    },
    reviewNeeded: async (
      scope: SimulationScope,
      criteria: ReviewNeededQuery,
    ): Promise<ReviewNeededPage> => {
      const pinned = {
        ...scope,
        bankVersion: criteria.bankVersion ?? scope.bankVersion,
      };
      if (
        !Number.isInteger(criteria.page) ||
        criteria.page < 0 ||
        criteria.page > 10000 ||
        criteria.sort !== "BEST_SCORE_ASC" ||
        (criteria.chapterId !== null && !/^[1-6]$/.test(criteria.chapterId)) ||
        (criteria.datasetVersion !== undefined &&
          !/^[a-f0-9]{64}$/.test(criteria.datasetVersion))
      )
        throw new Error("Bộ lọc hoặc phiên dữ liệu cần ôn không hợp lệ.");
      assertSession(pinned);
      const value = parseWire(
        wireReviewPage,
        await api.get<unknown>("/v1/simulations/review-needed", {
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
        }),
      );
      assertSession(pinned);
      const model: ReviewNeededPage = {
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
      match(pinned, {
        ...model,
        scoringVersion: value.scoringVersion,
        datasetVersion: value.datasetVersion,
      });
      if (
        model.page !== criteria.page ||
        value.page.totalElements !== model.filteredCount ||
        value.page.totalPages !==
          Math.ceil(model.filteredCount / value.page.size)
      )
        throw new Error("Phân trang cần ôn không khớp dữ liệu backend.");
      validateReviewNeededPage(model, criteria);
      return model;
    },
  };
}
