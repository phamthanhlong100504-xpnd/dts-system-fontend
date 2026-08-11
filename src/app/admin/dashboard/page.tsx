"use client";

import {
  School,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Download,
  FolderTree,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAdminQuestions, useAdminPrograms, useAdminChapters } from "@/features/admin/use-admin-content";

export default function AdminDashboardPage() {
  const { data: questions = [], isLoading: isLoadingQ } = useAdminQuestions();
  const { data: programs = [], isLoading: isLoadingP } = useAdminPrograms();
  const { data: chapters = [], isLoading: isLoadingC } = useAdminChapters();

  const totalQuestions = questions.length;
  const publishedQuestions = questions.filter((q) => q.status === "PUBLISHED").length;
  const publishedPercent = totalQuestions > 0 ? Math.round((publishedQuestions / totalQuestions) * 100) : 0;

  const isLoading = isLoadingQ || isLoadingP || isLoadingC;

  return (
    <div className="space-y-6">
      {/* Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Overview Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan dữ liệu thời gian thực từ Content Builder Service.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/questions/create">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo câu hỏi mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Programs */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <School className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Live API
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Learning Programs
              </p>
              {isLoadingP ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{programs.length}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Questions */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HelpCircle className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Total Questions
              </p>
              {isLoadingQ ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-foreground">{totalQuestions}</p>
                  <span className="text-xs text-muted-foreground">Từ Database</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Chapters */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
                <FolderTree className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Total Chapters
              </p>
              {isLoadingC ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{chapters.length}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Published Rate */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Published Rate
              </p>
              {isLoadingQ ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-foreground">{publishedPercent}%</p>
                  <span className="text-xs font-medium text-emerald-600">
                    ({publishedQuestions}/{totalQuestions})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Questions List */}
      <Card className="rounded-2xl shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-base font-bold">Câu hỏi mới cập nhật</h2>
          <Link href="/admin/questions">
            <Button variant="ghost" size="sm" className="text-xs">Xem tất cả →</Button>
          </Link>
        </div>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoadingQ ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-4 w-3/4" /></div>
              ))
            ) : questions.slice(0, 5).map((q) => (
              <div key={q.rawId || q.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{q.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.id} · {q.program}</p>
                </div>
                <Badge variant={q.status === "PUBLISHED" ? "default" : "secondary"}>
                  {q.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
