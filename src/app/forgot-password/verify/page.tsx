"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") ?? "";

  if (!identifier) {
    return (
      <AuthShell
        icon={<KeyRound className="h-8 w-8" />}
        title="Thiếu thông tin"
        subtitle="Không tìm thấy email cần xác minh."
        footer={
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Quay lại Quên mật khẩu
          </Link>
        }
      >
        <div />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<KeyRound className="h-8 w-8" />}
      title="Nhập mã xác minh"
      subtitle="Nhập mã OTP 6 chữ số vừa được gửi đến email của bạn"
      footer={
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Thay đổi email
        </Link>
      }
    >
      <OtpForm mode="reset" identifier={identifier} />
    </AuthShell>
  );
}
