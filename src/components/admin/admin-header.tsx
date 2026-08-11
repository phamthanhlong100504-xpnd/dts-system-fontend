"use client";

import { Search, Bell, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-[260px] z-40 bg-background/80 backdrop-blur-md border-b border-border flex justify-between items-center h-16 px-6">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        {title ? (
          <h2 className="text-lg font-bold tracking-tight text-foreground hidden sm:block">
            {title}
          </h2>
        ) : (
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm thông tin trong hệ thống..."
              className="pl-9 bg-muted/40 text-sm h-9"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Thông báo"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
        </button>

        <button
          type="button"
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Trợ giúp"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
          AD
        </div>
      </div>
    </header>
  );
}
