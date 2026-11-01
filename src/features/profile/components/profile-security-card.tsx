"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword, useLogout } from "@/features/auth/use-auth";
import { toast } from "sonner";

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự").max(100, "Mật khẩu tối đa 100 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export function ProfileSecurityCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-[18px] border border-[#e3e5ec] dark:border-[#35445a] bg-white dark:bg-[#182231] p-[0.6cm] shadow-[0_3px_12px_rgba(31,41,55,0.035)]">
        <div className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-[#f8f8fd] dark:bg-[#243044] px-4">
          <ShieldCheck className="size-[18px] text-[#0758d9] dark:text-[#93b4ff]" strokeWidth={1.9} />

          <h2 className="text-[16px] font-bold text-[#101828] dark:text-[#f8fafc]">
            Bảo mật
          </h2>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14.5px] font-semibold text-[#101828] dark:text-[#f8fafc]">
              Mật khẩu
            </p>

            <p className="mt-1 text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
              Cập nhật mật khẩu đăng nhập của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-[10px] bg-[#f0f2ff] dark:bg-[#26364e] px-5 text-[13.5px] font-semibold sm:self-auto text-[#27364f] dark:text-[#e2e8f0] transition hover:bg-[#f5f7fa] hover:text-[#0758d9]"
          >
            <KeyRound className="size-4" strokeWidth={1.9} />
            Đổi mật khẩu
          </button>
        </div>
      </section>

      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const changePasswordMutation = useChangePassword();
  const logoutMutation = useLogout();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function handleOpenChange(value: boolean) {
    onOpenChange(value);
    if (!value) reset();
  }

  function onSubmit(values: ChangePasswordForm) {
    changePasswordMutation.mutate(
      {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
          toast.info("Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.");
          // Identity revokes refresh tokens on password change.
          // Reuse the existing shared logout workflow to clear all UI caches.
          logoutMutation.mutate();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="font-dts max-w-[480px] rounded-[18px] border-[#e4e7ec] dark:border-[#35445a] bg-white dark:bg-[#182231] p-[0.6cm]">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="mb-1 mx-auto flex size-10 items-center justify-center rounded-[10px] bg-[#eef3ff] dark:bg-[#26364e] text-[#0758d9] dark:text-[#93b4ff]">
            <LockKeyhole className="size-[18px]" strokeWidth={1.9} />
          </span>

          <DialogTitle className="text-center text-[20px] font-bold text-[#101828] dark:text-[#f8fafc]">
            Đổi mật khẩu
          </DialogTitle>

          <DialogDescription className="text-center text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
            Nhập mật khẩu hiện tại và mật khẩu mới cho tài khoản của bạn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2 space-y-4">
          <PasswordField
            id="oldPassword"
            label="Mật khẩu hiện tại"
            error={errors.oldPassword?.message}
            registration={register("oldPassword")}
          />

          <PasswordField
            id="newPassword"
            label="Mật khẩu mới"
            error={errors.newPassword?.message}
            registration={register("newPassword")}
          />

          <PasswordField
            id="confirmPassword"
            label="Nhập lại mật khẩu mới"
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword")}
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-[10px] border border-[#dfe3ea] px-5 text-[13.5px] font-semibold text-[#27364f] dark:text-[#e2e8f0] hover:bg-[#f8f9fb]"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending || logoutMutation.isPending}
              className="h-10 rounded-[10px] bg-[#0758d9] px-5 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changePasswordMutation.isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  id,
  label,
  error,
  registration,
}: {
  id: string;
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<ChangePasswordForm>>["register"]>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13.5px] font-semibold text-[#27364f] dark:text-[#e2e8f0]">
        {label}
      </Label>

      <Input
        id={id}
        type="password"
        autoComplete="off"
        className="h-11 rounded-[10px] border-[#dfe3ea] bg-[#fbfbff] dark:bg-[#111c2d] text-[14.5px]"
        {...registration}
      />

      {error && (
        <p className="text-[12.5px] font-medium text-[#d92d20]">
          {error}
        </p>
      )}
    </div>
  );
}
