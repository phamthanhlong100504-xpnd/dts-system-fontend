import { identityApi } from "@/lib/api";
import type { CurrentUserProfile } from "@/features/auth/auth-service";
import type { IdentitySchemas } from "@/lib/api";

export type Profile = CurrentUserProfile;

export interface UpdateMyProfilePayload {
  username?: string;
  email?: string;
  fullName?: string;
  birthOfDate?: string;
  phoneNumber?: string;
}

export interface ProfileRole {
  id: string;
  name: string;
  permissions: string[];
}

export function getProfile(): Promise<Profile> {
  return identityApi.get<Profile>("/v1/users/me");
}

export function getMyProfileRoles(): Promise<ProfileRole[]> {
  return identityApi.get<ProfileRole[]>("/v1/users/me/roles");
}

export function updateMyProfile(
  payload: UpdateMyProfilePayload
): Promise<Profile> {
  return identityApi.put<Profile>("/v1/users/me", payload);
}

export function requestChangeEmailVerification(
  identifier: string
): Promise<unknown> {
  return identityApi.post<unknown>(
    "/v1/auth/resend-verification",
    {
      identifier,
      type: "CHANGE_EMAIL",
    }
  );
}

export function verifyChangedEmail(
  identifier: string,
  code: string
): Promise<unknown> {
  return identityApi.post<unknown>(
    "/v1/auth/verify",
    {
      identifier,
      code,
      type: "CHANGE_EMAIL",
    }
  );
}

// Giữ các export cũ để tránh ảnh hưởng code đang sử dụng.

export type UpdateProfilePayload = UpdateMyProfilePayload;

export type ChangeProfilePasswordPayload =
  IdentitySchemas["ChangePasswordRequest"];

export function updateProfile(
  payload: UpdateMyProfilePayload
): Promise<Profile> {
  return updateMyProfile(payload);
}

export function changeProfilePassword(
  payload: ChangeProfilePasswordPayload
): Promise<unknown> {
  return identityApi.post<unknown>(
    "/v1/auth/change-password",
    payload
  );
}