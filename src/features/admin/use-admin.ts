"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
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
  revokePermissionFromRole,
  revokeRole,
  updateUserStatus,
  type ListUsersParams,
} from "./admin-service";

const adminKeys = {
  users: (params: ListUsersParams) => ["admin", "users", params] as const,
  roles: ["admin", "roles"] as const,
  permissions: ["admin", "permissions"] as const,
};

function toastError(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError ? error.message : fallback);
}

/* ---------------- Queries ---------------- */

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => listUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: adminKeys.roles,
    queryFn: listRoles,
  });
}

/** Vai trò của một người dùng — chỉ gọi khi enabled (sheet mở) */
export function useUserRoles(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "user-roles", userId] as const,
    queryFn: () => getUserRoles(userId!),
    enabled: !!userId,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: adminKeys.permissions,
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
    },
    onError: (error) => toastError(error, "Không thể tạo người dùng"),
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
    onError: (error) => toastError(error, "Không thể cập nhật trạng thái"),
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
    onError: (error) => toastError(error, "Không thể xóa người dùng"),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      toast.success("Đã gán vai trò");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toastError(error, "Không thể gán vai trò"),
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
    },
    onError: (error) => toastError(error, "Không thể thu hồi vai trò"),
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
    },
    onError: (error) => toastError(error, "Không thể tạo vai trò"),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast.success("Đã xóa vai trò");
      queryClient.invalidateQueries({ queryKey: adminKeys.roles });
    },
    onError: (error) => toastError(error, "Không thể xóa vai trò"),
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
    onError: (error) => toastError(error, "Không thể tạo quyền hạn"),
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
    },
    onError: (error) => toastError(error, "Không thể cập nhật quyền cho vai trò"),
  });
}
