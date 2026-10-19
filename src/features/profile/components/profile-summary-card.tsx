
"use client";

import { CarFront } from "lucide-react";

import type {
  Profile,
  ProfileRole,
} from "@/features/profile/profile-service";

interface ProfileSummaryCardProps {
  user: Profile;
  roles?: readonly ProfileRole[];
  rolesPending?: boolean;
  rolesError?: boolean;
  licenseClass: string;
  onChangeLicense: () => void;
}

export function ProfileSummaryCard({
  user,
  roles,
  rolesPending = false,
  rolesError = false,
  licenseClass,
  onChangeLicense,
}: ProfileSummaryCardProps) {
  const displayName =
    user.fullName?.trim() ||
    user.username?.trim() ||
    "Người dùng";

  const initials = getInitials(displayName);

  const roleLabel = rolesPending
    ? "Đang tải vai trò..."
    : rolesError
      ? "Chưa xác nhận vai trò"
      : getRoleLabel(roles ?? []);

  return (
    <section className="flex h-full flex-col rounded-[18px] border border-[#e3e5ec] bg-white px-[0.6cm] pb-[1cm] pt-[0.6cm] shadow-[0_3px_12px_rgba(31,41,55,0.035)] dark:border-[#35445a] dark:bg-[#182231]">

      {/* Thông tin tài khoản */}
      <div className="flex flex-col items-center text-center">
        <div className="flex size-[64px] items-center justify-center rounded-full bg-[#2f6df6] text-[17px] font-bold text-white">
          {initials}
        </div>

        <h2 className="mt-4 break-words text-[18px] font-bold leading-[1.4] text-[#101828] dark:text-[#f8fafc]">
          {displayName}
        </h2>

        <p className="mt-1 max-w-full break-all text-[13.5px] font-medium leading-5 text-[#475467] dark:text-[#aab8cf]">
          {user.email?.trim() || "—"}
        </p>

        <span className="mt-3 rounded-full bg-[#f0f3ff] px-3 py-1.5 text-[12.5px] font-semibold text-[#344054] dark:bg-[#26364e] dark:text-[#cbd5e1]">
          {roleLabel}
        </span>
      </div>

      {/* Đẩy khối hạng GPLX xuống dưới card */}
      <div className="mt-auto">

        {/* Khoảng cách tối thiểu 1cm giữa vai trò và khối GPLX */}
        <div className="my-[0.5cm] h-px bg-[#eef0f4] dark:bg-[#35445a]" />

        {/* Khối hạng đang học */}
        <div className="rounded-[12px] bg-[#f4f6ff] p-4 dark:bg-[#26364e]">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-[#475467] dark:text-[#aab8cf]">
            Hạng đang học
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-[8px] bg-[#e8efff] px-3 text-[13.5px] font-bold text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]">
              <CarFront
                className="size-4"
                strokeWidth={2}
              />

              {licenseClass}
            </span>

            <button
              type="button"
              onClick={onChangeLicense}
              className="inline-flex h-10 items-center text-[14.5px] font-semibold text-[#0758d9] transition hover:text-[#064fc2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/20 dark:text-[#93b4ff]"
            >
              Đổi hạng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function getRoleLabel(
  roles: readonly ProfileRole[]
): string {
  const names = roles.map(
    (role) => role.name
  );

  if (
    names.includes("ROLE_ADMIN") ||
    names.includes("ADMIN")
  ) {
    return "Quản trị viên";
  }

  if (
    names.includes("ROLE_STUDENT") ||
    names.includes("STUDENT")
  ) {
    return "Học viên";
  }

  return names.length > 0
    ? names.join(", ").replace(/ROLE_/g, "")
    : "Chưa được cấp vai trò";
}

function getInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "ND";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}
