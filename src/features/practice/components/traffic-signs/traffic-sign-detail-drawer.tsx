
"use client";

import { useEffect, useRef } from "react";
import { ImageOff, Lightbulb, X } from "lucide-react";

import { MediaImage } from "@/components/ui/media-image";
import {
  TRAFFIC_SIGN_CATEGORIES,
  type TrafficSign,
} from "@/features/practice/traffic-sign-types";

interface TrafficSignDetailDrawerProps {
  open: boolean;
  sign: TrafficSign | null;
  onClose: () => void;
}

export function TrafficSignDetailDrawer({
  open,
  sign,
  onClose,
}: TrafficSignDetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const previousFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocused?.focus();
    };
  }, [open, onClose]);

  if (!open || !sign) return null;

  const categoryLabel =
    TRAFFIC_SIGN_CATEGORIES.find(
      (category) => category.groupCode === sign.groupCode
    )?.label ?? sign.groupName;

  const quickTip = sign.memoryTip?.trim();

  return (
    <div className="font-dts fixed inset-0 z-[80]">

      {/* Lớp phủ phía sau */}
      <button type="button" aria-label="Đóng chi tiết biển báo" onClick={onClose} className="absolute inset-0 cursor-default bg-[#101828]/30 backdrop-blur-[2px]" />

      {/* Drawer */}
      <aside role="dialog" aria-modal="true" aria-label={`Chi tiết ${sign.name}`} className="absolute right-0 top-0 flex h-full w-full max-w-[calc(480px-1.5cm)] flex-col border-l border-[#e3e7ee] bg-white shadow-[-14px_0_36px_rgba(15,23,42,0.1)] dark:border-[#35445a] dark:bg-[#182231]">

        {/* Header drawer */}
        <div className="flex min-h-[90px] shrink-0 items-start justify-between gap-4 border-b border-[#eaecf0] px-6 py-5 dark:border-[#35445a]">
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold uppercase tracking-[0.04em] text-[#0758d9] dark:text-[#93b4ff]">
              {categoryLabel.toUpperCase()}
            </p>

            <h2 className="mt-1.5 break-words text-[20px] font-bold leading-7 text-[#101828] dark:text-[#f8fafc]">
              {sign.code} · {sign.name}
            </h2>
          </div>

          <button ref={closeButtonRef} type="button" aria-label="Đóng" onClick={onClose} className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#475467] transition hover:bg-[#f2f4f7] hover:text-[#344054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/25 dark:text-[#cbd5e1] dark:hover:bg-[#26364e]">
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        {/* Nội dung có thể cuộn */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-6">

          {/* Hình ảnh biển báo */}
          <div className="flex min-h-[240px] w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#f7f8fb] p-5 dark:bg-[#26364e]">
            {sign.mediaFileId ? (
              <MediaImage src={sign.mediaFileId} alt={sign.name} className="max-h-[210px] max-w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-[#98a2b3] dark:text-[#aab8cf]">
                <ImageOff className="size-7" strokeWidth={1.7} />
                <span className="text-[13.5px] font-medium">Chưa có hình ảnh</span>
              </div>
            )}
          </div>

          {/* Mã và tên biển báo */}
          <div className="mt-6">
            <span className="inline-flex min-h-7 items-center rounded-[7px] bg-[#eef2ff] px-3 text-[13.5px] font-bold text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]">
              {sign.code}
            </span>

            <h3 className="mt-3 break-words text-[20px] font-bold leading-7 text-[#101828] dark:text-[#f8fafc]">
              {sign.name}
            </h3>
          </div>

          {/* Nhóm biển báo */}
          <div className="mt-5 rounded-[12px] border border-[#e4e7ec] bg-[#fafbfc] px-4 py-4 dark:border-[#35445a] dark:bg-[#26364e]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[14.5px] font-medium text-[#475467] dark:text-[#aab8cf]">
                Nhóm biển
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[14.5px] font-semibold text-[#0758d9] ring-1 ring-[#e4e7ec] dark:bg-[#182231] dark:text-[#93b4ff] dark:ring-[#35445a]">
                <span className="size-2 rounded-full bg-[#0758d9]" />
                {sign.groupName}
              </span>
            </div>
          </div>

          {/* Ý nghĩa*/}
          <div className="mt-6">
            <p className="text-[13.5px] font-bold uppercase tracking-[0.04em] text-[#475467] dark:text-[#aab8cf]">
              Ý nghĩa
            </p>

            <div className="mt-3 rounded-[12px] border border-[#e4e7ec] bg-white px-4 py-4 dark:border-[#35445a] dark:bg-[#182231]">
              <p className="whitespace-pre-line break-words text-[15.5px] font-medium leading-6 text-[#344054] dark:text-[#cbd5e1]">
                {sign.meaning}
              </p>
            </div>
          </div>

          {/* Ghi nhớ nhanh*/}
          {quickTip && (
            <div className="mt-6 rounded-[12px] border border-[#dbe7ff] bg-[#f4f8ff] px-4 py-4 dark:border-[#365485] dark:bg-[#26364e]">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-white text-[#0758d9] dark:bg-[#182231] dark:text-[#93b4ff]">
                  <Lightbulb className="size-5" strokeWidth={2} />
                </span>

                <div className="min-w-0">
                  <p className="text-[16px] font-bold leading-6 text-[#27364f] dark:text-[#f8fafc]">
                    Ghi nhớ nhanh
                  </p>

                  <p className="mt-2 whitespace-pre-line break-words text-[15.5px] font-medium leading-6 text-[#475467] dark:text-[#cbd5e1]">
                    {quickTip}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
