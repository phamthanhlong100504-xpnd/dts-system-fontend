import {capabilityAllows,validCapabilityGrant,type AdminCapabilityGrant} from "./admin-capabilities";
/** Current, verified Identity/Content Builder/Examination contracts.
 * The proposed /admin/me/capabilities contract is not available yet.
 * Do not grant new workflow permissions or specialized admin roles here.
 */
export interface AdminPrincipal {
  id?: string;
  roles?: string[];
  permissions?: string[];
}

export interface AdminAccess {
  actorId: string;
  roles: readonly string[];
  permissions: readonly string[];
  capabilities?: AdminCapabilityGrant;
}

export function restrictAdminAccess(access: AdminAccess | null, principal: AdminPrincipal | null): AdminAccess | null {
  if (!access || !principal?.id || principal.id !== access.actorId) return null;
  const roles = new Set((principal.roles ?? []).map(roleName));
  const permissions = new Set((principal.permissions ?? []).map(permissionName));
  return { ...access, roles: access.roles.filter((r) => roles.has(r)), permissions: access.permissions.filter((p) => permissions.has(p)) };
}

const roleName = (name: string) => name === "ADMIN" ? "ROLE_ADMIN" : name;
const permissionName = (name: string) => name.replace(/^PERM_/, "");

export function readCurrentAdminAccess(principal: AdminPrincipal, response: unknown): AdminAccess {
  if (!principal.id || !Array.isArray(response)) {
    throw new Error("Không thể xác minh quyền của tài khoản hiện tại.");
  }
  const roles: string[] = [];
  const permissions: string[] = [];
  for (const value of response) {
    if (!value || typeof value !== "object" || typeof value.name !== "string" ||
      !Array.isArray(value.permissions) || value.permissions.some((p: unknown) => typeof p !== "string")) {
      throw new Error("Dữ liệu quyền không hợp lệ. Vui lòng tải lại hoặc đăng nhập lại.");
    }
    roles.push(roleName(value.name));
    permissions.push(...value.permissions.map(permissionName));
  }
  // A fresh database grant alone cannot grant operations to an older JWT.
  const tokenRoles = new Set((principal.roles ?? []).map(roleName));
  const tokenPermissions = new Set((principal.permissions ?? []).map(permissionName));
  return {
    actorId: principal.id,
    roles: [...new Set(roles)].filter((role) => tokenRoles.has(role)),
    permissions: [...new Set(permissions)].filter((permission) => tokenPermissions.has(permission)),
  };
}

export function canEnterCurrentAdmin(access: AdminAccess | null): boolean {
  // Transitional gate for the existing controllers, not the future capability gate.
  if(access?.capabilities)return validCapabilityGrant(access.capabilities,access.actorId)&&access.capabilities.canEnterAdmin;
  return access?.roles.includes("ROLE_ADMIN") === true;
}

export function canAdmin(access: AdminAccess | null, resource: string, action: string): boolean {
  if (!access || !canEnterCurrentAdmin(access)) return false;
  if(access.capabilities)return capabilityAllows(access.capabilities,access.actorId,resource,action);
  if (resource === "practice-policy-summary") return action === "read"; // Current random-policy summary reads only, no preset Admin capability inferred.
  if (["users", "roles", "permissions"].includes(resource)) {
    // Identity AdminController currently protects these actions with ROLE_ADMIN.
    return ["read", "create", "update", "delete"].includes(action);
  }
  if (["traffic-signs", "memory-tips"].includes(resource)) {
    // Verified current controllers: role-guarded draft creation; never grant publish/update/delete.
    return ["read", "create"].includes(action);
  }
  if (["questions", "chapters", "learning-programs"].includes(resource)) {
    return ["read", "create", "update", "delete"].includes(action) &&
      access.permissions.includes(`${resource}:${action}`);
  }
  if (["exam", "exam_version", "exam_structure", "exam_rule", "exam_criteria"].includes(resource)) {
    if (!["read", "create", "update", "delete", "publish", "archive", "clone"].includes(action)) return false;
    if (["publish", "archive", "clone"].includes(action) && resource !== "exam_version") return false;
    const moduleAction = action === "clone" ? "create" : ["publish", "archive"].includes(action) ? "update" : action;
    return access.permissions.includes(`exams:${moduleAction}`) ||
      access.permissions.includes(`${resource}:${action}`);
  }
  // No guessed permission fallback for release, approval, scoring or new resources.
  return false;
}

export function canReadAdminPage(access: AdminAccess | null, id: string): boolean {
  if (!canEnterCurrentAdmin(access)) return false;
  if(access?.capabilities)return validCapabilityGrant(access.capabilities,access.actorId)&&access.capabilities.pages[id]===true;
  switch (id) {
    case "dashboard":
    case "reports":
    case "system-monitoring":
    case "audit-logs": return true; // Availability/authorized navigation only, no analytics, audit or operations data capability is granted.
    case "practice-exam-sets": return canAdmin(access, "practice-policy-summary", "read");
    case "exam-sessions": return canAdmin(access, "exam", "read"); // Availability page only, no session read capability or API inferred.
    case "questions": return canAdmin(access, "questions", "read");
    case "traffic-signs": return canAdmin(access, "traffic-signs", "read");
    case "memory-tips": return canAdmin(access, "memory-tips", "read");
    case "chapters": return canAdmin(access, "chapters", "read") && canAdmin(access, "questions", "read");
    case "programs": return canAdmin(access, "learning-programs", "read") && canAdmin(access, "chapters", "read");
    case "exams": return ["exam", "exam_version", "exam_structure", "exam_rule", "exam_criteria"].every((r) => canAdmin(access, r, "read"));
    case "exam-structures": return canAdmin(access, "exam_structure", "read");
    case "exam-criteria": return canAdmin(access, "exam_criteria", "read");
    case "exam-rules": return canAdmin(access, "exam_rule", "read");
    case "users": return canAdmin(access, "users", "read");
    case "roles": return canAdmin(access, "roles", "read");
    case "simulation-scenarios":
    case "simulation-exam-sets":
    case "simulation-settings":
    case "simulation-guide":
    case "settings": return true; // Existing role-guarded screens; no new capability granted.
    case "media":
    case "content-releases": return true; // Admin metadata / explicitly blocked release shell; no new write capability.
    default: return false;
  }
}

export function canOpenAdminPath(access: AdminAccess | null, pageId: string, pathname: string): boolean {
  if (!canReadAdminPage(access, pageId)) return false;
  if (pathname === "/admin/questions/create") return canAdmin(access, "questions", "create");
  if (pathname.startsWith("/admin/questions/edit/")) return canAdmin(access, "questions", "update");
  // This existing route also hosts ?edit=...; each save button and service checks its own action.
  if (pathname === "/admin/exams/structures/create") return canAdmin(access, "exam_structure", "create") || canAdmin(access, "exam_structure", "update");
  return true;
}
