"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CarFront, RefreshCcw } from "lucide-react";

import { useUpdateProfile } from "@/features/auth/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/profile/use-profile";
import type { Profile } from "@/features/profile/profile-service";
import { useUpdateCurrentLicense } from "@/features/license/use-license";
import { ProfileAppearanceCard } from "@/features/profile/components/profile-appearance-card";
import { ProfileLearningCard } from "@/features/profile/components/profile-learning-card";
import { ProfileLicenseDialog } from "@/features/profile/components/profile-license-dialog";
import { ProfilePersonalInfoCard } from "@/features/profile/components/profile-personal-info-card";
import { ProfileSecurityCard } from "@/features/profile/components/profile-security-card";
import { ProfileSummaryCard } from "@/features/profile/components/profile-summary-card";

export function ProfileContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, rolesQuery, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const updateLicense = useUpdateCurrentLicense();
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);

  function handleSelectLicense(value: string) {
    if (updateLicense.isPending || !profile) return;

    updateLicense.mutate(
      { licenseClass: value },
      {
        onSuccess: (response) => {
          setLicenseDialogOpen(false);
          // Only update this view after a confirmed backend PUT.
          queryClient.setQueryData<Profile>(["auth", "me"], (current) =>
            current ? { ...current, selectedLicenseClass: response.licenseClass } : current
          );
          void refetch();
        },
      }
    );
  }

  function handleSavePersonalInfo(values: { fullName: string; email: string }) {
    if (updateProfile.isPending) return;
    updateProfile.mutate({ fullName: values.fullName, email: values.email });
  }

  if (isLoading) return <ProfileLoading />;

  if (isError || !profile) {
    return <ProfileError onRetry={() => void refetch()} />;
  }

  const displayName =
    profile.fullName?.trim() || profile.username?.trim() || "Người dùng";
  const email = profile.email?.trim() || "";

  // Identity is authoritative; an absent field is different from null.
  const hasLicenseContract = profile.selectedLicenseClass !== undefined;
  const licenseClass =
    typeof profile.selectedLicenseClass === "string" &&
    profile.selectedLicenseClass.trim()
      ? profile.selectedLicenseClass.trim().toUpperCase()
      : null;


  return (
    <div className="font-dts mx-auto w-full max-w-[1240px] px-6 pb-16 pt-7 lg:px-[38px]">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.025em] text-[#101828] dark:text-[#f8fafc]">
          Hồ sơ
        </h1>
        <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
          Quản lý thông tin cá nhân và cài đặt tài khoản.
        </p>
      </div>

      <div className="mt-6 grid items-stretch gap-[0.7cm] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {!hasLicenseContract ? (
          <ProfileLicenseUnavailable onRetry={() => void refetch()} />
        ) : licenseClass ? (
          <ProfileSummaryCard
            user={profile}
            roles={rolesQuery.data}
            rolesPending={rolesQuery.isPending}
            rolesError={rolesQuery.isError}
            licenseClass={licenseClass}
            onChangeLicense={() => setLicenseDialogOpen(true)}
          />
        ) : (
          <NoLicenseCard onSelectLicense={() => router.push("/")} />
        )}

        <ProfilePersonalInfoCard
          key={`${profile.id ?? "me"}:${displayName}:${email}`}
          fullName={profile.fullName ?? ""}
          email={email}
          isSaving={updateProfile.isPending}
          emailVerified={Boolean(profile.emailVerifiedAt)}
          onSave={handleSavePersonalInfo}
        />
      </div>

      <div className="mt-[1cm] space-y-[1cm]">
        {hasLicenseContract && licenseClass && (
          <ProfileLearningCard
            licenseClass={licenseClass}
            onChangeLicense={() => setLicenseDialogOpen(true)}
          />
        )}
        <ProfileAppearanceCard />
        <ProfileSecurityCard />
      </div>

      {hasLicenseContract && licenseClass && (
        <ProfileLicenseDialog
          open={licenseDialogOpen}
          selectedLicense={licenseClass}
          onOpenChange={setLicenseDialogOpen}
          onSelect={handleSelectLicense}
        />
      )}
    </div>
  );
}

function NoLicenseCard({ onSelectLicense }: { onSelectLicense: () => void }) {
  return (
    <section className="flex min-h-[300px] flex-col items-center justify-center rounded-[18px] border border-[#e3e5ec] dark:border-[#35445a] bg-white dark:bg-[#182231] p-[0.6cm] text-center shadow-[0_3px_12px_rgba(31,41,55,0.035)]">
      <span className="flex size-12 items-center justify-center rounded-[12px] bg-[#eef3ff] dark:bg-[#26364e] text-[#0758d9] dark:text-[#93b4ff]">
        <CarFront className="size-5" strokeWidth={2} />
      </span>
      <h2 className="mt-4 text-[17px] font-bold text-[#101828] dark:text-[#f8fafc]">Chưa chọn hạng GPLX</h2>
      <p className="mt-2 max-w-[260px] text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
        Chọn hạng GPLX để DTS hiển thị nội dung học tập và tiến độ phù hợp.
      </p>
      <button
        type="button"
        onClick={onSelectLicense}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-5 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3]"
      >
        Chọn hạng GPLX <ArrowRight className="size-4" />
      </button>
    </section>
  );
}

function ProfileLicenseUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="flex min-h-[300px] flex-col justify-center rounded-[18px] border border-[#fedf89] bg-white dark:bg-[#182231] p-[0.6cm] shadow-[0_3px_12px_rgba(31,41,55,0.035)]">
      <AlertCircle className="size-6 text-[#b54708]" />
      <h2 className="mt-4 text-[16px] font-bold text-[#101828] dark:text-[#f8fafc]">
        Chưa xác nhận được hạng GPLX
      </h2>
      <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
        Identity chưa trả trường selectedLicenseClass. Trang Hồ sơ không dùng hạng đã lưu trên trình duyệt để thay thế.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-10 w-fit items-center gap-2 rounded-[10px] bg-[#eef3ff] dark:bg-[#26364e] px-4 text-[13.5px] font-semibold text-[#0758d9] dark:text-[#93b4ff]"
      >
        <RefreshCcw className="size-4" /> Tải lại
      </button>
    </section>
  );
}

function ProfileLoading() {
  return (
    <div className="font-dts mx-auto w-full max-w-[1240px] px-6 pb-16 pt-7 lg:px-[38px]">
      <div className="h-9 w-[115px] animate-pulse rounded-[8px] bg-[#e9edf3]" />
      <div className="mt-2 h-5 w-[330px] max-w-full animate-pulse rounded-[6px] bg-[#edf0f5]" />
      <div className="mt-6 grid gap-[0.7cm] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="h-[340px] animate-pulse rounded-[18px] border border-[#e7e9f0] dark:border-[#35445a] bg-white dark:bg-[#182231]" />
        <div className="h-[340px] animate-pulse rounded-[18px] border border-[#e7e9f0] dark:border-[#35445a] bg-white dark:bg-[#182231]" />
      </div>
      <div className="mt-[1cm] space-y-[1cm]">
        <div className="h-[165px] animate-pulse rounded-[18px] border border-[#e7e9f0] dark:border-[#35445a] bg-white dark:bg-[#182231]" />
        <div className="h-[165px] animate-pulse rounded-[18px] border border-[#e7e9f0] dark:border-[#35445a] bg-white dark:bg-[#182231]" />
        <div className="h-[165px] animate-pulse rounded-[18px] border border-[#e7e9f0] dark:border-[#35445a] bg-white dark:bg-[#182231]" />
      </div>
    </div>
  );
}

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="font-dts mx-auto w-full max-w-[1240px] px-6 pb-16 pt-7 lg:px-[38px]">
      <section className="flex min-h-[300px] items-center justify-center rounded-[18px] border border-[#fecdca] bg-white dark:bg-[#182231] p-6 text-center">
        <div className="max-w-[420px]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#fff1f0] text-[#d92d20]">
            <AlertCircle className="size-5" strokeWidth={1.9} />
          </span>
          <h2 className="mt-4 text-[17px] font-bold text-[#101828] dark:text-[#f8fafc]">Không tải được hồ sơ</h2>
          <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
            Không thể lấy thông tin tài khoản ở thời điểm hiện tại.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#eef3ff] dark:bg-[#26364e] px-5 text-[13.5px] font-semibold text-[#0758d9] dark:text-[#93b4ff] transition hover:bg-[#e3eaff]"
          >
            <RefreshCcw className="size-4" /> Thử lại
          </button>
        </div>
      </section>
    </div>
  );
}
