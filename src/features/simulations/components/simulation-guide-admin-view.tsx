"use client";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  FileClock,
  History,
  LoaderCircle,
  RefreshCw,
  Save,
  Send,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LearningLoadState } from "../simulation-learning-types";
import type {
  GuideAdminSnapshot,
  GuideContent,
  GuideHistory,
} from "../simulation-guide-types";
import { guideDraftNeedsPublication } from "../simulation-guide-validation";
import { guideTextFields } from "../simulation-guide-fields";
import { LearningNotice, LearningSkeleton } from "./learning-ui";
import { SimulationGuideContent } from "./simulation-guide-view";
const adminGuideStyles = {
  card: "rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
  heading: "text-2xl font-bold tracking-tight text-foreground",
  body: "text-[14.5px]/5 text-muted-foreground",
  primary: buttonVariants({ size: "lg" }),
  secondary: buttonVariants({ variant: "outline", size: "lg" }),
};
export type GuideAdminTab = "edit" | "preview" | "history";
export interface GuideAdminEditorState {
  snapshot: GuideAdminSnapshot;
  content: GuideContent;
  dirty: boolean;
  tab: GuideAdminTab;
  section: string;
  previewPublished: boolean;
  busy: "save" | "publish" | "reload" | null;
  notice: string | null;
  error: string | null;
  conflict: boolean;
  writeBlocked: boolean;
  publishOpen: boolean;
  leaveOpen: boolean;
  validationErrors: string[];
  history: LearningLoadState<GuideHistory>;
}
export interface GuideAdminActions {
  change?: (path: (string | number)[], value: string) => void;
  tab?: (tab: GuideAdminTab) => void;
  section?: (section: string) => void;
  previewPublished?: (value: boolean) => void;
  save?: () => void;
  askPublish?: () => void;
  confirmPublish?: () => void;
  cancelPublish?: () => void;
  reload?: () => void;
  retry?: () => void;
  historyRetry?: () => void;
  confirmLeave?: () => void;
  cancelLeave?: () => void;
}
export function guideDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
}
export function SimulationGuideAdminView({
  state,
  actions = {},
}: {
  state: LearningLoadState<GuideAdminEditorState>;
  actions?: GuideAdminActions;
}) {
  const model = state.status === "ready" ? state.data : null;
  return (
    <div className="font-sans mx-auto w-full max-w-[1320px] space-y-[1cm] text-foreground">
      <header className="flex items-start justify-between gap-4 rounded-[18px] border border-[#e3e5ec] bg-card p-6 shadow-sm">
        <div>
          <h1 className={adminGuideStyles.heading}>Hướng dẫn mô phỏng</h1>
          <p className={cn(adminGuideStyles.body, "mt-2")}>
            Biên tập, xem trước và công bố nội dung hướng dẫn cho học viên.
          </p>
        </div>
        <span className="hidden rounded-[12px] bg-primary/10 p-3 text-primary sm:block">
          <BookOpen className="size-6" />
        </span>
      </header>
      {!model ? (
        state.status === "loading" ? (
          <LearningSkeleton cards={2} />
        ) : (
          <LearningNotice
            kind={state.status === "error" ? "error" : "unavailable"}
            message={
              state.status === "error"
                ? state.message
                : "Quản trị nội dung hướng dẫn sẽ khả dụng khi backend được bàn giao."
            }
            onRetry={state.status === "error" ? actions.retry : undefined}
          />
        )
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <Summary
              title="Bản nháp"
              icon={FileClock}
              revision={model.snapshot.draft?.revision}
              date={model.snapshot.draft?.updatedAt}
              empty="Chưa có bản nháp"
            />
            <Summary
              title="Bản học viên đang đọc"
              icon={CheckCircle2}
              revision={model.snapshot.published?.revision}
              date={model.snapshot.published?.publishedAt ?? undefined}
              empty="Chưa có bản công bố"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[#dce2f7] bg-[#eef2ff] px-5 py-4 text-[14.5px] font-medium text-foreground">
            <BookOpen className="size-5 text-primary" />
            <strong>
              {model.snapshot.bank.chapterCount} chương ·{" "}
              {model.snapshot.bank.scenarioCount} tình huống
            </strong>
            <span>
              Số liệu lấy từ ngân hàng đang công bố, không chỉnh sửa tại đây.
            </span>
          </div>
          {model.notice && (
            <p
              role="status"
              className="rounded-[12px] border border-[#abefc6] bg-[#ecfdf3] p-4 text-[14.5px] font-medium leading-6 text-[#027a48]"
            >
              {model.notice}
            </p>
          )}
          {model.error && (
            <div
              role="alert"
              className="rounded-[12px] border border-[#fecdca] bg-[#fff5f4] p-4 text-[14.5px] font-medium leading-7 text-[#b42318]"
            >
              <p>{model.error}</p>
              {model.conflict && (
                <p className="mt-2">
                  Nội dung đang nhập được giữ nguyên. Đối chiếu hoặc sao chép
                  trước khi tải lại phiên bản mới.
                </p>
              )}
            </div>
          )}
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#e3e5ec] bg-card p-4 shadow-sm">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Quản trị hướng dẫn"
            >
              {(
                [
                  ["edit", "Biên tập", Save],
                  ["preview", "Xem trước", Eye],
                  ["history", "Lịch sử phiên bản", History],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  tabIndex={model.tab === key ? 0 : -1}
                  onKeyDown={(e) => {
                    const tabs: GuideAdminTab[] = [
                      "edit",
                      "preview",
                      "history",
                    ];
                    const current = tabs.indexOf(key);
                    const next =
                      e.key === "ArrowRight"
                        ? (current + 1) % 3
                        : e.key === "ArrowLeft"
                          ? (current + 2) % 3
                          : e.key === "Home"
                            ? 0
                            : e.key === "End"
                              ? 2
                              : null;
                    if (next === null) return;
                    e.preventDefault();
                    actions.tab?.(tabs[next]);
                    const buttons =
                      e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                        '[role="tab"]',
                      );
                    buttons?.[next]?.focus();
                  }}
                  aria-selected={model.tab === key}
                  onClick={() => actions.tab?.(key)}
                  className={cn(
                    adminGuideStyles.secondary,
                    model.tab === key
                      ? "bg-primary text-primary-foreground hover:bg-primary/80"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 whitespace-nowrap text-[14.5px] font-medium text-muted-foreground">
                {model.dirty
                  ? "Có thay đổi chưa lưu"
                  : "Không có thay đổi chưa lưu"}
              </span>
              <button
                type="button"
                aria-label="Tải lại nội dung quản trị"
                disabled={!!model.busy || !actions.reload}
                onClick={actions.reload}
                className={adminGuideStyles.secondary}
              >
                <RefreshCw className="size-4" />
                Tải lại
              </button>
              <button
                type="button"
                disabled={
                  !!model.busy ||
                  model.writeBlocked ||
                  !actions.save ||
                  (!model.dirty && !!model.snapshot.draft)
                }
                onClick={actions.save}
                className={adminGuideStyles.secondary}
              >
                {model.busy === "save" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Lưu nháp
              </button>
              <button
                type="button"
                disabled={
                  !!model.busy ||
                  model.writeBlocked ||
                  !actions.askPublish ||
                  model.dirty ||
                  !guideDraftNeedsPublication(model.snapshot) ||
                  model.validationErrors.length > 0
                }
                onClick={actions.askPublish}
                className={adminGuideStyles.primary}
              >
                {model.busy === "publish" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Công bố
              </button>
            </div>
          </div>
          {model.validationErrors.length > 0 && (
            <details className="rounded-[12px] border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-[14.5px] leading-6 text-[#934d13]">
              <summary className="cursor-pointer font-semibold">
                Cần hoàn thiện {model.validationErrors.length} trường trước khi
                công bố
              </summary>
              <ul className="mt-2 list-inside list-disc">
                {model.validationErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </details>
          )}
          {model.tab === "edit" && (
            <GuideTextEditor model={model} actions={actions} />
          )}
          {model.tab === "preview" && (
            <section className="rounded-[18px] border border-[#e3e5ec] bg-[#f8f8fc] p-5 sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#fedf89] bg-[#fffaeb] p-4">
                <p className="text-[14.5px] font-semibold text-[#934d13]">
                  {model.previewPublished
                    ? "Xem trước bản đã công bố"
                    : "Xem trước nội dung đang biên tập · Chưa công bố"}
                </p>
                <label className="flex items-center gap-2 text-[14.5px] font-medium text-muted-foreground">
                  Nội dung
                  <select
                    aria-label="Bản xem trước"
                    value={model.previewPublished ? "published" : "working"}
                    onChange={(e) =>
                      actions.previewPublished?.(e.target.value === "published")
                    }
                    className="min-h-10 rounded-[8px] border border-input bg-card px-3 py-2"
                  >
                    <option value="working">Đang biên tập</option>
                    <option
                      value="published"
                      disabled={!model.snapshot.published}
                    >
                      Đã công bố
                    </option>
                  </select>
                </label>
              </div>
              <SimulationGuideContent
                content={
                  model.previewPublished && model.snapshot.published
                    ? model.snapshot.published.content
                    : model.content
                }
                bank={model.snapshot.bank}
              />
            </section>
          )}
          {model.tab === "history" && (
            <GuideHistoryView
              state={model.history}
              onRetry={actions.historyRetry}
            />
          )}

          <Dialog
            open={model.publishOpen}
            onOpenChange={(open) => {
              if (!open && !model.busy) actions.cancelPublish?.();
            }}
          >
            <DialogContent className="font-sans sm:max-w-[520px]">
              <DialogTitle>Công bố hướng dẫn mô phỏng?</DialogTitle>
              <DialogDescription>
                Phiên bản nháp {model.snapshot.draft?.revision} sẽ thay nội dung
                học viên đọc khi tải lại trang. Nội dung chỉ được công bố sau
                khi hệ thống xác nhận.
              </DialogDescription>
              <div className="mt-3 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={!!model.busy}
                  onClick={actions.cancelPublish}
                  className={adminGuideStyles.secondary}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={
                    !!model.busy ||
                    !actions.confirmPublish ||
                    model.dirty ||
                    model.validationErrors.length > 0 ||
                    model.writeBlocked
                  }
                  onClick={actions.confirmPublish}
                  className={adminGuideStyles.primary}
                >
                  Xác nhận công bố
                </button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={model.leaveOpen}
            onOpenChange={(open) => {
              if (!open) actions.cancelLeave?.();
            }}
          >
            <DialogContent className="font-sans sm:max-w-[520px]">
              <DialogTitle>Rời nội dung đang biên tập?</DialogTitle>
              <DialogDescription>
                Các thay đổi chưa lưu sẽ không được giữ khi rời trang hoặc tải
                lại bản mới. Bạn có thể quay lại để lưu nháp trước.
              </DialogDescription>
              <div className="mt-3 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={actions.cancelLeave}
                  className={adminGuideStyles.secondary}
                >
                  Tiếp tục biên tập
                </button>
                <button
                  type="button"
                  disabled={!!model.busy || !actions.confirmLeave}
                  onClick={actions.confirmLeave}
                  className={adminGuideStyles.primary}
                >
                  Tiếp tục rời trang
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
function GuideTextEditor({
  model,
  actions,
}: {
  model: GuideAdminEditorState;
  actions: GuideAdminActions;
}) {
  const fields = guideTextFields(model.content),
    groups = [...new Set(fields.map((f) => f.group))],
    active = groups.includes(model.section) ? model.section : groups[0];
  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav
        aria-label="Khu vực biên tập"
        className={cn(
          adminGuideStyles.card,
          "flex h-full flex-wrap content-start gap-2 self-stretch p-3 lg:flex-col",
        )}
      >
        {groups.map((group, n) => (
          <button
            type="button"
            key={group}
            aria-current={group === active ? "step" : undefined}
            onClick={() => actions.section?.(group)}
            className={cn(
              "rounded-[10px] px-4 py-3 text-left text-[14.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active === group
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {n + 1}. {group}
          </button>
        ))}
      </nav>
      <section className={cn(adminGuideStyles.card, "min-w-0 p-5 sm:p-6")}>
        <h2 className="text-lg font-semibold text-foreground">{active}</h2>
        <div className="mt-6 space-y-6">
          {fields
            .filter((f) => f.group === active)
            .map((field) => (
              <label
                key={JSON.stringify(field.path)}
                className="block text-[14.5px] font-medium text-foreground"
              >
                {field.label}
                {field.multiline ? (
                  <textarea
                    aria-label={field.label}
                    disabled={!!model.busy}
                    rows={3}
                    maxLength={12000}
                    value={field.value}
                    onChange={(e) =>
                      actions.change?.(field.path, e.target.value)
                    }
                    className="mt-2 block w-full resize-y rounded-[10px] border border-input bg-card px-4 py-3 text-[14.5px] font-medium leading-7 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-[#0758d9]/15 disabled:bg-muted"
                  />
                ) : (
                  <input
                    aria-label={field.label}
                    disabled={!!model.busy}
                    maxLength={12000}
                    value={field.value}
                    onChange={(e) =>
                      actions.change?.(field.path, e.target.value)
                    }
                    className="mt-2 block min-h-11 w-full rounded-[10px] border border-input bg-card px-4 py-2.5 text-[14.5px] font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-[#0758d9]/15 disabled:bg-muted"
                  />
                )}
              </label>
            ))}
        </div>
      </section>
    </div>
  );
}
function Summary({
  title,
  icon: Icon,
  revision,
  date,
  empty,
}: {
  title: string;
  icon: typeof BookOpen;
  revision?: number;
  date?: string;
  empty: string;
}) {
  return (
    <section
      className={cn(adminGuideStyles.card, "flex items-start gap-4 p-5")}
    >
      <span className="rounded-[10px] bg-primary/10 p-3 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className={cn(adminGuideStyles.body, "mt-2")}>
          {revision !== undefined ? `Phiên bản ${revision}` : empty}
        </p>
        {date && (
          <p className="mt-1 text-[14.5px] font-medium text-muted-foreground">
            {guideDate(date)}
          </p>
        )}
      </div>
    </section>
  );
}
export function GuideHistoryView({
  state,
  onRetry,
}: {
  state: LearningLoadState<GuideHistory>;
  onRetry?: () => void;
}) {
  if (state.status !== "ready")
    return state.status === "loading" ? (
      <LearningSkeleton cards={2} />
    ) : (
      <LearningNotice
        kind={state.status === "error" ? "error" : "unavailable"}
        message={
          state.status === "error"
            ? state.message
            : "Lịch sử phiên bản chưa sẵn sàng."
        }
        onRetry={state.status === "error" ? onRetry : undefined}
      />
    );
  return (
    <section className={cn(adminGuideStyles.card, "p-6")}>
      <h2 className="text-lg font-semibold text-foreground">
        Lịch sử phiên bản
      </h2>
      {state.data.versions.length === 0 ? (
        <p className={cn(adminGuideStyles.body, "mt-4")}>
          Chưa có phiên bản được lưu.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {state.data.versions.map((v) => (
            <li
              key={v.revision}
              className="flex flex-wrap items-start justify-between gap-4 rounded-[12px] border border-[#e3e5ec] p-4"
            >
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Phiên bản {v.revision} · {v.content.title}
                </h3>
                <p className={cn(adminGuideStyles.body, "mt-2")}>
                  {guideDate(v.updatedAt)} · {v.updatedBy}
                </p>
                {v.publishedAt && (
                  <p className="mt-1 text-[14.5px] font-medium text-muted-foreground">
                    Công bố: {guideDate(v.publishedAt)} · {v.publishedBy}
                  </p>
                )}
              </div>
              <details className="order-3 basis-full rounded-[10px] bg-[#f8f8fc] p-4">
                <summary className="cursor-pointer text-[14.5px] font-semibold text-primary">
                  Xem nội dung phiên bản
                </summary>
                <dl className="mt-4 space-y-4">
                  {guideTextFields(v.content).map((field) => (
                    <div key={JSON.stringify(field.path)}>
                      <dt className="text-[14.5px] font-medium text-foreground">
                        {field.group} · {field.label}
                      </dt>
                      <dd className="mt-1 whitespace-pre-line break-words text-[14.5px] font-medium leading-7 text-muted-foreground">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
              <span
                className={cn(
                  "whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[14.5px] font-semibold",
                  v.status === "PUBLISHED"
                    ? "bg-[#ecfdf3] text-[#027a48]"
                    : "bg-[#f2f4f9] text-muted-foreground",
                )}
              >
                {v.status === "DRAFT"
                  ? "Bản nháp"
                  : v.status === "PUBLISHED"
                    ? "Đang công bố"
                    : "Đã lưu trữ"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
