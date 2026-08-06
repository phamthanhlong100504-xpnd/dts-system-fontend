import { identityApi } from "@/lib/api";
import type { IdentitySchemas } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

/** Gọi login + lưu token/user vào auth store */
export async function login(payload: IdentitySchemas["LoginRequest"]) {
  const auth = await identityApi.post<IdentitySchemas["AuthResponse"]>(
    "/v1/auth/login",
    payload
  );
  useAuthStore.getState().setAuth(auth);
  return auth;
}

export async function register(payload: IdentitySchemas["RegisterRequest"]) {
  const auth = await identityApi.post<IdentitySchemas["AuthResponse"]>(
    "/v1/auth/register",
    payload
  );
  useAuthStore.getState().setAuth(auth);
  return auth;
}

/** Gọi logout backend (revoke refresh token) + xóa trạng thái local */
export async function logout() {
  try {
    await identityApi.post<unknown>("/v1/auth/logout");
  } catch {
    // Dù backend lỗi vẫn phải logout local
  } finally {
    useAuthStore.getState().logout();
  }
}

export async function fetchMe() {
  return identityApi.get<IdentitySchemas["UserResponse"]>("/v1/users/me");
}

/** Quên mật khẩu — gửi OTP vào email (identifier) */
export async function forgotPassword(identifier: string) {
  return identityApi.post<unknown>("/v1/auth/forgot-password", { identifier });
}

/** Đặt lại mật khẩu với mã xác nhận (identifier + code + newPassword) */
export async function resetPassword(
  payload: IdentitySchemas["ResetPasswordRequest"]
) {
  return identityApi.post<unknown>("/v1/auth/reset-password", payload);
}

/** Xác minh email/phone bằng OTP (type: EMAIL | PHONE) */
export async function verifyCode(payload: IdentitySchemas["VerifyCodeRequest"]) {
  return identityApi.post<unknown>("/v1/auth/verify", payload);
}

/** Gửi lại mã xác minh */
export async function resendVerification(
  payload: IdentitySchemas["ResendVerificationRequest"]
) {
  return identityApi.post<unknown>("/v1/auth/resend-verification", payload);
}

/** Đổi mật khẩu khi đã đăng nhập */
export async function changePassword(
  payload: IdentitySchemas["ChangePasswordRequest"]
) {
  return identityApi.post<unknown>("/v1/auth/change-password", payload);
}

/** Cập nhật hồ sơ người dùng hiện tại */
export async function updateProfile(payload: IdentitySchemas["UpdateUserRequest"]) {
  return identityApi.put<IdentitySchemas["UserResponse"]>("/v1/users/me", payload);
}
