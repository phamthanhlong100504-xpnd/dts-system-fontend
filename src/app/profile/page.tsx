"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Lock, LogOut, Mail, User as UserIcon } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useChangePassword,
  useLogout,
  useMe,
  useUpdateProfile,
} from "@/features/auth/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import type { IdentitySchemas } from "@/lib/api";

type UserResponse = IdentitySchemas["UserResponse"];

function initialsOf(fullName?: string, username?: string): string {
  const source = fullName?.trim() || username?.trim() || "?";
  const parts = source.split(/\s+/);
  return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

function formatDate(d?: string): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { data: me, isLoading, isError } = useMe();
  const storeUser = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (isLoading) {
    return (
      <div className="container max-w-2xl space-y-6 py-8">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError || !me) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-sm text-destructive">
          Không tải được hồ sơ. Kiểm tra service dts-identity.
        </p>
      </div>
    );
  }

  const emailVerified = !!me.emailVerifiedAt;

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ & Bảo mật</h1>
      </div>

      {/* Profile header */}
      <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-6 text-center shadow-sm">
        <Avatar size="lg" className="size-24">
          <AvatarFallback className="text-2xl">
            {initialsOf(me.fullName, me.username)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{me.fullName || me.username}</h2>
          <p className="text-sm text-muted-foreground">{me.email}</p>
        </div>
        <StatusBadge status={me.status} />
        {!emailVerified && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/verify-email?identifier=${encodeURIComponent(me.email ?? "")}`}>
              <Mail className="h-4 w-4" />
              Xác minh email
            </Link>
          </Button>
        )}
      </div>

      {/* Thông tin cá nhân */}
      <section className="mb-6">
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Thông tin cá nhân
        </h3>
        <Card>
          <CardContent className="divide-y divide-border">
            <InfoRow label="Tên đăng nhập" value={me.username} />
            <InfoRow label="Họ và tên" value={me.fullName ?? "—"} />
            <InfoRow label="Email" value={me.email ?? "—"} />
            <InfoRow label="Ngày sinh" value={formatDate(me.birthOfDate)} />
            <InfoRow label="Số điện thoại" value={me.phoneNumber ?? "—"} />
          </CardContent>
        </Card>
        <EditProfileSheet me={me} />
      </section>

      {/* Bảo mật */}
      <section className="mb-6">
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bảo mật
        </h3>
        <Card>
          <button
            type="button"
            onClick={() => setShowChangePassword((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <Lock className="h-4 w-4 text-primary" />
              Đổi mật khẩu
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${showChangePassword ? "rotate-180" : ""}`}
            />
          </button>
          {showChangePassword && (
            <div className="border-t border-border p-4">
              <ChangePasswordForm />
            </div>
          )}
        </Card>
      </section>

      {/* Đăng xuất */}
      <Button
        variant="destructive"
        className="h-12 w-full text-base"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
      >
        <LogOut className="h-5 w-5" />
        {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Đang đăng nhập với tài khoản {storeUser?.username ?? me.username}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

/* ---------- Chỉnh sửa hồ sơ ---------- */

const editProfileSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên").max(100, "Tối đa 100 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  birthOfDate: z.string().optional(),
  phoneNumber: z.string().max(20, "Tối đa 20 ký tự").optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

function EditProfileSheet({ me }: { me: UserResponse }) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdateProfile();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: me.fullName ?? "",
      email: me.email ?? "",
      birthOfDate: me.birthOfDate ?? "",
      phoneNumber: me.phoneNumber ?? "",
    },
  });

  function onSubmit(values: EditProfileForm) {
    updateMutation.mutate(values, {
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="mt-4 w-full">
          <UserIcon className="h-4 w-4" />
          Chỉnh sửa thông tin
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa hồ sơ</SheetTitle>
          <SheetDescription>Cập nhật thông tin cá nhân của bạn</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" className="h-11" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="h-11" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthOfDate">Ngày sinh</Label>
            <Input id="birthOfDate" type="date" className="h-11" {...register("birthOfDate")} />
            {errors.birthOfDate && (
              <p className="text-sm text-destructive">{errors.birthOfDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input id="phoneNumber" type="tel" className="h-11" {...register("phoneNumber")} />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>
          <SheetFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Đổi mật khẩu ---------- */

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới tối thiểu 8 ký tự")
      .max(100, "Mật khẩu mới tối đa 100 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

function ChangePasswordForm() {
  const changePasswordMutation = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  function onSubmit(values: ChangePasswordForm) {
    changePasswordMutation.mutate(
      { oldPassword: values.oldPassword, newPassword: values.newPassword },
      { onSuccess: () => reset() }
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
        <Input id="oldPassword" type="password" className="h-11" {...register("oldPassword")} />
        {errors.oldPassword && (
          <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input id="newPassword" type="password" className="h-11" {...register("newPassword")} />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
        <Input
          id="confirmPassword"
          type="password"
          className="h-11"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={changePasswordMutation.isPending}>
        {changePasswordMutation.isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
      </Button>
    </form>
  );
}
