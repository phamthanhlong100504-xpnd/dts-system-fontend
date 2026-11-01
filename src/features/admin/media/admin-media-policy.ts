import { canAdmin, canEnterCurrentAdmin, type AdminAccess } from "../foundation/admin-access";
import { MEDIA_UPLOAD_POLICIES, type MediaUploadTarget } from "@/features/media/media-upload-policy";
import type { AdminMediaItem } from "./admin-media-contract";

/** Reuse only existing attachment editing rights. This is NOT a new Media ACL.
 * New video/sign/thumbnail administration waits for a verified Admin contract.
 */
export function canUploadExistingAttachment(access: AdminAccess | null, target: MediaUploadTarget): boolean {
  if (target === "TRAFFIC_SIGN") return canAdmin(access, "traffic-signs", "create");
  const resource = target === "QUESTION" ? "questions" : target === "EXAM" ? "exam" : null;
  return resource !== null && (canAdmin(access, resource, "create") || canAdmin(access, resource, "update"));
}
export function canChooseAdminMedia(access: AdminAccess | null, item: AdminMediaItem, target: MediaUploadTarget, editableDraft: boolean): boolean {
  if (!editableDraft || !canEnterCurrentAdmin(access) || !canUploadExistingAttachment(access, target)) return false;
  const policy = MEDIA_UPLOAD_POLICIES[target];
  return item.status === "READY" && item.visibility === "PUBLIC" && item.mediaType === "IMAGE" &&
    validateCompatibleMedia(item, policy);
}
function validateCompatibleMedia(item: AdminMediaItem, policy: (typeof MEDIA_UPLOAD_POLICIES)[MediaUploadTarget]): boolean {
  return policy.mimeTypes.includes(item.mimeType) && item.sizeBytes <= policy.maxBytes &&
    policy.extensions.includes(item.extension.toLowerCase());
}
