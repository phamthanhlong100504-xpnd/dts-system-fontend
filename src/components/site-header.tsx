"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, LogOut, Shield } from "lucide-react";
import { isAdminSelector, isAuthenticatedSelector, useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/features/auth/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore(isAuthenticatedSelector);
  const isAdmin = useAuthStore(isAdminSelector);
  const logoutMutation = useLogout();

  // Đóng SiteHeader khi ở các trang /admin (vì Admin Layout có Header/Sidebar riêng)
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Car className="h-5 w-5" />
          <span>DTS Lái xe</span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <NavLink href="/examination">Thi chính thức</NavLink>
            <NavLink href="/practice">Luyện tập</NavLink>
            <NavLink href="/practice/history">Lịch sử thi</NavLink>
            <NavLink href="/practice/leaderboard">Bảng xếp hạng</NavLink>
            <NavLink href="/progress">Tiến độ</NavLink>
            <NavLink href="/profile">Hồ sơ</NavLink>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4" />
                    Quản trị
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Quản trị hệ thống</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users">Người dùng</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/roles">Vai trò & Quyền</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground md:inline">
                {user?.fullName ?? user?.username}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Đăng xuất"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}
