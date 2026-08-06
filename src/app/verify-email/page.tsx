"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";

export default function VerifyEmailPage() {
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
        icon={<MailCheck className="h-8 w-8" />}
        title="Thiếu thông tin"
        subtitle="Không tìm thấy email cần xác minh."
        footer={
          <Link href="/practice" className="font-medium text-primary hover:underline">
            Đi đến Luyện tập
          </Link>
        }
      >
        <div />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<MailCheck className="h-8 w-8" />}
      title="Xác thực tài khoản"
      subtitle="Nhập mã OTP 6 chữ số đã được gửi đến email của bạn"
      footer={
        <Link href="/practice" className="font-medium text-primary hover:underline">
          Bỏ qua, vào luyện tập
        </Link>
      }
    >
      <OtpForm mode="verify" identifier={identifier} />
    </AuthShell>
  );
}
