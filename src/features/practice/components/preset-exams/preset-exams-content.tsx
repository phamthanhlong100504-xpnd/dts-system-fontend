"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  CheckCircle2,
  FileQuestion,
} from "lucide-react";

import { PresetExamCard } from "@/features/practice/components/preset-exams/preset-exam-card";

import {
  filterPresetExams,
  getPresetExamCounts,
  type PresetExamFilter,
  type PresetExamSet,
} from "@/features/practice/preset-exam-types";

import {
  usePresetExamSets,
} from "@/features/practice/use-preset-exams";

import { cn } from "@/lib/utils";

interface PresetExamsContentProps {
  /**
   * Hạng GPLX đang học từ global license state.
   */
  licenseClass: string;

  /**
   * Khi user bắt đầu hoặc làm lại một bộ đề.
   */
  onStartExam?: (
    exam: PresetExamSet
  ) => void;

  /**
   * Khi user có session đang làm dở.
   */
  onResumeExam?: (
    exam: PresetExamSet
  ) => void;

  /**
   * ID của bộ đề đang được xử lý.
   */
  pendingExamId?: string | null;
}

export function PresetExamsContent({
  licenseClass,
  onStartExam,
  onResumeExam,
  pendingExamId,
}: PresetExamsContentProps) {
  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<PresetExamFilter>(
      "ALL"
    );

  const presetQuery =
    usePresetExamSets(
      licenseClass
    );

  const items =
    presetQuery.data?.items ??
    [];

  const counts =
    getPresetExamCounts(
      items
    );

  const filteredItems =
    filterPresetExams(
      items,
      activeFilter
    );

  const totalExamSets =
    presetQuery.data?.total ??
    items.length;

  return (
    <div className="font-dts">
      {/* ===================================================== */}
      {/* Heading                                               */}
      {/* ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <h1
            className="
              text-[25px]
              font-bold
              tracking-[-0.025em]
              text-[#101828]
            "
          >
            Bộ đề thi thử
          </h1>

          <p
            className="
              mt-1.5
              text-[14.5px]
              font-medium
              leading-6
              text-[#475467]
            "
          >
            Luyện tập với các bộ đề
            được chuẩn bị sẵn cho
            hạng{" "}
            <span className="font-semibold text-[#27364f]">
              {licenseClass}
            </span>
            .
          </p>
        </div>

        <div
          className="
            inline-flex
            h-9
            shrink-0
            items-center
            gap-2
            self-start
            rounded-full
            bg-[#e8edff]
            px-4
            text-[13.5px]
            font-semibold
            text-[#0758d9]
            sm:self-auto
          "
        >
          <CheckCircle2
            className="size-4"
            strokeWidth={2.2}
          />

          <span>
            Đã hoàn thành{" "}
            <strong className="font-bold">
              {counts.completed}
            </strong>
            {" / "}
            {totalExamSets} bộ đề
          </span>
        </div>
      </div>

      {/* ===================================================== */}
      {/* Filters                                               */}
      {/* ===================================================== */}

      <div
        className="
          mt-6
          flex
          flex-wrap
          items-center
          gap-2.5
        "
      >
        <PresetFilterButton
          active={
            activeFilter ===
            "ALL"
          }
          onClick={() =>
            setActiveFilter(
              "ALL"
            )
          }
        >
          Tất cả ({items.length})
        </PresetFilterButton>

        <PresetFilterButton
          active={
            activeFilter ===
            "NOT_STARTED"
          }
          onClick={() =>
            setActiveFilter(
              "NOT_STARTED"
            )
          }
        >
          Chưa làm (
          {counts.notStarted})
        </PresetFilterButton>

        <PresetFilterButton
          active={
            activeFilter ===
            "PASSED"
          }
          onClick={() =>
            setActiveFilter(
              "PASSED"
            )
          }
        >
          Đã đạt ({counts.passed})
        </PresetFilterButton>

        <PresetFilterButton
          active={
            activeFilter ===
            "FAILED"
          }
          onClick={() =>
            setActiveFilter(
              "FAILED"
            )
          }
        >
          Chưa đạt ({counts.failed})
        </PresetFilterButton>
      </div>

      {/* Loading */}
      {presetQuery.isLoading && (
        <PresetExamSkeletonGrid />
      )}

      {/* Error */}
      {presetQuery.isError && (
        <PresetExamErrorState
          onRetry={() => {
            void presetQuery.refetch();
          }}
        />
      )}

      {/* Empty backend state */}
      {!presetQuery.isLoading &&
        !presetQuery.isError &&
        items.length === 0 && (
          <PresetExamEmptyState
            licenseClass={
              licenseClass
            }
          />
        )}

      {/* Empty filter */}
      {!presetQuery.isLoading &&
        !presetQuery.isError &&
        items.length > 0 &&
        filteredItems.length ===
          0 && (
          <PresetExamFilterEmptyState
            onReset={() =>
              setActiveFilter(
                "ALL"
              )
            }
          />
        )}

      {/* ===================================================== */}
      {/* Exam cards                                            */}
      {/* ===================================================== */}

      {!presetQuery.isLoading &&
        !presetQuery.isError &&
        filteredItems.length >
          0 && (
          <div
            className="
              mt-7
              grid
              grid-cols-1
              gap-9
              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            {filteredItems.map(
              (exam) => (
                <PresetExamCard
                  key={exam.id}
                  exam={exam}
                  pending={
                    pendingExamId ===
                    exam.id
                  }
                  onStart={(
                    selectedExam
                  ) => {
                    onStartExam?.(
                      selectedExam
                    );
                  }}
                  onResume={(
                    selectedExam
                  ) => {
                    onResumeExam?.(
                      selectedExam
                    );
                  }}
                />
              )
            )}
          </div>
        )}
    </div>
  );
}

/* ========================================================= */
/* Filter button                                             */
/* ========================================================= */

function PresetFilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        `
          inline-flex
          h-9
          items-center
          justify-center
          rounded-full
          border
          px-4
          text-[14.5px]
          font-semibold
          transition
        `,
        active
          ? `
              border-[#0758d9]
              bg-[#0758d9]
              text-white
              shadow-[0_2px_5px_rgba(7,88,217,0.16)]
            `
          : `
              border-[#e1e5ed]
              bg-white
              text-[#344054]
              hover:border-[#c8d1df]
              hover:bg-[#f8f9fb]
              hover:text-[#344054]
            `
      )}
    >
      {children}
    </button>
  );
}

/* ========================================================= */
/* Empty backend state                                       */
/* ========================================================= */

function PresetExamEmptyState({
  licenseClass,
}: {
  licenseClass: string;
}) {
  return (
    <div
      className="
        mt-7
        flex
        min-h-[280px]
        flex-col
        items-center
        justify-center
        rounded-[18px]
        border
        border-dashed
        border-[#d9dde7]
        bg-white/70
        px-6
        text-center
      "
    >
      <div
        className="
          flex
          size-12
          items-center
          justify-center
          rounded-[12px]
          bg-[#eef2ff]
          text-[#0758d9]
        "
      >
        <FileQuestion
          className="size-6"
          strokeWidth={1.9}
        />
      </div>

      <h2
        className="
          mt-4
          text-[17px]
          font-bold
          text-[#101828]
        "
      >
        Chưa có bộ đề cho hạng{" "}
        {licenseClass}
      </h2>

      <p
        className="
          mt-1.5
          max-w-[460px]
          text-[14.5px]
          font-medium
          leading-6
          text-[#475467]
        "
      >
        Các bộ đề thi thử đã được
        chuẩn bị và phát hành sẽ xuất
        hiện tại đây.
      </p>
    </div>
  );
}

/* ========================================================= */
/* Empty filtered state                                      */
/* ========================================================= */

function PresetExamFilterEmptyState({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div
      className="
        mt-7
        flex
        min-h-[190px]
        flex-col
        items-center
        justify-center
        rounded-[16px]
        border
        border-[#e1e4eb]
        bg-white
        px-6
        text-center
      "
    >
      <FileQuestion
        className="size-7 text-[#98a2b3]"
        strokeWidth={1.8}
      />

      <p
        className="
          mt-3
          text-[14.5px]
          font-medium
          text-[#475467]
        "
      >
        Không có bộ đề phù hợp với bộ
        lọc này.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="
          mt-3
          text-[13.5px]
          font-semibold
          text-[#0758d9]
          transition
          hover:text-[#064fc3]
        "
      >
        Xem tất cả bộ đề
      </button>
    </div>
  );
}

/* ========================================================= */
/* Error state                                               */
/* ========================================================= */

function PresetExamErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div
      className="
        mt-7
        rounded-[16px]
        border
        border-[#f1d5d2]
        bg-white
        px-6
        py-12
        text-center
      "
    >
      <FileQuestion
        className="
          mx-auto
          size-9
          text-[#d92d20]
        "
        strokeWidth={1.8}
      />

      <h2
        className="
          mt-3
          text-[17px]
          font-bold
          text-[#101828]
        "
      >
        Không thể tải bộ đề
      </h2>

      <p
        className="
          mx-auto
          mt-1.5
          max-w-[440px]
          text-[14.5px]
          font-medium
          leading-6
          text-[#475467]
        "
      >
        Dữ liệu bộ đề hiện chưa thể
        tải. Vui lòng thử lại sau.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="
          mt-4
          inline-flex
          h-9
          items-center
          justify-center
          rounded-[9px]
          bg-[#eef2ff]
          px-4
          text-[13.5px]
          font-semibold
          text-[#0758d9]
          transition
          hover:bg-[#e3eaff]
        "
      >
        Thử tải lại
      </button>
    </div>
  );
}

/* ========================================================= */
/* Loading                                                   */
/* ========================================================= */

function PresetExamSkeletonGrid() {
  return (
    <div
      className="
        mt-7
        grid
        grid-cols-1
        gap-9
        md:grid-cols-2
        lg:grid-cols-3
      "
    >
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="
            min-h-[230px]
            animate-pulse
            rounded-[18px]
            border
            border-[#e4e5ec]
            bg-white
            p-5
          "
        >
          <div className="h-7 w-16 rounded-[7px] bg-[#eceef4]" />

          <div className="mt-4 h-5 w-[78%] rounded bg-[#eceef4]" />

          <div className="mt-3 h-4 w-[50%] rounded bg-[#f0f1f5]" />

          <div className="mt-8 h-[48px] rounded-[11px] bg-[#f0f2f7]" />

          <div className="mt-4 h-10 w-36 rounded-[10px] bg-[#e8ebf2]" />
        </div>
      ))}
    </div>
  );
}