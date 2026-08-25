"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Filter, Loader2, BookOpen, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaImage } from "@/components/ui/media-image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getQuestionsByChapter, CHAPTER_META } from "@/features/practice/practice-service";

import { toast } from "sonner";

import { useAdminQuestions, useDeleteQuestion, useAdminQuestionDetail } from "@/features/admin/use-admin-content";

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: questions = [], isLoading } = useAdminQuestions();
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

  const handleDelete = (rawId: string, title: string) => {
    if (!rawId) {
      toast.error("Không tìm thấy ID câu hỏi");
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ngân hàng Câu hỏi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và biên tập các câu hỏi trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/questions/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo câu hỏi mới
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="official" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="official">Bộ 600 câu hỏi chuẩn</TabsTrigger>
          <TabsTrigger value="others">Các câu hỏi tùy chỉnh</TabsTrigger>
        </TabsList>

        <TabsContent value="official" className="space-y-4">
          <Official600QuestionsView />
        </TabsContent>

        <TabsContent value="others" className="space-y-4">

      {/* Filter Toolbar */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          {/* Filter Status Pills */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("ALL")}
              className="rounded-full"
            >
              Tất cả ({questions.length})
            </Button>
            <Button
              variant={activeTab === "PUBLISHED" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("PUBLISHED")}
              className="rounded-full"
            >
              Đã xuất bản ({publishedCount})
            </Button>
            <Button
              variant={activeTab === "DRAFT" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("DRAFT")}
              className="rounded-full"
            >
              Bản nháp ({draftCount})
            </Button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Filter className="h-4 w-4" /> Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="rounded-2xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4 w-28">Mã câu</th>
                <th className="py-3.5 px-4">Nội dung câu hỏi</th>
                <th className="py-3.5 px-4 w-36">Loại câu</th>
                <th className="py-3.5 px-4 w-48">Chương trình / Môn</th>
                <th className="py-3.5 px-4 w-32">Trạng thái</th>
                <th className="py-3.5 px-4 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-full max-w-xs" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    {searchQuery ? "Không tìm thấy câu hỏi phù hợp" : "Chưa có câu hỏi nào. Hãy tạo câu hỏi đầu tiên!"}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => (
                  <tr key={q.rawId || q.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-medium text-foreground">
                      {q.id}
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground max-w-md leading-relaxed">
                      <div className="flex items-center gap-2">
                        <span>{q.title}</span>
                        {q.isCritical && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                            ⚠️ Điểm liệt
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{q.type}</td>
                    <td className="py-4 px-4 text-muted-foreground">{q.program}</td>
                    <td className="py-4 px-4">
                      {q.status === "PUBLISHED" ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          PUBLISHED
                        </Badge>
                      ) : q.status === "ARCHIVED" ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          ARCHIVED
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          DRAFT
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Xem chi tiết"
                          onClick={() => setViewingId(q.rawId)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit — trỏ đến trang edit với UUID thật */}
                        <Link href={`/admin/questions/edit/${q.rawId}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Chỉnh sửa"
                            disabled={!q.rawId}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Delete — confirm rồi gọi API */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title={q.status === "PUBLISHED" ? "Không thể xóa câu hỏi đã xuất bản. Vui lòng Archive." : "Xóa"}
                          disabled={deletingId === q.rawId || !q.rawId || q.status === "PUBLISHED"}
                          onClick={() => handleDelete(q.rawId, q.title)}
                        >
                          {deletingId === q.rawId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
          <span>Hiển thị {filteredQuestions.length} / {questions.length} câu hỏi</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled className="h-8 text-xs">Trước</Button>
            <Button variant="default" size="sm" className="h-8 text-xs">1</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs">Sau</Button>
          </div>
        </div>
      </Card>
        </TabsContent>
      </Tabs>

      {/* View Detail Dialog */}
      <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Chi tiết câu hỏi</DialogTitle>
            <DialogDescription className="sr-only">Chi tiết câu hỏi</DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : viewingQuestionDetail ? (
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Nội dung câu hỏi</h4>
                <p className="text-base font-medium leading-relaxed">{viewingQuestionDetail.title}</p>
                {viewingQuestionDetail.isCritical && <Badge variant="destructive" className="mt-1">⚠️ Câu điểm liệt</Badge>}
              </div>

              {viewingQuestionDetail.imageUrl && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Hình ảnh minh họa</h4>
                  <MediaImage src={viewingQuestionDetail.imageUrl} alt="Hình ảnh minh họa" className="max-h-[300px] w-auto rounded-md border object-contain bg-muted/20" />
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Các lựa chọn</h4>
                <div className="space-y-2 mt-2">
                  {viewingQuestionDetail.options?.map((opt: any, idx: number) => {
                    const isCorrect = opt.isCorrect || opt.is_correct || opt.correct;
                    return (
                      <div key={idx} className={`p-3 rounded-md border text-sm flex gap-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200 font-medium' : 'bg-background'}`}>
                        <span className="font-bold">{opt.label || String.fromCharCode(65 + idx)}.</span>
                        <span>{opt.content || opt.text}</span>
                        {isCorrect && <span className="ml-auto text-emerald-600 dark:text-emerald-400">✓ Đáp án đúng</span>}
                      </div>
                    );
                  })}
                  {(!viewingQuestionDetail.options || viewingQuestionDetail.options.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">Không có lựa chọn nào.</p>
                  )}
                </div>
              </div>

              {viewingQuestionDetail.explanation && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Giải thích / Mẹo nhớ</h4>
                  <div className="p-3 bg-primary/5 rounded-md text-sm border border-primary/10 leading-relaxed text-muted-foreground">
                    {viewingQuestionDetail.explanation}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
                  <Badge variant={viewingQuestionDetail.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {viewingQuestionDetail.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Chương trình / Môn</p>
                  <p className="text-sm font-medium">{viewingQuestionDetail.program}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Không tải được dữ liệu chi tiết.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Official600QuestionsView() {
  const { data: chapters, isLoading } = useQuery({
    queryKey: ["official-600-questions"],
    queryFn: async () => {
      const allQs = await Promise.all(
        [1, 2, 3, 4, 5, 6].map(async (ch) => {
          const qs = await getQuestionsByChapter(ch);
          return { chapter: ch, questions: qs };
        })
      );
      return allQs;
    },
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl p-8 border">
        <div className="flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl overflow-hidden border flex flex-col h-[750px]">
      {/* Quick Navigation Header */}
      <div className="bg-muted/20 border-b p-4 shrink-0">
        <h4 className="font-semibold mb-3 text-sm text-foreground">Nhảy nhanh đến Chương ({chapters?.length}):</h4>
        <div className="flex flex-wrap gap-2">
          {chapters?.map((c) => (
            <Button
              key={c.chapter}
              variant="outline"
              size="sm"
              className="bg-background text-xs hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => {
                const el = document.getElementById(`chapter-${c.chapter}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              title={CHAPTER_META[c.chapter.toString()]?.name}
            >
              Chương {c.chapter}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 scroll-smooth">
        {chapters?.map(({ chapter, questions }) => (
          <div key={chapter} id={`chapter-${chapter}`} className="space-y-4">
            <h3 className="font-bold text-lg sticky top-0 bg-background/95 backdrop-blur py-3 border-b z-10 shadow-sm">
              Chương {chapter}: {CHAPTER_META[chapter.toString()]?.name}
            </h3>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex gap-3">
                    <span className="font-bold min-w-[48px] text-primary">Câu {q.id}:</span>
                    <div className="flex-1">
                      <p className="font-medium">{q.questionText}</p>
                      {q.isCritical && <Badge variant="destructive" className="mt-1.5 text-[10px] px-1.5 py-0">⚠️ Điểm liệt</Badge>}
                      
                      {q.imageUrl && (
                        <img src={q.imageUrl} alt="Minh họa" className="mt-3 rounded-md max-h-40 object-contain border bg-white" />
                      )}
                      
                      <div className="mt-4 space-y-2">
                        {q.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="text-sm flex gap-2">
                            <span className="font-medium text-muted-foreground">{opt.label}.</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                      
                      {(q.correctAnswer || q.explanation) && (
                        <div className="mt-4 p-3 bg-primary/5 rounded-md text-sm border border-primary/10">
                          {q.correctAnswer && <p><span className="font-bold text-primary">Đáp án:</span> {q.correctAnswer}</p>}
                          {q.explanation && <p className="mt-1.5 text-muted-foreground"><span className="font-semibold text-foreground">Giải thích:</span> {q.explanation}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

