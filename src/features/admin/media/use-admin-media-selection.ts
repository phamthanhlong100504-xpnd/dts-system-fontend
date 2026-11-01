"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { MediaUploadTarget } from "@/features/media/media-upload-policy";
import { restrictAdminAccess } from "../foundation/admin-access";
import { useAdminAccess } from "../foundation/admin-access-provider";
import { adminFailure } from "../foundation/admin-errors";
import { canChooseAdminMedia } from "./admin-media-policy";
import { checkUploadedMedia } from "./admin-media-service";
import type { AdminMediaItem } from "./admin-media-contract";

/** Recheck READY, visibility, actor and current rights before returning an ID to a draft. */
export function useAdminMediaSelection(target: MediaUploadTarget | undefined, editableDraft: boolean, onChoose?: (item: AdminMediaItem) => void) {
  const { access, error } = useAdminAccess();
  const latest = useRef({ access, error, target, editableDraft, onChoose });
  useEffect(() => { latest.current = { access, error, target, editableDraft, onChoose }; }, [access, error, target, editableDraft, onChoose]);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  async function choose(candidate: AdminMediaItem) {
    if (locked.current) return;
    locked.current = true;
    setPending(true); setMessage(null);
    const actorId = latest.current.access?.actorId;
    const authorized = (item: AdminMediaItem) => {
      const now = latest.current;
      const current = restrictAdminAccess(now.error ? null : now.access, useAuthStore.getState().user);
      return Boolean(actorId && current?.actorId === actorId && now.target && canChooseAdminMedia(current, item, now.target, now.editableDraft));
    };
    try {
      if (!actorId || !authorized(candidate)) throw new ApiError("Không có quyền chọn tài nguyên này.", 403);
      controller.current = new AbortController();
      const result = await checkUploadedMedia(actorId, candidate.mediaId, controller.current.signal);
      if (!mounted.current || controller.current.signal.aborted) return;
      if (result.kind !== "known" || result.item.status !== "READY") { setMessage("Chưa xác nhận tài nguyên còn sẵn sàng. Tải lại thư viện trước khi chọn."); return; }
      if (!authorized(result.item)) throw new ApiError("Trạng thái hoặc quyền sử dụng tài nguyên đã thay đổi.", 403);
      latest.current.onChoose?.(result.item);
    } catch (reason) {
      if (mounted.current && !controller.current?.signal.aborted) setMessage(adminFailure(reason, "Không thể xác minh tài nguyên để gắn vào bản nháp. Vui lòng kiểm tra lại.").message);
    } finally {
      locked.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return { choose, pending, message };
}
