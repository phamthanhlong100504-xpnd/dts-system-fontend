"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { MailCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useProfileEmailVerification } from "@/features/profile/use-profile";

interface Props {
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEmailVerificationDialog({
  email,
  open,
  onOpenChange,
}: Props) {
  const [code, setCode] = useState("");

  const {
    sendCode,
    confirmCode,
  } = useProfileEmailVerification();

  const isSaving =
    sendCode.isPending ||
    confirmCode.isPending;

  function handleOpenChange(value: boolean) {
    if (isSaving) return;

    if (!value) {
      setCode("");
    }

    onOpenChange(value);
  }

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const verificationCode = code.trim();

    if (!verificationCode || isSaving) {
      return;
    }

    confirmCode.mutate(
      {
        email,
        code: verificationCode,
      },
      {
        onSuccess: () => {
          setCode("");
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="font-dts max-w-[460px] rounded-[18px] border-[#e4e7ec] bg-white p-[0.6cm] dark:border-[#35445a] dark:bg-[#182231]">
        <DialogHeader>
          <span className="mb-1 flex size-11 items-center justify-center rounded-[11px] bg-[#eef3ff] text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]">
            <MailCheck className="size-5" />
          </span>

          <DialogTitle className="text-[20px] font-bold text-[#101828] dark:text-[#f8fafc]">
            Xác minh địa chỉ email
          </DialogTitle>

          <DialogDescription className="text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
            Yêu cầu mã xác minh gửi tới {email},
            sau đó nhập mã để xác nhận email hiện tại.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="mt-3 space-y-4"
        >
          <div>
            <label
              htmlFor="profile-email-code"
              className="text-[13.5px] font-semibold text-[#27364f] dark:text-[#e2e8f0]"
            >
              Mã xác minh
            </label>

            <input
              id="profile-email-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              disabled={isSaving}
              className="mt-2 h-11 w-full rounded-[10px] border border-[#dfe3ea] bg-[#f8f9fe] px-4 text-[14.5px] font-semibold text-[#101828] outline-none focus:border-[#0758d9] dark:bg-[#111c2d] dark:text-[#f8fafc]"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                sendCode.mutate(email)
              }
              className="h-10 rounded-[10px] border border-[#dfe3ea] px-4 text-[13.5px] font-semibold text-[#27364f] disabled:opacity-50 dark:text-[#e2e8f0]"
            >
              {sendCode.isPending
                ? "Đang gửi..."
                : "Gửi mã / Gửi lại mã"}
            </button>

            <button
              type="submit"
              disabled={isSaving || !code.trim()}
              className="h-10 rounded-[10px] bg-[#0758d9] px-5 text-[13.5px] font-semibold text-white disabled:opacity-50"
            >
              {confirmCode.isPending
                ? "Đang xác minh..."
                : "Xác minh"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}