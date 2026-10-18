"use client";

import { useState } from "react";
import {
  FolderTree, Plus, GripVertical, Trash2, Sparkles, Loader2, FileText, ArrowUp, ArrowDown, Search, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useAdminChapters,
  useCreateChapter,
  useDeleteChapter,
  useUpdateChapter,
  useAdminChapterDetail,
  useAddQuestionBlock,
  useDeleteQuestionBlock,
  useReorderQuestionBlocks,
  useAdminQuestions
} from "@/features/admin/use-admin-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminQuestionItem } from "@/features/admin/admin-content-service";
import type { ChapterDetail } from "@/features/admin/admin-chapters-service";
import { OfficialBankBrowser } from "@/features/admin/components/official-bank-browser";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AdminChaptersPage() {
  const { data: chapters = [], isLoading, isError: chaptersError } = useAdminChapters();
  const createMutation = useCreateChapter();
  const deleteMutation = useDeleteChapter();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const activeChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];
  const updateMutation = useUpdateChapter(activeChapter?.id || "");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: chapterDetail, isLoading: isLoadingDetail } = useAdminChapterDetail(activeChapter?.id || null);

  const addQuestionMutation = useAddQuestionBlock(activeChapter?.id || "");
  const deleteQuestionMutation = useDeleteQuestionBlock(activeChapter?.id || "");
  const reorderQuestionsMutation = useReorderQuestionBlocks(activeChapter?.id || "");

  const { data: bankQuestions = [], isLoading: isLoadingQuestions, isError: questionsError } = useAdminQuestions();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tên chương");
      return;
    }
    createMutation.mutate(
      { title: newTitle, description: newDescription, status: "DRAFT" },
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
        if (selectedChapterId === id) setSelectedChapterId(null);
      },
      onError: () => {
        toast.error("Xóa chương thất bại.");
        setDeletingId(null);
      },
    });
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!activeChapter) return;
    updateMutation.mutate(
      { title: activeChapter.title, status: newStatus, description: activeChapter.description },
      {
        onSuccess: () => toast.success(`Đã chuyển chương sang trạng thái ${({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", ARCHIVED: "Đã lưu trữ" } as Record<string, string>)[newStatus] ?? newStatus}`),
        onError: () => toast.error("Đổi trạng thái thất bại"),
      }
    );
  };

  const handleAddQuestion = (question: AdminQuestionItem) => {
    if (!activeChapter) return;
    addQuestionMutation.mutate(
      { questionId: question.rawId, title: question.title, status: "PUBLISHED" },
      {
        onSuccess: () => {
          toast.success("Đã thêm câu hỏi vào chương!");
          setIsAddingQuestion(false);
        },
        onError: () => {
          toast.error("Thêm câu hỏi thất bại.");
        }
      }
    );
  };

  const handleRemoveQuestion = (blockId: string) => {
    if (!window.confirm("Loại bỏ câu hỏi này khỏi chương?")) return;
    deleteQuestionMutation.mutate(blockId, {
      onSuccess: () => toast.success("Đã loại bỏ câu hỏi."),
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!chapterDetail || !chapterDetail.questionBlocks) return;
    const blocks = [...chapterDetail.questionBlocks];
    if (direction === 'up' && index > 0) {
      [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    } else {
      return;
    }
    
    // Update sortOrder
    const reorderPayload = blocks.map((b, i) => ({ id: b.id, sortOrder: i }));
    reorderQuestionsMutation.mutate(reorderPayload, {
      onSuccess: () => toast.success("Đã cập nhật thứ tự.")
    });
  };

  const filteredQuestions = bankQuestions.filter(q => 
    q.status === "PUBLISHED" &&
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    // Lọc bỏ những câu đã có trong chương
    !chapterDetail?.questionBlocks?.some(b => b.questionId === q.rawId)
  );

  const handleOpenEditInfo = () => {
    if (activeChapter) {
      setEditTitle(activeChapter.title);
      setEditDescription(activeChapter.description || "");
      setIsEditingInfo(true);
    }
  };

  const handleSaveEditInfo = () => {
    if (!editTitle.trim()) {
      toast.error("Vui lòng nhập tên chương");
      return;
    }
    if (activeChapter) {
      updateMutation.mutate(
        { title: editTitle, description: editDescription, status: activeChapter.status },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật thông tin chương");
            setIsEditingInfo(false);
          },
          onError: () => toast.error("Cập nhật thất bại"),
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              QUẢN LÝ NỘI DUNG
            </Badge>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Quản lý chương học
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
Quản lý các chương câu hỏi theo hạng GPLX và những chương học do bạn biên soạn.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="h-4 w-4" /> {isCreating ? "Đóng form" : "Tạo chương mới"}
          </Button>
        </div>
      </div>

      {chaptersError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Không thể tải danh sách chương tự tạo. Vui lòng thử lại hoặc kiểm tra quyền truy cập. Bạn vẫn có thể xem Ngân hàng chuẩn.</p>}
      <Tabs defaultValue="official" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="official">Chương ngân hàng theo hạng</TabsTrigger>
          <TabsTrigger value="custom">Chương tự biên soạn</TabsTrigger>
        </TabsList>

        <TabsContent value="official" className="space-y-4">
          <OfficialChaptersView />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">

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
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu bản nháp"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel */}
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
                        {({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", ARCHIVED: "Đã lưu trữ", HIDDEN: "Đang ẩn" } as Record<string, string>)[chapter.status] ?? chapter.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        disabled={deletingId === chapter.id || chapter.status !== "DRAFT"}
                        title={chapter.status !== "DRAFT" ? "Chỉ có thể xóa chương đang ở trạng thái bản nháp" : "Xóa chương"}
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

        {/* Right Panel */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
              <div>
                <Badge variant="outline" className="text-[10px] mb-1">
                  ĐANG BIÊN TẬP
                </Badge>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  {activeChapter ? activeChapter.title : "Chọn chương để xem chi tiết"}
                  {activeChapter && activeChapter.status !== "ARCHIVED" && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleOpenEditInfo}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardTitle>
            </div>
            {activeChapter && (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={activeChapter.status === "ARCHIVED" ? "outline" : "secondary"}
                  onClick={() => handleUpdateStatus(activeChapter.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED")}
                  disabled={updateMutation.isPending}
                  title={activeChapter.status === "PUBLISHED" ? "Lưu trữ chương này" : ""}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {activeChapter.status === "ARCHIVED" ? "Khôi phục bản nháp" : "Lưu trữ"}
                </Button>
                
                {activeChapter.status === "DRAFT" && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleUpdateStatus("PUBLISHED")}
                    disabled={updateMutation.isPending}
                  >
                    Xuất bản
                  </Button>
                )}

                <Button size="sm" onClick={() => setIsAddingQuestion(true)} className="gap-2" disabled={activeChapter.status === "ARCHIVED"}>
                  <Plus className="h-4 w-4" /> Thêm câu hỏi
                </Button>
              </div>
            )}
          </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {activeChapter ? (
                <>
                  {isEditingInfo ? (
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Tên chương</label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Mô tả chương</label>
                        <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditingInfo(false)}>Hủy</Button>
                        <Button size="sm" onClick={handleSaveEditInfo} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Lưu thay đổi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2 group">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> Mô tả chương
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">
                        {activeChapter.description || "Chương này chưa có mô tả."}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Danh sách câu hỏi trong chương</h3>
                    {isLoadingDetail ? (
                       <Skeleton className="h-20 w-full rounded-xl" />
                    ) : chapterDetail?.questionBlocks?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">
                        Chưa có câu hỏi nào. Bấm &quot;Thêm câu hỏi&quot; để lấy từ Ngân hàng.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chapterDetail?.questionBlocks?.map((block, index) => (
                          <div key={block.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button 
                                variant="ghost" size="icon" className="h-5 w-5" 
                                onClick={() => handleMove(index, 'up')}
                                disabled={index === 0 || reorderQuestionsMutation.isPending}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" size="icon" className="h-5 w-5"
                                onClick={() => handleMove(index, 'down')}
                                disabled={index === chapterDetail.questionBlocks.length - 1 || reorderQuestionsMutation.isPending}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{block.title}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {block.questionId}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveQuestion(block.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Add Question Modal */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chọn câu hỏi từ ngân hàng</DialogTitle>
            <DialogDescription>
              Chọn câu hỏi bạn muốn thêm vào chương {activeChapter?.title}.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="custom" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom">Ngân hàng Tùy chỉnh</TabsTrigger>
              <TabsTrigger value="official">Ngân hàng 600 câu chuẩn</TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4 pt-4">
              {questionsError && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">Không thể tải danh sách câu hỏi để lựa chọn. Vui lòng thử lại.</p>}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm kiếm câu hỏi tùy chỉnh..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground italic px-1">
                * Chỉ hiển thị câu hỏi đã xuất bản và chưa có trong chương này.
              </p>
              
              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Không tìm thấy câu hỏi phù hợp.</div>
                ) : (
                  filteredQuestions.map((q) => (
                    <div key={q.rawId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{q.id}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{q.type}</Badge>
                          {q.isCritical && <Badge variant="destructive" className="text-[10px]">Điểm liệt</Badge>}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddQuestion(q)}
                        disabled={addQuestionMutation.isPending}
                      >
                        Thêm
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="official" className="pt-4">
              <OfficialQuestionsSelector 
                chapterDetail={chapterDetail} 
                onAdd={handleAddQuestion} 
                isPending={addQuestionMutation.isPending} 
              />
            </TabsContent>
          </Tabs>

        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OfficialQuestionsSelector({ chapterDetail, onAdd, isPending }: { chapterDetail: ChapterDetail | null | undefined; onAdd: (q: AdminQuestionItem) => void; isPending: boolean }) {
  return <OfficialBankBrowser
    view="questions"
    isPicking={isPending}
    excludedIds={(chapterDetail?.questionBlocks ?? []).map((block) => block.questionId ?? "").filter(Boolean)}
    onPick={(question) => onAdd({
      id: `#Q-${question.id.slice(0, 6)}`,
      rawId: question.id,
      title: question.content,
      type: "Trắc nghiệm",
      program: "Ngân hàng câu hỏi chuẩn",
      status: "PUBLISHED",
    })}
  />;
}

function OfficialChaptersView() {
  return <OfficialBankBrowser view="chapters" />;
}
