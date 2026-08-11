"use client";

import { useState } from "react";
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
import Link from "next/link";
import { useStartExamAndGo } from "@/features/practice/use-practice";

interface ExamSetCard {
  id: string;
  code: string;
  title: string;
  licenseType: string;
  questionsCount: number;
  durationMinutes: number;
  passScore: number;
  lastAttempt?: { score: number; passed: boolean; date: string };
}

const EXAM_LIST: ExamSetCard[] = [
  {
    id: "ex-b2-1",
    code: "ĐỀ SỐ 01",
    title: "Đề thi sát hạch lý thuyết GPLX Hạng B2 — Bộ đề 01",
    licenseType: "B2",
    questionsCount: 35,
    durationMinutes: 22,
    passScore: 32,
    lastAttempt: { score: 34, passed: true, date: "10/08/2026" },
  },
  {
    id: "ex-b2-2",
    code: "ĐỀ SỐ 02",
    title: "Đề thi sát hạch lý thuyết GPLX Hạng B2 — Bộ đề 02",
    licenseType: "B2",
    questionsCount: 35,
    durationMinutes: 22,
    passScore: 32,
    lastAttempt: { score: 30, passed: false, date: "09/08/2026" },
  },
  {
    id: "ex-b2-3",
    code: "ĐỀ SỐ 03",
    title: "Đề thi sát hạch lý thuyết GPLX Hạng B2 — Bộ đề 03",
    licenseType: "B2",
    questionsCount: 35,
    durationMinutes: 22,
    passScore: 32,
  },
  {
    id: "ex-a1-1",
    code: "ĐỀ SỐ 01",
    title: "Đề thi sát hạch lý thuyết GPLX Hạng A1 — Bộ đề 01",
    licenseType: "A1",
    questionsCount: 25,
    durationMinutes: 19,
    passScore: 21,
    lastAttempt: { score: 24, passed: true, date: "08/08/2026" },
  },
];

const HISTORY_LIST = [
  { id: "h1", examTitle: "Đề thi sát hạch B2 - Bộ đề 01", score: "34/35", status: "ĐẠT", date: "10/08/2026 14:30", timeSpent: "14 phút 20 giây" },
  { id: "h2", examTitle: "Đề thi sát hạch B2 - Bộ đề 02", score: "30/35", status: "TRƯỢT", date: "09/08/2026 10:15", timeSpent: "18 phút 05 giây" },
  { id: "h3", examTitle: "Đề thi sát hạch A1 - Bộ đề 01", score: "24/25", status: "ĐẠT", date: "08/08/2026 16:45", timeSpent: "11 phút 30 giây" },
];

export default function StudentExamsListPage() {
  const [selectedLicense, setSelectedLicense] = useState("B2");
  const [activeTab, setActiveTab] = useState<"EXAMS" | "HISTORY">("EXAMS");
  const [searchQuery, setSearchQuery] = useState("");
  const startAndGo = useStartExamAndGo();

  const filteredExams = EXAM_LIST.filter((e) => {
    if (selectedLicense !== "ALL" && e.licenseType !== selectedLicense) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
            activeTab === "EXAMS" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <FileText className="h-4 w-4" /> Danh sách Bộ đề
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            activeTab === "HISTORY" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
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
              {["ALL", "A1", "A2", "B1", "B2", "C"].map((lic) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="font-mono font-bold text-xs">
                      {exam.code}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 font-bold">
                      Hạng {exam.licenseType}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                      <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {exam.questionsCount} câu</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.durationMinutes} phút</span>
                      <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Đạt ≥{exam.passScore}</span>
                    </p>
                  </div>

                  {exam.lastAttempt ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 text-xs">
                      <span className="text-muted-foreground">Lần thi gần nhất:</span>
                      <Badge variant={exam.lastAttempt.passed ? "default" : "destructive"} className="text-[10px]">
                        {exam.lastAttempt.passed ? `ĐẠT (${exam.lastAttempt.score}/${exam.questionsCount})` : `TRƯỢT (${exam.lastAttempt.score}/${exam.questionsCount})`}
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
            ))}
          </div>
        </>
      ) : (
        /* History View */
        <Card className="rounded-2xl shadow-sm border overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Tên bài thi</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Thời gian làm</th>
                  <th className="py-3.5 px-4">Điểm số</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {HISTORY_LIST.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-foreground">{h.examTitle}</td>
                    <td className="py-4 px-4 text-xs text-muted-foreground">{h.date}</td>
                    <td className="py-4 px-4 text-xs text-muted-foreground">{h.timeSpent}</td>
                    <td className="py-4 px-4 font-bold">{h.score}</td>
                    <td className="py-4 px-4">
                      <Badge className={h.status === "ĐẠT" ? "bg-emerald-500 text-white" : "bg-destructive text-white"}>
                        {h.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link href={`/practice/result/${h.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">Xem bài làm →</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
