
"use client";

import { AlertCircle } from "lucide-react";

import type {
  LearningProgressOverview,
} from "@/features/progress-learning/progress-learning-types";

interface ProgressLearningSummaryProps {
  data: LearningProgressOverview;
  onOpenReview: () => void;
  onOpenCritical: () => void;
}

export function ProgressLearningSummary({
  data,
  onOpenReview,
  onOpenCritical,
}: ProgressLearningSummaryProps) {
  const { overall, review, critical } = data;

  const overallPercent = clampPercent(
    overall.progressPercent
  );

  return (
    <>
      {/* TIÊU ĐỀ TRANG */}
      <div>
        <h1
          className="
            text-[28px]
            font-bold
            leading-[1.2]
            tracking-[-0.025em]
            text-[#101828]
          "
        >
          Tiến độ học tập
        </h1>

        <p
          className="
            mt-2
            text-[14.5px]
            font-medium
            leading-6
            text-[#475467]
          "
        >
          Theo dõi những nội dung bạn đã học trong hạng{" "}
          <span className="font-semibold text-[#27364f]">
            {data.licenseClass}
          </span>
          .
        </p>
      </div>

      {/* CARD TIẾN ĐỘ TỔNG THỂ */}
      <section
        className="
          mt-6
          rounded-[18px]
          border
          border-[#e3e5ec]
          bg-white
          p-[0.6cm]
          shadow-[0_3px_12px_rgba(31,41,55,0.035)]
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-end
            justify-between
            gap-5
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-[11.5px]
                font-bold
                uppercase
                tracking-[0.04em]
                text-[#27364f]
              "
            >
              Tiến độ tổng thể
            </p>

            <div
              className="
                mt-3
                flex
                flex-wrap
                items-baseline
                gap-2
              "
            >
              <span
                className="
                  text-[23px]
                  font-bold
                  leading-[1.2]
                  tracking-[-0.025em]
                  text-[#101828]
                "
              >
                {overall.studiedQuestions}
                {" / "}
                {overall.totalQuestions}
                {" câu"}
              </span>

              <span className="text-[14.5px] font-medium text-[#344054]">
                đã học
              </span>
            </div>
          </div>

          <span
            className="
              shrink-0
              text-[24px]
              font-bold
              tracking-[-0.025em]
              text-[#0758d9]
            "
          >
            {Math.round(overallPercent)}%
          </span>
        </div>

        {/* THANH TIẾN ĐỘ TỔNG THỂ */}
        <div
          className="
            mt-5
            h-2
            w-full
            overflow-hidden
            rounded-full
            bg-[#e7eaf4]
          "
          role="progressbar"
          aria-label="Tiến độ học tập tổng thể"
          aria-valuenow={overallPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="
              h-full
              rounded-full
              bg-[#2f6eea]
              transition-[width]
              duration-300
            "
            style={{
              width: `${overallPercent}%`,
            }}
          />
        </div>

        <div
          className="
            mt-4
            flex
            items-start
            gap-2
            text-[14.5px]
            font-medium
            leading-6
            text-[#475467]
          "
        >
          <AlertCircle
            className="mt-1 size-4 shrink-0 text-[#475467]"
            strokeWidth={1.8}
          />

          <p>
            Còn{" "}
            <strong className="font-semibold text-[#101828]">
              {overall.remainingQuestions}
            </strong>{" "}
            câu trong các chương hiện tại chưa học.
          </p>
        </div>
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
        {/* CARD CÂU CẦN ÔN LẠI */}
        <button
          type="button"
          onClick={onOpenReview}
          className="
            flex
            min-h-[150px]
            flex-col
            items-start
            justify-center
            rounded-[18px]
            border
            border-[#e3e5ec]
            bg-white
            p-[0.6cm]
            text-left
            shadow-[0_3px_12px_rgba(31,41,55,0.035)]
            transition
            hover:border-[#cbd7ff]
            hover:bg-[#fcfdff]
            hover:shadow-[0_6px_18px_rgba(31,41,55,0.05)]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#0758d9]/20
          "
        >
          <p
            className="
              text-[14.5px]
              font-semibold
              leading-6
              text-[#27364f]
            "
          >
            Câu cần ôn lại
          </p>

          <p
            className="
              mt-3
              text-[24px]
              font-bold
              leading-none
              text-[#101828]
            "
          >
            {review.needReviewCount}
          </p>

          <p
            className="
              mt-3
              text-[13.5px]
              font-medium
              leading-6
              text-[#475467]
            "
          >
            Những câu cần xem lại.
          </p>
        </button>

        {/* CARD CÂU ĐIỂM LIỆT */}
        <button
          type="button"
          onClick={onOpenCritical}
          className="
            flex
            min-h-[150px]
            flex-col
            items-start
            justify-center
            rounded-[18px]
            border
            border-[#e3e5ec]
            bg-white
            p-[0.6cm]
            text-left
            shadow-[0_3px_12px_rgba(31,41,55,0.035)]
            transition
            hover:border-[#f0c7c2]
            hover:bg-[#fffdfd]
            hover:shadow-[0_6px_18px_rgba(31,41,55,0.05)]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#d92d20]/20
          "
        >
          <p
            className="
              text-[14.5px]
              font-semibold
              leading-6
              text-[#27364f]
            "
          >
            Câu điểm liệt đã học
          </p>

          <p
            className="
              mt-3
              text-[24px]
              font-bold
              leading-none
              text-[#c91c16]
            "
          >
            {critical.studiedQuestions}
            {" / "}
            {critical.totalQuestions}
          </p>

          <p
            className="
              mt-3
              text-[13.5px]
              font-medium
              leading-6
              text-[#475467]
            "
          >
            Tiến độ ôn nhóm câu điểm liệt.
          </p>
        </button>
      </div>
    </>
  );
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
