"use client";

import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

import type { OfficialExamTab } from "@/features/examination/official-exam-types";
import { cn } from "@/lib/utils";

interface OfficialExamTabsProps {
  value: OfficialExamTab;
  onChange: (tab: OfficialExamTab) => void;
}

const TABS: {
  id: OfficialExamTab;
  label: string;
  icon: typeof CircleDot;
}[] = [
  {
    id: "OPEN",
    label: "Đang mở",
    icon: CircleDot,
  },
  {
    id: "UPCOMING",
    label: "Sắp diễn ra",
    icon: CalendarClock,
  },
  {
    id: "PARTICIPATED",
    label: "Đã tham gia",
    icon: CheckCircle2,
  },
];

export function OfficialExamTabs({
  value,
  onChange,
}: OfficialExamTabsProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-[12px] bg-[#f0f2fb] p-1.5 sm:w-fit">
      {TABS.map((tab) => {
        const active = value === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-[9px] px-4 text-[14px] font-semibold transition",
              active
                ? "bg-white text-[#0758d9] shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                : "text-[#667085] hover:bg-white/60 hover:text-[#344054]"
            )}
          >
            <Icon
              className="size-4"
              strokeWidth={2}
            />

            {tab.label}
          </button>
        );
      })}
    </div>
  );
}