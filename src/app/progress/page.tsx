"use client";

import {
  CheckCircle2,
  Flame,
  Gauge,
  GraduationCap,
  Target,
  Timer,
  XCircle,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useDashboard } from "@/features/progress/use-progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function formatStudyTime(seconds?: number): string {
  if (!seconds) return "0 phút";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}

function formatPercent(value?: number): string {
  if (value == null) return "—";
  return `${Math.round(value)}%`;
}

export default function ProgressPage() {
  return (
    <RequireAuth>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tiến độ học tập</h1>
          <p className="text-sm text-muted-foreground">
            Thống kê tổng hợp từ dts-progress
          </p>
        </div>
        <DashboardContent />
      </div>
    </RequireAuth>
  );
}

function DashboardContent() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Không tải được dữ liệu tiến độ. Kiểm tra service dts-progress.
      </p>
    );
  }

  const cards: { title: string; value: string; icon: React.ReactNode }[] = [
    { title: "Số bài thi đã làm", value: String(data.totalExams ?? 0), icon: <GraduationCap className="h-4 w-4 text-muted-foreground" /> },
    { title: "Phiên luyện tập", value: String(data.totalPracticeSessions ?? 0), icon: <Target className="h-4 w-4 text-muted-foreground" /> },
    { title: "Thời gian học", value: formatStudyTime(data.totalStudyTimeSeconds), icon: <Timer className="h-4 w-4 text-muted-foreground" /> },
    { title: "Điểm trung bình", value: formatPercent(data.averageScore), icon: <Gauge className="h-4 w-4 text-muted-foreground" /> },
    { title: "Đã đậu", value: String(data.examsPassed ?? 0), icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
    { title: "Chưa đậu", value: String(data.examsFailed ?? 0), icon: <XCircle className="h-4 w-4 text-destructive" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              {c.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Độ chính xác</CardTitle>
            <CardDescription>
              {data.totalCorrectAnswers ?? 0} / {data.totalQuestionsAnswered ?? 0} câu trả lời đúng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={data.averageScore ?? 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hoàn thành chương</CardTitle>
            <CardDescription>
              {data.chaptersCompleted ?? 0} / {data.chaptersTotal ?? 0} chương
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={data.chaptersProgressPercent ?? 0} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Đang học: {data.chaptersInProgress ?? 0}</span>
              <span>{formatPercent(data.chaptersProgressPercent)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Chuỗi ngày học</CardTitle>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.currentStreak ?? 0} ngày
            </div>
            <p className="text-sm text-muted-foreground">
              Kỷ lục: {data.longestStreak ?? 0} ngày
              {data.lastStudyDate ? ` • Học gần nhất: ${data.lastStudyDate}` : ""}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
