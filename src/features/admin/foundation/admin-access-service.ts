import { identityApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { readCurrentAdminAccess, type AdminPrincipal } from "./admin-access";

/** Existing endpoint, verified in Identity UserController. Not a capabilities mock. */
export async function fetchCurrentAdminAccess(principal: AdminPrincipal, signal?: AbortSignal) {
  const roles = await identityApi.get<unknown>("/v1/users/me/roles", { signal });
  const latest = useAuthStore.getState();
  if (!latest.accessToken || !latest.user || latest.user.id !== principal.id) {
    throw new Error("Tài khoản đã thay đổi. Vui lòng mở lại trang quản trị.");
  }
  return readCurrentAdminAccess(latest.user, roles);
}
