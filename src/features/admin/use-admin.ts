"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type IdentitySchemas } from "@/lib/api";
import {
  assignPermissionToRole,
  assignRole,
  createPermission,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getUserRoles,
  listPermissions,
  listRoles,
  listUsers,
  resetUserPassword,
  revokePermissionFromRole,
  revokeRole,
  updateUser,
  updateUserStatus,
  type ListUsersParams,
} from "./admin-service";

import { useAdminAccess } from "./foundation/admin-access-provider";
import { adminFailure } from "./foundation/admin-errors";

const adminKeys = {
  users: (params: ListUsersParams) => ["admin", "users", params] as const,
  roles: ["admin", "roles"] as const,
  permissions: ["admin", "permissions"] as const,
};

function toastError(error: unknown, fallback: string) {
  const status=error && typeof error === "object" && "status" in error ? error.status : undefined;
  toast.error(adminFailure(error, typeof status !== "number" || status >= 500 ? "Chưa xác nhận được kết quả thao tác. Kiểm tra lại danh sách trước khi gửi lại." : fallback).message);
}

/* ---------------- Queries ---------------- */

export function useUsers(params: ListUsersParams) {
  const {access,can}=useAdminAccess();
  return useQuery({
    queryKey: [...adminKeys.users(params), access?.actorId],
    enabled: can("users", "read"),
    queryFn: () => listUsers(params),

  });
}

export function useRoles() {
  const {access,can}=useAdminAccess();
  return useQuery({
    queryKey: [...adminKeys.roles, access?.actorId],
    enabled: can("roles", "read"),
    queryFn: listRoles,
  });
}

/** Vai trò của một người dùng — chỉ gọi khi enabled (sheet mở) */
export function useUserRoles(userId: string | null) {
  const {access,can}=useAdminAccess();
  return useQuery({
    queryKey: ["admin", "user-roles", userId, access?.actorId] as const,
    queryFn: () => getUserRoles(userId!),
    enabled: !!userId && can("roles", "read"),
  });
}

export function usePermissions() {
  const {access,can}=useAdminAccess();
  return useQuery({
    queryKey: [...adminKeys.permissions, access?.actorId],
    enabled: can("permissions", "read"),
    queryFn: listPermissions,
  });
}

/* ---------------- User mutations ---------------- */

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("Đã tạo người dùng");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "current-access"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể tạo người dùng");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: IdentitySchemas["UpdateUserRequest"];
    }) => updateUser(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật thông tin người dùng");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể cập nhật thông tin người dùng");
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateUserStatus(id, status),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể cập nhật trạng thái");
    },
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, password),
    onSuccess: () => {
      toast.success("Đã đặt lại mật khẩu");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể đặt lại mật khẩu");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("Đã xóa người dùng");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể xóa người dùng");
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      toast.success("Đã gán vai trò");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "current-access"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể gán vai trò");
    },
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      revokeRole(userId, roleId),
    onSuccess: () => {
      toast.success("Đã thu hồi vai trò");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "current-access"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể thu hồi vai trò");
    },
  });
}

/* ---------------- Role mutations ---------------- */

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      toast.success("Đã tạo vai trò");
      queryClient.invalidateQueries({ queryKey: adminKeys.roles });
      queryClient.invalidateQueries({ queryKey: ["admin", "current-access"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể tạo vai trò");
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast.success("Đã xóa vai trò");
      queryClient.invalidateQueries({ queryKey: adminKeys.roles });
      queryClient.invalidateQueries({ queryKey: ["admin", "current-access"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể xóa vai trò");
    },
  });
}

/* ---------------- Permission mutations ---------------- */

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      toast.success("Đã tạo quyền hạn");
      queryClient.invalidateQueries({ queryKey: adminKeys.permissions });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể tạo quyền hạn");
    },
  });
}

export function useToggleRolePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissionId,
      revoke,
    }: {
      roleId: string;
      permissionId: string;
      revoke: boolean;
    }) =>
      revoke
        ? revokePermissionFromRole(roleId, permissionId)
        : assignPermissionToRole(roleId, permissionId),
    onSuccess: (_data, vars) => {
      toast.success(vars.revoke ? "Đã thu hồi quyền" : "Đã gán quyền");
      queryClient.invalidateQueries({ queryKey: adminKeys.roles });
      queryClient.invalidateQueries({ queryKey: ["admin", "current-access"] });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toastError(error, "Không thể cập nhật quyền cho vai trò");
    },
  });
}
