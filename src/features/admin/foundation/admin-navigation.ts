import { canReadAdminPage, type AdminAccess } from "./admin-access";

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  resource: string;
  implemented: boolean;
  readiness?: "partial" | "awaiting-data";
}
export interface AdminNavGroup {
  id: string;
  label: string;
  items: readonly AdminNavItem[];
}

/** One registry for sidebar, quick search, route access and future GAPs.
 * implemented means a route exists; readiness describes integration independently.
 * Neither property grants data or mutation capabilities.
 */
export const ADMIN_NAVIGATION: readonly AdminNavGroup[] = [
  {
    id: "overview", label: "Tổng quan", items: [
      { id: "dashboard", readiness: "partial", label: "Tổng quan", href: "/admin/dashboard", icon: "dashboard", resource: "dashboard", implemented: true },
    ]
  },
  {
    id: "theory", label: "Nội dung lý thuyết", items: [
      { id: "questions", readiness: "partial", label: "Ngân hàng câu hỏi", href: "/admin/questions", icon: "questions", resource: "questions", implemented: true },
      { id: "chapters", readiness: "partial", label: "Quản lý chương", href: "/admin/chapters", icon: "chapters", resource: "chapters", implemented: true },
      { id: "programs", readiness: "partial", label: "Chương trình học", href: "/admin/programs", icon: "programs", resource: "learning-programs", implemented: true },
      { id: "traffic-signs", readiness: "partial", label: "Biển báo giao thông", href: "/admin/traffic-signs", icon: "signs", resource: "traffic-signs", implemented: true },
      { id: "memory-tips", readiness: "partial", label: "Mẹo ghi nhớ", href: "/admin/memory-tips", icon: "tips", resource: "memory-tips", implemented: true },
      { id: "practice-exam-sets", readiness: "partial", label: "Bộ đề luyện tập", href: "/admin/practice-exam-sets", icon: "exams", resource: "practice-exam-sets", implemented: true },
    ]
  },
  {
    id: "official", label: "Thi chính thức", items: [
      { id: "exams", readiness: "partial", label: "Quản lý đề thi", href: "/admin/exams", icon: "exams", resource: "exam", implemented: true },
      { id: "exam-structures", readiness: "partial", label: "Cấu trúc đề thi", href: "/admin/exam-structures", icon: "structures", resource: "exam_structure", implemented: true },
      { id: "exam-criteria", readiness: "partial", label: "Tiêu chí chấm thi", href: "/admin/exam-criteria", icon: "criteria", resource: "exam_criteria", implemented: true },
      { id: "exam-rules", readiness: "partial", label: "Quy chế thi", href: "/admin/exam-rules", icon: "rules", resource: "exam_rule", implemented: true },
      { id: "exam-sessions", readiness: "awaiting-data", label: "Theo dõi phiên thi", href: "/admin/exam-sessions", icon: "sessions", resource: "exam-sessions", implemented: true },
    ]
  },
  {
    id: "simulation", label: "Video mô phỏng", items: [
      { id: "simulation-scenarios", readiness: "awaiting-data", label: "Ngân hàng tình huống", href: "/admin/simulations/scenarios", icon: "video", resource: "simulation-scenarios", implemented: true },
      { id: "simulation-exam-sets", readiness: "awaiting-data", label: "Bộ đề mô phỏng", href: "/admin/simulations/exam-sets", icon: "exams", resource: "simulation-exam-sets", implemented: true },
      { id: "simulation-guide", readiness: "awaiting-data", label: "Hướng dẫn mô phỏng", href: "/admin/simulation-guide", icon: "guide", resource: "simulation-guide", implemented: true },
      { id: "simulation-settings", readiness: "awaiting-data", label: "Cấu hình áp dụng", href: "/admin/simulations/settings", icon: "settings", resource: "simulation-policies", implemented: true },
    ]
  },
  {
    id: "operations", label: "Vận hành", items: [
      { id: "media", label: "Thư viện tài nguyên", href: "/admin/media", icon: "media", resource: "media", implemented: true },
      { id: "content-releases", readiness: "awaiting-data", label: "Phát hành & Đồng bộ", href: "/admin/content-releases", icon: "releases", resource: "content-releases", implemented: true },
      { id: "reports", readiness: "awaiting-data", label: "Báo cáo", href: "/admin/reports", icon: "reports", resource: "reports", implemented: true },
      { id: "system-monitoring", readiness: "awaiting-data", label: "Giám sát vận hành", href: "/admin/system-monitoring", icon: "monitoring", resource: "system-status", implemented: true },
      { id: "audit-logs", readiness: "awaiting-data", label: "Nhật ký quản trị", href: "/admin/audit-logs", icon: "audit", resource: "audit", implemented: true },
    ]
  },
  {
    id: "system", label: "Quản trị hệ thống", items: [
      { id: "users", label: "Người dùng", href: "/admin/users", icon: "users", resource: "users", implemented: true },
      { id: "roles", label: "Vai trò & Quyền", href: "/admin/roles", icon: "roles", resource: "roles", implemented: true },
      { id: "settings", label: "Cài đặt", href: "/admin/settings", icon: "settings", resource: "settings", implemented: true },
    ]
  },
];

export const matchesAdminPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function findAdminPage(pathname: string): AdminNavItem | undefined {
  if (matchesAdminPath(pathname, "/admin/exams/structures/create")) {
    return ADMIN_NAVIGATION.flatMap((g) => g.items).find((i) => i.id === "exam-structures");
  }
  return ADMIN_NAVIGATION.flatMap((g) => g.items)
    .filter((item) => matchesAdminPath(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function visibleAdminNavigation(access: AdminAccess | null): AdminNavGroup[] {
  return ADMIN_NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.implemented && canReadAdminPage(access, item.id)),
  })).filter((group) => group.items.length > 0);
}

const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
export function searchAdminNavigation(groups: readonly AdminNavGroup[], query: string): AdminNavItem[] {
  const terms = searchable(query.trim()).split(/\s+/).filter(Boolean);
  return groups.flatMap((group) => group.items.filter((item) =>
    terms.every((term) => searchable(`${group.label} ${item.label} ${item.href}`).includes(term))));
}
