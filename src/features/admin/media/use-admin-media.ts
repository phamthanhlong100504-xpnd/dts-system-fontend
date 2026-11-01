"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAccess } from "../foundation/admin-access-provider";
import { canEnterCurrentAdmin } from "../foundation/admin-access";
import { fetchAdminMedia } from "./admin-media-service";
import type { AdminMediaFilter } from "./admin-media-contract";

export const adminMediaKeys = {
  lists: (actorId: string) => ["admin", "media", actorId, "list"] as const,
  list: (actorId: string, filter: AdminMediaFilter) => ["admin", "media", actorId, "list", filter] as const,
};
export function useAdminMedia(filter: AdminMediaFilter) {
  const { access, error } = useAdminAccess();
  const actorId = access?.actorId ?? "";
  return useQuery({ queryKey: adminMediaKeys.list(actorId, filter), queryFn: ({ signal }) => fetchAdminMedia(actorId, filter, signal),
    enabled: !error && canEnterCurrentAdmin(access), retry: false, staleTime: 0, gcTime: 0,
    refetchOnWindowFocus: true,
  });
}
