import { isUuid } from "./theory/theory-contract";
import { identityRequest } from "./identity/identity-operation";
import { identityApi } from "@/lib/api";
import type { IdentitySchemas } from "@/lib/api";

function verifyRecord<T extends { id?: string }>(value: T, expectedId?: string): T {
  if (!value || !isUuid(value.id) || (expectedId && value.id !== expectedId)) throw new Error("Chưa xác nhận được dữ liệu tài khoản hoặc quyền. Vui lòng tải lại.");
  return value;
}
function verifyRoles(value: IdentitySchemas["RoleResponse"][]) {
  if (!Array.isArray(value) || value.some(row => !row || !isUuid(row.id) || !row.name || !Array.isArray(row.permissions) || row.permissions.some(p => typeof p !== "string"))) throw new Error("Chưa xác nhận được danh sách vai trò. Vui lòng tải lại.");
  return value;
}

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
  const result = await identityRequest("users", "read", () => identityApi.get<IdentitySchemas["PageUserResponse"]>("/v1/admin/users", {
    params: { page, size, search, status, role },
  }));
  if (!result || !Array.isArray(result.content) || result.number !== page || !Number.isSafeInteger(result.size) || result.size! <= 0 || !Number.isSafeInteger(result.totalElements) || result.totalElements! < 0 || result.totalPages !== Math.ceil(result.totalElements! / result.size!) || result.content.length > result.size! || (result.content.length > 0 && page * result.size! + result.content.length > result.totalElements!) || (result.totalElements === 0 && result.content.length !== 0) || (page < result.totalPages! && result.content.length === 0)) throw new Error("Chưa xác nhận được trang người dùng. Vui lòng tải lại.");
  result.content.forEach(row => verifyRecord(row));
  return result;
}

export async function createUser(payload: IdentitySchemas["CreateUserRequest"]) {
  const result = await identityRequest("users", "create", () => identityApi.post<IdentitySchemas["UserResponse"]>("/v1/admin/users", payload));
  return verifyRecord(result);
}

/** Cập nhật hồ sơ người dùng (admin): username/email/fullName/birthOfDate/phoneNumber/status */
export async function updateUser(id: string, payload: IdentitySchemas["UpdateUserRequest"]) {
  const result = await identityRequest("users", "update", () => identityApi.put<IdentitySchemas["UserResponse"]>(`/v1/admin/users/${id}`, payload));
  return verifyRecord(result, id);
}

/** Đổi trạng thái tài khoản (LOCKED/ACTIVE/BANNED/...) */
export async function updateUserStatus(id: string, status: string) {
  const result = await identityRequest("users", "update", () => identityApi.patch<IdentitySchemas["UserResponse"]>(
    `/v1/admin/users/${id}/status`,
    { status }
  ));
  verifyRecord(result, id);
  if (result.status !== status) throw new Error("Chưa xác nhận thay đổi trạng thái tài khoản. Vui lòng tải lại.");
  return result;
}

/** Admin đặt lại mật khẩu cho người dùng */
export async function resetUserPassword(id: string, password: string) {
  return identityRequest("users", "update", () => identityApi.patch<unknown>(`/v1/admin/users/${id}/password`, { password }));
}

/** Soft-delete người dùng */
export async function deleteUser(id: string) {
  return identityRequest("users", "delete", () => identityApi.delete<unknown>(`/v1/admin/users/${id}`));
}

/** Lấy danh sách vai trò của một người dùng */
export async function getUserRoles(id: string) {
  const result = await identityRequest("roles", "read", () => identityApi.get<IdentitySchemas["RoleResponse"][]>(
    `/v1/admin/users/${id}/roles`
  ));
  return verifyRoles(result);
}

/** Gán vai trò cho người dùng */
export async function assignRole(payload: IdentitySchemas["AssignRoleRequest"]) {
  return identityRequest("roles", "update", () => identityApi.post<unknown>("/v1/admin/roles/assign", payload));
}

/** Thu hồi vai trò khỏi người dùng */
export async function revokeRole(userId: string, roleId: string) {
  return identityRequest("roles", "update", () => identityApi.delete<unknown>(`/v1/admin/users/${userId}/roles/${roleId}`));
}

/* ---------------- Roles ---------------- */

export async function listRoles() {
  const result = await identityRequest("roles", "read", () => identityApi.get<IdentitySchemas["RoleResponse"][]>("/v1/admin/roles"));
  return verifyRoles(result);
}

export async function createRole(payload: IdentitySchemas["CreateRoleRequest"]) {
  const result = await identityRequest("roles", "create", () => identityApi.post<IdentitySchemas["RoleResponse"]>("/v1/admin/roles", payload));
  return verifyRecord(result);
}

export async function deleteRole(id: string) {
  return identityRequest("roles", "delete", () => identityApi.delete<unknown>(`/v1/admin/roles/${id}`));
}

/* ---------------- Permissions ---------------- */

export async function listPermissions() {
  const result = await identityRequest("permissions", "read", () => identityApi.get<IdentitySchemas["PermissionResponse"][]>("/v1/admin/permissions"));
  if (!Array.isArray(result) || result.some(row => !row || !isUuid(row.id) || !row.name)) throw new Error("Chưa xác nhận được danh sách quyền. Vui lòng tải lại.");
  return result;
}

export async function createPermission(
  payload: IdentitySchemas["CreatePermissionRequest"]
) {
  const result = await identityRequest("permissions", "create", () => identityApi.post<IdentitySchemas["PermissionResponse"]>(
    "/v1/admin/permissions",
    payload
  ));
  return verifyRecord(result);
}

export async function assignPermissionToRole(roleId: string, permissionId: string) {
  return identityRequest("roles", "update", () => identityApi.post<unknown>(`/v1/admin/roles/${roleId}/permissions/${permissionId}`));
}

export async function revokePermissionFromRole(roleId: string, permissionId: string) {
  return identityRequest("roles", "update", () => identityApi.delete<unknown>(`/v1/admin/roles/${roleId}/permissions/${permissionId}`));
}
