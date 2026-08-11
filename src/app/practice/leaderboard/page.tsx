"use client";

import { useState } from "react";
import { Trophy, User } from "lucide-react";
import { useLeaderboard } from "@/features/practice/use-practice";
import { EXAM_TYPES } from "@/features/practice/practice-service";
import { RequireAuth } from "@/components/require-auth";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PERIODS = [
  { key: "all", label: "Tất cả" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
];

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function LeaderboardPage() {
  const [examType, setExamType] = useState("all");
  const [period, setPeriod] = useState("all");
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useLeaderboard(
    examType === "all" ? "" : examType,
    period
  );

  // Backend leaderboard KHÔNG lọc theo examType (chấp nhận nhưng bỏ qua tham số)
  // → lọc client-side trên danh sách trả về để filter hoạt động.
  const filtered = (data ?? []).filter(
    (e) => examType === "all" || e.examType === examType
  );

  return (
    <RequireAuth>
      <div className="container space-y-5 py-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Trophy className="h-6 w-6 text-amber-500" />
            Bảng xếp hạng
          </h1>
          <p className="text-sm text-muted-foreground">
            Top thí sinh có điểm cao nhất (chế độ thi thử)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              {PERIODS.map((p) => (
                <TabsTrigger key={p.key} value={p.key}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="w-44">
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tất cả hạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hạng</SelectItem>
                {EXAM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    Hạng {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-destructive">
            Không tải được bảng xếp hạng. Kiểm tra service dts-practice.
          </p>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Hạng</TableHead>
                  <TableHead>Thí sinh</TableHead>
                  <TableHead>Hạng bằng</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead className="hidden md:table-cell">Đúng/Tổng</TableHead>
                  <TableHead className="hidden lg:table-cell">Hoàn thành</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, i) => {
                  const isMe =
                    (currentUser?.username && currentUser.username === entry.username) ||
                    (currentUser?.id && currentUser.id === entry.userId);

                  const displayName =
                    entry.username && entry.username.trim() !== ""
                      ? entry.username
                      : entry.userId
                        ? `user_${entry.userId.slice(0, 6)}`
                        : `Thí sinh #${i + 1}`;

                  return (
                    <TableRow key={entry.userId ?? i} className={isMe ? "bg-primary/5" : ""}>
                      <TableCell>
                        <span
                          className={
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold " +
                            (i === 0
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                              : i === 1
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : i === 2
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                  : "bg-muted text-muted-foreground")
                          }
                        >
                          {i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="truncate max-w-[180px] font-semibold">{displayName}</span>
                          {isMe && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                              Bạn
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{entry.examType}</TableCell>
                      <TableCell className="font-semibold">{entry.score ?? 0}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {entry.correctCount ?? 0}/{entry.totalQuestions ?? 0}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatTime(entry.completedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Chưa có dữ liệu xếp hạng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
