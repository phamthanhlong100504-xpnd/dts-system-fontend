import type { GuideContent } from "./simulation-guide-types";
export interface GuideTextField {
  group: string;
  label: string;
  path: (string | number)[];
  value: string;
  multiline: boolean;
}
/** Fixed editor fields: only human-readable text is writable. Keys, bank statistics and scoring rules are not inputs. */
export function guideTextFields(content: GuideContent): GuideTextField[] {
  const fields: GuideTextField[] = [];
  const add = (
    group: string,
    label: string,
    path: (string | number)[],
    value: string,
    multiline = false,
  ) => fields.push({ group, label, path, value, multiline });
  const item = (
    group: string,
    prefix: (string | number)[],
    entry: { title: string; description: string },
    label: string,
  ) => {
    add(group, `${label} · Tiêu đề`, [...prefix, "title"], entry.title);
    add(
      group,
      `${label} · Mô tả`,
      [...prefix, "description"],
      entry.description,
      true,
    );
  };
  add("Tổng quan", "Tiêu đề trang", ["title"], content.title);
  add("Tổng quan", "Mô tả trang", ["description"], content.description, true);
  add(
    "Tổng quan",
    "Giới thiệu module",
    ["overview", "description"],
    content.overview.description,
    true,
  );
  add(
    "Cách luyện tập",
    "Tiêu đề khu vực",
    ["steps", "title"],
    content.steps.title,
  );
  content.steps.items.forEach((i, n) =>
    item("Cách luyện tập", ["steps", "items", n], i, `Bước ${n + 1}`),
  );
  add(
    "Cách tính điểm",
    "Tiêu đề khu vực",
    ["scoring", "title"],
    content.scoring.title,
  );
  add(
    "Cách tính điểm",
    "Giải thích chung",
    ["scoring", "description"],
    content.scoring.description,
    true,
  );
  add(
    "Cách tính điểm",
    "Tiêu đề thanh minh họa",
    ["scoring", "illustrationTitle"],
    content.scoring.illustrationTitle,
  );
  add(
    "Cách tính điểm",
    "Chú thích minh họa",
    ["scoring", "illustrationNote"],
    content.scoring.illustrationNote,
    true,
  );
  content.scoring.items.forEach((i, n) =>
    item("Cách tính điểm", ["scoring", "items", n], i, `Giải thích ${n + 1}`),
  );
  add(
    "Cách tính điểm",
    "Ghi chú quan trọng",
    ["scoring", "important"],
    content.scoring.important,
    true,
  );
  add(
    "Nhận diện tình huống",
    "Tiêu đề khu vực",
    ["recognition", "title"],
    content.recognition.title,
  );
  content.recognition.items.forEach((i, n) =>
    item(
      "Nhận diện tình huống",
      ["recognition", "items", n],
      i,
      `Nội dung ${n + 1}`,
    ),
  );
  item(
    "Nhận diện tình huống",
    ["recognition", "policy"],
    content.recognition.policy,
    "Quy tắc hiển thị gợi ý",
  );
  add(
    "So sánh chế độ",
    "Tiêu đề khu vực",
    ["comparison", "title"],
    content.comparison.title,
  );
  for (const mode of ["practice", "exam"] as const) {
    const label = mode === "practice" ? "Ôn tập" : "Thi thử";
    add(
      "So sánh chế độ",
      `${label} · Nhãn`,
      ["comparison", mode, "badge"],
      content.comparison[mode].badge,
    );
    add(
      "So sánh chế độ",
      `${label} · Tiêu đề`,
      ["comparison", mode, "title"],
      content.comparison[mode].title,
    );
    content.comparison[mode].items.forEach((i, n) =>
      item(
        "So sánh chế độ",
        ["comparison", mode, "items", n],
        i,
        `${label} · Mục ${n + 1}`,
      ),
    );
  }
  add(
    "Lưu ý luyện tập",
    "Tiêu đề khu vực",
    ["notes", "title"],
    content.notes.title,
  );
  content.notes.items.forEach((i, n) =>
    item("Lưu ý luyện tập", ["notes", "items", n], i, `Lưu ý ${n + 1}`),
  );
  add("Cuối trang", "Tiêu đề khu vực", ["cta", "title"], content.cta.title);
  add(
    "Cuối trang",
    "Mô tả",
    ["cta", "description"],
    content.cta.description,
    true,
  );
  add(
    "Cuối trang",
    "Nhãn nút bắt đầu",
    ["cta", "buttonLabel"],
    content.cta.buttonLabel,
  );
  return fields;
}
export function updateGuideText(
  content: GuideContent,
  path: (string | number)[],
  value: string,
): GuideContent {
  if (
    !guideTextFields(content).some(
      (f) => JSON.stringify(f.path) === JSON.stringify(path),
    )
  )
    throw new Error("Trường nội dung không được phép chỉnh sửa.");
  const next = structuredClone(content);
  let target = next as unknown as Record<string | number, unknown>;
  for (const part of path.slice(0, -1))
    target = target[part] as Record<string | number, unknown>;
  target[path[path.length - 1]] = value;
  return next;
}
