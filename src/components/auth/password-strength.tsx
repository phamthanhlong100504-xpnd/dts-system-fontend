"use client";

import { cn } from "@/lib/utils";

/** Điểm mạnh mật khẩu (0–4): độ dài ≥8, chữ hoa, chữ số, ký tự đặc biệt */
function getScore(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const LEVELS = [
  { label: "Yếu", bar: "bg-destructive", text: "text-destructive" },
  { label: "Trung bình", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Mạnh", bar: "bg-primary", text: "text-primary" },
];

/** Thanh độ mạnh mật khẩu 4 đoạn — theo mockup đăng ký Identity */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const score = getScore(value);
  const level = LEVELS[score <= 1 ? 0 : score <= 3 ? 1 : 2];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5 px-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? level.bar : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn("text-right text-xs font-medium", level.text)}>
        Mật khẩu {level.label}
      </p>
    </div>
  );
}
