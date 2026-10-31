import { ApiError, identityApi } from "@/lib/api";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";
import { canAdmin, readCurrentAdminAccess, restrictAdminAccess } from "../foundation/admin-access";
const pendingWrites = new Set<string>();
/** Current Identity controller is ROLE_ADMIN guarded. No specialized Admin right is inferred. */
export async function identityRequest<T>(resource: "users" | "roles" | "permissions", action: "read" | "create" | "update" | "delete", request: () => Promise<T>): Promise<T> {
  getAccessToken();
  const initial = useAuthStore.getState(), actorId = initial.user?.id, token = initial.accessToken;
  const assertActor = () => {
    const state=useAuthStore.getState();
    if (!actorId || !token || state.user?.id !== actorId || state.accessToken !== token) throw new ApiError("Phiên đăng nhập đã thay đổi. Vui lòng mở lại trang.",401);
    if (!state.user.roles?.some(r=>r === "ROLE_ADMIN" || r === "ADMIN")) throw new ApiError("Bạn chưa được cấp quyền thực hiện thao tác này.",403);
    return state.user;
  };
  assertActor();
  if (action !== "read" && pendingWrites.has(actorId!)) throw new ApiError("Một thao tác đang được xử lý. Vui lòng chờ kết quả.",409);
  if (action !== "read") pendingWrites.add(actorId!);
  try {
    const roles=await identityApi.get<unknown>("/v1/users/me/roles");
    const user=assertActor(), access=readCurrentAdminAccess(user,roles);
    if (!canAdmin(access,resource,action)) throw new ApiError("Bạn chưa được cấp quyền thực hiện thao tác này.",403);
    const result=await request();
    if (!canAdmin(restrictAdminAccess(access,assertActor()),resource,action)) throw new ApiError("Bạn chưa được cấp quyền thực hiện thao tác này.",403);
    return result;
  } finally { if (action !== "read") pendingWrites.delete(actorId!); }
}
