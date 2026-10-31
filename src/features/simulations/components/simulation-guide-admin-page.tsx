"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequireAdmin } from "@/components/require-admin";
import { useAuthStore } from "@/stores/auth-store";
import { SimulationGuideError } from "../simulation-guide-types";
import type {
  GuideAdminSnapshot,
  GuideContent,
  GuideSaveRequest,
  SimulationGuideSource,
} from "../simulation-guide-types";
import {
  guideEditableContent,
  guideDraftNeedsPublication,
  guidePublishErrors,
  validateGuideAdmin,
} from "../simulation-guide-validation";
import { updateGuideText } from "../simulation-guide-fields";
import {
  simulationGuideKeys,
  useSimulationGuideAdmin,
  useSimulationGuideHistory,
} from "../use-simulation-guide";
import { SimulationGuideAdminView } from "./simulation-guide-admin-view";
import type { GuideAdminTab } from "./simulation-guide-admin-view";
import { BookOpen } from "lucide-react";
import { LearningNotice } from "./learning-ui";
export function SimulationGuideAdminPage() {
  return (
    <RequireAdmin>
      <AdminIdentity />
    </RequireAdmin>
  );
}
function AdminIdentity() {
  const actorId = useAuthStore((s) => s.user?.id);
  return typeof actorId === "string" && actorId ? (
    <AdminRead key={actorId} actorId={actorId} />
  ) : (
    <SimulationGuideAdminView
      state={{
        status: "error",
        message: "Không thể xác nhận tài khoản quản trị.",
      }}
    />
  );
}
function AdminRead({ actorId }: { actorId: string }) {
  const { state, query, source } = useSimulationGuideAdmin(actorId);
  // Keep a mounted editor and its unsaved content even when a background/manual refetch fails.
  if (query.data && source?.admin)
    return (
      <GuideWorkspace
        key={actorId}
        initial={query.data}
        actorId={actorId}
        source={source}
        reload={async () => {
          const result = await query.refetch({ throwOnError: true });
          if (!result.data) throw new Error("Không thể tải lại nội dung.");
          return result.data;
        }}
      />
    );
  if (state.status === "unavailable") {
    return <div className="font-sans mx-auto w-full max-w-[1320px] space-y-[1cm] text-foreground">
      <header className="flex items-start justify-between gap-4 rounded-[18px] border border-[#e3e5ec] bg-card p-6 shadow-sm">
        <div><h1 className="text-2xl font-bold tracking-tight text-foreground">Hướng dẫn mô phỏng</h1><p className="mt-2 text-[14.5px]/5 text-muted-foreground">Biên tập, xem trước và công bố nội dung hướng dẫn cho học viên.</p></div>
        <span className="hidden rounded-[12px] bg-primary/10 p-3 text-primary sm:block"><BookOpen className="size-6" /></span>
      </header>
      <LearningNotice kind="unavailable" message="Chức năng biên tập hướng dẫn hiện chưa khả dụng. Vui lòng thử lại sau." />
    </div>;
  }
  return (
    <SimulationGuideAdminView
      state={
        state.status === "ready"
          ? { status: "error", message: "Không thể khởi tạo phiên biên tập." }
          : state
      }
      actions={{ retry: () => void query.refetch() }}
    />
  );
}
function GuideWorkspace({
  initial,
  actorId,
  source,
  reload,
}: {
  initial: GuideAdminSnapshot;
  actorId: string;
  source: SimulationGuideSource;
  reload: () => Promise<GuideAdminSnapshot>;
}) {
  const router = useRouter(),
    client = useQueryClient();
  const [snapshot, setSnapshot] = useState(initial),
    [content, setContent] = useState<GuideContent>(() =>
      structuredClone(guideEditableContent(initial)),
    );
  const [tab, setTab] = useState<GuideAdminTab>("edit"),
    [section, setSection] = useState("Tổng quan"),
    [previewPublished, setPreviewPublished] = useState(false);
  const [notice, setNotice] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null),
    [conflict, setConflict] = useState(false),
    [writeBlocked, setWriteBlocked] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | "reload" | null>(null),
    [publishOpen, setPublishOpen] = useState(false),
    [leaveTarget, setLeaveTarget] = useState<{ run: () => void } | null>(null);
  const lock = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const dirty =
    JSON.stringify(content) !== JSON.stringify(guideEditableContent(snapshot));
  const validationErrors = guidePublishErrors(content);
  const history = useSimulationGuideHistory(actorId, tab === "history");
  const mutation = useMutation({
    mutationFn: async (input: {
      kind: "save" | "publish";
      revision: number;
      content: GuideContent;
      published: GuideAdminSnapshot["published"];
    }) => {
      let next: GuideAdminSnapshot;
      if (input.kind === "save") {
        if (!source.saveDraft) throw new Error("Chức năng lưu nháp hiện chưa khả dụng.");
        const request: GuideSaveRequest = {
          expectedRevision: input.revision,
          schemaVersion: 1,
          content: input.content,
        };
        next = await source.saveDraft(actorId, request);
        validateGuideAdmin(next, actorId);
        if (
          next.revision <= input.revision ||
          !next.draft ||
          JSON.stringify(next.draft.content) !==
          JSON.stringify(input.content) ||
          JSON.stringify(next.published) !== JSON.stringify(input.published)
        )
          throw new Error(
            "Chưa xác nhận được bản nháp hoặc bản công bố đã thay đổi. Hãy tải lại để đối chiếu.",
          );
      } else {
        if (!source.publish) throw new Error("Chức năng công bố hiện chưa khả dụng.");
        next = await source.publish(actorId, {
          expectedRevision: input.revision,
        });
        validateGuideAdmin(next, actorId);
        if (
          !next.published ||
          next.published.revision < input.revision ||
          JSON.stringify(next.published.content) !==
          JSON.stringify(input.content)
        )
          throw new Error(
            "Chưa xác nhận được đúng nội dung vừa công bố. Hãy tải lại để đối chiếu.",
          );
      }
      return next;
    },
    onSuccess: (next, input) => {
      client.setQueryData(simulationGuideKeys.admin(actorId), next);
      void client.invalidateQueries({
        queryKey: ["simulation-guide", "history"],
      });
      if (input.kind === "publish")
        void client.invalidateQueries({
          queryKey: ["simulation-guide", "current"],
        });
      if (mounted.current) {
        setSnapshot(next);
        setContent(structuredClone(guideEditableContent(next)));
        setError(null);
        setConflict(false);
        setWriteBlocked(false);
        setPublishOpen(false);
        setNotice(
          input.kind === "save"
            ? "Đã lưu bản nháp. Nội dung học viên đang đọc giữ nguyên."
            : "Đã công bố hướng dẫn. Học viên nhận nội dung mới khi tải lại trang.",
        );
      }
    },
    onError: (err) => {
      if (!mounted.current) return;
      setPublishOpen(false);
      setNotice(null);
      setError(
        err instanceof Error
          ? err.message
          : "Thao tác chưa được xác nhận, nội dung đang nhập được giữ nguyên.",
      );
      const code = err instanceof SimulationGuideError ? err.code : null;
      setConflict(code === "CONFLICT");
      setWriteBlocked(
        code === "CONFLICT" || code === "FORBIDDEN" || code === "UNAUTHORIZED",
      );
    },
    onSettled: () => {
      lock.current = false;
      if (mounted.current) setBusy(null);
    },
  });
  function submit(kind: "save" | "publish") {
    if (
      lock.current ||
      writeBlocked ||
      (kind === "publish" &&
        (dirty ||
          !guideDraftNeedsPublication(snapshot) ||
          validationErrors.length > 0))
    )
      return;
    lock.current = true;
    setBusy(kind);
    setNotice(null);
    setError(null);
    mutation.mutate({
      kind,
      revision: snapshot.revision,
      content: structuredClone(content),
      published: structuredClone(snapshot.published),
    });
  }
  async function reloadNow() {
    if (lock.current) return;
    lock.current = true;
    setBusy("reload");
    setNotice(null);
    try {
      const next = await reload();
      validateGuideAdmin(next, actorId);
      if (mounted.current) {
        setSnapshot(next);
        setContent(structuredClone(guideEditableContent(next)));
        setError(null);
        setConflict(false);
        setWriteBlocked(false);
        setPublishOpen(false);
      }
    } catch (err) {
      if (mounted.current)
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải lại nội dung, các thay đổi đang nhập được giữ nguyên.",
        );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(null);
    }
  }
  useEffect(() => {
    if (!dirty && !busy) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const click = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      )
        return;
      const a =
        e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (
        !(a instanceof HTMLAnchorElement) ||
        a.target === "_blank" ||
        a.hasAttribute("download")
      )
        return;
      const url = new URL(a.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.href === window.location.href
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setLeaveTarget({
        run: () => router.push(url.pathname + url.search + url.hash),
      });
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, busy, router]);
  return (
    <SimulationGuideAdminView
      state={{
        status: "ready",
        data: {
          snapshot,
          content,
          dirty,
          tab,
          section,
          previewPublished,
          busy,
          notice,
          error,
          conflict,
          writeBlocked,
          publishOpen,
          leaveOpen: !!leaveTarget,
          validationErrors,
          history: history.state,
        },
      }}
      actions={{
        change: (path, value) => {
          if (lock.current) return;
          setContent((prev) => updateGuideText(prev, path, value));
          setNotice(null);
          if (!writeBlocked) setError(null);
        },
        tab: setTab,
        section: setSection,
        previewPublished: setPreviewPublished,
        save: source.saveDraft ? () => submit("save") : undefined,
        askPublish: source.publish
          ? () => {
            if (
              !lock.current &&
              !dirty &&
              guideDraftNeedsPublication(snapshot) &&
              validationErrors.length === 0 &&
              !writeBlocked
            )
              setPublishOpen(true);
          }
          : undefined,
        confirmPublish: () => submit("publish"),
        cancelPublish: () => setPublishOpen(false),
        reload: () => {
          if (lock.current) return;
          if (dirty) setLeaveTarget({ run: () => void reloadNow() });
          else void reloadNow();
        },
        historyRetry: () => void history.query.refetch(),
        cancelLeave: () => setLeaveTarget(null),
        confirmLeave: () => {
          if (lock.current) return;
          const target = leaveTarget;
          setLeaveTarget(null);
          target?.run();
        },
      }}
    />
  );
}
