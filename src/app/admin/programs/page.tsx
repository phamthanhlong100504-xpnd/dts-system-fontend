"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, ChevronRight, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { useAdminPrograms, useCreateProgram, useDeleteProgram } from "@/features/admin/use-admin-content";

export default function AdminProgramsPage() {
  const { data: programs = [], isLoading } = useAdminPrograms();
  const createMutation = useCreateProgram();
  const deleteMutation = useDeleteProgram();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newTitle.trim() || !newCode.trim()) {
      toast.error("Vui lòng nhập Tên và Mã chương trình");
      return;
    }
    createMutation.mutate(
      { title: newTitle, code: newCode, description: newDescription, status: "DRAFT" },
      {
        onSuccess: () => {
          toast.success("Đã tạo chương trình học mới!");
          setIsCreating(false);
          setNewTitle("");
          setNewCode("");
          setNewDescription("");
        },
        onError: () => {
          toast.error("Tạo chương trình thất bại.");
        },
      }
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chương trình "${title}"?`)) return;
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã xóa chương trình học thành công.");
        setDeletingId(null);
      },
      onError: () => {
        toast.error("Xóa chương trình thất bại.");
        setDeletingId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Chương trình học</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các chương trình đào tạo và bộ đề thi trong hệ thống.
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {isCreating ? "Đóng form" : "Thêm chương trình"}
        </Button>
      </div>

      {/* Quick Create Form */}
      {isCreating && (
        <Card className="rounded-2xl border bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Tạo chương trình học mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tên chương trình *</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Hạng B2 — Ô tô số sàn"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mã chương trình (Code) *</label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="VD: B2_CLASSIC"
                  className="bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mô tả chi tiết</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Nhập mô tả cho chương trình..."
                className="bg-background"
              />
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng chương trình", value: programs.length, icon: GraduationCap },
          { label: "Đã xuất bản", value: programs.filter((p) => p.status === "PUBLISHED").length, icon: BookOpen },
          { label: "Bản nháp", value: programs.filter((p) => p.status === "DRAFT").length, icon: ChevronRight },
          { label: "Tổng khối chương", value: programs.reduce((s, p) => s + (p.chapterBlocksCount || 0), 0), icon: BookOpen },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách chương trình từ API</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : programs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                Chưa có chương trình học nào. Nhấn "Thêm chương trình" để tạo chương trình đầu tiên!
              </div>
            ) : (
              programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{program.title}</p>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {program.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {program.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={program.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">
                      {program.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/admin/programs/${program.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === program.id}
                      onClick={() => handleDelete(program.id, program.title)}
                    >
                      {deletingId === program.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
