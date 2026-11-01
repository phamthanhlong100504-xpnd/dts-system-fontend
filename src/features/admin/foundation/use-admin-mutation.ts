"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminAccess } from "./admin-access-provider";

/** Shared guard for existing admin hooks; backend remains authoritative. */
export function useAdminMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  resource: string,
  action: string,
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const { access, can } = useAdminAccess();
  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    retry: false,
    mutationFn: async (variables, context) => {
      const current = useAuthStore.getState();
      if (!current.accessToken || current.user?.id !== access?.actorId || !can(resource, action)) {
        throw new ApiError("Bạn không có quyền thực hiện thao tác này.", 403);
      }
      if (!options.mutationFn) throw new Error("Thiếu thao tác quản trị.");
      return options.mutationFn(variables, context);
    },
  });
}
