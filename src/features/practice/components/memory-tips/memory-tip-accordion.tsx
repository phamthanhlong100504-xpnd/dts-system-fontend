
"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";

import type { MemoryTip } from "@/features/practice/memory-tip-types";
import { cn } from "@/lib/utils";

interface MemoryTipAccordionProps {
  items: MemoryTip[];
}

export function MemoryTipAccordion({ items }: MemoryTipAccordionProps) {

  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const expandedId = openId === undefined ? items[0]?.id ?? null : openId;

  function handleToggle(id: string) {
    setOpenId((current) => {
      const activeId = current === undefined ? items[0]?.id ?? null : current;
      return activeId === id ? null : id;
    });
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#dfe3ea] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.035)] dark:border-[#35445a] dark:bg-[#182231]">
      {items.map((item, index) => (
        <MemoryTipItem key={item.id} item={item} index={index} expanded={item.id === expandedId} onToggle={() => handleToggle(item.id)} />
      ))}
    </div>
  );
}

function MemoryTipItem({ item, index, expanded, onToggle }: { item: MemoryTip; index: number; expanded: boolean; onToggle: () => void }) {
  const number = String(index + 1).padStart(2, "0");

  const quickRuleParts = item.quickRule.split("|").map((part) => part.trim()).filter(Boolean);
  const hasSeparatePoints = quickRuleParts.length > 1;

  return (
    <section className={cn(index > 0 && "border-t border-[#eef0f4] dark:border-[#35445a]")}>

      {/* Tiêu đề từng mẹo */}
      <button type="button" aria-expanded={expanded} onClick={onToggle} className="flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3 text-left transition hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0758d9]/25 sm:px-[0.6cm] dark:hover:bg-[#26364e]">

        <span className={cn("inline-flex h-8 min-w-[40px] shrink-0 items-center justify-center rounded-[7px] px-2 text-[13.5px] font-bold", expanded ? "bg-[#eef3ff] text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]" : "bg-[#f1f4f8] text-[#98a2b3] dark:bg-[#26364e] dark:text-[#aab8cf]")}>
          {number}
        </span>

        <span className="min-w-0 flex-1 text-[16px] font-bold leading-6 text-[#101828] dark:text-[#f8fafc]">
          {item.title}
        </span>

        <ChevronDown className={cn("size-5 shrink-0 text-[#98a2b3] transition-transform duration-200", expanded && "rotate-180 text-[#0758d9] dark:text-[#93b4ff]")} strokeWidth={2} />
      </button>

      {/* Nội dung accordion */}
      {expanded && (
        <div className="px-4 pb-[0.6cm] sm:px-[0.6cm]">

          {/* Ghi nhớ nhanh */}
          <div className="rounded-[12px] border border-[#d8e5ff] bg-[#f2f6ff] px-4 py-4 dark:border-[#365485] dark:bg-[#26364e]">
            <div className="flex items-start gap-3">

              <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#0758d9] dark:text-[#93b4ff]" strokeWidth={2} />

              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.04em] text-[#0758d9] dark:text-[#93b4ff]">
                  Ghi nhớ nhanh
                </p>

                {/*  */}
                {hasSeparatePoints ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] font-medium leading-6 text-[#27364f] marker:text-[#0758d9] dark:text-[#e2e8f0] dark:marker:text-[#93b4ff]">
                    {quickRuleParts.map((part, partIndex) => (
                      <li key={`${item.id}-${partIndex}`} className="whitespace-pre-line break-words pl-1">
                        {part}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 whitespace-pre-line break-words text-[14.5px] font-medium leading-6 text-[#27364f] dark:text-[#e2e8f0]">
                    {item.quickRule}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Giải thích */}
          <div className="mt-5">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.04em] text-[#475467] dark:text-[#aab8cf]">
              Giải thích
            </p>

            <p className="mt-2 whitespace-pre-line break-words text-[14.5px] font-medium leading-6 text-[#344054] dark:text-[#cbd5e1]">
              {item.explanation}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
