"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import type { CriticalQuestionSessionMode } from "@/features/practice/critical-session-types";
import { useCriticalOverview } from "@/features/practice/use-critical-overview";

interface CriticalQuestionsContentProps {
  licenseClass: string;
  starting: boolean;
  onStartStudy: (
    mode:
      CriticalQuestionSessionMode
  ) => void;
}

export function CriticalQuestionsContent({
  licenseClass,
  starting,
  onStartStudy,
}: CriticalQuestionsContentProps) {
  const {
    overview,
    isLoading,
    isError,
    refetch,
  } =
    useCriticalOverview(
      licenseClass
    );

  return (
    <div className="font-dts w-full pb-14 pt-7 text-[#101828]">
      <div className="px-5 lg:px-[1cm]">
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 rounded-[8px] py-2 text-[13px] font-medium text-[#667085] transition hover:text-[#0758d9]"
        >
          <ArrowLeft
            className="size-4"
            strokeWidth={2}
          />

          Quay lại Ôn luyện
        </Link>
      </div>

      <div className="mx-auto mt-5 w-full max-w-[1240px] px-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.025em] text-[#101828]">
            Câu điểm liệt
          </h1>

          <p className="mt-2 text-[14px] font-medium leading-6 text-[#667085]">
            Ôn tập những câu cần đặc biệt chú ý khi làm bài lý thuyết.
          </p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-[860px]">
          {isLoading && (
            <CriticalOverviewSkeleton />
          )}

          {isError && (
            <CriticalOverviewError
              onRetry={() => {
                void refetch();
              }}
            />
          )}

          {!isLoading &&
            !isError &&
            overview &&
            overview.totalQuestions >
              0 && (
              <CriticalOverviewCard
                licenseClass={
                  overview.licenseClass
                }
                totalQuestions={
                  overview.totalQuestions
                }
                learnedQuestions={
                  overview.learnedQuestions
                }
                completionPercent={
                  overview.completionPercent
                }
                hasProgress={
                  overview.hasProgress
                }
                completed={
                  overview.completed
                }
                starting={
                  starting
                }
                onStartStudy={
                  onStartStudy
                }
              />
            )}

          {!isLoading &&
            !isError &&
            overview &&
            overview.totalQuestions ===
              0 && (
              <CriticalQuestionsEmpty
                licenseClass={
                  overview.licenseClass
                }
              />
            )}
        </div>
      </div>
    </div>
  );
}

function CriticalOverviewCard({
  licenseClass,
  totalQuestions,
  learnedQuestions,
  completionPercent,
  hasProgress,
  completed,
  starting,
  onStartStudy,
}: {
  licenseClass: string;
  totalQuestions: number;
  learnedQuestions: number;
  completionPercent: number;
  hasProgress: boolean;
  completed: boolean;
  starting: boolean;
  onStartStudy: (
    mode:
      CriticalQuestionSessionMode
  ) => void;
}) {
  const mode:
    CriticalQuestionSessionMode =
    completed
      ? "REVIEW"
      : "CONTINUE";

  const actionLabel =
    completed
      ? "Ôn lại"
      : hasProgress
        ? "Tiếp tục ôn"
        : "Bắt đầu ôn";

  return (
    <section className="min-h-[390px] rounded-[18px] border border-[#dedfea] bg-white px-9 py-9 shadow-[0_4px_14px_rgba(31,41,55,0.055)] sm:px-10 sm:py-10">
      <div className="flex size-12 items-center justify-center rounded-[11px] border border-[#fde7b0] bg-[#fff9e8] text-[#f79009]">
        <ShieldAlert
          className="size-[22px]"
          strokeWidth={2}
        />
      </div>

      <div className="mt-7 flex items-baseline gap-2.5">
        <strong className="text-[34px] font-bold leading-none tracking-[-0.035em] text-[#0758d9]">
          {learnedQuestions}
        </strong>

        <span className="text-[28px] font-bold leading-none text-[#101828]">
          / {totalQuestions}
        </span>

        <span className="ml-1 text-[14px] font-medium text-[#667085]">
          câu đã học
        </span>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e9edf5]">
        <div
          className="h-full rounded-full bg-[#0758d9] transition-[width]"
          style={{
            width:
              `${completionPercent}%`,
          }}
        />
      </div>

      <p className="mt-6 text-[14px] font-medium leading-[1.7] text-[#475467]">
        {completed
          ? `Bạn đã học hết các câu điểm liệt của hạng ${licenseClass}.`
          : hasProgress
            ? `Tiếp tục ôn những câu điểm liệt trong hạng ${licenseClass}.`
            : `Bắt đầu ôn những câu điểm liệt trong hạng ${licenseClass}.`}
      </p>

      <div className="mt-7 flex justify-center">
        <button
          type="button"
          disabled={
            starting
          }
          onClick={() =>
            onStartStudy(
              mode
            )
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[13px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-60"
        >
          {starting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : completed ? (
            <RotateCcw className="size-4" />
          ) : null}

          {starting
            ? "Đang mở..."
            : actionLabel}

          {!starting &&
            !completed && (
              <ArrowRight
                className="size-4"
                strokeWidth={
                  2.2
                }
              />
            )}
        </button>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-[12px] bg-[#fff9e8] px-5 py-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#fff1bf] text-[#d97706]">
          <Info className="size-4" />
        </span>

        <div>
          <h2 className="text-[13px] font-bold text-[#344054]">
            Vì sao cần chú ý?
          </h2>

          <p className="mt-1.5 text-[12.5px] font-medium leading-[1.65] text-[#667085]">
            Đây là nhóm câu cần được ghi nhớ đặc biệt khi ôn thi, giúp học viên nhận biết các tình huống giao thông cần chú ý và xây dựng phản xạ an toàn.
          </p>
        </div>
      </div>
    </section>
  );
}

function CriticalQuestionsEmpty({
  licenseClass,
}: {
  licenseClass: string;
}) {
  return (
    <section className="min-h-[300px] rounded-[18px] border border-[#dedfea] bg-white px-9 py-9 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <div className="flex size-12 items-center justify-center rounded-[11px] bg-[#fff9e8] text-[#f79009]">
        <ShieldAlert className="size-[22px]" />
      </div>

      <h2 className="mt-6 text-[21px] font-bold text-[#101828]">
        Chưa có câu điểm liệt
      </h2>

      <p className="mt-3 max-w-[560px] text-[14px] font-medium leading-6 text-[#667085]">
        Hiện chưa có câu điểm liệt phù hợp với hạng{" "}
        {licenseClass}.
      </p>
    </section>
  );
}

function CriticalOverviewError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <section className="min-h-[260px] rounded-[18px] border border-[#fecdca] bg-white px-9 py-9 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <h2 className="text-[18px] font-bold text-[#b42318]">
        Không tải được câu điểm liệt
      </h2>

      <p className="mt-3 text-[14px] font-medium leading-6 text-[#667085]">
        Không thể tải dữ liệu câu điểm liệt ở thời điểm hiện tại.
      </p>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={
            onRetry
          }
          className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#f2f4f7] px-5 text-[13px] font-semibold text-[#344054] transition hover:bg-[#e9edf3]"
        >
          <RefreshCcw className="size-4" />
          Thử lại
        </button>
      </div>
    </section>
  );
}

function CriticalOverviewSkeleton() {
  return (
    <div className="h-[390px] animate-pulse rounded-[18px] border border-[#dedfea] bg-white" />
  );
}