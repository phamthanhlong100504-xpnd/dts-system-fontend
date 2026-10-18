
"use client";

import { Search } from "lucide-react";

import {
  TRAFFIC_SIGN_CATEGORIES,
  type TrafficSignCategory,
  type TrafficSignGroupDto,
} from "@/features/practice/traffic-sign-types";
import { cn } from "@/lib/utils";

interface TrafficSignFiltersProps {
  search: string;
  selectedCategory: TrafficSignCategory;
  groups?: readonly TrafficSignGroupDto[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: TrafficSignCategory) => void;
}

export function TrafficSignFilters({
  search,
  selectedCategory,
  groups,
  onSearchChange,
  onCategoryChange,
}: TrafficSignFiltersProps) {
  return (
    <div className="font-dts w-full">
      <div className="relative w-full">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#98a2b3]" strokeWidth={1.9} />

        <input
          type="search"
          value={search}
          maxLength={255}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm biển báo theo tên hoặc mã (ví dụ: P.101, Cấm ô tô)..."
          aria-label="Tìm kiếm biển báo giao thông"
          className="h-12 w-full rounded-[12px] border border-[#e3e7ee] bg-white pl-12 pr-4 text-[15.5px] font-medium text-[#344054] outline-none transition placeholder:text-[15.5px] placeholder:text-[#98a2b3] focus:border-[#9db8ff] focus:ring-2 focus:ring-[#0758d9]/15 dark:border-[#35445a] dark:bg-[#182231] dark:text-[#e2e8f0] dark:placeholder:text-[#94a3b8]"
        />
      </div>
      <div className="mt-5 grid w-full grid-cols-2 gap-x-[0.8cm] gap-y-3 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Nhóm biển báo">
        {TRAFFIC_SIGN_CATEGORIES.map((category) => {
          const active = category.id === selectedCategory;

          const count = groups?.find(
            (group) => group.groupCode === category.groupCode
          )?.totalElements;

          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "inline-flex min-h-11 min-w-0 w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0 rounded-[10px] border px-2 py-2 text-center text-[15px] font-semibold leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25",
                active
                  ? "border-[#dce5ff] bg-[#e8eeff] text-[#0758d9] dark:border-[#365485] dark:bg-[#26364e] dark:text-[#93b4ff]"
                  : "border-[#e9edf4] bg-white text-[#475467] hover:border-[#c8d5ee] hover:bg-[#f4f6fa] hover:text-[#101828] dark:border-[#35445a] dark:bg-[#182231] dark:text-[#cbd5e1] dark:hover:bg-[#26364e]"
              )}
            >
              <span>{category.label}</span>

              {typeof count === "number" && (
                <span className="shrink-0 text-[13px] font-medium opacity-75">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
