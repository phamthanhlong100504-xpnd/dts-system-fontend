"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Settings2,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { useAdminExams, useCreateExam, useChangeExamStatus, useDeleteExam } from "@/features/admin/use-admin-content";

const FALLBACK_EXAM_SETS = [
  {
    id: "ex-1",
    code: "EX-B2-01",
    title: "Đề thi sát hạch lý thuyết B2 — Bộ đề 01",
    licenseType: "B2",
    questionsCount: 35,
    durationMinutes: 22,
    passScore: 32,
    status: "PUBLISHED",
    updatedAt: "10/08/2026",
  },
  {
    id: "ex-2",
    code: "EX-B2-02",
    title: "Đề thi sát hạch lý thuyết B2 — Bộ đề 02",
    licenseType: "B2",
    questionsCount: 35,
    durationMinutes: 22,
    passScore: 32,
    status: "PUBLISHED",
    updatedAt: "09/08/2026",
  },
  {
    id: "ex-3",
    code: "EX-A1-01",
    title: "Bộ đề sát hạch xe máy A1 — Đề 01",
    licenseType: "A1",
    questionsCount: 25,
    durationMinutes: 19,
    passScore: 21,
    status: "PUBLISHED",
    updatedAt: "08/08/2026",
  },
];

export default function AdminExamsPage() {
  const { data: apiExams = [], isLoading } = useAdminExams();
  const createMutation = useCreateExam();
  const changeStatusMutation = useChangeExamStatus();
  const deleteMutation = useDeleteExam();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreating, setIsCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Combine real API exams with fallbacks if API list is empty
  const examSets = apiExams.length > 0 ? apiExams : FALLBACK_EXAM_SETS;

  const filteredExams = examSets.filter((item) => {
    if (selectedLicense !== "ALL" && item.licenseType !== selectedLicense) return false;
    if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreate = () => {
    if (!newName.trim() || !newCode.trim()) {
      toast.error("Vui lòng nhập Tên bộ đề và Mã bộ đề");
      return;
    }
    createMutation.mutate(
      { title: newName, code: newCode, status: "DRAFT", durationMinutes: 22, passScore: 32 },
      {
        onSuccess: () => {
          toast.success("Đã tạo bộ đề thi nháp thành công!");
          setIsCreating(false);
          setNewName("");
          setNewCode("");
        },
        onError: () => {
          toast.error("Tạo bộ đề thi thất bại.");
        },
      }
    );
  };

  const handlePublish = (id: string, title: string) => {
    if (!window.confirm(`Xuất bản bộ đề "${title}" lên hệ thống?`)) return;
    setPublishingId(id);
    changeStatusMutation.mutate(
      { id, status: "PUBLISHED" },
      {
        onSuccess: () => {
          toast.success("Đã xuất bản bộ đề thi thành công!");
          setPublishingId(null);
        },
        onError: () => {
          toast.error("Xuất bản thất bại. Vui lòng thử lại.");
          setPublishingId(null);
        },
      }
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Xóa bộ đề "${title}"?`)) return;
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã xóa bộ đề thi thành công.");
        setDeletingId(null);
      },
      onError: () => {
        toast.error("Xóa bộ đề thi thất bại.");
        setDeletingId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý Kỳ thi & Bộ đề thi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình ma trận đề thi, quy chế sát hạch và danh sách bộ đề.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/exams/structures/create">
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Cấu hình Ma trận
            </Button>
          </Link>
          <Button className="gap-2" onClick={() => setIsCreating(!isCreating)}>
            <Plus className="h-4 w-4" />
            {isCreating ? "Đóng form" : "Tạo bộ đề thi mới"}
          </Button>
        </div>
      </div>

      {/* Quick Create Form */}
      {isCreating && (
        <Card className="rounded-2xl border bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Tạo bộ đề thi mới (Tự động lưu dạng Bản nháp DRAFT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tên bộ đề *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Đề thi sát hạch lý thuyết B2 — Bộ đề 04"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mã đề (Code) *</label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="VD: EX-B2-04"
                  className="bg-background"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu bản nháp"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng số bộ đề", value: examSets.length, icon: BookOpen, color: "text-primary" },
          { label: "Đã xuất bản", value: examSets.filter((e) => e.status === "PUBLISHED").length, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Bản nháp", value: examSets.filter((e) => e.status === "DRAFT").length, icon: Clock, color: "text-amber-500" },
          { label: "Lượt thi hoàn thành", value: "12,450", icon: Award, color: "text-purple-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bộ đề thi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Hạng bằng (Tất cả)</option>
              <option value="A1">Hạng A1</option>
              <option value="A2">Hạng A2</option>
              <option value="B1">Hạng B1</option>
              <option value="B2">Hạng B2</option>
              <option value="C">Hạng C</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Trạng thái (Tất cả)</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="DRAFT">Bản nháp</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Exams Table */}
      <Card className="rounded-2xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4">Mã đề</th>
                <th className="py-3.5 px-4">Tên bộ đề</th>
                <th className="py-3.5 px-4 w-28">Hạng bằng</th>
                <th className="py-3.5 px-4 w-44">Cấu trúc</th>
                <th className="py-3.5 px-4 w-32">Trạng thái</th>
                <th className="py-3.5 px-4 w-32">Cập nhật</th>
                <th className="py-3.5 px-4 w-36 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    Chưa có bộ đề nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-foreground">
                      {exam.code}
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground max-w-xs">
                      {exam.title}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="font-bold">
                        {exam.licenseType}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs text-muted-foreground">
                      {exam.questionsCount} câu · {exam.durationMinutes}p · Đạt ≥{exam.passScore}
                    </td>
                    <td className="py-4 px-4">
                      {exam.status === "PUBLISHED" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          PUBLISHED
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          DRAFT
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-muted-foreground">{exam.updatedAt}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Nút Xuất bản nếu đang là DRAFT */}
                        {exam.status === "DRAFT" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            disabled={publishingId === exam.id}
                            onClick={() => handlePublish(exam.id, exam.title)}
                            title="Xuất bản bộ đề thi này"
                          >
                            {publishingId === exam.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Xuất bản
                          </Button>
                        )}

                        <Link href="/admin/exams/structures/create">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Cấu hình ma trận">
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === exam.id}
                          onClick={() => handleDelete(exam.id, exam.title)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Xóa"
                        >
                          {deletingId === exam.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
