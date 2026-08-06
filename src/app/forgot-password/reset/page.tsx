"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { useResetPassword } from "@/features/auth/use-auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(100, "Mật khẩu tối đa 100 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  );
}

function ResetContent() {
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") ?? "";
  const code = searchParams.get("code") ?? "";
  const resetMutation = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });
  const passwordValue = useWatch({ control, name: "newPassword" }) ?? "";

  if (!identifier || !code) {
    return (
      <AuthShell
        icon={<KeyRound className="h-8 w-8" />}
        title="Thiếu thông tin"
        subtitle="Phiên đặt lại mật khẩu không hợp lệ."
        footer={
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Bắt đầu lại
          </Link>
        }
      >
        <div />
      </AuthShell>
    );
  }

  const checks = [
    { label: "Tối thiểu 8 ký tự", ok: passwordValue.length >= 8 },
    { label: "Có ít nhất 1 ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(passwordValue) },
    { label: "Có ít nhất 1 chữ hoa", ok: /[A-Z]/.test(passwordValue) },
  ];

  function onSubmit(values: ResetForm) {
    resetMutation.mutate({ identifier, code, newPassword: values.newPassword });
  }

  return (
    <AuthShell
      icon={<KeyRound className="h-8 w-8" />}
      title="Tạo mật khẩu mới"
      subtitle="Đảm bảo mật khẩu của bạn có độ bảo mật cao để bảo vệ tài khoản."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Quay lại Đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-12 pr-10"
                {...register("newPassword")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
            <PasswordStrength value={passwordValue} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-12 pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="space-y-3 rounded-xl bg-muted/50 p-4">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                    c.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span
                  className={cn(
                    "text-sm",
                    c.ok ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
