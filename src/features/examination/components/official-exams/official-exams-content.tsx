"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  RefreshCcw,
} from "lucide-react";

import { OfficialExamCard } from "@/features/examination/components/official-exams/official-exam-card";
import { OfficialExamTabs } from "@/features/examination/components/official-exams/official-exam-tabs";
import type {
  OfficialExamListItem,
  OfficialExamTab,
} from "@/features/examination/official-exam-types";
import { useOfficialExams } from "@/features/examination/use-official-exams";

interface OfficialExamsContentProps {
  licenseClass: string;
  onStartExam: (exam: OfficialExamListItem) => void;
  startingExamId?: string | null;
}

export function OfficialExamsContent({
  licenseClass,
  onStartExam,
  startingExamId,
}: OfficialExamsContentProps) {
  const [selectedTab, setSelectedTab] = useState<OfficialExamTab>("OPEN");
  const [page, setPage] = useState(0);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useOfficialExams({
    licenseClass,
    tab: selectedTab,
    page,
    size: 20,
  });

  const items = data?.items ?? [];

  return (
    <div className="font-dts mx-auto w-full max-w-[1260px] px-5 pb-16 pt-9 sm:px-7 lg:px-10">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#101828]">
          Thi chính thức
        </h1>

        <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467]">
          Xem và tham gia các kỳ thi chính thức phù hợp với hạng GPLX của bạn.
        </p>
      </div>

      <div className="mt-7">
        <OfficialExamTabs
          value={selectedTab}
          onChange={(tab) => {setSelectedTab(tab);setPage(0);}}
        />
      </div>

      <div className="mt-7">
        {isLoading && (
          <OfficialExamListSkeleton />
        )}

        {isError && (
          <OfficialExamError
            onRetry={() => {
              void refetch();
            }}
          />
        )}

        {!isLoading &&
          !isError &&
          items.length > 0 && (
            <div className="space-y-[1cm] [&>article]:min-h-[170px]">
              {items.map((exam) => (
                <OfficialExamCard
                  key={`${exam.examId}-${exam.examVersionId ?? "unknown"}`}
                  exam={exam}
                  onStart={onStartExam}
                  isStarting={
                    startingExamId ===
                    exam.examId
                  }
                />
              ))}
            </div>
          )}

        {!isLoading &&
          !isError &&
          items.length === 0 && (
            <OfficialExamEmpty
              tab={selectedTab}
            />
          )}
        {!isLoading && !isError && (data?.totalPages ?? 0) > 1 && <nav className="mt-7 flex items-center justify-center gap-4" aria-label="Phân trang kỳ thi"><button type="button" disabled={page===0} className="rounded-lg border bg-white px-4 py-2 text-[14.5px]/5 disabled:opacity-40" onClick={()=>setPage(p=>Math.max(0,p-1))}>Trang trước</button><span className="text-[14.5px]/5">{page+1} / {data!.totalPages}</span><button type="button" disabled={page+1>=(data?.totalPages??0)} className="rounded-lg border bg-white px-4 py-2 text-[14.5px]/5 disabled:opacity-40" onClick={()=>setPage(p=>p+1)}>Trang sau</button></nav>}
      </div>
    </div>
  );
}

function OfficialExamListSkeleton() {
  return (
    <div className="space-y-[1cm]">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="min-h-[170px] rounded-[16px] border border-[#e7e9f0] bg-white px-6 py-5"
        >
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0 flex-1">
              <div className="flex gap-2.5">
                <div className="h-6 w-24 animate-pulse rounded-[6px] bg-[#edf0f5]" />
                <div className="h-6 w-20 animate-pulse rounded-[6px] bg-[#edf0f5]" />
                <div className="h-6 w-24 animate-pulse rounded bg-[#edf0f5]" />
              </div>

              <div className="mt-4 h-6 w-[340px] max-w-full animate-pulse rounded bg-[#edf0f5]" />

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="h-[58px] animate-pulse rounded-[10px] bg-[#f0f2f7]" />
                <div className="h-[58px] animate-pulse rounded-[10px] bg-[#f0f2f7]" />
              </div>
            </div>

            <div className="mt-[60px] h-11 w-[136px] shrink-0 animate-pulse rounded-[10px] bg-[#edf0f5]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OfficialExamError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <section className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-[#fecdca] bg-white px-8 py-10 text-center">
      <div className="max-w-[460px]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#fff1f0] text-[#d92d20]">
          <AlertCircle
            className="size-5.5"
            strokeWidth={1.9}
          />
        </span>

        <h2 className="mt-5 text-[18px] font-bold text-[#101828]">
          Không tải được danh sách kỳ thi
        </h2>

        <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467]">
          Danh sách kỳ thi chưa tải được. Vui lòng thử lại sau ít phút.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#f2f4f7] px-5 text-[14.5px] font-semibold text-[#27364f] transition hover:bg-[#e9edf3]"
        >
          <RefreshCcw className="size-4" />
          Thử lại
        </button>
      </div>
    </section>
  );
}

function OfficialExamEmpty({
  tab,
}: {
  tab: OfficialExamTab;
}) {
  const content = getEmptyContent(tab);
  const Icon = content.icon;

  return (
    <section className="flex min-h-[290px] items-center justify-center rounded-[16px] border border-[#e3e7ee] bg-white px-8 py-10 text-center">
      <div className="max-w-[470px]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#eef3ff] text-[#0758d9]">
          <Icon
            className="size-5.5"
            strokeWidth={1.9}
          />
        </span>

        <h2 className="mt-5 text-[18px] font-bold text-[#101828]">
          {content.title}
        </h2>

        <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467]">
          {content.description}
        </p>
      </div>
    </section>
  );
}

function getEmptyContent(
  tab: OfficialExamTab
) {
  if (tab === "UPCOMING") {
    return {
      icon: CalendarClock,
      title:
        "Chưa có kỳ thi sắp diễn ra",
      description:
        "Các kỳ thi sắp mở sẽ được hiển thị tại đây.",
    };
  }

  if (tab === "PARTICIPATED") {
    return {
      icon: CheckCircle2,
      title:
        "Bạn chưa tham gia kỳ thi nào",
      description:
        "Những kỳ thi bạn đã tham gia sẽ được hiển thị tại đây.",
    };
  }

  return {
    icon: FileText,
    title:
      "Hiện chưa có kỳ thi đang mở",
    description:
      "Kỳ thi phù hợp với hạng GPLX của bạn sẽ hiển thị tại đây khi đến thời gian tổ chức.",
  };
}