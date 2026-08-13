"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  BookOpen,
  FolderTree,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Tổng quan",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Ngân hàng câu hỏi",
    href: "/admin/questions",
    icon: HelpCircle,
  },
  {
    name: "Chương trình học",
    href: "/admin/programs",
    icon: BookOpen,
  },
  {
    name: "Quản lý chương",
    href: "/admin/chapters",
    icon: FolderTree,
  },
  {
    name: "Quản lý đề thi",
    href: "/admin/exams",
    icon: ShieldCheck,
  },
  {
    name: "Cài đặt",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[260px] bg-background border-r border-border shadow-sm z-50">
      <div className="flex flex-col h-full p-4 gap-2">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-2 pt-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              Admin Panel
            </h1>
            <p className="text-xs text-muted-foreground">Hệ thống quản trị DTS</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm scale-[0.98]"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 mx-2 rounded-xl font-medium text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Giao diện học viên</span>
          </Link>
          
          {/* User Profile Snippet in Sidebar */}
          <div className="pt-4 border-t border-border flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            A
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-foreground">
              Admin User
            </span>
            <span className="text-xs text-muted-foreground truncate">
              admin@dts.edu.vn
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
