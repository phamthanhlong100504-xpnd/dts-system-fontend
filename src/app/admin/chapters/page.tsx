"use client";
import {LifecycleButton} from "@/features/admin/workbench/components/lifecycle-button";
import { adminQuestionTypeLabel } from "@/features/admin/foundation/admin-ui-labels";
import { AdminCan } from "@/features/admin/foundation/admin-access-provider";


import { useState } from "react";
import {
  FolderTree, Plus, Trash2, Sparkles, Loader2, FileText, ArrowUp, ArrowDown, Search, Edit2
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

import { contentFingerprint } from "@/features/admin/theory/theory-contract";
import { useAdminUnsavedChanges } from "@/features/admin/foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "@/features/admin/foundation/components/admin-leave-dialog";
import { adminFailure } from "@/features/admin/foundation/admin-errors";
import { AdminPageHeader } from "@/features/admin/foundation/components/admin-page-header";
import styles from "./admin-chapters.module.css";

export default function AdminChaptersPage() {
  const { data: chapters = [], isLoading, isError: chaptersError, refetch: reloadChapters } = useAdminChapters();
  const createMutation = useCreateChapter();
  const deleteMutation = useDeleteChapter();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const activeChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];
  const updateMutation = useUpdateChapter(activeChapter?.id || "");
  const [isCreating, setIsCreating] = useState(false);
  const [chapterTab, setChapterTab] = useState<"official" | "custom">("official");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editFingerprint, setEditFingerprint] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: chapterDetail, isLoading: isLoadingDetail, isError: detailError, error: detailFailure, refetch: reloadDetail } = useAdminChapterDetail(activeChapter?.id || null);

  const addQuestionMutation = useAddQuestionBlock(activeChapter?.id || "");
  const deleteQuestionMutation = useDeleteQuestionBlock(activeChapter?.id || "");
  const reorderQuestionsMutation = useReorderQuestionBlocks(activeChapter?.id || "");

  const { data: bankQuestions = [], isLoading: isLoadingQuestions, isError: questionsError } = useAdminQuestions();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const editable = chapterDetail?.status === "DRAFT" && !detailError;
  const busy = updateMutation.isPending || addQuestionMutation.isPending || deleteQuestionMutation.isPending || reorderQuestionsMutation.isPending;
  const dirty = (isCreating && Boolean(newTitle || newDescription)) || (isEditingInfo && (editTitle !== activeChapter?.title || editDescription !== (activeChapter?.description || "")));
  const leave = useAdminUnsavedChanges(dirty, busy || createMutation.isPending);
  const closeCreate = () => leave.requestLeave(() => { setIsCreating(false); setNewTitle(""); setNewDescription(""); });
  const closeEdit = () => leave.requestLeave(() => setIsEditingInfo(false));
  const [creationUncertain, setCreationUncertain] = useState(false);
  const handleCreate = () => {
    if (createMutation.isPending || creationUncertain) return;
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
        onError: (error) => {
          if (!(error && typeof error === "object" && "status" in error && typeof error.status === "number" && error.status < 500)) setCreationUncertain(true);
          toast.error(adminFailure(error, "Chưa xác nhận tạo chương. Nội dung được giữ lại.").message);
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

  const handleAddQuestion = (question: AdminQuestionItem) => {
    if (!activeChapter || !editable || busy) return;
    addQuestionMutation.mutate(
      { questionId: question.rawId, title: question.title, status: "DRAFT" },
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
    if (!editable || busy || !window.confirm("Loại bỏ câu hỏi này khỏi chương?")) return;
    deleteQuestionMutation.mutate(blockId, {
      onSuccess: () => toast.success("Đã loại bỏ câu hỏi."),
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!editable || busy || !chapterDetail || !chapterDetail.questionBlocks) return;
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
    reorderQuestionsMutation.mutate({ items: reorderPayload, expectedFingerprint: contentFingerprint(chapterDetail) }, {
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
    if (activeChapter && editable && !busy) {
      setEditFingerprint(contentFingerprint(chapterDetail));
      setEditTitle(chapterDetail!.title);
      setEditDescription(chapterDetail!.description || "");
      setIsEditingInfo(true);
    }
  };

  const handleSaveEditInfo = () => {
    if (!editTitle.trim()) {
      toast.error("Vui lòng nhập tên chương");
      return;
    }
    if (activeChapter && editable && !busy) {
      updateMutation.mutate(
        { title: editTitle, description: editDescription, status: "DRAFT", expectedFingerprint: editFingerprint },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật thông tin chương");
            setIsEditingInfo(false);
          },
          onError: (error) => toast.error(adminFailure(error, "Cập nhật thất bại, nội dung được giữ lại.").message),
        }
      );
    }
  };

  return (
    <div className={styles.page} data-testid="admin-chapters">
      <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
      {creationUncertain && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[14.5px]/6 text-amber-900">Chưa xác nhận được việc tạo chương. Vui lòng kiểm tra danh sách trước khi thử lại.</p>}
      <AdminPageHeader
        title="Quản lý chương"
        description="Quản lý chương học và câu hỏi theo hạng GPLX."
        actions={
          <AdminCan resource="chapters" action="create">
            <Button onClick={() => { if (isCreating) closeCreate(); else { setChapterTab("custom"); setIsCreating(true); } }} className="gap-2">
              <Plus className="h-4 w-4" /> {isCreating ? "Đóng biểu mẫu" : "Tạo chương mới"}
            </Button>
          </AdminCan>
        }
      />

      {chaptersError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[15px]/6 text-destructive">Không thể tải danh sách chương tự tạo. Vui lòng thử lại hoặc kiểm tra quyền truy cập. Bạn vẫn có thể xem Ngân hàng chuẩn.</p>}
      <Tabs value={chapterTab} onValueChange={(value) => leave.requestLeave(() => setChapterTab(value as "official" | "custom"))} className={styles.tabShell}>
        <TabsList className={styles.tabList}>
          <TabsTrigger value="official" className={styles.tabTrigger}>Chương ngân hàng chuẩn</TabsTrigger>
          <TabsTrigger value="custom" className={styles.tabTrigger}>Chương biên soạn</TabsTrigger>
        </TabsList>

        <TabsContent value="official" className="space-y-4">
          <OfficialChaptersView />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">

          {isCreating && (
            <Card className={styles.createCard}>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Thêm chương học mới
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[14px]/5 font-semibold text-muted-foreground">Tên chương *</label>
                  <Input
                    disabled={createMutation.isPending || creationUncertain} value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Chương 1: Quy tắc giao thông đường bộ"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[14px]/5 font-semibold text-muted-foreground">Mô tả chương</label>
                  <Input
                    disabled={createMutation.isPending || creationUncertain} value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Nhập mô tả cho chương này..."
                    className="bg-background"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={closeCreate}>
                    Hủy
                  </Button>
                  <AdminCan resource="chapters" action={"create"}><Button size="sm" onClick={handleCreate} disabled={createMutation.isPending || creationUncertain}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu bản nháp"}
                  </Button></AdminCan>
                </div>
              </CardContent>
            </Card>
          )}

          <div className={styles.workspaceGrid}>
            {/* Left Panel */}
            <div className={styles.workspaceSidebar}>
              <Card className={styles.panelCard}>
                <CardHeader className={styles.listHeader}>
                  <CardTitle className="text-[15px]/6 font-bold flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-primary" /> Danh sách chương ({isLoading || chaptersError ? "—" : chapters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className={styles.listBody}>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))
                  ) : chaptersError ? <Button variant="outline" onClick={() => void reloadChapters()}>Thử lại</Button> : chapters.length === 0 ? (
                    <p className="text-[14px]/5 text-muted-foreground py-6 text-center">Chưa có chương nào trong hệ thống.</p>
                  ) : (
                    chapters.map((chapter) => {
                      const isSelected = activeChapter?.id === chapter.id;
                      return (
                        <div
                          key={chapter.id}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          onClick={() => leave.requestLeave(() => { setSelectedChapterId(chapter.id); setIsEditingInfo(false); })}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              leave.requestLeave(() => { setSelectedChapterId(chapter.id); setIsEditingInfo(false); });
                            }
                          }}
                          className={`${styles.chapterListItem} ${isSelected
                            ? styles.selectedChapter
                            : styles.unselectedChapter
                            }`}
                        >
                          <FolderTree className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px]/5 truncate text-foreground font-medium">
                              {chapter.title}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[14px]/5 uppercase px-1.5 py-0 shrink-0">
                            {({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", ARCHIVED: "Đã lưu trữ", HIDDEN: "Đang ẩn" } as Record<string, string>)[chapter.status] ?? chapter.status}
                          </Badge>
                          <AdminCan resource="chapters" action={"delete"}><Button
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
                          </Button></AdminCan>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel */}
            <div className={styles.workspaceMain}>
              <Card className={styles.panelCard}>
                <CardHeader className={styles.detailHeader}>
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      {activeChapter ? activeChapter.title : "Chọn chương để xem chi tiết"}
                      {activeChapter && editable && (
                        <AdminCan resource="chapters" action={"update"}><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleOpenEditInfo}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button></AdminCan>
                      )}
                    </CardTitle>
                  </div>
                  {activeChapter && (
                    <div className={styles.chapterActions}>
                      <LifecycleButton key={activeChapter.id} subject={{kind:"CHAPTER",id:activeChapter.id}}/>
                      <AdminCan resource="chapters" action={"update"}><Button size="sm" onClick={() => setIsAddingQuestion(true)} className="gap-2" disabled={!editable || busy}>
                        <Plus className="h-4 w-4" /> Thêm câu hỏi
                      </Button></AdminCan>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {activeChapter ? (
                    <>
                      {isEditingInfo ? (
                        <div className={styles.editCard}>
                          <div className="space-y-1.5">
                            <label className="text-[14px]/5 font-semibold text-muted-foreground">Tên chương</label>
                            <Input disabled={busy} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[14px]/5 font-semibold text-muted-foreground">Mô tả chương</label>
                            <Input disabled={busy} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={closeEdit}>Hủy</Button>
                            <AdminCan resource="chapters" action={"update"}><Button size="sm" onClick={handleSaveEditInfo} disabled={!editable || busy}>
                              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                              Lưu thay đổi
                            </Button></AdminCan>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.descriptionCard}>
                          <div className="flex items-center justify-between text-[14px]/5 text-muted-foreground mb-1">
                            <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" /> Mô tả chương
                            </span>
                          </div>
                          <p className="text-[15px]/6 leading-relaxed text-foreground">
                            {activeChapter.description || "Chưa có mô tả."}
                          </p>
                        </div>
                      )}

                      <div className={styles.questionSection}>
                        <h3 className="font-semibold text-[15px]/6">Danh sách câu hỏi trong chương</h3>
                        {isLoadingDetail ? (
                          <Skeleton className="h-20 w-full rounded-xl" />
                        ) : detailError ? <p role="alert" className="text-[15px]/6 text-destructive">{adminFailure(detailFailure, "Không tải được liên kết của chương.").message} <Button variant="outline" size="sm" onClick={() => void reloadDetail()}>Thử lại</Button></p> : chapterDetail?.questionBlocks?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-[15px]/6 border rounded-xl border-dashed">
                            Chưa có câu hỏi nào. Bấm &quot;Thêm câu hỏi&quot; để lấy từ Ngân hàng.
                          </div>
                        ) : (
                          <div className={styles.questionBlockList}>
                            {chapterDetail?.questionBlocks?.map((block, index) => (
                              <div key={block.id} className={styles.questionBlock}>
                                <div className="flex flex-col gap-1 shrink-0">
                                  <AdminCan resource="chapters" action={"update"}><Button
                                    variant="ghost" size="icon" className="h-5 w-5"
                                    onClick={() => handleMove(index, 'up')}
                                    disabled={!editable || busy || index === 0 || chapterDetail.questionBlocks.some(b => b.parentId)}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button></AdminCan>
                                  <AdminCan resource="chapters" action={"update"}><Button
                                    variant="ghost" size="icon" className="h-5 w-5"
                                    onClick={() => handleMove(index, 'down')}
                                    disabled={!editable || busy || index === chapterDetail.questionBlocks.length - 1 || chapterDetail.questionBlocks.some(b => b.parentId)}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button></AdminCan>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[15px]/6 font-medium truncate">{block.title}</p>
                                </div>
                                <AdminCan resource="chapters" action={"update"}><Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  disabled={!editable || busy || chapterDetail.questionBlocks.some(b => b.parentId === block.id)} onClick={() => handleRemoveQuestion(block.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button></AdminCan>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-[15px]/6">
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
                  <TabsTrigger value="official">Ngân hàng chuẩn theo hạng</TabsTrigger>
                </TabsList>

                <TabsContent value="custom" className="space-y-4 pt-4">
                  {questionsError && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-[15px]/6 text-destructive">Không thể tải danh sách câu hỏi để lựa chọn. Vui lòng thử lại.</p>}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm câu hỏi tùy chỉnh..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                    {isLoadingQuestions ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : filteredQuestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Không tìm thấy câu hỏi phù hợp.</div>
                    ) : (
                      filteredQuestions.map((q) => (
                        <div key={q.rawId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px]/6 font-medium line-clamp-2">{q.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[14px]/5">{q.id}</Badge>
                              <Badge variant="secondary" className="text-[14px]/5">{adminQuestionTypeLabel(q.type)}</Badge>
                              {q.isCritical && <Badge variant="destructive" className="text-[14px]/5">Điểm liệt</Badge>}
                            </div>
                          </div>
                          <AdminCan resource="chapters" action={"update"}><Button
                            size="sm"
                            onClick={() => handleAddQuestion(q)}
                            disabled={!editable || busy}
                          >
                            Thêm
                          </Button></AdminCan>
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
    </div>);
}

function OfficialQuestionsSelector({ chapterDetail, onAdd, isPending }: { chapterDetail: ChapterDetail | null | undefined; onAdd: (q: AdminQuestionItem) => void; isPending: boolean }) {
  return <OfficialBankBrowser
    view="questions"
    questionsView
    showVersionLink={false}
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
  return <OfficialBankBrowser view="chapters" showVersionLink={false} chapterVersionHref="/admin/chapters/versions" />;
}
