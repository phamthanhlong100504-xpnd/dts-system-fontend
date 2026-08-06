import { identityApi } from "@/lib/api";
import type { IdentitySchemas } from "@/lib/api";

/* ---------------- Users ---------------- */

export interface ListUsersParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  role?: string;
}

/** Danh sách người dùng (phân trang kiểu Spring: ?page=0&size=20&search=...) */
export async function listUsers(params: ListUsersParams = {}) {
  const { page = 0, size = 20, search, status, role } = params;
  return identityApi.get<IdentitySchemas["PageUserResponse"]>("/v1/admin/users", {
    params: { page, size, search, status, role },
  });
}

export async function createUser(payload: IdentitySchemas["CreateUserRequest"]) {
  return identityApi.post<IdentitySchemas["UserResponse"]>("/v1/admin/users", payload);
}

/** Đổi trạng thái tài khoản (LOCKED/ACTIVE/BANNED/...) */
export async function updateUserStatus(id: string, status: string) {
  return identityApi.patch<IdentitySchemas["UserResponse"]>(
    `/v1/admin/users/${id}/status`,
    { status }
  );
}

/** Soft-delete người dùng */
export async function deleteUser(id: string) {
  return identityApi.delete<unknown>(`/v1/admin/users/${id}`);
}

/** Lấy danh sách vai trò của một người dùng */
export async function getUserRoles(id: string) {
  return identityApi.get<IdentitySchemas["RoleResponse"][]>(
    `/v1/admin/users/${id}/roles`
  );
}

/** Gán vai trò cho người dùng */
export async function assignRole(payload: IdentitySchemas["AssignRoleRequest"]) {
  return identityApi.post<unknown>("/v1/admin/roles/assign", payload);
}

/** Thu hồi vai trò khỏi người dùng */
export async function revokeRole(userId: string, roleId: string) {
  return identityApi.delete<unknown>(`/v1/admin/users/${userId}/roles/${roleId}`);
}

/* ---------------- Roles ---------------- */

export async function listRoles() {
  return identityApi.get<IdentitySchemas["RoleResponse"][]>("/v1/admin/roles");
}

export async function createRole(payload: IdentitySchemas["CreateRoleRequest"]) {
  return identityApi.post<IdentitySchemas["RoleResponse"]>("/v1/admin/roles", payload);
}

export async function deleteRole(id: string) {
  return identityApi.delete<unknown>(`/v1/admin/roles/${id}`);
}

/* ---------------- Permissions ---------------- */

export async function listPermissions() {
  return identityApi.get<IdentitySchemas["PermissionResponse"][]>("/v1/admin/permissions");
}

export async function createPermission(
  payload: IdentitySchemas["CreatePermissionRequest"]
) {
  return identityApi.post<IdentitySchemas["PermissionResponse"]>(
    "/v1/admin/permissions",
    payload
  );
}

export async function assignPermissionToRole(roleId: string, permissionId: string) {
  return identityApi.post<unknown>(`/v1/admin/roles/${roleId}/permissions/${permissionId}`);
}

export async function revokePermissionFromRole(roleId: string, permissionId: string) {
  return identityApi.delete<unknown>(`/v1/admin/roles/${roleId}/permissions/${permissionId}`);
}
