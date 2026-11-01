"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import { useSimulationReview } from "../use-simulation-review";
import { simulationLearningKeys } from "../use-simulation-learning";
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
          key={`${scope.userId}:${scope.licenseClass}:${criteria.chapterId}:${criteria.page}`}
          scope={scope}
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
  const [notice, setNotice] = useState<string | null>(null);
  const data = state.status === "ready" ? state.data : null;
  const canonicalPage = data
    ? data.page !== criteria.page
      ? data.page
      : data.totalPages > 0 && criteria.page >= data.totalPages
        ? data.totalPages - 1
        : null
    : null;
  useEffect(() => {
    if (canonicalPage !== null)
      router.replace(reviewNeededUrl({ ...criteria, page: canonicalPage }), {
        scroll: false,
      });
  }, [canonicalPage, criteria, router]);
  const bookmark = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      if (!source?.bookmark) throw new Error("Chưa có API đánh dấu.");
      const ack = await source.bookmark(scope, id, value);
      if (ack.scenarioId !== id || ack.bookmarked !== value)
        throw new Error("Backend chưa xác nhận trạng thái đánh dấu.");
      return ack;
    },
    onSuccess: () => {
      setNotice(null);
      void client.invalidateQueries({
        queryKey: simulationLearningKeys.scope(scope),
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
      state={canonicalPage !== null ? { status: "loading" } : state}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      onBack={() => {
        select(scope.licenseClass, "simulation");
        router.push("/practice");
      }}
      onStartChapters={() => router.push(simulationRoutes.chapters)}
      onChapter={(chapterId) =>
        router.push(reviewNeededUrl({ ...criteria, chapterId, page: 0 }))
      }
      onPage={(page) => router.push(reviewNeededUrl({ ...criteria, page }))}
      onRetry={() => void query.refetch()}
      onOpen={(item) =>
        router.push(
          simulationRoutes.scenario(
            item.id,
            item.chapterId,
            "ALL",
            0,
            undefined,
            { origin: "review-needed", ...criteria },
          ),
        )
      }
      onBookmark={
        source?.bookmark
          ? (item) =>
              bookmark.mutate({ id: item.id, value: !item.isBookmarked })
          : undefined
      }
      bookmarkPendingId={bookmark.isPending ? bookmark.variables?.id : null}
    />
  );
}
