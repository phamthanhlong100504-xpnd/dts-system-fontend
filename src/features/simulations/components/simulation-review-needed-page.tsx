"use client";
import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/api/envelope";
import { useSimulationCanLearn } from "../simulation-access";
import { invalidateSimulationLists } from "../simulation-cache";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import { useSimulationReview } from "../use-simulation-review";
import {
  simulationRoutes,
  useSimulationNavigation,
} from "../simulation-navigation-store";
import { reviewNeededUrl } from "../simulation-review-navigation";
import type { ReviewNeededQuery } from "../simulation-review-types";
import type { SimulationScope } from "../simulation-learning-types";
import { SimulationReviewNeededView } from "./simulation-review-needed-view";
export function SimulationReviewNeededPage({
  criteria,
}: {
  criteria: ReviewNeededQuery;
}) {
  return (
    <SimulationLearningBoundary>
      {(scope) => (
        <BoundReview
          key={`${scope.userId}:${scope.licenseClass}:${criteria.bankVersion ?? scope.bankVersion}:${criteria.chapterId}:${criteria.page}:${criteria.datasetVersion ?? "latest"}`}
          scope={{
            ...scope,
            bankVersion: criteria.bankVersion ?? scope.bankVersion,
          }}
          criteria={criteria}
        />
      )}
    </SimulationLearningBoundary>
  );
}
function BoundReview({
  scope,
  criteria,
}: {
  scope: SimulationScope;
  criteria: ReviewNeededQuery;
}) {
  const router = useRouter(),
    client = useQueryClient(),
    select = useSimulationNavigation((s) => s.select);
  const { state, query, source } = useSimulationReview(scope, criteria);
  const canLearn = useSimulationCanLearn();
  const redirected = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);
  const data = state.status === "ready" ? state.data : null;
  const canonicalPage = data
    ? data.page !== criteria.page
      ? data.page
      : data.totalPages === 0 && criteria.page > 0
        ? 0
        : data.totalPages > 0 && criteria.page >= data.totalPages
          ? data.totalPages - 1
          : null
    : null;
  const changed =
    query.error instanceof ApiError &&
    query.error.status === 409 &&
    query.error.errorCode === "SIMULATION_REVIEW_CHANGED" &&
    !!(criteria.datasetVersion || criteria.page);
  useEffect(() => {
    if ((canonicalPage !== null || changed) && !redirected.current) {
      redirected.current = true;
      router.replace(
        reviewNeededUrl({
          ...criteria,
          bankVersion: data?.scope.bankVersion ?? scope.bankVersion,
          page: changed ? 0 : canonicalPage!,
          datasetVersion: undefined,
        }),
        {
          scroll: false,
        },
      );
    }
  }, [
    canonicalPage,
    changed,
    criteria,
    data?.scope.bankVersion,
    scope.bankVersion,
    router,
  ]);
  const bookmark = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      if (!source?.bookmark || !canLearn)
        throw new Error("Tài khoản không có quyền đánh dấu.");
      const ack = await source.bookmark(
        { ...scope, bankVersion: data?.scope.bankVersion ?? scope.bankVersion },
        id,
        value,
      );
      if (ack.scenarioId !== id || ack.bookmarked !== value)
        throw new Error("Backend chưa xác nhận trạng thái đánh dấu.");
      return ack;
    },
    onSuccess: () => {
      setNotice(null);
      void invalidateSimulationLists(client, {
        ...scope,
        bankVersion: data?.scope.bankVersion ?? scope.bankVersion,
      });
    },
    onError: () =>
      setNotice(
        "Không thể thay đổi đánh dấu. Trạng thái hiện tại được giữ nguyên; vui lòng thử lại.",
      ),
  });
  return (
    <SimulationReviewNeededView
      criteria={criteria}
      state={canonicalPage !== null || changed ? { status: "loading" } : state}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      onBack={() => {
        select(scope.licenseClass, "simulation");
        router.push("/practice");
      }}
      onStartChapters={() => router.push(simulationRoutes.chapters)}
      onChapter={(chapterId) =>
        router.push(
          reviewNeededUrl({
            ...criteria,
            chapterId,
            page: 0,
            bankVersion: data?.scope.bankVersion ?? scope.bankVersion,
            datasetVersion: undefined,
          }),
        )
      }
      onPage={(page) =>
        router.push(
          reviewNeededUrl({
            ...criteria,
            page,
            bankVersion: data?.scope.bankVersion ?? scope.bankVersion,
            datasetVersion: data?.datasetVersion,
          }),
        )
      }
      onRetry={() => void query.refetch()}
      onOpen={
        canLearn
          ? (item) =>
              router.push(
                simulationRoutes.scenario(
                  item.id,
                  item.chapterId,
                  "ALL",
                  0,
                  undefined,
                  {
                    origin: "review-needed",
                    ...criteria,
                    bankVersion: data?.scope.bankVersion ?? scope.bankVersion,
                    datasetVersion: undefined,
                  },
                ),
              )
          : undefined
      }
      onBookmark={
        source?.bookmark && canLearn
          ? (item) =>
              bookmark.mutate({ id: item.id, value: !item.isBookmarked })
          : undefined
      }
      bookmarkPendingId={bookmark.isPending ? bookmark.variables?.id : null}
    />
  );
}
