"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  changePassword,
  fetchMe,
  forgotPassword,
  login,
  logout,
  register,
  resendVerification,
  resetPassword,
  updateProfile,
  verifyCode,
} from "./auth-service";
import type { IdentitySchemas } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useExamStore } from "@/stores/exam-store";

const authKeys = {
  me: ["auth", "me"] as const,
};

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: IdentitySchemas["LoginRequest"]) => login(payload),
    onSuccess: () => {
      toast.success("Đăng nhập thành công");
      router.push("/practice");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Đăng nhập thất bại");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: IdentitySchemas["RegisterRequest"]) => register(payload),
    onSuccess: (_auth, variables) => {
      toast.success("Đăng ký thành công");
      // Đưa sang màn xác minh email (OTP); user có thể "Bỏ qua" vì đã auto-login
      router.push(
        `/verify-email?identifier=${encodeURIComponent(variables.email)}`
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Đăng ký thất bại");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      useExamStore.getState().clear();
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
  });
}

/** Quên mật khẩu — toast khi gửi thành công; điều hướng tùy nơi gọi */
export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success("Mã xác nhận đã được gửi đến email của bạn");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không thể gửi mã xác nhận");
    },
  });
}

/** Xác nhận mã OTP đặt lại mật khẩu — điều hướng sang trang nhập mật khẩu mới */
export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công");
      router.push("/login");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Đặt lại mật khẩu thất bại");
    },
  });
}

/** Xác minh email bằng OTP */
export function useVerifyCode() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyCode,
    onSuccess: () => {
      toast.success("Xác minh thành công");
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      router.push("/practice");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Mã xác nhận không hợp lệ");
    },
  });
}

/** Gửi lại mã xác minh */
export function useResendVerification() {
  return useMutation({
    mutationFn: resendVerification,
    onSuccess: () => {
      toast.success("Đã gửi lại mã xác minh");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không thể gửi lại mã");
    },
  });
}

/** Đổi mật khẩu khi đã đăng nhập */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Đổi mật khẩu thất bại");
    },
  });
}

/** Cập nhật hồ sơ — cập nhật store user + invalidate ["auth","me"] */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      const current = useAuthStore.getState().user;
      if (current && data) {
        useAuthStore.getState().setUser({
          ...current,
          username: data.username ?? current.username,
          email: data.email ?? current.email,
          fullName: data.fullName ?? current.fullName,
        });
      }
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      toast.success("Đã cập nhật hồ sơ");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Cập nhật hồ sơ thất bại");
    },
  });
}
