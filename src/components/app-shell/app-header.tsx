"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CarFront,
  CircleUserRound,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { LicenseSwitcherDialog } from "@/components/app-shell/license-switcher-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAVIGATION } from "@/config/navigation";
import { useLogout } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";
import {
  isAdminSelector,
  useAuthStore,
} from "@/stores/auth-store";
import { useLicenseStore } from "@/stores/license-store";

export function AppHeader() {
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore(isAdminSelector);

  const selectedLicense = useLicenseStore(
    (state) => state.selectedLicense
  );

  const logoutMutation = useLogout();

  const [licenseDialogOpen, setLicenseDialogOpen] =
    useState(false);

  const displayName =
    user?.fullName?.trim() ||
    user?.username ||
    "Tài khoản";

  return (
    <>
      <header className="font-dts sticky top-0 z-50 border-b border-[#e3e7ee] bg-white">
        <div className="mx-auto flex h-[64px] w-full max-w-[1480px] items-center gap-6 pl-6 pr-1 lg:pl-8 lg:pr-1">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
          >
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#0758d9] text-white">
              <CarFront
                className="size-[18px]"
                strokeWidth={2.3}
              />
            </span>

            <span className="leading-tight">
              <span className="block text-[16px] font-bold text-[#101828]">
                DTS
              </span>

              <span className="block text-[11px] font-semibold text-[#0758d9]">
                Lái xe
              </span>
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex">
            {APP_NAVIGATION.map((item) => {
              const active = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[9px] px-3.5 py-2 text-[15px] font-semibold transition-colors",
                    active
                      ? "bg-[#eef3ff] text-[#0758d9]"
                      : "text-[#475467] hover:bg-[#f5f7fa] hover:text-[#101828]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 outline-none transition hover:bg-[#f5f7fa]">
                <span className="hidden max-w-[150px] truncate text-[14px] font-semibold text-[#1d2939] md:block">
                  {displayName}
                </span>

                <span className="flex size-9 items-center justify-center rounded-full bg-[#0758d9] text-white">
                  <CircleUserRound
                    className="size-[20px]"
                    strokeWidth={2.1}
                  />
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="font-dts w-60"
              >
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <div className="font-semibold text-[#101828]">
                      {displayName}
                    </div>

                    {user?.email && (
                      <div className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {selectedLicense && (
                  <>
                    <DropdownMenuItem
                      onSelect={() =>
                        setLicenseDialogOpen(true)
                      }
                      className="cursor-pointer"
                    >
                      <CarFront className="size-4" />
                      Hạng đang học - {selectedLicense}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="cursor-pointer"
                  >
                    <UserRound className="size-4" />
                    Hồ sơ
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="cursor-pointer"
                      >
                        <ShieldCheck className="size-4" />
                        Quản trị hệ thống
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={logoutMutation.isPending}
                  onClick={() =>
                    logoutMutation.mutate()
                  }
                  className="cursor-pointer"
                >
                  <LogOut className="size-4" />

                  {logoutMutation.isPending
                    ? "Đang đăng xuất..."
                    : "Đăng xuất"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <LicenseSwitcherDialog
        open={licenseDialogOpen}
        onOpenChange={setLicenseDialogOpen}
      />
    </>
  );
}