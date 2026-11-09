"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MediaImage } from "@/components/ui/media-image";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfficialBankBrowser } from "@/features/admin/components/official-bank-browser";
import { AdminCan } from "@/features/admin/foundation/admin-access-provider";
import { AdminPageHeader } from "@/features/admin/foundation/components/admin-page-header";
import { adminQuestionTypeLabel } from "@/features/admin/foundation/admin-ui-labels";
import { useAdminQuestionDetail, useAdminQuestions, useDeleteQuestion } from "@/features/admin/use-admin-content";
import styles from "@/features/admin/questions/admin-questions.module.css";

const statusLabel: Record<string, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
  HIDDEN: "Đang ẩn",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED") {
    return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Đã xuất bản</Badge>;
  }
  if (status === "ARCHIVED") {
    return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Đã lưu trữ</Badge>;
  }
  return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{statusLabel[status] ?? status}</Badge>;
}

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: questions = [], isLoading, isError: questionsError } = useAdminQuestions();
  const { data: viewingQuestionDetail, isLoading: isLoadingDetail } = useAdminQuestionDetail(viewingId);
  const deleteMutation = useDeleteQuestion();

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === "PUBLISHED" && q.status !== "PUBLISHED") return false;
    if (activeTab === "DRAFT" && q.status !== "DRAFT") return false;
    if (
      searchQuery &&
      !q.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const publishedCount = questions.filter((q) => q.status === "PUBLISHED").length;
  const draftCount = questions.filter((q) => q.status === "DRAFT").length;

  const pageSize = 20;
  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const displayedPage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const visibleQuestions = filteredQuestions.slice(displayedPage * pageSize, (displayedPage + 1) * pageSize);

  const handleDelete = (rawId: string, title: string) => {
    if (!rawId) {
      toast.error("Không tìm thấy câu hỏi cần chỉnh sửa");
      return;
    }
    const confirmed = window.confirm(`Xóa câu hỏi:\n"${title.substring(0, 80)}..."?\n\nHành động này không thể hoàn tác.`);
    if (!confirmed) return;

    setDeletingId(rawId);
    deleteMutation.mutate(rawId, {
      onSuccess: () => {
        toast.success("Đã xóa câu hỏi thành công");
        setDeletingId(null);
      },
      onError: () => {
        toast.error("Xóa câu hỏi thất bại. Vui lòng thử lại.");
        setDeletingId(null);
      },
    });
  };

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Ngân hàng câu hỏi"
        description="Tra cứu ngân hàng chuẩn theo hạng GPLX và quản lý các câu hỏi biên soạn trong hệ thống."
        actions={(
          <AdminCan resource="questions" action="create">
            <Button asChild className="gap-2">
              <Link href="/admin/questions/create">
                <Plus className="h-4 w-4" />
                Tạo câu hỏi mới
              </Link>
            </Button>
          </AdminCan>
        )}
      />

      <Tabs defaultValue="official" className={styles.tabShell}>
        <TabsList className={styles.tabList}>
          <TabsTrigger value="official" className={styles.tabTrigger}>Ngân hàng chuẩn</TabsTrigger>
          <TabsTrigger value="others" className={styles.tabTrigger}>Câu hỏi biên soạn</TabsTrigger>
        </TabsList>

        <TabsContent value="official" className="space-y-4">
          <OfficialBankBrowser view="questions" questionsView />
        </TabsContent>

        <TabsContent value="others" className="space-y-4">
          <section className={styles.filterCard}>
            <div className={styles.toolbar}>
              <div className={styles.filterPills}>
                <Button variant={activeTab === "ALL" ? "default" : "outline"} size="sm" onClick={() => { setActiveTab("ALL"); setCurrentPage(0); }} className={styles.filterPill}>
                  Tất cả ({questions.length})
                </Button>
                <Button variant={activeTab === "PUBLISHED" ? "default" : "outline"} size="sm" onClick={() => { setActiveTab("PUBLISHED"); setCurrentPage(0); }} className={styles.filterPill}>
                  Đã xuất bản ({publishedCount})
                </Button>
                <Button variant={activeTab === "DRAFT" ? "default" : "outline"} size="sm" onClick={() => { setActiveTab("DRAFT"); setCurrentPage(0); }} className={styles.filterPill}>
                  Bản nháp ({draftCount})
                </Button>
              </div>

              <div className={styles.searchBox}>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo nội dung hoặc mã câu hỏi"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                  className={styles.searchInput}
                />
              </div>
            </div>
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className="w-28">Mã câu</th>
                    <th>Nội dung câu hỏi</th>
                    <th className="w-36">Loại câu</th>
                    <th className="w-44">Chương trình</th>
                    <th className="w-32">Trạng thái</th>
                    <th className="w-28 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsError ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyState}>Không tải được danh sách câu hỏi. Vui lòng kiểm tra quyền truy cập hoặc thử lại.</td>
                    </tr>
                  ) : isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td><Skeleton className="h-4 w-20" /></td>
                        <td><Skeleton className="h-4 w-full max-w-xs" /></td>
                        <td><Skeleton className="h-4 w-24" /></td>
                        <td><Skeleton className="h-4 w-32" /></td>
                        <td><Skeleton className="h-5 w-20 rounded-full" /></td>
                        <td><Skeleton className="ml-auto h-8 w-16" /></td>
                      </tr>
                    ))
                  ) : filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyState}>
                        {searchQuery ? "Không tìm thấy câu hỏi phù hợp." : "Chưa có câu hỏi biên soạn trong hệ thống."}
                      </td>
                    </tr>
                  ) : (
                    visibleQuestions.map((q) => (
                      <tr key={q.rawId || q.id}>
                        <td className={styles.codeCell}>{q.id}</td>
                        <td className={styles.questionText}>
                          <div className="flex items-center gap-2">
                            <span>{q.title}</span>
                            {q.isCritical && <Badge variant="destructive" className="shrink-0 px-1.5 py-0 text-[10.5px]">⚠️ Điểm liệt</Badge>}
                          </div>
                        </td>
                        <td className="text-muted-foreground">{adminQuestionTypeLabel(q.type)}</td>
                        <td className="text-muted-foreground">{q.program || "Chưa phân loại"}</td>
                        <td><StatusBadge status={q.status} /></td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Xem chi tiết" onClick={() => setViewingId(q.rawId)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AdminCan resource="questions" action="update">
                              {q.rawId && (
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <Link href={`/admin/questions/edit/${q.rawId}`} title="Chỉnh sửa" aria-label="Chỉnh sửa câu hỏi">
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </AdminCan>
                            <AdminCan resource="questions" action="delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title={q.status === "PUBLISHED" ? "Không thể xóa câu hỏi đã xuất bản. Hãy lưu trữ câu hỏi trước." : q.status === "ARCHIVED" ? "Không thể xóa câu hỏi đã lưu trữ." : "Xóa"}
                                disabled={deletingId === q.rawId || !q.rawId || q.status === "PUBLISHED" || q.status === "ARCHIVED"}
                                onClick={() => handleDelete(q.rawId, q.title)}
                              >
                                {deletingId === q.rawId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </AdminCan>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.footerBar}>
              <span>Hiển thị {visibleQuestions.length} / {filteredQuestions.length} câu hỏi</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={displayedPage === 0} onClick={() => setCurrentPage(displayedPage - 1)}>Trang trước</Button>
                  <span>Trang {displayedPage + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={displayedPage + 1 >= totalPages} onClick={() => setCurrentPage(displayedPage + 1)}>Trang sau</Button>
                </div>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Chi tiết câu hỏi</DialogTitle>
            <DialogDescription className="sr-only">Chi tiết câu hỏi</DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : viewingQuestionDetail ? (
            <div className="mt-4 space-y-6">
              <div className={styles.dialogSection}>
                <div className="space-y-5 p-5">
                  <div className="space-y-2">
                    <h4 className="text-[14.5px]/5 font-semibold uppercase text-muted-foreground">Nội dung câu hỏi</h4>
                    <p className="text-base font-medium leading-relaxed">{viewingQuestionDetail.title}</p>
                    {viewingQuestionDetail.isCritical && <Badge variant="destructive" className="mt-1">⚠️ Câu điểm liệt</Badge>}
                  </div>

                  {viewingQuestionDetail.imageUrl && (
                    <div className="space-y-2">
                      <h4 className="text-[14.5px]/5 font-semibold uppercase text-muted-foreground">Hình ảnh minh họa</h4>
                      <MediaImage src={viewingQuestionDetail.imageUrl} alt="Hình ảnh minh họa" className="mx-auto block max-h-[300px] w-auto max-w-full rounded-xl border bg-muted/20 object-contain" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-[14.5px]/5 font-semibold uppercase text-muted-foreground">Các lựa chọn</h4>
                    <div className={styles.optionsGrid}>
                      {viewingQuestionDetail.options?.map((opt, idx: number) => {
                        const isCorrect = opt.isCorrect || opt.is_correct || opt.correct;
                        return (
                          <div key={idx} className={`${styles.optionItem} ${isCorrect ? styles.optionCorrect : ""}`}>
                            <strong>{opt.label || String.fromCharCode(65 + idx)}. </strong>
                            {opt.content || opt.text}
                            {isCorrect && <span className="ml-2 font-semibold">✓ Đáp án đúng</span>}
                          </div>
                        );
                      })}
                      {(!viewingQuestionDetail.options || viewingQuestionDetail.options.length === 0) && (
                        <p className="text-[14.5px]/5 italic text-muted-foreground">Không có lựa chọn nào.</p>
                      )}
                    </div>
                  </div>

                  {viewingQuestionDetail.explanation && (
                    <div className="space-y-2">
                      <h4 className="text-[14.5px]/5 font-semibold uppercase text-muted-foreground">Giải thích / Mẹo nhớ</h4>
                      <div className={styles.helperPanel}>{viewingQuestionDetail.explanation}</div>
                    </div>
                  )}

                  <div className={styles.dialogGrid}>
                    <div>
                      <p className={styles.dialogLabel}>Trạng thái</p>
                      <StatusBadge status={viewingQuestionDetail.status} />
                    </div>
                    <div>
                      <p className={styles.dialogLabel}>Chương trình</p>
                      <p className={styles.dialogValue}>{viewingQuestionDetail.program || "Chưa phân loại"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>Không tải được dữ liệu chi tiết.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
