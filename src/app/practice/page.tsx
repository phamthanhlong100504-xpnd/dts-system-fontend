"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  History,
  PlayCircle,
  Timer,
  Trophy,
  Video,
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
import { SIMULATION_CHAPTERS } from "@/features/simulation/simulation-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="container mx-auto px-4 max-w-7xl space-y-8 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Luyện thi Giấy phép lái xe</h1>
          <p className="text-sm text-muted-foreground">
            Ngân hàng 600 câu hỏi lý thuyết sát hạch & 120 tình huống mô phỏng giao thông chuẩn 2026
          </p>
        </div>

        <StartActions />
        <SimulationOverviewSection />
        <StatsOverview />
        <ChapterList />
      </div>
    </RequireAuth>
  );
}

/** Nút bắt đầu Thi thử / Luyện tập / Mô phỏng + link Lịch sử & Bảng xếp hạng */
function StartActions() {
  const [mode, setMode] = useState<ExamMode | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Thi thử lý thuyết */}
        <button
          type="button"
          onClick={() => setMode("EXAM")}
          className="group flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Thi thử lý thuyết</p>
            <p className="text-xs text-muted-foreground">
              25 câu, 20 phút, chấm điểm theo quy chuẩn
            </p>
          </div>
        </button>

        {/* Luyện tập lý thuyết */}
        <button
          type="button"
          onClick={() => setMode("PRACTICE")}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Luyện tập lý thuyết</p>
            <p className="text-xs text-muted-foreground">
              Xem đáp án đúng/sai và giải thích ngay sau mỗi câu
            </p>
          </div>
        </button>

        {/* 120 Tình huống mô phỏng */}
        <Link
          href="/practice/simulation"
          className="group flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-left shadow-sm transition-all hover:border-amber-500 hover:bg-amber-500/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground">120 Tình huống mô phỏng</p>
              <Badge variant="default" className="bg-amber-500 text-[10px] h-4 px-1 text-white">MỚI</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Video 3D thực tế, cắm cờ Space chấm thang 5 điểm
            </p>
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 text-sm pt-1">
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

/** Khối Luyện tập 120 Tình huống mô phỏng theo chương */
function SimulationOverviewSection() {
  return (
    <div className="space-y-4 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-50/40 via-card to-background p-6 shadow-sm dark:from-amber-950/15">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">120 Tình huống mô phỏng giao thông</h2>
            <Badge variant="outline" className="border-amber-500 text-amber-600 font-semibold text-xs">
              Chuẩn GPLX 2026
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Luyện kỹ năng nhận diện tình huống nguy hiểm trên đường đô thị, cao tốc, nông thôn và đèo dốc.
          </p>
        </div>

        <Link href="/practice/simulation">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold shadow">
            <PlayCircle className="h-4 w-4" /> Bắt đầu luyện mô phỏng
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SIMULATION_CHAPTERS.map((ch) => (
          <Link
            key={ch.id}
            href={`/practice/simulation`}
            className="group"
          >
            <Card className="h-full transition-all group-hover:border-amber-500/60 group-hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Chương {ch.id}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">Tình huống {ch.range}</span>
                </div>
                <CardTitle className="text-sm font-semibold leading-snug pt-1">
                  {ch.title.split(": ")[1] ?? ch.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <CardDescription className="text-xs line-clamp-2">
                  {ch.description}
                </CardDescription>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 pt-1">
                  <span>{ch.count} video mô phỏng</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
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
        Không tải được thống kê câu hỏi lý thuyết. Kiểm tra service dts-practice.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Thống kê lý thuyết 600 câu</h2>
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
      <h2 className="text-lg font-semibold">Ôn tập lý thuyết theo chương</h2>
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
