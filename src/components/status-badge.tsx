import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UserStatus = "ACTIVE" | "PENDING" | "LOCKED" | "BANNED" | (string & {});

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Đang hoạt động", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  PENDING: { label: "Chờ xác minh", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  LOCKED: { label: "Đã khóa", className: "bg-destructive/10 text-destructive" },
  BANNED: { label: "Bị cấm", className: "bg-destructive/10 text-destructive" },
};

/** Badge trạng thái người dùng (map UserResponse.status → nhãn tiếng Việt) */
export function StatusBadge({ status }: { status?: UserStatus }) {
  if (!status) return null;
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn(meta.className, "border-transparent")}>
      {meta.label}
    </Badge>
  );
}
