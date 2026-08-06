"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  /** ISO — nguồn thời gian còn lại (server-authoritative) */
  expiresAt: string;
  /** Gọi 1 lần khi hết giờ */
  onExpire: () => void;
}

/** Đồng hồ đếm ngược từ expiresAt; đỏ khi dưới 60s. */
export function ExamTimer({ expiresAt, onExpire }: ExamTimerProps) {
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  // Luôn giữ onExpire mới nhất mà không phải re-subscribe interval mỗi render
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const tick = () => {
      const rem = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setRemaining(rem);
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <span
      className={cn(
        "flex items-center gap-1 font-mono text-sm font-semibold tabular-nums",
        remaining < 60 ? "text-destructive" : "text-foreground"
      )}
      aria-label="Thời gian còn lại"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2" />
        <path d="M5 3 2 6" />
        <path d="m22 6-3-3" />
        <path d="M6.38 18.7 4 21" />
        <path d="M17.64 18.67 20 21" />
      </svg>
      {mm}:{ss}
    </span>
  );
}
