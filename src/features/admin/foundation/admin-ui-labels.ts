/** Presentation labels only. API values, permission checks and submitted data stay unchanged. */
const statuses: Record<string, string> = {
  DRAFT: "Bản nháp", PUBLISHED: "Đã công bố", ARCHIVED: "Đã lưu trữ", HIDDEN: "Đang ẩn",
  UPLOADING: "Đang xử lý", READY: "Sẵn sàng", FAILED: "Xử lý thất bại",
  CREATED: "Đã tạo", VALIDATING: "Đang kiểm tra", DISTRIBUTING: "Đang đồng bộ",
  ACTIVATING: "Đang kích hoạt", ACTIVE: "Đã kích hoạt", RETIRED: "Ngừng sử dụng",
};
export function adminStatusLabel(value: string | null | undefined): string {
  return value ? statuses[value] ?? "Chưa xác định" : "Chưa xác định";
}
const questionTypes: Record<string, string> = {
  SINGLE_CHOICE: "Một đáp án đúng", MULTIPLE_CHOICE: "Nhiều đáp án đúng", TRUE_FALSE: "Đúng / Sai",
  FILL_BLANK: "Điền vào chỗ trống", ORDERING: "Sắp xếp thứ tự", MATCHING: "Ghép cặp",
};
export function adminQuestionTypeLabel(value: string): string {
  return questionTypes[value] ?? (/[À-ỹ]/.test(value) ? value : "Loại câu hỏi khác");
}
const roles: Record<string, string> = {
  ADMIN: "Quản trị viên", STUDENT: "Học viên", TEACHER: "Giảng viên", INSTRUCTOR: "Giảng viên",
  USER: "Người dùng", MANAGER: "Người quản lý", MODERATOR: "Người kiểm duyệt", CONTENT_EDITOR: "Người biên soạn",
};
export function adminRoleLabel(value: string | null | undefined): string {
  if (!value) return "Chưa có vai trò";
  return roles[value.replace(/^ROLE_/, "")] ?? value;
}
const resources: Record<string, string> = {
  questions: "câu hỏi", chapters: "chương học", "question-blocks": "liên kết câu hỏi",
  "chapter-blocks": "liên kết chương", "learning-programs": "chương trình học", courses: "khóa học",
  users: "người dùng", roles: "vai trò", permissions: "quyền hạn", exams: "kỳ thi", exam: "kỳ thi",
  "exam-versions": "phiên bản đề thi", exam_version: "phiên bản đề thi",
  "exam-structures": "cấu trúc đề thi", exam_structure: "cấu trúc đề thi",
  "exam-rules": "quy chế thi", exam_rule: "quy chế thi",
  "exam-criterias": "tiêu chí chấm thi", "exam-criteria": "tiêu chí chấm thi", exam_criteria: "tiêu chí chấm thi",
  media: "tài nguyên", "traffic-signs": "biển báo giao thông", "memory-tips": "mẹo ghi nhớ",
  "content-releases": "đợt phát hành", "simulation-guide": "hướng dẫn mô phỏng",
  "simulation-scenarios": "tình huống mô phỏng", "simulation-exam-sets": "bộ đề mô phỏng",
  practice: "luyện tập", progress: "tiến độ học", results: "kết quả học tập", reports: "báo cáo", settings: "cài đặt",
};
const actions: Record<string, string> = {
  read: "Xem", create: "Tạo", update: "Chỉnh sửa", delete: "Xóa", publish: "Công bố",
  approve: "Phê duyệt", archive: "Lưu trữ", clone: "Sao chép", upload: "Tải lên", manage: "Quản lý",
};
export function adminResourceLabel(value: string | null | undefined): string {
  if (!value) return "Khác";
  const label = resources[value];
  return label ? label.charAt(0).toLocaleUpperCase("vi-VN") + label.slice(1) : value;
}
export function adminPermissionLabel(name: string | null | undefined, displayName?: string | null): string {
  const [resource, action] = (name ?? "").replace(/^PERM_/, "").split(":");
  return resources[resource] && actions[action] ? `${actions[action]} ${resources[resource]}` : displayName || name || "Quyền chưa đặt tên";
}
