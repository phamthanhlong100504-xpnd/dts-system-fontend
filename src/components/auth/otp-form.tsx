"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  useForgotPassword,
  useResendVerification,
  useVerifyCode,
} from "@/features/auth/use-auth";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

interface OtpFormProps {
  /** verify = xác minh email (dùng /auth/verify); reset = bước giữa quên mật khẩu */
  mode: "verify" | "reset";
  identifier: string;
}

/**
 * Ô nhập mã OTP 6 chữ số + đồng hồ đếm ngược + gửi lại mã.
 * - verify: gọi /auth/verify rồi về /practice
 * - reset: giữ code rồi sang /forgot-password/reset
 */
export function OtpForm({ mode, identifier }: OtpFormProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  const verifyMutation = useVerifyCode();
  const resendVerifyMutation = useResendVerification();
  const resendResetMutation = useForgotPassword();

  const isSubmitting = verifyMutation.isPending;
  const isResending =
    resendVerifyMutation.isPending || resendResetMutation.isPending;
  const error =
    (verifyMutation.error as Error | null) ??
    (resendVerifyMutation.error as Error | null) ??
    (resendResetMutation.error as Error | null);

  // Đếm ngược 60s trước khi cho phép gửi lại
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  function handleComplete(code: string) {
    if (code.length !== OTP_LENGTH) return;
    if (mode === "verify") {
      // type theo enum backend: REGISTER / RESET_PASSWORD / CHANGE_EMAIL
      verifyMutation.mutate({ identifier, code, type: "REGISTER" });
    } else {
      router.push(
        `/forgot-password/reset?identifier=${encodeURIComponent(identifier)}&code=${encodeURIComponent(code)}`
      );
    }
  }

  function handleResend() {
    if (mode === "verify") {
      resendVerifyMutation.mutate({ identifier, type: "REGISTER" });
    } else {
      resendResetMutation.mutate(identifier);
    }
    setSeconds(RESEND_SECONDS);
  }

  // Tự submit khi đủ 6 chữ số
  useEffect(() => {
    if (value.length === OTP_LENGTH) handleComplete(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const timeText = `00:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">
        Mã xác minh gồm 6 chữ số đã được gửi đến{" "}
        <span className="font-medium text-foreground">{identifier}</span>
      </p>

      <div className="flex justify-center">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={value}
          onChange={setValue}
          containerClassName="gap-3 justify-center"
        >
          <InputOTPGroup className="gap-3">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-14 w-12 rounded-xl border border-input text-2xl font-bold shadow-sm data-[active=true]:border-primary"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Có lỗi xảy ra, vui lòng thử lại"}
        </p>
      )}

      <Button
        type="button"
        className="h-12 w-full text-base"
        onClick={() => handleComplete(value)}
        disabled={isSubmitting || value.length !== OTP_LENGTH}
      >
        {isSubmitting
          ? "Đang xác minh..."
          : mode === "verify"
            ? "Xác minh tài khoản"
            : "Tiếp tục"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Bạn chưa nhận được mã?{" "}
        {canResend() ? (
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? "Đang gửi..." : "Gửi lại mã ngay"}
          </button>
        ) : (
          <span className="font-medium text-muted-foreground">
            Gửi lại sau ({timeText})
          </span>
        )}
      </p>
    </div>
  );

  function canResend() {
    return seconds <= 0;
  }
}
