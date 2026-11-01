"use client";

import type { ReactNode } from "react";
import { Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFailure } from "../admin-errors";

export function AdminPageState({ state, title, description, error, onRetry, children }: {
  state: "loading" | "empty" | "error" | "forbidden" | "conflict" | "processing" | "ready";
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  if (state === "ready") return children;
  const failure = adminFailure(error);
  const pending = state === "loading" || state === "processing";
  const warningCard = !pending && state !== "forbidden";
  const Icon = pending ? Loader2 : state === "forbidden" ? ShieldAlert : TriangleAlert;
  const titles = {
    loading: "Đang tải dữ liệu", empty: "Chưa có dữ liệu", error: "Không thể tải dữ liệu",
    forbidden: "Truy cập bị từ chối", conflict: "Dữ liệu đã thay đổi", processing: "Đang xử lý",
  };
  return (
    <section role={pending || state === "empty" ? "status" : "alert"} aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-sm"
      style={warningCard ? { paddingBlock: "calc(1.5rem + 1.25cm)" } : undefined}>
      <Icon aria-hidden="true" className={`h-6 w-6 ${pending ? "animate-spin text-primary" : "text-muted-foreground"}`} />
      <h2 className="text-base font-semibold">{title ?? titles[state]}</h2>
      {Boolean(description || error) && <p className="max-w-xl text-[14.5px]/5 text-muted-foreground">{description ?? failure.message}</p>}
      {failure.traceId && <p className="text-[12.5px]/4 text-muted-foreground">Mã hỗ trợ: {failure.traceId}</p>}
      {onRetry && !pending && state !== "forbidden" && <Button type="button" variant="outline" onClick={onRetry}>Tải lại</Button>}
      {children}
    </section>
  );
}
