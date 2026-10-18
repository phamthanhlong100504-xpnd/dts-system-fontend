
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  RefreshCcw,
} from "lucide-react";

import { TrafficSignCard } from "@/features/practice/components/traffic-signs/traffic-sign-card";
import { TrafficSignFilters } from "@/features/practice/components/traffic-signs/traffic-sign-filters";
import {
  TRAFFIC_SIGN_CATEGORIES,
  type TrafficSign,
  type TrafficSignCategory,
} from "@/features/practice/traffic-sign-types";
import { useTrafficSigns } from "@/features/practice/use-traffic-signs";

const PAGE_SIZE = 20;

interface TrafficSignsContentProps {
  onOpenDetail: (sign: TrafficSign) => void;
}

export function TrafficSignsContent({ onOpenDetail }: TrafficSignsContentProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TrafficSignCategory>("PROHIBITORY");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useTrafficSigns({
    category: selectedCategory,
    search: debouncedSearch || undefined,
    page,
    size: PAGE_SIZE,
  });

  const isDebouncing = searchInput.trim() !== debouncedSearch;
  const items = data?.items ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const categoryLabel =
    TRAFFIC_SIGN_CATEGORIES.find(
      (category) => category.id === selectedCategory
    )?.label ?? "";

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(0);
  }

  function handleCategoryChange(value: TrafficSignCategory) {
    if (value === selectedCategory) return;
    setSelectedCategory(value);
    setPage(0);
  }

  return (
    <div className="font-dts mx-auto w-full max-w-[1240px] px-6 pb-16 pt-7 lg:px-[38px]">

      {/* Nút Quay lại Ôn luyện */}
      <Link href="/practice" style={{ marginLeft: "calc(50% - 50vw + 1cm)" }} className="inline-flex min-h-9 items-center gap-2 text-[14.5px] font-medium text-[#667085] transition hover:text-[#0758d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25 dark:text-[#aab8cf]">
        <ArrowLeft className="size-4" strokeWidth={2} />
        Quay lại Ôn luyện
      </Link>

      {/* Tiêu đề trang */}
      <div className="mt-4">
        <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.025em] text-[#101828] dark:text-[#f8fafc]">
          Biển báo giao thông
        </h1>

        <p className="mt-2 text-[15px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf]">
          Học và ghi nhớ biển báo theo từng nhóm.
        </p>
      </div>

      {/* Thanh tìm kiếm và tab */}
      <div className="mt-7">
        <TrafficSignFilters
          search={searchInput}
          selectedCategory={selectedCategory}
          groups={data?.groups}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Danh sách biển báo */}
      <section className="mt-8" aria-label="Danh sách biển báo">

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[20px] font-bold leading-7 text-[#101828] dark:text-[#f8fafc]">
            {categoryLabel}
          </h2>

          {!isLoading && !isError && !isDebouncing && (
            <span className="inline-flex min-h-7 items-center rounded-[7px] bg-[#eef2ff] px-2.5 text-[14px] font-semibold text-[#667085] dark:bg-[#26364e] dark:text-[#cbd5e1]">
              {total} biển phù hợp
            </span>
          )}
        </div>

        {/* Loading */}
        {(isLoading || isDebouncing) && (
          <TrafficSignGridSkeleton />
        )}

        {/* Lỗi lấy dữ liệu */}
        {!isLoading && !isDebouncing && isError && (
          <TrafficSignError onRetry={() => void refetch()} />
        )}

        {/* Danh sách card biển báo */}
        {!isLoading && !isDebouncing && !isError && items.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-[0.6cm] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((sign) => (
              <TrafficSignCard key={sign.id} sign={sign} onOpenDetail={onOpenDetail} />
            ))}
          </div>
        )}

        {/* Danh sách rỗng */}
        {!isLoading && !isDebouncing && !isError && items.length === 0 && (
          <TrafficSignEmpty search={debouncedSearch} categoryLabel={categoryLabel} page={page} />
        )}

        {/* Phân trang */}
        {!isLoading && !isDebouncing && !isError && totalPages > 1 && (
          <nav aria-label="Phân trang biển báo" className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-[#e4e7ec] bg-white px-4 text-[14px] font-semibold text-[#344054] transition hover:border-[#b9c9f7] hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25 disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#35445a] dark:bg-[#182231] dark:text-[#cbd5e1]"
            >
              <ChevronLeft className="size-4" />
              Trước
            </button>

            <span className="text-[14px] font-medium text-[#667085] dark:text-[#aab8cf]">
              Trang {page + 1} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-[#e4e7ec] bg-white px-4 text-[14px] font-semibold text-[#344054] transition hover:border-[#b9c9f7] hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25 disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#35445a] dark:bg-[#182231] dark:text-[#cbd5e1]"
            >
              Sau
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

function TrafficSignGridSkeleton() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-[0.6cm] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-[308px] animate-pulse rounded-[16px] border border-[#e3e7ee] bg-white dark:border-[#35445a] dark:bg-[#182231]" />
      ))}
    </div>
  );
}

function TrafficSignError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-5 rounded-[16px] border border-[#fecdca] bg-white px-6 py-10 text-center dark:bg-[#182231]">
      <h3 className="text-[18px] font-bold text-[#b42318] dark:text-[#fca5a5]">
        Không tải được dữ liệu biển báo
      </h3>

      <p className="mt-3 text-[15px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf]">
        Không thể tải danh sách biển báo ở thời điểm hiện tại.
      </p>

      <button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-[#f2f4f7] px-5 text-[14px] font-semibold text-[#344054] transition hover:bg-[#e9edf3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25 dark:bg-[#26364e] dark:text-[#e2e8f0]">
        <RefreshCcw className="size-4" />
        Thử lại
      </button>
    </div>
  );
}

function TrafficSignEmpty({
  search,
  categoryLabel,
  page,
}: {
  search: string;
  categoryLabel: string;
  page: number;
}) {
  const hasSearch = Boolean(search.trim());

  return (
    <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[16px] border border-[#e3e7ee] bg-white px-6 py-10 text-center dark:border-[#35445a] dark:bg-[#182231]">
      <div className="max-w-[440px]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#f2f4f7] text-[#98a2b3] dark:bg-[#26364e]">
          <ImageOff className="size-6" strokeWidth={1.8} />
        </span>

        <h3 className="mt-4 text-[18px] font-bold leading-7 text-[#101828] dark:text-[#f8fafc]">
          {page > 0
            ? "Không có biển báo trên trang này"
            : hasSearch
              ? "Không tìm thấy biển báo phù hợp"
              : "Nhóm biển báo hiện chưa có dữ liệu"}
        </h3>

        <p className="mt-3 text-[15px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf]">
          {page > 0
            ? "Bạn có thể quay lại trang trước để xem các biển báo đã tải."
            : hasSearch
              ? `Không có kết quả trong nhóm ${categoryLabel} khớp với nội dung bạn đang tìm.`
              : `Hiện chưa có biển báo được công bố thuộc nhóm ${categoryLabel}.`}
        </p>
      </div>
    </div>
  );
}
