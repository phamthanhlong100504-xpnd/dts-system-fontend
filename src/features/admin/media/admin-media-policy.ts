import { canAdmin, canEnterCurrentAdmin, type AdminAccess } from "../foundation/admin-access";
import { MEDIA_UPLOAD_POLICIES, type MediaUploadTarget } from "@/features/media/media-upload-policy";
import type { AdminMediaItem } from "./admin-media-contract";

/** Identity V15 effective grants gate UI; MediaAccess additionally checks media:upload server-side.
 * Source-content rights are required to attach a Media object; Media create alone is insufficient.
 */
export function canUploadExistingAttachment(access: AdminAccess | null, target: MediaUploadTarget): boolean {
  if (!canAdmin(access, "media", "create")) return false;
  if (target === "TRAFFIC_SIGN") return canAdmin(access, "traffic-signs", "create") || canAdmin(access, "traffic-signs", "update");
  if (target === "QUESTION") return canAdmin(access, "questions", "create") || canAdmin(access, "questions", "update");
  if (target === "EXAM") return canAdmin(access, "exam", "create") || canAdmin(access, "exam", "update") || canAdmin(access, "official-exams", "update");
  return canAdmin(access, "simulation-scenarios", "create") || canAdmin(access, "simulation-scenarios", "update");
}
export function canChooseAdminMedia(access: AdminAccess | null, item: AdminMediaItem, target: MediaUploadTarget, editableDraft: boolean): boolean {
  if (!editableDraft || !canEnterCurrentAdmin(access) || !canAdmin(access, "media", "read") || !canUploadExistingAttachment(access, target)) return false;
  const policy = MEDIA_UPLOAD_POLICIES[target];
  const expectedKind = target === "SIMULATION_VIDEO" ? "VIDEO" : "IMAGE";
  return item.status === "READY" && item.visibility === policy.visibility && item.mediaType === expectedKind &&
    item.targetType === target && policy.mimeTypes.includes(item.mimeType) && item.sizeBytes <= policy.maxBytes &&
    policy.extensions.includes(item.extension.toLowerCase());
}
