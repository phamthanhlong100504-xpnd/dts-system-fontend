"use client";

import { useState } from "react";
import Link from "next/link";
import { useExamHistory } from "@/features/practice/use-practice";
import type { ExamHistoryEntry } from "@/features/practice/practice-service";
import { RequireAuth } from "@/components/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function ModeBadge({ mode }: { mode?: string }) {
  return mode === "PRACTICE" ? (
    <Badge variant="secondary">Luyện tập</Badge>
  ) : (
    <Badge>Thi thử</Badge>
  );
}

function PassedBadge({ passed }: { passed?: boolean }) {
  if (passed === undefined) return <Badge variant="outline">—</Badge>;
  return passed ? (
    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
      Đạt
    </Badge>
  ) : (
    <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/10">
      Không đạt
    </Badge>
  );
}

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useExamHistory(page, PAGE_SIZE);

  return (
    <RequireAuth>
      <div className="container space-y-5 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch sử thi</h1>
          <p className="text-sm text-muted-foreground">
            Các bài thi và luyện tập đã hoàn thành
          </p>
        </div>

        {isLoading && !data ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-destructive">
            Không tải được lịch sử thi. Kiểm tra service dts-practice.
          </p>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Hạng</TableHead>
                  <TableHead className="hidden md:table-cell">Số câu</TableHead>
                  <TableHead>Đúng/Sai</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead className="hidden lg:table-cell">Thời gian</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.content ?? []).map((h: ExamHistoryEntry) => (
                  <TableRow key={h.examId}>
                    <TableCell>
                      <ModeBadge mode={h.mode} />
                    </TableCell>
                    <TableCell className="font-medium">{h.examType}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {h.totalQuestions}
                    </TableCell>
                    <TableCell>
                      <span className="text-emerald-600">{h.correctCount ?? 0}</span>
                      {" / "}
                      <span className="text-destructive">{h.wrongCount ?? 0}</span>
                    </TableCell>
                    <TableCell className="font-semibold">{h.score ?? 0}</TableCell>
                    <TableCell>
                      {h.status === "IN_PROGRESS" ? (
                        <Badge variant="outline">Đang làm</Badge>
                      ) : (
                        <PassedBadge passed={h.passed} />
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatTime(h.startedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.status === "IN_PROGRESS" ? (
                        <Link
                          href={`/practice/exam/${h.examId}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Tiếp tục
                        </Link>
                      ) : (
                        <Link
                          href={`/practice/result/${h.examId}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Kết quả
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(data.content ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Chưa có bài thi nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {data && (data.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={data.first}
            >
              Trang trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {(data.number ?? 0) + 1} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.last}
            >
              Trang sau
            </Button>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
