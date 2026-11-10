import { useAuthStore } from "@/stores/auth-store";
import { SimulationGuideError } from "./simulation-guide-types";
export type GuideAccess = "current" | "read" | "update" | "publish";
type Session = {
  accessToken?: string | null;
  user: { id?: string; roles?: string[]; permissions?: string[] } | null;
};
export function guideCan(state: Session, action: GuideAccess) {
  if (!state.user) return false;
  let roles: unknown = state.user.roles,
    permissions: unknown = state.user.permissions;
  if ((roles === undefined || permissions === undefined) && state.accessToken) {
    try {
      const claim = JSON.parse(
        atob(
          state.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        ),
      );
      roles ??= claim.roles;
      permissions ??= claim.permissions;
    } catch {
      return false;
    }
  }
  const permission =
    action === "current" ? "simulations:read" : `simulation-guides:${action}`;
  return (
    Array.isArray(permissions) &&
    permissions.includes(permission) &&
    (action === "current" ||
      (Array.isArray(roles) &&
        roles.some((r) => r === "ADMIN" || r === "ROLE_ADMIN")))
  );
}
export function useGuideCan(action: GuideAccess) {
  return useAuthStore((state) => guideCan(state, action));
}
export function assertGuideSession(actorId: string, action: GuideAccess) {
  const state = useAuthStore.getState();
  if (!state.accessToken || !actorId || state.user?.id !== actorId)
    throw new SimulationGuideError(
      "UNAUTHORIZED",
      "Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.",
      401,
    );
  if (!guideCan(state, action))
    throw new SimulationGuideError(
      "FORBIDDEN",
      "Tài khoản không có quyền thực hiện thao tác hướng dẫn này.",
      403,
    );
}
