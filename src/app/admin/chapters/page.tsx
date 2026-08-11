"use client";

import { useState } from "react";
import {
  FolderTree,
  Plus,
  Clock,
  Award,
  GripVertical,
  Trash2,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAdminChapters, useCreateChapter, useDeleteChapter } from "@/features/admin/use-admin-content";

export default function AdminChaptersPage() {
  const { data: chapters = [], isLoading } = useAdminChapters();
  const createMutation = useCreateChapter();
  const deleteMutation = useDeleteChapter();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tên chương");
      return;
    }
    createMutation.mutate(
      { title: newTitle, description: newDescription, status: "PUBLISHED" },
      {
        onSuccess: () => {
          toast.success("Đã tạo chương mới thành công!");
          setIsCreating(false);
          setNewTitle("");
          setNewDescription("");
        },
        onError: () => {
          toast.error("Tạo chương thất bại.");
        },
      }
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chương "${title}"?`)) return;
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã xóa chương thành công.");
        setDeletingId(null);
      },
      onError: () => {
        toast.error("Xóa chương thất bại.");
        setDeletingId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              CONTENT BUILDER
            </Badge>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Quản lý Chương học (Chapters)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Biên tập cấu trúc các chương và phân bổ bài học trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="h-4 w-4" /> {isCreating ? "Đóng form" : "Tạo chương mới"}
          </Button>
        </div>
      </div>

      {/* Quick Create Form */}
      {isCreating && (
        <Card className="rounded-2xl border bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Thêm chương học mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Tên chương *</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Chương 1: Quy tắc giao thông đường bộ"
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mô tả chương</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Nhập mô tả cho chương này..."
                className="bg-background"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu & Xuất bản"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2-Panel Layout: Lesson Tree & Block Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Chapters Tree */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" /> Danh sách Chương ({chapters.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))
              ) : chapters.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Chưa có chương nào trong hệ thống.</p>
              ) : (
                chapters.map((chapter) => {
                  const isSelected = activeChapter?.id === chapter.id;
                  return (
                    <div
                      key={chapter.id}
                      onClick={() => setSelectedChapterId(chapter.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm font-semibold"
                          : "border-border bg-card hover:bg-accent/50"
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate text-foreground font-medium">
                          {chapter.title}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase px-1.5 py-0 shrink-0">
                        {chapter.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(chapter.id, chapter.title);
                        }}
                      >
                        {deletingId === chapter.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Active Chapter Detail Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
              <div>
                <Badge variant="outline" className="text-[10px] mb-1">
                  ĐANG BIÊN TẬP
                </Badge>
                <CardTitle className="text-base font-bold">
                  {activeChapter ? activeChapter.title : "Chọn chương để xem chi tiết"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {activeChapter ? (
                <>
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> Mô tả chương
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {activeChapter.description || "Chương này chưa có mô tả."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Mã định danh (ID)</span>
                    </div>
                    <p className="text-xs font-mono bg-background p-2.5 rounded-lg border">{activeChapter.id}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Vui lòng chọn hoặc tạo chương mới từ danh sách bên trái.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
