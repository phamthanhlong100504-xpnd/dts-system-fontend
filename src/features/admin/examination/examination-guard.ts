import { ApiError } from "@/lib/api";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";
import { canAdmin, type AdminAccess } from "../foundation/admin-access";

/** Mirrors verified current permission aliases. The server decides authorization. */
export function examinationActor(resource: string, action = "read") {
  getAccessToken();
  const actorId = useAuthStore.getState().user?.id;
  const assert = () => {
    const state = useAuthStore.getState(), user = state.user;
    if (!actorId || !state.accessToken || user?.id !== actorId) throw new ApiError("Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.", 401);
    const access: AdminAccess = { actorId, roles: (user.roles ?? []).map(r => r === "ADMIN" ? "ROLE_ADMIN" : r), permissions: (user.permissions ?? []).map(p => p.replace(/^PERM_/, "")) };
    if (!canAdmin(access, resource, action)) throw new ApiError("Bạn chưa được cấp quyền thực hiện thao tác này.", 403);
  };
  assert();
  return { id: actorId!, assert };
}

/** Current Practice catalog/config controllers accept authenticated reads, no Admin write right is inferred. */
export function practiceCatalogActor() {
  getAccessToken();
  const id = useAuthStore.getState().user?.id;
  const assert = () => {
    const state = useAuthStore.getState();
    if (!id || !state.accessToken || state.user?.id !== id) throw new ApiError("Phiên đăng nhập đã thay đổi.", 401);
    if (!state.user.roles?.some(r => r === "ROLE_ADMIN" || r === "ADMIN")) throw new ApiError("Bạn chưa được cấp quyền quản trị.", 403);
  };
  assert(); return { id: id!, assert };
}
