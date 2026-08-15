"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Clock,
  ArrowRight,
  Sparkles,
  History,
  FileText,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  useExamHistory,
  useStartExamAndGo,
} from "@/features/practice/use-practice";
import type { ExamHistoryEntry } from "@/features/practice/practice-service";

/**
 * Cấu hình bộ đề theo hạng — spec chuẩn sát hạch GPLX (Cục Đường bộ).
 * Practice service KHÔNG có endpoint liệt kê bộ đề: `startExam` nhận
 * examType/totalQuestions/durationMinutes. Vì vậy phần danh sách là cấu hình
 * miền (tương tự CHAPTER_META); phần lịch sử & "lần thi gần nhất" lấy từ API thật.
 */
const EXAM_SETS: {
  licenseType: string;
  questionsCount: number;
  durationMinutes: number;
  passScore: number;
}[] = [
  { licenseType: "A1", questionsCount: 25, durationMinutes: 19, passScore: 21 },
  { licenseType: "B1", questionsCount: 30, durationMinutes: 20, passScore: 27 },
  { licenseType: "B2", questionsCount: 35, durationMinutes: 22, passScore: 32 },
  { licenseType: "C", questionsCount: 40, durationMinutes: 24, passScore: 36 },
  { licenseType: "D", questionsCount: 45, durationMinutes: 26, passScore: 41 },
  { licenseType: "E", questionsCount: 45, durationMinutes: 26, passScore: 41 },
  { licenseType: "F", questionsCount: 45, durationMinutes: 26, passScore: 41 },
];

const HISTORY_PAGE_SIZE = 20;

function titleFor(licenseType: string) {
  return `Đề thi sát hạch lý thuyết GPLX Hạng ${licenseType}`;
}

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function StudentExamsListPage() {
  const [selectedLicense, setSelectedLicense] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"EXAMS" | "HISTORY">("EXAMS");
  const [searchQuery, setSearchQuery] = useState("");
  const startAndGo = useStartExamAndGo();

  // Lịch sử thật (dùng chung cho tab Lịch sử + "lần thi gần nhất" trên card)
  const { data: historyData, isLoading: historyLoading } = useExamHistory(0, 50);

  // Lần thi gần nhất theo từng hạng (API trả sort startedAt desc → lấy entry đầu tiên)
  const lastAttempts = useMemo(() => {
    const map = new Map<string, ExamHistoryEntry>();
    for (const h of historyData?.content ?? []) {
      if (h.status === "IN_PROGRESS") continue;
      const key = h.examType ?? "";
      if (key && !map.has(key)) map.set(key, h);
    }
    return map;
  }, [historyData]);

  const filteredExams = EXAM_SETS.filter((e) => {
    if (selectedLicense !== "ALL" && e.licenseType !== selectedLicense) return false;
    if (
      searchQuery &&
      !titleFor(e.licenseType).toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hệ thống Thi sát hạch GPLX Trực tuyến</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Luyện tập các bộ đề sát hạch chuẩn của Cục Đường bộ Việt Nam 2026.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() =>
            startAndGo.mutate({
              examType: "B2",
              totalQuestions: 35,
              durationMinutes: 22,
              mode: "EXAM",
            })
          }
          disabled={startAndGo.isPending}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0"
        >
          <Sparkles className="h-5 w-5" />
          {startAndGo.isPending ? "Đang tạo đề..." : "Thi Đề ngẫu nhiên"}
        </Button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-4 border-b pb-2">
        <button
          onClick={() => setActiveTab("EXAMS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            activeTab === "EXAMS"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <FileText className="h-4 w-4" /> Danh sách Bộ đề
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            activeTab === "HISTORY"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <History className="h-4 w-4" /> Lịch sử làm bài
        </button>
      </div>

      {activeTab === "EXAMS" ? (
        <>
          {/* License Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {["ALL", ...EXAM_SETS.map((e) => e.licenseType)].map((lic) => (
                <Button
                  key={lic}
                  variant={selectedLicense === lic ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLicense(lic)}
                  className="rounded-full"
                >
                  {lic === "ALL" ? "Tất cả hạng" : `Hạng ${lic}`}
                </Button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm bộ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Exam Cards Grid */}
          {historyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                const last = lastAttempts.get(exam.licenseType);
                return (
                  <Card
                    key={exam.licenseType}
                    className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="font-mono font-bold text-xs">
                          ĐỀ {exam.licenseType}
                        </Badge>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 font-bold">
                          Hạng {exam.licenseType}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2">
                          {titleFor(exam.licenseType)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {exam.questionsCount} câu</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.durationMinutes} phút</span>
                          <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Đạt ≥{exam.passScore}</span>
                        </p>
                      </div>

                      {last ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 text-xs">
                          <span className="text-muted-foreground">Lần thi gần nhất:</span>
                          <Badge variant={last.passed ? "default" : "destructive"} className="text-[10px]">
                            {last.passed
                              ? `ĐẠT (${last.correctCount ?? 0}/${last.totalQuestions ?? exam.questionsCount})`
                              : `TRƯỢT (${last.correctCount ?? 0}/${last.totalQuestions ?? exam.questionsCount})`}
                          </Badge>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-muted/20 text-xs text-muted-foreground text-center">
                          Chưa từng thi bài này
                        </div>
                      )}

                      <div className="block pt-2">
                        <Button
                          onClick={() =>
                            startAndGo.mutate({
                              examType: exam.licenseType,
                              totalQuestions: exam.questionsCount,
                              durationMinutes: exam.durationMinutes,
                              mode: "EXAM",
                            })
                          }
                          disabled={startAndGo.isPending}
                          className="w-full gap-2 font-bold"
                        >
                          {startAndGo.isPending ? "Đang tạo..." : "Bắt đầu làm bài"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredExams.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground py-10">
                  Không tìm thấy bộ đề phù hợp.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <HistoryTab />
      )}
    </div>
  );
}

function HistoryTab() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useExamHistory(page, HISTORY_PAGE_SIZE);

  if (isLoading && !data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Không tải được lịch sử làm bài. Kiểm tra service dts-practice.
      </p>
    );
  }

  const rows = data.content ?? [];

  return (
    <Card className="rounded-2xl shadow-sm border overflow-hidden">
      <CardContent className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3.5 px-4">Hạng</th>
              <th className="py-3.5 px-4">Loại</th>
              <th className="py-3.5 px-4">Đúng/Sai</th>
              <th className="py-3.5 px-4">Điểm</th>
              <th className="py-3.5 px-4">Kết quả</th>
              <th className="py-3.5 px-4">Thời gian</th>
              <th className="py-3.5 px-4 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((h: ExamHistoryEntry) => (
              <tr key={h.examId} className="hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium text-foreground">{h.examType}</td>
                <td className="py-4 px-4">
                  {h.mode === "PRACTICE" ? (
                    <Badge variant="secondary">Luyện tập</Badge>
                  ) : (
                    <Badge>Thi thử</Badge>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className="text-emerald-600">{h.correctCount ?? 0}</span>
                  {" / "}
                  <span className="text-destructive">{h.wrongCount ?? 0}</span>
                </td>
                <td className="py-4 px-4 font-bold">{h.score ?? 0}</td>
                <td className="py-4 px-4">
                  {h.status === "IN_PROGRESS" ? (
                    <Badge variant="outline">Đang làm</Badge>
                  ) : h.passed ? (
                    <Badge className="bg-emerald-500 text-white">ĐẠT</Badge>
                  ) : (
                    <Badge className="bg-destructive text-white">TRƯỢT</Badge>
                  )}
                </td>
                <td className="py-4 px-4 text-xs text-muted-foreground">{formatTime(h.startedAt)}</td>
                <td className="py-4 px-4 text-right">
                  {h.status === "IN_PROGRESS" ? (
                    <Link href={`/practice/exam/${h.examId}`}>
                      <Button variant="ghost" size="sm" className="text-xs">Tiếp tục →</Button>
                    </Link>
                  ) : (
                    <Link href={`/practice/result/${h.examId}`}>
                      <Button variant="ghost" size="sm" className="text-xs">Xem bài làm →</Button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  Chưa có bài thi nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
      {(data.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
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
    </Card>
  );
}
