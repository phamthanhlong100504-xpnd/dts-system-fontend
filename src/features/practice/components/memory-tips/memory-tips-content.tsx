
"use client";

import Link from "next/link";
import { ArrowLeft, Lightbulb, RefreshCcw } from "lucide-react";

import { MemoryTipAccordion } from "@/features/practice/components/memory-tips/memory-tip-accordion";
import { useMemoryTips } from "@/features/practice/use-memory-tips";

export function MemoryTipsContent() {
  const { data, isLoading, isError, refetch } = useMemoryTips();
  const items = data?.items ?? [];

  return (
    <div className="font-dts w-full pb-16 pt-8">
      {/*  */}
      <div className="w-full px-[1cm]">
        <Link href="/practice" className="inline-flex min-h-9 items-center gap-2 text-[14.5px] font-medium text-[#667085] transition hover:text-[#0758d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25 dark:text-[#aab8cf] dark:hover:text-[#93b4ff]">
          <ArrowLeft className="size-4" strokeWidth={2} />
          Quay lại Ôn luyện
        </Link>
      </div>

      {/* */}
      <div className="mx-auto mt-7 w-full max-w-[1120px] px-5 sm:px-7 xl:px-0">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#101828] sm:text-[28px] dark:text-[#f8fafc]">
              Mẹo ghi nhớ
            </h1>

            {data && (
              <span className="inline-flex min-h-7 items-center rounded-[8px] bg-[#eef3ff] px-3 text-[13px] font-semibold text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]">
                {data.totalElements} mẹo
              </span>
            )}
          </div>

          <p className="mt-3 text-[15px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf]">
            Những kiến thức thường dễ nhầm cần ghi nhớ khi ôn thi lý thuyết.
          </p>
        </div>

        <div className="mt-8">
          {isLoading && <MemoryTipsSkeleton />}

          {isError && (
            <MemoryTipsError onRetry={() => void refetch()} />
          )}

          {!isLoading && !isError && items.length > 0 && (
            <MemoryTipAccordion items={items} />
          )}

          {!isLoading && !isError && items.length === 0 && (
            <MemoryTipsEmpty />
          )}
        </div>
      </div>
    </div>
  );
}

function MemoryTipsSkeleton() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e3e7ee] bg-white dark:border-[#35445a] dark:bg-[#182231]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="border-b border-[#eef0f4] px-6 py-5 last:border-b-0 dark:border-[#35445a]">
          <div className="flex items-center gap-4">
            <div className="h-8 w-10 shrink-0 animate-pulse rounded-[7px] bg-[#edf0f5] dark:bg-[#26364e]" />
            <div className="h-4 flex-1 animate-pulse rounded bg-[#edf0f5] dark:bg-[#26364e]" />
            <div className="size-4 animate-pulse rounded bg-[#edf0f5] dark:bg-[#26364e]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MemoryTipsError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-[16px] border border-[#fecdca] bg-white px-6 py-10 text-center dark:bg-[#182231]">
      <span className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#fff1f0] text-[#d92d20]">
        <RefreshCcw className="size-5" strokeWidth={1.9} />
      </span>

      <h2 className="mt-4 text-[18px] font-bold text-[#101828] dark:text-[#f8fafc]">
        Không tải được mẹo ghi nhớ
      </h2>

      <p className="mt-2 text-[14px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf]">
        Không thể tải dữ liệu ở thời điểm hiện tại.
      </p>

      <button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-[#f2f4f7] px-5 text-[14px] font-semibold text-[#344054] transition hover:bg-[#e9edf3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25 dark:bg-[#26364e] dark:text-[#e2e8f0]">
        <RefreshCcw className="size-4" />
        Thử lại
      </button>
    </section>
  );
}

function MemoryTipsEmpty() {
  return (
    <section className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-[#e3e7ee] bg-white px-6 py-10 text-center dark:border-[#35445a] dark:bg-[#182231]">
      <div className="max-w-[460px]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#eef3ff] text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]">
          <Lightbulb className="size-6" strokeWidth={1.9} />
        </span>

        <h2 className="mt-4 text-[18px] font-bold text-[#101828] dark:text-[#f8fafc]">
          Chưa có dữ liệu mẹo ghi nhớ
        </h2>

        <p className="mt-3 text-[14px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf]">
          Nội dung mẹo ghi nhớ sẽ được hiển thị tại đây sau khi bộ dữ liệu được bổ sung vào hệ thống.
        </p>
      </div>
    </section>
  );
}
