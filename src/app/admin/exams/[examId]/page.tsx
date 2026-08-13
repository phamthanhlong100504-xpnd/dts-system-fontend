"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Loader2, Send, Trash2, BookOpen, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { 
  useAdminExams,
  useAdminExamVersions, 
  useCreateExamVersion, 
  usePublishExamVersion, 
  useDeleteExamVersion,
  useAdminChapters,
  useAdminPrograms
} from "@/features/admin/use-admin-content";

export default function AdminExamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  // Fetch Exam Data
  const { data: exams, isLoading: isExamsLoading } = useAdminExams();
  const exam = exams?.find((e) => e.id === examId);

  // Fetch Exam Versions
  const { data: versions = [], isLoading: isVersionsLoading } = useAdminExamVersions(examId);
  const createVersionMutation = useCreateExamVersion(examId);
  const publishVersionMutation = usePublishExamVersion(examId);
  const deleteVersionMutation = useDeleteExamVersion(examId);

  // Fetch Contents for selection
  const { data: chapters = [], isLoading: isChaptersLoading } = useAdminChapters();
  const { data: programs = [], isLoading: isProgramsLoading } = useAdminPrograms();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newExamType, setNewExamType] = useState("PRACTICE");
  const [newContentType, setNewContentType] = useState("CHAPTER");
  const [newContentId, setNewContentId] = useState("");

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateVersion = () => {
    if (!newTitle.trim() || !newContentId) {
      toast.error("Vui lòng nhập Tên phiên bản và chọn Nguồn nội dung (Chương/Chương trình)");
      return;
    }
    
    createVersionMutation.mutate(
      {
        title: newTitle,
        examType: newExamType,
        contentType: newContentType,
        contentId: newContentId,
      },
      {
        onSuccess: () => {
          toast.success("Đã tạo phiên bản đề thi thành công!");
          setIsCreating(false);
          setNewTitle("");
          setNewContentId("");
        },
        onError: () => {
          toast.error("Tạo phiên bản đề thi thất bại.");
        }
      }
    );
  };

  const handlePublish = (versionId: string, title: string) => {
    if (!window.confirm(`Xuất bản phiên bản "${title}"?`)) return;
    setPublishingId(versionId);
    publishVersionMutation.mutate(versionId, {
      onSuccess: () => {
        toast.success("Đã xuất bản thành công!");
        setPublishingId(null);
      },
      onError: () => {
        toast.error("Xuất bản thất bại.");
        setPublishingId(null);
      }
    });
  };

  const handleDelete = (versionId: string, title: string) => {
    if (!window.confirm(`Xóa phiên bản "${title}"?`)) return;
    setDeletingId(versionId);
    deleteVersionMutation.mutate(versionId, {
      onSuccess: () => {
        toast.success("Đã xóa thành công.");
        setDeletingId(null);
      },
      onError: () => {
        toast.error("Xóa thất bại.");
        setDeletingId(null);
      }
    });
  };

  if (isExamsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border">
        <h2 className="text-xl font-bold mb-4">Không tìm thấy Kỳ thi</h2>
        <Button onClick={() => router.push("/admin/exams")}>Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/exams")} className="rounded-full shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="outline">{exam.code}</Badge>
              {exam.status === "PUBLISHED" ? (
                <Badge className="bg-emerald-100 text-emerald-700">Đã xuất bản (PUBLISHED)</Badge>
              ) : (
                <Badge variant="secondary">Bản nháp (DRAFT)</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{exam.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hạng bằng: <strong className="text-foreground">{exam.licenseType}</strong> · {exam.questionsCount} câu · {exam.durationMinutes} phút
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle>Phiên bản đề thi (Exam Versions)</CardTitle>
            <CardDescription className="mt-1">
              Mỗi kỳ thi có thể có nhiều phiên bản. Phiên bản sẽ lấy câu hỏi từ Chương học hoặc Chương trình học.
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isCreating ? "Đóng form" : "Tạo phiên bản mới"}
          </Button>
        </CardHeader>

        {isCreating && (
          <div className="p-6 bg-primary/5 border-b space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
              <Layers className="h-4 w-4" /> Thiết lập phiên bản đề thi mới
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tên phiên bản *</label>
                <Input 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="VD: Phiên bản 1.0"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Loại đề (Exam Type) *</label>
                <select
                  value={newExamType}
                  onChange={(e) => setNewExamType(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="PRACTICE">Luyện tập (PRACTICE)</option>
                  <option value="REAL">Thi thật (REAL)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Loại nguồn câu hỏi *</label>
                <select
                  value={newContentType}
                  onChange={(e) => {
                    setNewContentType(e.target.value);
                    setNewContentId(""); // reset
                  }}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="CHAPTER">Từ Chương học (CHAPTER)</option>
                  <option value="LEARNING_PROGRAM">Từ Chương trình học (LEARNING_PROGRAM)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Chọn {newContentType === "CHAPTER" ? "Chương học" : "Chương trình học"} *
                </label>
                <select
                  value={newContentId}
                  onChange={(e) => setNewContentId(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" disabled>-- Vui lòng chọn --</option>
                  {newContentType === "CHAPTER" ? (
                    chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                  ) : (
                    programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                  )}
                </select>
                {newContentType === "CHAPTER" && isChaptersLoading && <span className="text-xs text-muted-foreground">Đang tải...</span>}
                {newContentType === "LEARNING_PROGRAM" && isProgramsLoading && <span className="text-xs text-muted-foreground">Đang tải...</span>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>Hủy</Button>
              <Button size="sm" onClick={handleCreateVersion} disabled={createVersionMutation.isPending}>
                {createVersionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu phiên bản"}
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4 w-16">Version</th>
                <th className="py-3.5 px-4">Tên phiên bản</th>
                <th className="py-3.5 px-4">Loại đề</th>
                <th className="py-3.5 px-4">Nguồn câu hỏi</th>
                <th className="py-3.5 px-4 w-32">Trạng thái</th>
                <th className="py-3.5 px-4 w-36 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isVersionsLoading ? (
                <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : versions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    Kỳ thi này chưa có phiên bản nào.<br/>
                    Hãy tạo một phiên bản và chọn nguồn câu hỏi để học viên có thể làm bài.
                  </td>
                </tr>
              ) : (
                versions.map((version) => (
                  <tr key={version.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-center">v{version.versionNo}</td>
                    <td className="py-4 px-4 font-medium">{version.title}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline">{version.examType}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        {version.contentType === "CHAPTER" ? "Chương học" : "Chương trình học"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {version.status === "PUBLISHED" ? (
                        <Badge className="bg-emerald-100 text-emerald-700">PUBLISHED</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">DRAFT</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {version.status === "DRAFT" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            disabled={publishingId === version.id}
                            onClick={() => handlePublish(version.id, version.title)}
                          >
                            {publishingId === version.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Xuất bản
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === version.id}
                          onClick={() => handleDelete(version.id, version.title)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          {deletingId === version.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
