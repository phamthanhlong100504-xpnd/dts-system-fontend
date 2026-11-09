"use client";

import { AdminCan } from "@/features/admin/foundation/admin-access-provider";


import { useState } from "react";
import { BookOpen, Plus, Trash2, ChevronRight, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useAdminPrograms, useCreateProgram, useDeleteProgram } from "@/features/admin/use-admin-content";

import styles from "@/features/admin/admin-business-pages.module.css";
import { useAdminUnsavedChanges } from "@/features/admin/foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "@/features/admin/foundation/components/admin-leave-dialog";
import { adminFailure } from "@/features/admin/foundation/admin-errors";

export default function AdminProgramsPage() {
  const { data: programs = [], isLoading, isError, refetch } = useAdminPrograms();
  const actorId = useAuthStore(state => state.user?.id);
  const createMutation = useCreateProgram();
  const deleteMutation = useDeleteProgram();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const leave = useAdminUnsavedChanges(isCreating && Boolean(newTitle || newCode || newDescription), createMutation.isPending);
  const closeCreate = () => leave.requestLeave(() => { setIsCreating(false); setNewTitle(""); setNewCode(""); setNewDescription(""); });
  const [creationUncertain, setCreationUncertain] = useState(false);
  const handleCreate = () => {
    if (creationUncertain || createMutation.isPending) return;
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
        onError: (error) => {
          if (!(error && typeof error === "object" && "status" in error && typeof error.status === "number" && error.status < 500)) setCreationUncertain(true);
          toast.error(adminFailure(error, "Chưa xác nhận tạo chương trình. Nội dung được giữ lại.").message);
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
    <div className={styles.page}>
      <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
      {creationUncertain && <p role="alert" className="rounded-xl border p-4 text-[15px]/6">Chưa xác định chương trình đã được tạo hay chưa. Kiểm tra danh sách trước khi gửi lại.</p>}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Chương trình học</h1>
          <p className="text-[15px]/6 text-muted-foreground mt-1">
            Quản lý chương trình học, nội dung và các chương liên quan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/admin/programs/versions">Phiên bản chương trình</Link></Button>
          <AdminCan resource="learning-programs" action={"create"}><Button onClick={() => isCreating ? closeCreate() : setIsCreating(true)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {isCreating ? "Đóng biểu mẫu" : "Thêm chương trình"}
        </Button></AdminCan>
        </div>
      </div>

      {/* Quick Create Form */}
      {isCreating && (
        <Card className="rounded-2xl border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Tạo chương trình học mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={styles.formGrid}>
              <div className="space-y-1.5">
                <label className="text-[14px]/5 font-semibold text-muted-foreground">Tên chương trình *</label>
                <Input
                  disabled={createMutation.isPending || creationUncertain} value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Hạng B — Ô tô"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[14px]/5 font-semibold text-muted-foreground">Mã chương trình *</label>
                <Input
                  disabled={createMutation.isPending || creationUncertain} value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="VD: CHUONG_TRINH_B"
                  className="bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[14px]/5 font-semibold text-muted-foreground">Mô tả chi tiết</label>
              <Input
                disabled={createMutation.isPending || creationUncertain} value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Nhập mô tả cho chương trình..."
                className="bg-background"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={closeCreate}>
                Hủy
              </Button>
              <AdminCan resource="learning-programs" action={"create"}><Button size="sm" onClick={handleCreate} disabled={createMutation.isPending || creationUncertain}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu bản nháp"}
              </Button></AdminCan>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className={styles.statGrid}>
        {[
          { label: "Tổng chương trình", value: isError || isLoading ? "—" : programs.length, icon: GraduationCap },
          { label: "Đã xuất bản", value: isError || isLoading ? "—" : programs.filter((p) => p.status === "PUBLISHED").length, icon: BookOpen },
          { label: "Bản nháp", value: isError || isLoading ? "—" : programs.filter((p) => p.status === "DRAFT").length, icon: ChevronRight },
          { label: "Tổng số chương", value: isError || isLoading ? "—" : programs.some(p => p.chapterBlocksCount === undefined) ? "—" : programs.reduce((s, p) => s + (p.chapterBlocksCount ?? 0), 0), icon: BookOpen },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className={styles.statTitle}>{stat.label}</p>
                  <p className={styles.statValue}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Programs List */}
      <Card>
        <CardHeader className="border-b bg-[#f8f8fc] py-5">
          <CardTitle className="text-[17px] font-bold">Danh sách chương trình học</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isError ? (
              <div role="alert" className="p-6 text-[15px]/6 text-destructive">Không thể tải danh sách chương trình học. Vui lòng thử lại hoặc kiểm tra quyền truy cập của tài khoản. <Button variant="outline" size="sm" onClick={() => void refetch()}>Thử lại</Button></div>
            ) : isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : programs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-[15px]/6">
                Chưa có chương trình học nào. Nhấn &quot;Thêm chương trình&quot; để tạo chương trình đầu tiên!
              </div>
            ) : (
              programs.map((program) => (
                <div
                  key={program.id}
                  className={styles.itemRow}
                >
                  <div className={styles.itemBody}>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className={styles.itemTitle}>
                        <p className="font-medium text-[15px]/6">{program.title}</p>
                        <Badge variant="outline" className="text-[14px]/5 uppercase font-mono">
                          {program.code}
                        </Badge>
                      </div>
                      <p className={styles.itemDescription}>
                        {program.description}
                      </p>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Badge variant={program.status === "PUBLISHED" ? "default" : "secondary"} className="text-[14px]/5">
                      {({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", ARCHIVED: "Đã lưu trữ", HIDDEN: "Đang ẩn" } as Record<string, string>)[program.status ?? ""] ?? program.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/admin/programs/${program.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AdminCan resource="learning-programs" action={"delete"}><Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={deleteMutation.isPending || program.status !== "DRAFT" || program.createdBy !== actorId}
                      onClick={() => handleDelete(program.id, program.title)}
                    >
                      {deletingId === program.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button></AdminCan>
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
