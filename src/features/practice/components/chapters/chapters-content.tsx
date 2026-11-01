"use client";

import {
  BookOpen,
  FileQuestion,
} from "lucide-react";

import { ChapterOverviewCard } from "@/features/practice/components/chapters/chapter-overview-card";
import type {
  ChapterLearningProgress,
} from "@/features/practice/chapter-overview-types";
import { useChapterLearningOverview } from "@/features/practice/use-chapter-overview";

interface ChaptersContentProps {
  licenseClass: string;

  onStartChapter?: (
    chapter: ChapterLearningProgress
  ) => void;

  onResumeChapter?: (
    chapter: ChapterLearningProgress
  ) => void;

  onReviewChapter?: (
    chapter: ChapterLearningProgress
  ) => void;

  pendingChapterId?: number | null;
}

export function ChaptersContent({
  licenseClass,
  onStartChapter,
  onResumeChapter,
  onReviewChapter,
  pendingChapterId,
}: ChaptersContentProps) {
  const overviewQuery =
    useChapterLearningOverview(
      licenseClass
    );

  const overview =
    overviewQuery.data;

  const chapters =
    overview?.chapters ?? [];

  if (overviewQuery.isLoading) {
    return (
      <ChaptersContentSkeleton />
    );
  }

  if (overviewQuery.isError) {
    return (
      <ChaptersErrorState
        onRetry={() => {
          void overviewQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="font-dts">
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
          Ôn theo chương
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
          Học lần lượt từng nhóm kiến thức
          của hạng{" "}
          <span
            className="
              font-semibold
              text-[#27364f]
            "
          >
            {licenseClass}
          </span>
          .
        </p>
      </div>

      <div className="mt-6">
        <OverallProgressCard
          learnedQuestions={
            overview
              ?.learnedQuestions ??
            0
          }
          totalQuestions={
            overview
              ?.totalQuestions ??
            0
          }
          completionPercent={
            overview
              ?.completionPercent ??
            0
          }
        />
      </div>

      {chapters.length === 0 && (
        <ChaptersEmptyState
          licenseClass={
            licenseClass
          }
        />
      )}

      {chapters.length > 0 && (
        <div
          className="
            mt-[0.9cm]
            grid
            grid-cols-1
            gap-[0.9cm]
            lg:grid-cols-2
          "
        >
          {chapters.map(
            (chapter) => (
              <ChapterOverviewCard
                key={
                  chapter.chapterId
                }
                chapter={chapter}
                pending={
                  pendingChapterId ===
                  chapter.chapterId
                }
                onStart={(
                  selectedChapter
                ) => {
                  onStartChapter?.(
                    selectedChapter
                  );
                }}
                onResume={(
                  selectedChapter
                ) => {
                  onResumeChapter?.(
                    selectedChapter
                  );
                }}
                onReview={(
                  selectedChapter
                ) => {
                  onReviewChapter?.(
                    selectedChapter
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

function OverallProgressCard({
  learnedQuestions,
  totalQuestions,
  completionPercent,
}: {
  learnedQuestions: number;
  totalQuestions: number;
  completionPercent: number;
}) {
  const percent =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          completionPercent
        )
      )
    );

  return (
    <section
      className="
        rounded-[18px]
        border
        border-[#e3e5ec]
        bg-white
        px-6
        py-5
        shadow-[0_3px_12px_rgba(31,41,55,0.035)]
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-6
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-4
          "
        >
          <div
            className="
              flex
              size-11
              shrink-0
              items-center
              justify-center
              rounded-[11px]
              bg-[#edf3ff]
              text-[#0758d9]
            "
          >
            <BookOpen
              className="size-5"
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                text-[11.5px]
                font-bold
                uppercase
                tracking-[0.04em]
                text-[#475467]
              "
            >
              Tiến độ tổng thể
            </p>

            <p
              className="
                mt-1
                text-[14.5px]
                font-medium
                text-[#344054]
              "
            >
              <strong
                className="
                  text-[17px]
                  font-bold
                  text-[#101828]
                "
              >
                {learnedQuestions}
                {" / "}
                {totalQuestions}
              </strong>
              {" "}
              câu đã học
            </p>
          </div>
        </div>

        <span
          className="
            shrink-0
            text-[26px]
            font-bold
            tracking-[-0.025em]
            text-[#0758d9]
          "
        >
          {percent}%
        </span>
      </div>

      <div
        className="
          mt-4
          h-2
          overflow-hidden
          rounded-full
          bg-[#e7eaf4]
        "
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
            width: `${percent}%`,
          }}
        />
      </div>
    </section>
  );
}

function ChaptersEmptyState({
  licenseClass,
}: {
  licenseClass: string;
}) {
  return (
    <div
      className="
        mt-[0.9cm]
        flex
        min-h-[240px]
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
          className="size-5"
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
        Chưa có dữ liệu chương cho
        hạng {licenseClass}
      </h2>

      <p
        className="
          mt-2
          max-w-[460px]
          text-[14.5px]
          font-medium
          leading-6
          text-[#475467]
        "
      >
        Danh sách chương và tiến độ học
        sẽ xuất hiện tại đây khi dữ liệu
        theo hạng GPLX được cung cấp đầy đủ.
      </p>
    </div>
  );
}

function ChaptersErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div
      className="
        font-dts
        rounded-[18px]
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
          mt-4
          text-[17px]
          font-bold
          text-[#101828]
        "
      >
        Không thể tải tiến độ chương
      </h2>

      <p
        className="
          mx-auto
          mt-2
          max-w-[430px]
          text-[14.5px]
          font-medium
          leading-6
          text-[#475467]
        "
      >
        Dữ liệu ôn tập theo chương hiện
        chưa thể tải. Vui lòng thử lại sau.
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
          rounded-[10px]
          bg-[#eef2ff]
          px-5
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

function ChaptersContentSkeleton() {
  return (
    <div className="font-dts">
      <div
        className="
          h-9
          w-56
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

      <div
        className="
          mt-6
          h-[104px]
          animate-pulse
          rounded-[18px]
          border
          border-[#e4e5ec]
          bg-white
          p-5
        "
      >
        <div
          className="
            h-5
            w-44
            rounded
            bg-[#eceef4]
          "
        />

        <div
          className="
            mt-6
            h-2
            rounded-full
            bg-[#eceef4]
          "
        />
      </div>

      <div
        className="
          mt-[0.9cm]
          grid
          grid-cols-1
          gap-[0.9cm]
          lg:grid-cols-2
        "
      >
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <div
              key={index}
              className="
                min-h-[238px]
                animate-pulse
                rounded-[18px]
                border
                border-[#e4e5ec]
                bg-white
                p-5
              "
            >
              <div
                className="
                  h-7
                  w-24
                  rounded-[7px]
                  bg-[#eceef4]
                "
              />

              <div
                className="
                  mt-4
                  h-5
                  w-[72%]
                  rounded
                  bg-[#eceef4]
                "
              />

              <div
                className="
                  mt-6
                  h-4
                  w-[45%]
                  rounded
                  bg-[#f0f1f5]
                "
              />

              <div
                className="
                  mt-4
                  h-2
                  rounded-full
                  bg-[#eceef4]
                "
              />

              <div
                className="
                  mt-6
                  ml-auto
                  h-10
                  w-36
                  rounded-[10px]
                  bg-[#e8ebf2]
                "
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}