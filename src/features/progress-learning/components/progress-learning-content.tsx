
"use client";

import type { ReactNode } from "react";

import {
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

import { ProgressLearningChapters } from "@/features/progress-learning/components/progress-learning-chapters";
import { ProgressLearningSummary } from "@/features/progress-learning/components/progress-learning-summary";

import type {
  LearningChapterProgress,
} from "@/features/progress-learning/progress-learning-types";

import { useLearningProgressOverview } from "@/features/progress-learning/use-progress-learning";

interface ProgressLearningContentProps {
  licenseClass: string;

  onOpenChapter: (
    chapter: LearningChapterProgress
  ) => void;

  onOpenReview: () => void;
  onOpenCritical: () => void;
}

function ProgressPageContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="
        font-dts
        w-full
        px-6
        pb-16
        pt-6
        text-[#101828]
        lg:px-[calc(38px+1cm)]
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[calc(1240px-2cm)]
        "
      >
        {children}
      </div>
    </div>
  );
}

export function ProgressLearningContent({
  licenseClass,
  onOpenChapter,
  onOpenReview,
  onOpenCritical,
}: ProgressLearningContentProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useLearningProgressOverview(
    licenseClass
  );

  if (isLoading) {
    return <ProgressLearningLoading />;
  }

  if (isError || !data) {
    return (
      <ProgressLearningError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <ProgressPageContainer>
      <ProgressLearningSummary
        data={data}
        onOpenReview={onOpenReview}
        onOpenCritical={onOpenCritical}
      />

      <ProgressLearningChapters
        chapters={data.chapters}
        onOpenChapter={onOpenChapter}
      />
    </ProgressPageContainer>
  );
}


function ProgressLearningLoading() {
  return (
    <ProgressPageContainer>
      {/* TIÊU ĐỀ */}
      <div>
        <div
          className="
            h-9
            w-[240px]
            max-w-full
            animate-pulse
            rounded-[8px]
            bg-[#e4e6ed]
          "
        />

        <div
          className="
            mt-2
            h-5
            w-[420px]
            max-w-full
            animate-pulse
            rounded-[6px]
            bg-[#ebedf2]
          "
        />
      </div>

      {/* CARD TỔNG THỂ */}
      <section
        className="
          mt-6
          min-h-[160px]
          animate-pulse
          rounded-[18px]
          border
          border-[#e3e5ec]
          bg-white
          p-[0.6cm]
        "
      >
        <div
          className="
            h-4
            w-[150px]
            rounded
            bg-[#eceef4]
          "
        />

        <div
          className="
            mt-4
            flex
            items-end
            justify-between
            gap-4
          "
        >
          <div
            className="
              h-8
              w-[210px]
              max-w-full
              rounded
              bg-[#eceef4]
            "
          />

          <div
            className="
              h-8
              w-[70px]
              rounded
              bg-[#eceef4]
            "
          />
        </div>

        <div
          className="
            mt-5
            h-2
            w-full
            rounded-full
            bg-[#e8ebf5]
          "
        />

        <div
          className="
            mt-4
            h-5
            w-[340px]
            max-w-full
            rounded
            bg-[#eceef4]
          "
        />
      </section>

      {/* HAI CARD THỐNG KÊ */}
      <div
        className="
          mt-[0.6cm]
          grid
          grid-cols-1
          gap-[0.6cm]
          md:grid-cols-2
        "
      >
        <div
          className="
            h-[150px]
            animate-pulse
            rounded-[18px]
            border
            border-[#e3e5ec]
            bg-white
          "
        />

        <div
          className="
            h-[150px]
            animate-pulse
            rounded-[18px]
            border
            border-[#e3e5ec]
            bg-white
          "
        />
      </div>

      {/* DANH SÁCH CHƯƠNG */}
      <div className="mt-9">
        <div
          className="
            h-7
            w-[220px]
            animate-pulse
            rounded
            bg-[#e4e6ed]
          "
        />

        <div
          className="
            mt-2
            h-5
            w-[350px]
            max-w-full
            animate-pulse
            rounded
            bg-[#ebedf2]
          "
        />

        <div
          className="
            mt-6
            flex
            flex-col
            gap-[0.6cm]
          "
        >
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-[165px]
                animate-pulse
                rounded-[18px]
                border
                border-[#e3e5ec]
                bg-white
              "
            />
          ))}
        </div>
      </div>
    </ProgressPageContainer>
  );
}

/**
 * Giao diện lỗi khi backend không tải được.
 */
function ProgressLearningError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <ProgressPageContainer>
      <section
        className="
          flex
          min-h-[300px]
          items-center
          justify-center
          rounded-[18px]
          border
          border-[#fecdca]
          bg-white
          px-6
          py-10
          text-center
        "
      >
        <div className="max-w-[460px]">
          <span
            className="
              mx-auto
              flex
              size-12
              items-center
              justify-center
              rounded-[12px]
              bg-[#fff1f0]
              text-[#d92d20]
            "
          >
            <AlertCircle
              className="size-5"
              strokeWidth={1.9}
            />
          </span>

          <h1
            className="
              mt-4
              text-[17px]
              font-bold
              leading-[1.45]
              text-[#101828]
            "
          >
            Không tải được tiến độ học tập
          </h1>

          <p
            className="
              mt-2
              text-[14px]
              font-medium
              leading-6
              text-[#667085]
            "
          >
            Không thể lấy dữ liệu tiến độ của hạng bằng
            đang học ở thời điểm hiện tại.
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="
              mt-5
              inline-flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-[10px]
              bg-[#eef2ff]
              px-5
              text-[13px]
              font-semibold
              text-[#0758d9]
              transition-colors
              hover:bg-[#e3eaff]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#0758d9]/30
            "
          >
            <RefreshCcw className="size-4" />
            Thử lại
          </button>
        </div>
      </section>
    </ProgressPageContainer>
  );
}
