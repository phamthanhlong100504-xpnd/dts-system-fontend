"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  History,
  Timer,
  Trophy,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ExamSetupDialog } from "@/features/practice/components/exam-setup-dialog";
import {
  CHAPTER_META,
  type ExamMode,
} from "@/features/practice/practice-service";
import {
  useCriticalQuestions,
  useQuestionStats,
} from "@/features/practice/use-practice";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PracticePage() {
  return (
    <RequireAuth>
      <div className="container mx-auto px-4 max-w-7xl space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Luyện thi lý thuyết</h1>
          <p className="text-sm text-muted-foreground">
            Ngân hàng 600 câu hỏi sát hạch theo bộ đề Cục CSGT 2025
          </p>
        </div>

        <StartActions />
        <StatsOverview />
        <ChapterList />
      </div>
    </RequireAuth>
  );
}

/** Nút bắt đầu Thi thử / Luyện tập + link Lịch sử & Bảng xếp hạng */
function StartActions() {
  const [mode, setMode] = useState<ExamMode | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("EXAM")}
          className="group flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Thi thử</p>
            <p className="text-sm text-muted-foreground">
              25 câu, 20 phút, chấm điểm theo quy chuẩn
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("PRACTICE")}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Luyện tập</p>
            <p className="text-sm text-muted-foreground">
              Xem đáp án đúng/sai và giải thích ngay sau mỗi câu
            </p>
          </div>
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          href="/practice/history"
          className="flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <History className="h-4 w-4" /> Lịch sử thi
        </Link>
        <Link
          href="/practice/leaderboard"
          className="flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <Trophy className="h-4 w-4" /> Bảng xếp hạng
        </Link>
      </div>

      <ExamSetupDialog
        open={mode !== null}
        mode={mode ?? "EXAM"}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
      />
    </div>
  );
}

function StatsOverview() {
  const { data, isLoading, isError } = useQuestionStats();
  const criticalQuery = useCriticalQuestions();

  if (isLoading || criticalQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Không tải được thống kê câu hỏi. Kiểm tra service dts-practice.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số câu hỏi</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Câu điểm liệt</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {criticalQuery.data?.length ?? 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChapterList() {
  const { data, isLoading, isError } = useQuestionStats();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (isError || !data?.byChapter) {
    return null;
  }

  const chapters = Object.entries(data.byChapter).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Ôn tập theo chương</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map(([id, count]) => {
          const meta = CHAPTER_META[id];
          return (
            <Link key={id} href={`/practice/chapter/${id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">Chương {id}</Badge>
                    {meta?.range && (
                      <span className="text-xs text-muted-foreground">{meta.range}</span>
                    )}
                  </div>
                  <CardTitle className="text-sm leading-snug">
                    {meta?.name ?? `Chương ${id}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{count} câu hỏi</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

