"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { useMe } from "@/features/auth/use-auth";
import { useLicenseByCode } from "@/features/license/use-license";
import { useAuthStore } from "@/stores/auth-store";
import { validateScenarioSnapshot } from "../simulation-learning-validation";
import {
  simulationLearningKeys,
  useSimulationRead,
  validateSimulationScope,
} from "../use-simulation-learning";
import {
  simulationRoutes,
  useSimulationNavigation,
} from "../simulation-navigation-store";
import type {
  LearningLoadState,
  ScenarioActions,
  ScenarioFilter,
  SimulationChapterPage,
  SimulationCommand,
  SimulationCommandKind,
  SimulationScenarioPage,
  SimulationScope,
} from "../simulation-learning-types";
import type { SimulationListReturnContext } from "../simulation-review-types";
import { bookmarksUrl } from "../simulation-bookmarks-navigation";
import { reviewNeededUrl } from "../simulation-review-navigation";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
import { SimulationChaptersView } from "./simulation-chapters-view";
import { SimulationChapterView } from "./simulation-chapter-view";
import { SimulationScenarioView } from "./simulation-scenario-view";
import {
  BackAction,
  LearningNotice,
  LearningShell,
  LearningSkeleton,
} from "./learning-ui";

function LearningGate({
  children,
}: {
  children: (scope: SimulationScope) => ReactNode;
}) {
  const router = useRouter();
  const me = useMe();
  const authUser = useAuthStore((s) => s.user);
  const value = me.data?.selectedLicenseClass;
  const licenseCode =
    typeof value === "string" ? value.trim().toUpperCase() : "";
  const catalog = useLicenseByCode(licenseCode);
  const userId = me.data?.id ?? authUser?.id;
  if (me.isPending || catalog.isLoading)
    return (
      <LearningShell>
        <LearningSkeleton />
      </LearningShell>
    );
  if (me.isError || catalog.isError)
    return (
      <LearningShell>
        <BackAction onClick={() => router.push("/practice")}>
          Quay lại Ôn luyện
        </BackAction>
        <LearningNotice
          kind="error"
          message="Không thể xác nhận tài khoản hoặc danh mục hạng GPLX."
          onRetry={() => {
            void me.refetch();
            void catalog.refetch();
          }}
        />
      </LearningShell>
    );
  if (!licenseCode || !catalog.license || !userId || typeof userId !== "string")
    return (
      <LearningShell>
        <LearningNotice
          kind="error"
          message="Hãy chọn hạng GPLX hợp lệ trước khi mở nội dung mô phỏng."
        />
      </LearningShell>
    );
  if (catalog.license.group !== "car" && catalog.license.group !== "trailer")
    return (
      <LearningShell>
        <BackAction onClick={() => router.push("/practice")}>
          Quay lại Ôn luyện
        </BackAction>
        <LearningNotice
          kind="unavailable"
          message="Nội dung mô phỏng chưa được mở cho hạng đang chọn."
        />
      </LearningShell>
    );
  if (authUser?.id && me.data?.id && authUser.id !== me.data.id)
    return (
      <LearningShell>
        <LearningNotice
          kind="error"
          message="Thông tin tài khoản đã thay đổi. Vui lòng đăng nhập lại."
        />
      </LearningShell>
    );
  return children({ userId, licenseClass: licenseCode });
}
function Guarded({
  children,
}: {
  children: (scope: SimulationScope) => ReactNode;
}) {
  return (
    <RequireAuth>
      <LearningGate>{children}</LearningGate>
    </RequireAuth>
  );
}
export function SimulationChaptersPage() {
  return (
    <Guarded>
      {(scope) => (
        <BoundChapters
          key={`${scope.userId}:${scope.licenseClass}`}
          scope={scope}
        />
      )}
    </Guarded>
  );
}
function BoundChapters({ scope }: { scope: SimulationScope }) {
  const router = useRouter(),
    select = useSimulationNavigation((s) => s.select);
  const { state, query } = useSimulationRead(scope, "overview", [], (source) =>
    source.overview(scope),
  );
  return (
    <SimulationChaptersView
      licenseClass={scope.licenseClass}
      state={state}
      onBack={() => {
        select(scope.licenseClass, "simulation");
        router.push("/practice");
      }}
      onRetry={() => void query.refetch()}
      onOpenChapter={(chapter) =>
        router.push(simulationRoutes.chapter(chapter.id))
      }
    />
  );
}
export function SimulationChapterPage({
  chapterId,
  initialFilter = "ALL",
  initialPage = 0,
}: {
  chapterId: string;
  initialFilter?: ScenarioFilter;
  initialPage?: number;
}) {
  return (
    <Guarded>
      {(scope) => (
        <BoundChapter
          key={`${scope.userId}:${scope.licenseClass}:${chapterId}`}
          scope={scope}
          chapterId={chapterId}
          initialFilter={initialFilter}
          initialPage={initialPage}
        />
      )}
    </Guarded>
  );
}
function BoundChapter({
  scope,
  chapterId,
  initialFilter,
  initialPage,
}: {
  scope: SimulationScope;
  chapterId: string;
  initialFilter: ScenarioFilter;
  initialPage: number;
}) {
  const router = useRouter(),
    client = useQueryClient();
  const [filter, setFilter] = useState(initialFilter),
    [page, setPage] = useState(initialPage),
    [notice, setNotice] = useState<string | null>(null);
  const { state, source, query } = useSimulationRead(
    scope,
    "chapter",
    [chapterId, filter, page],
    (s) => s.chapter(scope, chapterId, filter, page),
  );
  const bookmark = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      if (!source?.bookmark)
        throw new Error("Chức năng đánh dấu chưa sẵn sàng.");
      const ack = await source.bookmark(scope, id, value);
      if (ack.scenarioId !== id || ack.bookmarked !== value)
        throw new Error("Chưa xác nhận được trạng thái đánh dấu.");
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
  const data = state.status === "ready" ? state.data : null;
  const checked: LearningLoadState<SimulationChapterPage> =
    data && data.chapter.id !== chapterId
      ? {
          status: "error",
          message: "Dữ liệu chương không khớp nội dung được yêu cầu.",
        }
      : state;
  const go = (id: string) =>
    router.push(simulationRoutes.scenario(id, chapterId, filter, page));
  return (
    <>
      <SimulationFeedbackModal
        key={notice ?? "no-notice"}
        message={notice}
        onDismiss={() => setNotice(null)}
      />

      <SimulationChapterView
        state={checked}
        filter={filter}
        onBack={() => router.push(simulationRoutes.chapters)}
        onFilter={(value) => {
          setFilter(value);
          setPage(0);
        }}
        onOpen={(item) => go(item.id)}
        onStudyAll={
          data?.startScenarioId ? () => go(data.startScenarioId!) : undefined
        }
        onPage={setPage}
        onRetry={() => void query.refetch()}
        onBookmark={
          source?.bookmark
            ? (item) =>
                bookmark.mutate({ id: item.id, value: !item.isBookmarked })
            : undefined
        }
        bookmarkPendingId={bookmark.isPending ? bookmark.variables?.id : null}
      />
    </>
  );
}
export function SimulationScenarioPage({
  scenarioId,
  chapterId,
  filter = "ALL",
  page = 0,
  attemptId,
  reviewContext,
}: {
  scenarioId: string;
  chapterId?: string;
  filter?: ScenarioFilter;
  page?: number;
  attemptId?: string;
  reviewContext?: SimulationListReturnContext;
}) {
  return (
    <Guarded>
      {(scope) => (
        <BoundScenario
          key={`${scope.userId}:${scope.licenseClass}:${scenarioId}`}
          scope={scope}
          scenarioId={scenarioId}
          chapterId={chapterId}
          filter={filter}
          page={page}
          attemptId={attemptId}
          reviewContext={reviewContext}
        />
      )}
    </Guarded>
  );
}
function BoundScenario({
  scope,
  scenarioId,
  chapterId,
  filter,
  page,
  attemptId,
  reviewContext,
}: {
  scope: SimulationScope;
  scenarioId: string;
  chapterId?: string;
  filter: ScenarioFilter;
  page: number;
  attemptId?: string;
  reviewContext?: SimulationListReturnContext;
}) {
  const router = useRouter(),
    client = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null),
    [saveFailed, setSaveFailed] = useState(false);
  const [exitTarget, setExitTarget] = useState<{ run: () => void } | null>(
    null,
  );
  const ids = useRef(new Map<string, string>());
  const commandLock = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const { state, source, query } = useSimulationRead(
    scope,
    "scenario",
    [
      scenarioId,
      attemptId ?? "new",
      ...(reviewContext ? [reviewContext.origin] : []),
    ],
    async (s) => {
      const value = await s.scenario(
        scope,
        scenarioId,
        attemptId,
        reviewContext
          ? attemptId
            ? "RESTORE"
            : reviewContext.origin === "bookmarks"
              ? "BOOKMARK_NEW"
              : "REVIEW_NEW"
          : undefined,
      );
      if (
        reviewContext &&
        !attemptId &&
        (value.phase !== "ready" ||
          value.result !== null ||
          value.responseRecorded)
      )
        throw new Error(
          "Backend chưa cấp khung lượt ôn lại mới. Không sử dụng kết quả cũ để thay thế.",
        );
      if (attemptId && value.attemptId !== attemptId)
        throw new Error("Lượt luyện không khớp địa chỉ đang mở.");
      return value;
    },
    reviewContext && !attemptId
      ? { gcTime: 0, refetchOnWindowFocus: false }
      : undefined,
  );
  const data = state.status === "ready" ? state.data : null;
  const key = simulationLearningKeys.read(
    scope,
    "scenario",
    scenarioId,
    attemptId ?? "new",
    ...(reviewContext ? [reviewContext.origin] : []),
  );
  const command = useMutation({
    mutationFn: async (input: SimulationCommand) => {
      if (!source?.command) throw new Error("Lượt luyện chưa sẵn sàng.");
      await client.cancelQueries({ queryKey: key });
      const value = await source.command(scope, input);
      validateSimulationScope(scope, value);
      validateScenarioSnapshot(value);
      if (
        input.attemptId &&
        input.kind !== "NEW_ATTEMPT" &&
        (value.attemptId !== input.attemptId ||
          value.scope.bankVersion !== data?.scope.bankVersion)
      )
        throw new Error(
          "Phản hồi không thuộc đúng lượt luyện hoặc phiên bản đang mở.",
        );
      if (
        input.kind === "NEW_ATTEMPT" &&
        (!value.attemptId || value.attemptId === input.attemptId)
      )
        throw new Error("Chưa xác nhận được lượt luyện mới.");
      if (input.kind === "RESPONSE" && !value.responseRecorded)
        throw new Error("Phản ứng chưa được xác nhận.");
      if (
        (input.kind === "COMPLETE" || input.kind === "RECONCILE_RESULT") &&
        value.phase !== "completed"
      )
        throw new Error("Kết quả chưa được lưu.");
      if (value.scenario.id !== scenarioId)
        throw new Error("Phản hồi lượt luyện không khớp tình huống.");
      if (
        value.phase === "completed" &&
        (!value.result ||
          value.result.status !== "COMPLETED" ||
          value.result.attemptId !== value.attemptId)
      )
        throw new Error("Kết quả lượt luyện chưa được xác nhận.");
      return value;
    },
    onSuccess: (value) => {
      client.setQueryData(key, value);
      client.setQueryData(
        simulationLearningKeys.read(
          scope,
          "scenario",
          scenarioId,
          value.attemptId ?? "new",
          ...(reviewContext ? [reviewContext.origin] : []),
        ),
        value,
      );
      if (mounted.current) {
        setNotice(null);
        setSaveFailed(false);
        if (value.attemptId && value.attemptId !== attemptId)
          router.replace(
            simulationRoutes.scenario(
              scenarioId,
              value.scenario.chapterId,
              filter,
              page,
              value.attemptId,
              reviewContext,
            ),
            { scroll: false },
          );
      }
      void client.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "simulation-learning" &&
          q.queryKey[1] === scope.userId &&
          q.queryKey[2] === scope.licenseClass &&
          q.queryKey[3] !== "scenario",
      });
    },
    onError: (_error, input) => {
      setNotice(
        "Chưa xác nhận được thao tác. Vui lòng kiểm tra lại trạng thái lượt luyện.",
      );
      if (input.kind === "COMPLETE" || input.kind === "RECONCILE_RESULT")
        setSaveFailed(true);
    },
  });
  async function run(
    kind: SimulationCommandKind,
    mediaTimeMs?: number,
    eventId?: string,
  ) {
    if (!data || commandLock.current)
      throw new Error("Một thao tác đang được xử lý.");
    const identity = `${data.attemptId ?? scenarioId}:${kind}`;
    let id = eventId ?? ids.current.get(identity);
    if (!id) {
      id = crypto.randomUUID();
      ids.current.set(identity, id);
    }
    commandLock.current = true;
    try {
      await command.mutateAsync({
        kind,
        scenarioId,
        attemptId: data.attemptId,
        playbackEventId: data.playbackEventId,
        eventId: id,
        mediaTimeMs,
      });
    } finally {
      commandLock.current = false;
    }
  }
  const bookmark = useMutation({
    mutationFn: async () => {
      if (!data || !source?.bookmark)
        throw new Error("Chức năng đánh dấu chưa sẵn sàng.");
      const ack = await source.bookmark(
        scope,
        scenarioId,
        !data.scenario.isBookmarked,
      );
      if (
        ack.scenarioId !== scenarioId ||
        ack.bookmarked !== !data.scenario.isBookmarked
      )
        throw new Error("Chưa xác nhận thay đổi đánh dấu.");
      return ack;
    },
    onSuccess: () => {
      setNotice(null);
      void client.invalidateQueries({
        queryKey: simulationLearningKeys.scope(scope),
      });
    },
    onError: () =>
      setNotice("Không thể thay đổi đánh dấu. Trạng thái cũ được giữ nguyên."),
  });
  const pendingPhase = command.isPending
    ? command.variables?.kind === "RESPONSE"
      ? "response-pending"
      : command.variables?.kind === "START" ||
          command.variables?.kind === "NEW_ATTEMPT"
        ? "starting"
        : command.variables?.kind === "COMPLETE" ||
            command.variables?.kind === "RECONCILE_RESULT"
          ? "completing"
          : null
    : null;
  const shown: LearningLoadState<SimulationScenarioPage> = data
    ? {
        status: "ready",
        data: {
          ...data,
          phase: pendingPhase ?? (saveFailed ? "save-error" : data.phase),
          result: pendingPhase || saveFailed ? null : data.result,
        },
      }
    : state;
  const active =
    command.isPending ||
    (!!data && !["ready", "completed"].includes(data.phase));
  function navigate(action: () => void) {
    if (active) setExitTarget({ run: action });
    else action();
  }
  useEffect(() => {
    if (!active) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const link = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      )
        return;
      const anchor =
        e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.href === window.location.href
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setExitTarget({
        run: () => router.push(url.pathname + url.search + url.hash),
      });
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", link, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", link, true);
    };
  }, [active, router]);
  const listId = chapterId ?? data?.scenario.chapterId;
  const back = () =>
    navigate(() =>
      router.push(
        reviewContext
          ? reviewContext.origin === "bookmarks"
            ? bookmarksUrl(reviewContext)
            : reviewNeededUrl(reviewContext)
          : listId
            ? `${simulationRoutes.chapter(listId)}?filter=${filter}&page=${page}`
            : simulationRoutes.chapters,
      ),
    );
  const actions: ScenarioActions = {
    bookmark: source?.bookmark ? () => bookmark.mutate() : undefined,
    previous:
      !reviewContext && data?.previousScenarioId
        ? () =>
            navigate(() =>
              router.push(
                simulationRoutes.scenario(
                  data.previousScenarioId!,
                  data.scenario.chapterId,
                  filter,
                  page,
                ),
              ),
            )
        : undefined,
    next:
      !reviewContext && data?.phase === "completed" && data.nextScenarioId
        ? () =>
            router.push(
              simulationRoutes.scenario(
                data.nextScenarioId!,
                data.scenario.chapterId,
                filter,
                page,
              ),
            )
        : undefined,
  };
  if (source?.command) {
    actions.start = () => run("START");
    actions.respond = (time, id) => run("RESPONSE", time, id);
    actions.complete = () => run("COMPLETE");
    actions.renewPlayback = () => run("RENEW_PLAYBACK");
    actions.reconcileResult = () => run("RECONCILE_RESULT");
    actions.newAttempt = () => run("NEW_ATTEMPT");
  }
  return (
    <SimulationScenarioView
      returnLabel={
        reviewContext
          ? reviewContext.origin === "bookmarks"
            ? "Tình huống đã đánh dấu"
            : "Tình huống cần ôn lại"
          : undefined
      }
      state={shown}
      actions={actions}
      onBack={back}
      onRetry={() => void query.refetch()}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      bookmarkPending={bookmark.isPending}
      exitOpen={!!exitTarget}
      onCancelExit={() => setExitTarget(null)}
      onConfirmExit={() => {
        const target = exitTarget;
        setExitTarget(null);
        target?.run();
      }}
    />
  );
}

export { Guarded as SimulationLearningBoundary };
