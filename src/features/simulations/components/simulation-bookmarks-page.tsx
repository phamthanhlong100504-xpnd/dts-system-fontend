"use client";
import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/api/envelope";
import { useSimulationCanLearn } from "../simulation-access";
import { invalidateSimulationLists } from "../simulation-cache";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import { useSimulationBookmarks } from "../use-simulation-bookmarks";
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
    query.error.errorCode === "SIMULATION_BOOKMARKS_CHANGED" &&
    !!(criteria.datasetVersion || criteria.page);
  useEffect(() => {
    if ((canonicalPage !== null || changed) && !redirected.current) {
      redirected.current = true;
      router.replace(
        bookmarksUrl({
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
  const bookmarkLock = useRef(false);
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
    onSettled: () => {
      bookmarkLock.current = false;
    },
    onError: () =>
      setNotice(
        "Không thể bỏ đánh dấu. Tình huống và tổng số được giữ nguyên; vui lòng thử lại.",
      ),
  });
  return (
    <SimulationBookmarksView
      criteria={criteria}
      state={canonicalPage !== null || changed ? { status: "loading" } : state}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      onRetryBookmark={
        notice && bookmark.variables && canLearn && !bookmark.isPending
          ? () => {
              if (bookmarkLock.current) return;
              bookmarkLock.current = true;
              bookmark.mutate(bookmark.variables!);
            }
          : undefined
      }
      onBack={() => {
        select(scope.licenseClass, "simulation");
        router.push("/practice");
      }}
      onStartChapters={() => router.push(simulationRoutes.chapters)}
      onChapter={(chapterId) =>
        router.push(
          bookmarksUrl({
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
          bookmarksUrl({
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
                    origin: "bookmarks",
                    ...criteria,
                    bankVersion: data?.scope.bankVersion ?? scope.bankVersion,
                    datasetVersion: undefined,
                  },
                ),
              )
          : undefined
      }
      onBookmark={
        source?.bookmark && canLearn && !bookmark.isPending
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
