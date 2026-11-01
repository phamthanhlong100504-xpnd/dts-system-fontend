"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import { useSimulationBookmarks } from "../use-simulation-bookmarks";
import { simulationLearningKeys } from "../use-simulation-learning";
import {
  simulationRoutes,
  useSimulationNavigation,
} from "../simulation-navigation-store";
import { bookmarksUrl } from "../simulation-bookmarks-navigation";
import type { BookmarksQuery } from "../simulation-bookmarks-types";
import type { SimulationScope } from "../simulation-learning-types";
import { SimulationBookmarksView } from "./simulation-bookmarks-view";
export function SimulationBookmarksPage({
  criteria,
}: {
  criteria: BookmarksQuery;
}) {
  return (
    <SimulationLearningBoundary>
      {(scope) => (
        <BoundBookmarks
          key={`${scope.userId}:${scope.licenseClass}:${criteria.chapterId}:${criteria.page}`}
          scope={scope}
          criteria={criteria}
        />
      )}
    </SimulationLearningBoundary>
  );
}
function BoundBookmarks({
  scope,
  criteria,
}: {
  scope: SimulationScope;
  criteria: BookmarksQuery;
}) {
  const router = useRouter(),
    client = useQueryClient(),
    select = useSimulationNavigation((s) => s.select);
  const { state, query, source } = useSimulationBookmarks(scope, criteria);
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
      router.replace(bookmarksUrl({ ...criteria, page: canonicalPage }), {
        scroll: false,
      });
  }, [canonicalPage, criteria, router]);
  const bookmarkLock = useRef(false);
  const bookmark = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      if (!source?.bookmark) throw new Error("Chưa có API đánh dấu.");
      const ack = await source.bookmark(scope, id, value);
      if (ack.scenarioId !== id || ack.bookmarked !== value)
        throw new Error("Backend chưa xác nhận trạng thái đánh dấu.");
      return ack;
    },
    onSuccess: async () => {
      setNotice(null);
      await client.invalidateQueries({
        queryKey: simulationLearningKeys.scope(scope),
      });
    },
    onError: () =>
      setNotice(
        "Không thể bỏ đánh dấu. Tình huống và tổng số được giữ nguyên; vui lòng thử lại.",
      ),
    onSettled: () => {
      bookmarkLock.current = false;
    },
  });
  return (
    <SimulationBookmarksView
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
        router.push(bookmarksUrl({ ...criteria, chapterId, page: 0 }))
      }
      onPage={(page) => router.push(bookmarksUrl({ ...criteria, page }))}
      onRetry={() => void query.refetch()}
      onOpen={(item) =>
        router.push(
          simulationRoutes.scenario(
            item.id,
            item.chapterId,
            "ALL",
            0,
            undefined,
            { origin: "bookmarks", ...criteria },
          ),
        )
      }
      onBookmark={
        source?.bookmark && !bookmark.isPending
          ? (item) => {
              if (bookmarkLock.current) return;
              bookmarkLock.current = true;
              bookmark.mutate({ id: item.id, value: false });
            }
          : undefined
      }
      bookmarkPendingId={bookmark.isPending ? bookmark.variables?.id : null}
    />
  );
}
