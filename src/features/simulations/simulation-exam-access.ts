import { useAuthStore } from "@/stores/auth-store";
import { SimulationExamError } from "./simulation-exam-types";
import type { SimulationScope } from "./simulation-learning-types";
export function examCanAccess(
  state: {
    user: { permissions?: string[] } | null;
    accessToken?: string | null;
  },
  media = false,
) {
  let permissions: unknown = state.user?.permissions;
  if (permissions === undefined && state.user && state.accessToken) {
    try {
      permissions = JSON.parse(
        atob(
          state.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        ),
      ).permissions;
    } catch {
      return false;
    }
  }
  const grants = Array.isArray(permissions) ? permissions : [];
  return [
    "practice:read",
    "simulations:read",
    "simulations:exam",
    ...(media ? ["media:read"] : []),
  ].every((p) => grants.includes(p));
}
export function assertExamSession(scope: SimulationScope, media = false) {
  const auth = useAuthStore.getState();
  if (!auth.accessToken || auth.user?.id !== scope.userId)
    throw new SimulationExamError(
      "ACCESS_DENIED",
      "Phiên đăng nhập đã thay đổi.",
      undefined,
      401,
    );
  if (!examCanAccess(auth, media))
    throw new SimulationExamError(
      "ACCESS_DENIED",
      "Tài khoản chưa có quyền thi thử mô phỏng.",
      undefined,
      403,
    );
}
