"use client";
import { useAuthStore } from "@/stores/auth-store";
export function adminInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(-2).map((p) => Array.from(p)[0]).join("").toLocaleUpperCase("vi-VN") || "?";
}
export function AdminAccount({ compact = false }: { compact?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const name = user?.fullName?.trim() || user?.username?.trim() || user?.email?.trim() || "Chưa xác định tài khoản";
  return <div className="flex min-w-0 items-center gap-3">
    <span aria-hidden="true" className={`${compact ? "h-8 w-8 text-[12.5px]/4" : "h-9 w-9 text-[14.5px]/5"} flex shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-semibold text-primary`}>{adminInitials(name)}</span>
    {!compact && <span className="flex min-w-0 flex-col text-left"><span className="truncate text-[14.5px]/5 font-semibold text-foreground" title={name}>{name}</span>{user?.email && <span className="truncate text-[12.5px]/4 text-muted-foreground" title={user.email}>{user.email}</span>}</span>}
  </div>;
}
