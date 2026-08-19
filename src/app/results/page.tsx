"use client";

import Link from "next/link";
import {
  Award,
  BookOpen,
  Clock,
  Gauge,
  Target,
  Trophy,
  FileCheck,
  FileText
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendChart, type TrendPoint } from "@/components/charts/trend-chart";
import {
  useRecentResults,
  useResultOverview,
  useResultStatistics,
  useResultSummaries,
} from "@/features/result/use-result";

function formatStudyTime(seconds?: number): string {
  if (!seconds) return "0 phút";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}

function formatScore(v: number | null | undefined): string {
  if (v == null) return "—";
  return String(Math.round(v));
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function statusTone(status: string | null | undefined) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "failed":
    case "not_completed":
      return "destructive";
    default:
      return "outline";
  }
}

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Hoàn thành",
  IN_PROGRESS: "Đang làm",
  NOT_COMPLETED: "Chưa hoàn thành",
  SUBMITTED: "Đã nộp",
};

export default function ResultsPage() {
  return (
    <RequireAuth>
      <div className="container space-y-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kết quả & Thống kê</h1>
            <p className="text-sm text-muted-foreground">
              Thành tích và xu hướng theo thời gian (dts-result)
            </p>
          </div>
          <Link href="/progress" className="text-sm text-primary hover:underline">
            Xem Tiến độ học tập →
          </Link>
        </div>
        <ResultsContent />
      </div>
    </RequireAuth>
  );
}

function ResultsContent() {
  const overview = useResultOverview();
  const stats = useResultStatistics();
  const summaries = useResultSummaries({ size: 20 });
  const recent = useRecentResults(10);

  const loading = overview.isLoading || stats.isLoading;
  const error = overview.isError || stats.isError;

  return (
    <div className="space-y-6">
      <OverviewCards overview={overview.data} loading={loading} error={error} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xu hướng điểm số</CardTitle>
            <CardDescription>Điểm trung bình theo ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={stats.data?.scoreTrend} loading={stats.isLoading} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thời gian học</CardTitle>
            <CardDescription>Số phút học theo ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <StudyTimeTrendChart data={stats.data?.studyTimeTrend} loading={stats.isLoading} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tổng hợp theo mục tiêu</CardTitle>
          <CardDescription>Điểm tốt nhất / trung bình cho từng bài thi, chương</CardDescription>
        </CardHeader>
        <CardContent>
          <SummaryTable page={summaries.data} loading={summaries.isLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentList items={recent.data} loading={recent.isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewCards({
  overview,
  loading,
  error,
}: {
  overview?: ReturnType<typeof useResultOverview>["data"];
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  if (error || !overview) {
    return (
      <p className="text-sm text-destructive">
        Không tải được dữ liệu kết quả. Kiểm tra service dts-result.
      </p>
    );
  }

  const cards = [
    { title: "Tổng số bài thi", value: String(overview.totalExamsTaken ?? 0), icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
    { title: "Số bài thi Đạt", value: String(overview.passedExams ?? 0), icon: <FileCheck className="h-4 w-4 text-emerald-500" /> },
    { title: "Điểm trung bình", value: formatScore(overview.averageScore), icon: <Gauge className="h-4 w-4 text-muted-foreground" /> },
    { title: "Thời gian học", value: formatStudyTime(overview.totalLearningTimeSeconds), icon: <Clock className="h-4 w-4 text-muted-foreground" /> },
    { title: "Chương hoàn thành", value: String(overview.completedChapters ?? 0), icon: <BookOpen className="h-4 w-4 text-muted-foreground" /> },
    { title: "Chương trình hoàn thành", value: String(overview.completedPrograms ?? 0), icon: <Award className="h-4 w-4 text-emerald-500" /> },
  ];

  return (
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
  );
}

function ScoreTrendChart({
  data,
  loading,
}: {
  data?: { date: string; averageScore: number | null }[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-52 w-full" />;
  const points: TrendPoint[] = (data ?? []).map((p) => ({
    label: shortDate(p.date),
    value: p.averageScore != null ? Math.round(p.averageScore) : null,
  }));
  return (
    <TrendChart
      data={points}
      variant="line"
      height={220}
      formatValue={(v) => String(v)}
    />
  );
}

function StudyTimeTrendChart({
  data,
  loading,
}: {
  data?: { date: string; durationSeconds: number }[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-52 w-full" />;
  const points: TrendPoint[] = (data ?? []).map((p) => ({
    label: shortDate(p.date),
    value: Math.round(p.durationSeconds / 60),
  }));
  return (
    <TrendChart
      data={points}
      variant="bar"
      height={220}
      formatValue={(v) => `${v}'`}
    />
  );
}

function SummaryTable({
  page,
  loading,
}: {
  page?: { content: { targetType: string; status: string; attemptCount: number; bestScore: number | null; progress: number | null; lastActivityAt: string | null }[] };
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-48 w-full" />;
  const rows = page?.content ?? [];
  if (!rows.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có kết quả thi nào.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Loại</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Số lần</TableHead>
          <TableHead>Điểm cao nhất</TableHead>
          <TableHead>Tiến độ</TableHead>
          <TableHead>Hoạt động gần nhất</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{r.targetType}</TableCell>
            <TableCell>
              <Badge variant={statusTone(r.status)}>
                {STATUS_LABEL[r.status] ?? r.status}
              </Badge>
            </TableCell>
            <TableCell>{r.attemptCount}</TableCell>
            <TableCell>{formatScore(r.bestScore)}</TableCell>
            <TableCell>{r.progress != null ? `${Math.round(r.progress)}%` : "—"}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(r.lastActivityAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RecentList({
  items,
  loading,
}: {
  items?: { targetType: string; result: string; score: number | null; completedAt: string | null }[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-32 w-full" />;
  const list = items ?? [];
  if (!list.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có hoạt động gần đây.
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {list.map((r, i) => (
        <li key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Badge variant={statusTone(r.result)}>
              {r.result}
            </Badge>
            <span className="text-sm">{r.targetType}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {r.score != null ? `${formatScore(r.score)} điểm` : "—"}
            {r.completedAt ? ` • ${formatDate(r.completedAt)}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
