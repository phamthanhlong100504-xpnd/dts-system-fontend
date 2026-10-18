"use client";

import { useState, type FormEvent } from "react";
import { ProfileEmailVerificationDialog } from "@/features/profile/components/profile-email-verification-dialog";
import { BriefcaseBusiness, Check } from "lucide-react";

interface ProfilePersonalInfoCardProps {
  fullName: string;
  email: string;
  isSaving?: boolean;
  emailVerified: boolean;
  onSave: (values: { fullName: string; email: string }) => void;
}

export function ProfilePersonalInfoCard({
  fullName,
  email,
  isSaving = false,
  emailVerified,
  onSave,
}: ProfilePersonalInfoCardProps) {
  const [nameValue, setNameValue] = useState(fullName);
  const [emailValue, setEmailValue] = useState(email);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const normalizedName = nameValue.trim();
  const normalizedEmail = emailValue.trim();
  const hasChanges =
    normalizedName !== fullName.trim() ||
    normalizedEmail !== email.trim();
  const canSave =
    !isSaving &&
    hasChanges &&
    normalizedName.length > 0 &&
    normalizedName.length <= 100 &&
    normalizedEmail.length > 0 &&
    normalizedEmail.length <= 254;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    onSave({
      fullName: normalizedName,
      email: normalizedEmail,
    });
  }

  return (
    <>
      <section className="h-full rounded-[18px] border border-[#e3e5ec] dark:border-[#35445a] bg-white dark:bg-[#182231] p-[0.6cm] shadow-[0_3px_12px_rgba(31,41,55,0.035)]">
      <div className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-[#f8f8fd] dark:bg-[#243044] px-4">
        <BriefcaseBusiness className="size-[18px] text-[#0758d9] dark:text-[#93b4ff]" strokeWidth={1.9} />
        <h2 className="text-[16px] font-bold text-[#101828] dark:text-[#f8fafc]">Thông tin cá nhân</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="profile-full-name" className="text-[13px] font-semibold text-[#344054] dark:text-[#e2e8f0]">
            Họ và tên
          </label>
          <input
            id="profile-full-name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            disabled={isSaving}
            className="mt-2 h-11 w-full rounded-[10px] border border-transparent bg-[#f0f2ff] dark:bg-[#26364e] px-4 text-[14px] font-medium text-[#101828] dark:text-[#f8fafc] outline-none transition placeholder:text-[#98a2b3] focus:border-[#b9c9ff] focus:bg-white focus:ring-2 focus:ring-[#0758d9]/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="text-[13px] font-semibold text-[#344054] dark:text-[#e2e8f0]">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={emailValue}
            onChange={(event) => setEmailValue(event.target.value)}
            disabled={isSaving}
            className="mt-2 h-11 w-full rounded-[10px] border border-transparent bg-[#f0f2ff] dark:bg-[#26364e] px-4 text-[14px] font-medium text-[#101828] dark:text-[#f8fafc] outline-none transition placeholder:text-[#98a2b3] focus:border-[#b9c9ff] focus:bg-white focus:ring-2 focus:ring-[#0758d9]/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {!emailVerified && email && (
          <div className="rounded-[10px] border border-[#fedf89] bg-[#fffcf5] dark:bg-[#35281b] p-3">
            <p className="text-[13px] font-semibold text-[#b54708]">Email chưa xác minh</p>
            <p className="mt-1 text-[13px] leading-5 text-[#667085] dark:text-[#aab8cf]">
              Nếu bạn vừa đổi email, hãy xác minh địa chỉ mới để cập nhật trạng thái tài khoản.
            </p>
            <button
              type="button"
              disabled={isSaving || hasChanges}
              onClick={() => setEmailDialogOpen(true)}
              className="mt-2 text-[13px] font-semibold text-[#0758d9] dark:text-[#93b4ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Xác minh email
            </button>
            {hasChanges && (
              <p className="mt-1 text-[12px] text-[#667085] dark:text-[#aab8cf]">Lưu thông tin vừa sửa trước khi xác minh.</p>
            )}
          </div>
        )}

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#064fc3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="size-4" strokeWidth={2.2} />
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
      </section>
      <ProfileEmailVerificationDialog
      email={email}
      open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </>
  );
}
