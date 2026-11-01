"use client";

import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CircleAlert,
  FileQuestion,
  Flag,
  Layers3,
  Lightbulb,
  RotateCcw,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  SimulationHubAction,
  SimulationHubActions,
  SimulationHubState,
} from "../simulation-hub-types";

const unavailable: SimulationHubState = { status: "unavailable" };

/** Presentation only. No mock data, guessed endpoints or client-side grading. */
export function SimulationPracticeHub({
  state = unavailable,
  actions = {},
  onRetry,
}: {
  state?: SimulationHubState;
  actions?: SimulationHubActions;
  onRetry?: () => void;
}) {
  const data = state.status === "ready" ? state.summary : null;
  const loading = state.status === "loading";

  function actionProps(action: SimulationHubAction) {
    return {
      onClick: actions[action],
      disabled:
        !actions[action] ||
        (!data &&
          action !== "chapters" &&
          action !== "review" &&
          action !== "bookmarks" &&
          action !== "guide" &&
          action !== "random" &&
          action !== "presets"),
      title:
        !actions[action] ||
        (!data &&
          action !== "chapters" &&
          action !== "review" &&
          action !== "bookmarks" &&
          action !== "guide" &&
          action !== "random" &&
          action !== "presets")
          ? "Chức năng đang được chuẩn bị"
          : undefined,
    };
  }

  return (
    <div aria-busy={loading}>
      {state.status === "unavailable" && (
        <div className="mt-6 flex items-start gap-3 rounded-[12px] border border-[#e1e5ed] bg-white px-4 py-3">
          <Video
            className="mt-0.5 size-[18px] shrink-0 text-[#0758d9]"
            aria-hidden="true"
          />
          <div>
            <p className="text-[13.5px] font-semibold text-[#344054]">
              Nội dung mô phỏng đang được chuẩn bị
            </p>
            <p className="mt-1 text-[13px] font-medium leading-5 text-[#667085]">
              Các chức năng luyện tập và thi thử sẽ khả dụng khi nội dung được
              phát hành.
            </p>
          </div>
        </div>
      )}
      {state.status === "error" && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#fecdca] bg-[#fffbfa] px-4 py-3"
        >
          <CircleAlert
            className="size-[18px] shrink-0 text-[#d92d20]"
            aria-hidden="true"
          />
          <p className="flex-1 text-[13.5px] font-medium text-[#b42318]">
            {state.message}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-[8px] px-3 py-2 text-[13.5px] font-semibold text-[#b42318] outline-none focus-visible:ring-2 focus-visible:ring-[#d92d20]"
            >
              Thử lại
            </button>
          )}
        </div>
      )}
      {data?.resume && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-[16px] border border-[#e1e5ed] bg-white px-5 py-4">
          <FeatureIcon>
            <RotateCcw className="size-5" />
          </FeatureIcon>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.04em] text-[#0758d9]">
              Tiếp tục gần đây
            </p>
            <h2 className="mt-1 text-[15.5px] font-bold text-[#101828]">
              {data.resume.title}
            </h2>
            <p className="mt-1 text-[13.5px] font-medium text-[#475467]">
              {data.resume.description}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[12.5px] font-semibold text-[#344054]">
                {data.resume.completedScenarios}/{data.resume.totalScenarios}{" "}
                tình huống
              </span>
              <div
                role="progressbar"
                aria-label="Tiến độ bài mô phỏng đang dở"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={data.resume.completionPercent}
                className="h-1.5 w-32 overflow-hidden rounded-full bg-[#e5e9f7]"
              >
                <div
                  className="h-full rounded-full bg-[#0758d9]"
                  style={{ width: `${data.resume.completionPercent}%` }}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            {...actionProps("resume")}
            className={primaryButton}
          >
            Tiếp tục <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <HubSection title="Thi thử" accent="#0758d9" className="mt-7">
        <div className="grid gap-5 md:grid-cols-2">
          <article className={examCard}>
            <FeatureIcon>
              <FileQuestion className="size-5" />
            </FeatureIcon>
            <h3 className={examTitle}>Thi thử ngẫu nhiên</h3>
            <p className={description}>
              Tạo đề ngẫu nhiên từ ngân hàng tình huống mô phỏng giao thông.
            </p>
            <div className="mt-4 flex min-h-7 flex-wrap gap-2">
              {data ? (
                <>
                  <MetaChip>
                    <Video className="size-3.5" aria-hidden="true" />
                    {data.scenariosPerExam} tình huống
                  </MetaChip>
                  <MetaChip>
                    <Flag className="size-3.5" aria-hidden="true" />
                    {data.maxTotalScore} điểm tối đa
                  </MetaChip>
                </>
              ) : (
                <PendingMeta loading={loading} />
              )}
            </div>
            <div className="mt-auto flex justify-center pt-6">
              <button
                type="button"
                {...actionProps("random")}
                className={primaryButton}
              >
                Bắt đầu thi thử{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </article>
          <article className={examCard}>
            <FeatureIcon>
              <Layers3 className="size-5" />
            </FeatureIcon>
            <h3 className={examTitle}>Bộ đề có sẵn</h3>
            <p className={description}>
              Luyện tập với các bộ đề mô phỏng đã được chuẩn bị sẵn.
            </p>
            <div className="mt-4 flex min-h-7 flex-wrap gap-2">
              {data ? (
                <>
                  <MetaChip>{data.publishedPresetCount} bộ đề</MetaChip>
                  <MetaChip>
                    {data.completedPresetCount} bộ đã hoàn thành
                  </MetaChip>
                </>
              ) : (
                <PendingMeta loading={loading} />
              )}
            </div>
            <div className="mt-auto flex justify-center pt-6">
              <button
                type="button"
                {...actionProps("presets")}
                className={secondaryButton}
              >
                Xem bộ đề <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
      </HubSection>

      <HubSection title="Ôn tập" accent="#0758d9" className="mt-9">
        <div className="grid gap-5 md:grid-cols-3">
          <article className={studyCard}>
            <FeatureIcon>
              <BookOpen className="size-5" />
            </FeatureIcon>
            <h3 className={studyTitle}>Ôn theo chương</h3>
            <div className="mt-2 min-h-6">
              {data ? (
                <MetaChip>{data.chapterCount} chương</MetaChip>
              ) : (
                <PendingMeta loading={loading} />
              )}
            </div>
            <p className={description}>
              {data
                ? `Luyện tập ${data.totalScenarios} tình huống giao thông theo từng chương.`
                : "Luyện tập các tình huống giao thông theo từng chương."}
            </p>
            <button
              type="button"
              {...actionProps("chapters")}
              className={textButton}
            >
              Bắt đầu ôn <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </article>
          <article className={studyCard}>
            <FeatureIcon>
              <RotateCcw className="size-5" />
            </FeatureIcon>
            <h3 className={studyTitle}>Tình huống cần ôn lại</h3>
            {data ? (
              <div className="mt-2 rounded-[9px] bg-[#f5f6fc] px-3 py-2.5">
                <p className="text-[13px] font-semibold text-[#344054]">
                  {data.practicedScenarios === 0
                    ? "Bạn chưa có kết quả luyện tập."
                    : `${data.needReviewCount} tình huống cần ôn lại`}
                </p>
                <p className="mt-1 text-[12.5px] font-medium leading-5 text-[#667085]">
                  {data.practicedScenarios === 0
                    ? "Các tình huống cần ôn sẽ xuất hiện sau khi bạn luyện tập."
                    : "Luyện lại những tình huống chưa từng đạt điểm tối đa."}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-2 min-h-6">
                  <PendingMeta loading={loading} />
                </div>
                <p className={description}>
                  Ôn lại những tình huống bạn cần luyện tập thêm.
                </p>
              </>
            )}
            <button
              type="button"
              {...actionProps("review")}
              className={textButton}
            >
              Xem tình huống{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </article>
          <article className={studyCard}>
            <FeatureIcon>
              <Bookmark className="size-5" />
            </FeatureIcon>
            <h3 className={studyTitle}>Tình huống đã đánh dấu</h3>
            <div className="mt-2 min-h-6">
              {data ? (
                <MetaChip>
                  {data.bookmarkedCount === 0
                    ? "Chưa lưu tình huống"
                    : `${data.bookmarkedCount} tình huống đã lưu`}
                </MetaChip>
              ) : (
                <PendingMeta loading={loading} />
              )}
            </div>
            <p className={description}>
              Xem lại những tình huống bạn đã lưu để luyện tập sau.
            </p>
            <button
              type="button"
              {...actionProps("bookmarks")}
              className={textButton}
            >
              Xem danh sách <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </article>
        </div>
      </HubSection>

      <HubSection title="Hướng dẫn" accent="#087f8d" className="mt-9">
        <article className="flex min-h-[170px] items-center gap-7 rounded-[16px] border border-[#e1e5ed] bg-white px-6 py-5 shadow-[0_2px_6px_rgba(15,23,42,0.025)]">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#087f8d]">
              Hướng dẫn luyện tập
            </p>
            <h3 className="mt-1.5 text-[17px] font-bold text-[#101828]">
              Hướng dẫn học và thi thử mô phỏng
            </h3>
            <p className={description}>
              Tìm hiểu cách xem tình huống, ghi nhận thời điểm phát hiện nguy
              hiểm và theo dõi kết quả luyện tập.
            </p>
            <button
              type="button"
              {...actionProps("guide")}
              className="mt-4 inline-flex min-h-8 items-center gap-1.5 rounded text-[14.5px] font-semibold text-[#0758d9] outline-none transition hover:text-[#064fc3] focus-visible:ring-2 focus-visible:ring-[#0758d9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Xem hướng dẫn <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <span className="hidden size-[54px] shrink-0 items-center justify-center rounded-[13px] bg-[#eeeaff] text-[#5b4ee8] sm:flex">
            <Lightbulb className="size-6" aria-hidden="true" />
          </span>
        </article>
      </HubSection>
    </div>
  );
}

const examCard =
  "flex min-h-[255px] flex-col rounded-[16px] border border-[#e1e5ed] bg-white p-6 shadow-[0_2px_6px_rgba(15,23,42,0.025)]";
const studyCard =
  "flex min-h-[230px] flex-col rounded-[16px] border border-[#e1e5ed] bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.025)]";
const examTitle = "mt-4 text-[19px] font-bold text-[#101828]";
const studyTitle = "mt-4 text-[17px] font-bold text-[#101828]";
const description = "mt-2.5 text-[14.5px] font-medium leading-6 text-[#344054]";
const primaryButton =
  "inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-[9px] bg-[#0758d9] px-5 py-2.5 text-[14px] font-semibold text-white outline-none transition hover:bg-[#064fc3] focus-visible:ring-2 focus-visible:ring-[#0758d9] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";
const secondaryButton =
  "inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-[9px] bg-[#eef2ff] px-5 py-2.5 text-[14px] font-semibold text-[#0758d9] outline-none transition hover:bg-[#e3eaff] focus-visible:ring-2 focus-visible:ring-[#0758d9] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";
const textButton =
  "mt-auto inline-flex min-h-10 w-fit items-center gap-1.5 rounded pt-5 text-[14px] font-semibold text-[#0758d9] outline-none transition hover:text-[#064fc3] focus-visible:ring-2 focus-visible:ring-[#0758d9] disabled:cursor-not-allowed disabled:opacity-60";

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 items-center justify-center rounded-[10px] bg-[#e9edff] text-[#0758d9]"
    >
      {children}
    </span>
  );
}
function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] bg-[#f0f2ff] px-2.5 py-1 text-[12.5px] font-semibold text-[#27364f]">
      {children}
    </span>
  );
}
function PendingMeta({ loading }: { loading: boolean }) {
  return loading ? (
    <span
      aria-label="Đang tải thông tin"
      className="block h-6 w-28 animate-pulse rounded-[7px] bg-[#eef0f8]"
    />
  ) : (
    <span className="inline-flex min-h-6 items-center rounded-[7px] bg-[#f5f6fa] px-2.5 py-1 text-[12px] font-medium text-[#667085]">
      Đang chuẩn bị
    </span>
  );
}
function HubSection({
  title,
  accent,
  className,
  children,
}: {
  title: string;
  accent: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(className)} aria-label={title}>
      <div className="mb-4 flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="h-[22px] w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <h2 className="text-[22px] font-bold text-[#101828]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
