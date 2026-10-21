
"use client";

import { ArrowRight, ImageOff } from "lucide-react";

import { MediaImage } from "@/components/ui/media-image";
import type { TrafficSign } from "@/features/practice/traffic-sign-types";

interface TrafficSignCardProps {
  sign: TrafficSign;
  onOpenDetail: (sign: TrafficSign) => void;
}

export function TrafficSignCard({ sign, onOpenDetail }: TrafficSignCardProps) {
  return (
    <article className="font-dts flex h-full min-h-[308px] min-w-0 flex-col items-center rounded-[14px] border border-[#d0d5dd] bg-white px-5 pb-3 pt-5 shadow-[0_2px_4px_rgba(15,23,42,0.025)] transition-all duration-200 hover:border-[#dce5f5] hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:border-[#35445a] dark:bg-[#182231]">

      <div className="mx-auto flex size-[132px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-white dark:bg-[#182231]">
        {sign.mediaFileId ? (
          <MediaImage src={sign.mediaFileId} alt={sign.name} className="size-full object-contain p-[10px]" />
        ) : (
          <TrafficSignImagePlaceholder />
        )}
      </div>

      <div className="mt-[14px] flex justify-center">
        <span className="inline-flex min-h-6 items-center justify-center rounded-[5px] bg-[#e9edff] px-2.5 text-[13.5px] font-bold leading-5 text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]">
          {sign.code}
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 min-h-[44px] w-full break-words text-center text-[17px] font-bold leading-[22px] text-[#101828] dark:text-[#f8fafc]">
        {sign.name}
      </h2>

      <button
        type="button"
        onClick={() => onOpenDetail(sign)}
        className="mx-auto mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-[9px] border border-[#0758d9] bg-[#0758d9] px-3.5 text-[14px] font-semibold text-white shadow-[0_2px_6px_rgba(7,88,217,0.18)] transition-all duration-200 hover:border-[#064bc0] hover:bg-[#064bc0] hover:text-white hover:shadow-[0_3px_9px_rgba(7,88,217,0.24)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/30 focus-visible:ring-offset-2 dark:border-[#0758d9] dark:bg-[#0758d9] dark:text-white dark:hover:border-[#064bc0] dark:hover:bg-[#064bc0]"
      >
        Xem chi tiết
        <ArrowRight className="size-[14px]" strokeWidth={2} />
      </button>
    </article>
  );
}

function TrafficSignImagePlaceholder() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 text-[#98a2b3] dark:text-[#aab8cf]">
      <span className="flex size-11 items-center justify-center rounded-[10px] bg-white dark:bg-[#182231]">
        <ImageOff className="size-5" strokeWidth={1.7} />
      </span>
      <span className="text-[13.5px] font-medium">Chưa có hình ảnh</span>
    </div>
  );
}
