"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { useForgotPassword } from "@/features/auth/use-auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotSchema = z.object({
  identifier: z.string().email("Vui lòng nhập email hợp lệ"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const forgotMutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  function onSubmit(values: ForgotForm) {
    forgotMutation.mutate(values.identifier, {
      onSuccess: () =>
        router.push(
          `/forgot-password/verify?identifier=${encodeURIComponent(values.identifier)}`
        ),
    });
  }

  return (
    <AuthShell
      icon={<Lock className="h-8 w-8" />}
      title="Quên mật khẩu?"
      subtitle="Nhập email đã đăng ký. Chúng tôi sẽ gửi mã khôi phục mật khẩu đến bạn."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Quay lại Đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email đã đăng ký</Label>
            <Input
              id="identifier"
              type="email"
              placeholder="Nhập email của bạn"
              autoComplete="email"
              className="h-12"
              {...register("identifier")}
            />
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={forgotMutation.isPending}
          >
            {forgotMutation.isPending ? "Đang gửi..." : "Gửi mã xác nhận"}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
