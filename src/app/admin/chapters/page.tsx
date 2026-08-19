"use client";

import { useState } from "react";
import {
  FolderTree, Plus, GripVertical, Trash2, Sparkles, Loader2, FileText, ArrowUp, ArrowDown, Search
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
import { AdminQuestionItem } from "@/features/admin/admin-content-service";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getQuestionsByChapter, CHAPTER_META } from "@/features/practice/practice-service";

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
  const { data: chapterDetail, isLoading: isLoadingDetail } = useAdminChapterDetail(activeChapter?.id || null);

  const addQuestionMutation = useAddQuestionBlock(activeChapter?.id || "");
  const deleteQuestionMutation = useDeleteQuestionBlock(activeChapter?.id || "");
  const reorderQuestionsMutation = useReorderQuestionBlocks(activeChapter?.id || "");

  const { data: bankQuestions = [], isLoading: isLoadingQuestions } = useAdminQuestions();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        if (selectedChapterId === id) setSelectedChapterId(null);
      },
      onError: () => {
        toast.error("Xóa chương thất bại.");
        setDeletingId(null);
      },
    });
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
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    // Lọc bỏ những câu đã có trong chương
    !chapterDetail?.questionBlocks?.some(b => b.questionId === q.rawId)
  );

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="official" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="official">Chương 600 câu chuẩn</TabsTrigger>
          <TabsTrigger value="custom">Các chương tùy chỉnh</TabsTrigger>
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
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu & Xuất bản"}
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

        {/* Right Panel */}
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
              {activeChapter && (
                <Button size="sm" onClick={() => setIsAddingQuestion(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Thêm câu hỏi
                </Button>
              )}
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

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Danh sách câu hỏi trong chương</h3>
                    {isLoadingDetail ? (
                       <Skeleton className="h-20 w-full rounded-xl" />
                    ) : chapterDetail?.questionBlocks?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">
                        Chưa có câu hỏi nào. Bấm "Thêm câu hỏi" để lấy từ Ngân hàng.
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
            <DialogTitle>Thêm câu hỏi từ Ngân hàng</DialogTitle>
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

function OfficialQuestionsSelector({ chapterDetail, onAdd, isPending }: { chapterDetail: any, onAdd: (q: AdminQuestionItem) => void, isPending: boolean }) {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const { data: questions, isLoading } = useQuery({
    queryKey: ["official-chapter-questions", selectedChapter],
    queryFn: () => getQuestionsByChapter(selectedChapter),
    staleTime: Infinity,
  });

  const filteredQuestions = questions?.filter(q => 
    !chapterDetail?.questionBlocks?.some((b: any) => b.questionId === (q.id?.toString() || ""))
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[1, 2, 3, 4, 5, 6].map(c => (
          <Button 
            key={c} 
            variant={selectedChapter === c ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedChapter(c)}
            className="shrink-0"
          >
            Chương {c}
          </Button>
        ))}
      </div>
      <div className="max-h-[45vh] overflow-y-auto space-y-2 pr-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Chương này đã được thêm toàn bộ hoặc không có câu hỏi.</div>
        ) : (
          filteredQuestions.map((q) => (
            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] text-primary bg-primary/5 border-primary/20">Câu {q.id}</Badge>
                  {q.isCritical && <Badge variant="destructive" className="text-[10px]">Điểm liệt</Badge>}
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => onAdd({
                  id: `CÂU ${q.id}`,
                  rawId: q.id?.toString() || "",
                  title: q.questionText || "",
                  type: "Trắc nghiệm",
                  program: `Chương ${selectedChapter}`,
                  status: "PUBLISHED"
                })}
                disabled={isPending}
              >
                Thêm
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OfficialChaptersView() {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["official-chapter-questions", selectedChapter],
    queryFn: () => getQuestionsByChapter(selectedChapter),
    staleTime: Infinity,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
      {/* Left Panel */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" /> Danh sách Chương chuẩn (6)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((chapter) => {
              const isSelected = selectedChapter === chapter;
              return (
                <div
                  key={chapter}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm font-semibold"
                      : "border-border bg-card hover:bg-accent/50"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate text-foreground font-medium">
                      Chương {chapter}: {CHAPTER_META[chapter.toString()]?.name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase px-1.5 py-0 shrink-0">
                    OFFICIAL
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-8 space-y-4">
        <Card className="rounded-2xl shadow-sm border h-full">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                  <Badge variant="outline" className="bg-background">READ-ONLY</Badge>
                  Chương {selectedChapter}
                </div>
                <CardTitle className="text-base font-bold">
                  {CHAPTER_META[selectedChapter.toString()]?.name}
                </CardTitle>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Số lượng câu hỏi: {questions?.length || 0} câu
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="flex flex-col max-h-[700px] overflow-y-auto p-4 space-y-3 bg-muted/10">
                {questions?.map((q) => (
                  <div key={q.id} className="flex gap-3 p-4 bg-background border rounded-xl shadow-sm">
                    <div className="shrink-0 pt-0.5">
                       <span className="font-bold text-sm text-primary">Câu {q.id}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium leading-relaxed">{q.questionText}</p>
                      {q.isCritical && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mt-1">⚠️ Điểm liệt</Badge>}
                      
                      {q.imageUrl && (
                        <img src={q.imageUrl} alt="Minh họa" className="mt-2 rounded-md max-h-40 object-contain border bg-white" />
                      )}
                      
                      <div className="mt-4 space-y-2">
                        {q.options?.map((opt, i) => (
                          <div key={i} className="text-sm flex gap-2">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
