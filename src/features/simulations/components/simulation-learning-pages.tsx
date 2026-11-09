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
  SimulationScenarioPage,
  SimulationScope,
} from "../simulation-learning-types";
import type { SimulationListReturnContext } from "../simulation-review-types";
import { bookmarksUrl } from "../simulation-bookmarks-navigation";
import { reviewNeededUrl } from "../simulation-review-navigation";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
import { useSimulationCanLearn } from "../simulation-access";
import { invalidateSimulationLists } from "../simulation-cache";
import { createSimulationCommandQueue } from "../simulation-command-queue";
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
  readOnly = false,
}: {
  readOnly?: boolean;
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
  if (
    catalog.license.simulationEnabled !== true ||
    (!readOnly &&
      (catalog.license.simulationReady !== true ||
        !catalog.license.simulationBankVersion))
  )
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
  return children({
    userId,
    licenseClass: licenseCode,
    bankVersion: catalog.license.simulationBankVersion ?? undefined,
  });
}
function Guarded({
  children,
  readOnly = false,
}: {
  readOnly?: boolean;
  children: (scope: SimulationScope) => ReactNode;
}) {
  return (
    <RequireAuth>
      <LearningGate readOnly={readOnly}>{children}</LearningGate>
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
  const canLearn = useSimulationCanLearn();
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
      if (!source?.bookmark || !canLearn)
        throw new Error("Chức năng đánh dấu chưa sẵn sàng.");
      const ack = await source.bookmark(scope, id, value);
      if (ack.scenarioId !== id || ack.bookmarked !== value)
        throw new Error("Chưa xác nhận được trạng thái đánh dấu.");
      return ack;
    },
    onSuccess: () => {
      setNotice(null);
      void invalidateSimulationLists(client, scope);
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
  const cursorLock = useRef(false);
  const cursorEvents = useRef(new Map<string, string>());
  async function go(id: string) {
    if (!data || cursorLock.current) return;
    cursorLock.current = true;
    try {
      if (source?.cursor) {
        const revision = data.cursor?.revision ?? 0;
        const identity = `${id}:${revision}`;
        const event = cursorEvents.current.get(identity) ?? crypto.randomUUID();
        cursorEvents.current.set(identity, event);
        await source.cursor(
          { ...scope, bankVersion: data.scope.bankVersion },
          chapterId,
          id,
          revision,
          event,
        );
      }
      router.push(simulationRoutes.scenario(id, chapterId, filter, page));
    } catch {
      setNotice(
        "Chưa xác nhận vị trí tiếp tục. Hãy tải lại danh sách rồi thử lại.",
      );
      void query.refetch();
    } finally {
      cursorLock.current = false;
    }
  }
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
        onOpen={canLearn ? (item) => void go(item.id) : undefined}
        onStudyAll={
          canLearn && data?.startScenarioId
            ? () => void go(data.startScenarioId!)
            : undefined
        }
        onPage={setPage}
        onRetry={() => void query.refetch()}
        onBookmark={
          source?.bookmark && canLearn
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
          key={`${scope.userId}:${scope.licenseClass}:${reviewContext?.bankVersion ?? scope.bankVersion}:${scenarioId}:${attemptId ?? "new"}`}
          scope={
            reviewContext?.bankVersion
              ? { ...scope, bankVersion: reviewContext.bankVersion }
              : scope
          }
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
  const canLearn = useSimulationCanLearn();
  const router = useRouter(),
    client = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null),
    [saveFailed, setSaveFailed] = useState(false);
  const [exitTarget, setExitTarget] = useState<{ run: () => void } | null>(
    null,
  );
  const ids = useRef(new Map<string, string>());
  const queue = useRef(createSimulationCommandQueue());
  const mounted = useRef(true);
  const snapshots = useRef<SimulationScenarioPage | null>(null);
  const prepared = useRef(false);
  const fixedCommands = useRef(new Map<string, SimulationCommand>());
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
    { gcTime: 0, refetchOnWindowFocus: false },
  );
  const data = state.status === "ready" ? state.data : null;
  const key = simulationLearningKeys.read(
    scope,
    "scenario",
    scenarioId,
    attemptId ?? "new",
    ...(reviewContext ? [reviewContext.origin] : []),
  );
  useEffect(() => {
    if (data) snapshots.current = data;
  }, [data]);
  const command = useMutation({
    mutationFn: async (input: SimulationCommand) => {
      if (!source?.command) throw new Error("Lượt luyện chưa sẵn sàng.");
      await client.cancelQueries({ queryKey: key });
      const current = snapshots.current ?? data;
      const pinned = {
        ...scope,
        bankVersion: current?.scope.bankVersion ?? scope.bankVersion,
      };
      let value = await source.command(pinned, input);
      if (input.kind === "RECONCILE_RESULT" && value.phase !== "completed") {
        const pendingComplete = [...fixedCommands.current.values()]
          .reverse()
          .find(
            (command) =>
              command.kind === "COMPLETE" &&
              command.attemptId === input.attemptId,
          );
        if (pendingComplete)
          value = await source.command(pinned, pendingComplete);
      }
      validateSimulationScope(scope, value);
      validateScenarioSnapshot(value);
      if (
        input.attemptId &&
        input.kind !== "NEW_ATTEMPT" &&
        (value.attemptId !== input.attemptId ||
          value.scope.bankVersion !== current?.scope.bankVersion)
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
    onSuccess: (value, input) => {
      snapshots.current = value;
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
      if (!(input.kind === "RENEW_PLAYBACK" && value.readOnly))
        void invalidateSimulationLists(client, {
          ...scope,
          bankVersion: value.scope.bankVersion,
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
  function run(
    kind: SimulationCommand["kind"],
    mediaTimeMs?: number,
    eventId?: string,
    reason?: SimulationCommand["reason"],
  ): Promise<void> {
    if (!canLearn && !["RENEW_PLAYBACK", "RECONCILE_RESULT"].includes(kind))
      return Promise.reject(
        new Error("Tài khoản không có quyền luyện mô phỏng."),
      );
    const current = snapshots.current ?? data;
    if (!current) return Promise.reject(new Error("Nội dung chưa sẵn sàng."));
    if (kind === "HEARTBEAT" && queue.current.pending) return Promise.resolve();
    const identity = `${current.attemptId ?? scenarioId}:${kind}`;
    let id = eventId ?? ids.current.get(identity);
    if (!id) {
      id = crypto.randomUUID();
      ids.current.set(identity, id);
    }
    // Keep initial create id in the URL until its ACK, including reload/lost ACK.
    if (kind === "NEW_ATTEMPT" && !eventId && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const existing = url.searchParams.get("createEvent");
      if (existing && /^[0-9a-f-]{36}$/i.test(existing)) id = existing;
      else {
        url.searchParams.set("createEvent", id);
      }
      url.searchParams.delete("attempt");
      window.history.replaceState(null, "", url);
    }
    const token = `${identity}:${id}`;
    let input = fixedCommands.current.get(token);
    if (!input) {
      input = {
        kind,
        scenarioId,
        attemptId: current.attemptId,
        playbackEventId: current.playbackEventId,
        eventId: id,
        mediaTimeMs,
        reason,
      };
      fixedCommands.current.set(token, input);
    }
    const stable = input;
    return queue.current.enqueue(async () => {
      if (!mounted.current) throw new Error("Trang lượt luyện đã đóng.");
      await command.mutateAsync(stable);
      // Repeated lifecycle events are new actions after ACK; retries retain exact bodies.
      if (["START", "INTERRUPT", "RENEW_PLAYBACK"].includes(kind))
        ids.current.delete(identity);
      if (kind === "RENEW_PLAYBACK") {
        ids.current.delete(`${current.attemptId}:START`);
        ids.current.delete(`${current.attemptId}:INTERRUPT`);
      }
    });
  }
  useEffect(() => {
    if (
      !data ||
      data.attemptId ||
      prepared.current ||
      !source?.command ||
      !canLearn
    )
      return;
    prepared.current = true;
    snapshots.current = data;
    void run("NEW_ATTEMPT").catch(() => {
      /* Existing error modal; retry preserves create event. */
    });
    // Deliberate mutation after a successful read, never inside a query/refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, source, canLearn]);
  const bookmark = useMutation({
    mutationFn: async () => {
      if (!data || !source?.bookmark || !canLearn)
        throw new Error("Chức năng đánh dấu chưa sẵn sàng.");
      const ack = await source.bookmark(
        { ...scope, bankVersion: data.scope.bankVersion },
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
    onSuccess: (ack) => {
      setNotice(null);
      const current = snapshots.current;
      if (current) {
        const value = {
          ...current,
          scenario: { ...current.scenario, isBookmarked: ack.bookmarked },
        };
        snapshots.current = value;
        client.setQueryData(key, value);
      }
      void invalidateSimulationLists(client, {
        ...scope,
        bankVersion: snapshots.current?.scope.bankVersion ?? scope.bankVersion,
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
    command.isPending || (!!data?.attemptId && data.phase !== "completed");
  function navigate(action: () => void) {
    if (active) setExitTarget({ run: action });
    else action();
  }
  useEffect(() => {
    if (!active) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      void run("INTERRUPT", undefined, undefined, "PAGE_EXIT").catch(() => {});
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
    // run reads the latest server snapshot and uses the attempt command queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    bookmark:
      source?.bookmark && canLearn ? () => bookmark.mutate() : undefined,
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
    actions.renewPlayback = () => run("RENEW_PLAYBACK");
    if (canLearn) {
      actions.newAttempt = () => run("NEW_ATTEMPT");
      if (data?.phase !== "completed") {
        actions.start = (time) => run("START", time);
        actions.refreshShortcuts = () =>
          run("REFRESH_SHORTCUTS", undefined, crypto.randomUUID());
        actions.skipIntro = (time) => run("SKIP_INTRO", time);
        actions.respond = (time, id) => run("RESPONSE", time, id);
        actions.complete = (time) => run("COMPLETE", time);
        actions.heartbeat = (time) =>
          run("HEARTBEAT", time, crypto.randomUUID());
        actions.interrupt = (reason) =>
          run("INTERRUPT", undefined, undefined, reason);
        actions.reconcileResult = () => run("RECONCILE_RESULT");
      }
    }
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
      onRetry={() => {
        if (data && !data.attemptId && canLearn)
          void run("NEW_ATTEMPT").catch(() => {});
        else void query.refetch();
      }}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      bookmarkPending={bookmark.isPending}
      exitOpen={!!exitTarget}
      onCancelExit={() => setExitTarget(null)}
      onConfirmExit={() => {
        const target = exitTarget;
        if (!target) return;
        void run("CANCEL")
          .then(() => {
            setExitTarget(null);
            target.run();
          })
          .catch(() => {});
      }}
    />
  );
}

export { Guarded as SimulationLearningBoundary };
