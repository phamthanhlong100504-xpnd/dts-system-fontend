"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRegister } from "@/features/auth/use-auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Ràng buộc mirror theo API-DOCS của dts-identity
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Tên đăng nhập tối thiểu 3 ký tự")
      .max(20, "Tên đăng nhập tối đa 20 ký tự")
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Chỉ được dùng chữ, số, dấu chấm, gạch dưới, gạch ngang"
      ),
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(100, "Mật khẩu tối đa 100 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    fullName: z
      .string()
      .min(1, "Vui lòng nhập họ tên")
      .max(100, "Họ tên tối đa 100 ký tự"),
    birthOfDate: z.string().min(1, "Vui lòng chọn ngày sinh"),
    phoneNumber: z
      .string()
      .min(1, "Vui lòng nhập số điện thoại")
      .max(20, "Số điện thoại tối đa 20 ký tự"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const passwordValue = useWatch({ control, name: "password" }) ?? "";

  function onSubmit(values: RegisterForm) {
    registerMutation.mutate({
      username: values.username,
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      birthOfDate: values.birthOfDate,
      phoneNumber: values.phoneNumber,
    });
  }

  return (
    <AuthShell
      icon={<ShieldCheck className="h-8 w-8" />}
      title="Tham gia với chúng tôi"
      subtitle="Dịch vụ định danh bảo mật và hiện đại"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="username">Tên người dùng</Label>
            <Input
              id="username"
              placeholder="Nhập tên người dùng"
              autoComplete="username"
              className="h-12"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@mail.com"
              autoComplete="email"
              className="h-12"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              className="h-12"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthOfDate">Ngày sinh</Label>
              <Input
                id="birthOfDate"
                type="date"
                autoComplete="bday"
                className="h-12"
                {...register("birthOfDate")}
              />
              {errors.birthOfDate && (
                <p className="text-sm text-destructive">{errors.birthOfDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="0987654321"
                autoComplete="tel"
                className="h-12"
                {...register("phoneNumber")}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-12 pr-10"
                {...register("password")}
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
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <PasswordStrength value={passwordValue} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
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
          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
