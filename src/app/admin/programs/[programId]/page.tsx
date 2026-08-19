"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, FolderTree, Plus, GripVertical, Trash2, Loader2, Sparkles, ArrowUp, ArrowDown, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useAdminProgramDetail,
  useAddChapterBlock,
  useDeleteChapterBlock,
  useReorderChapterBlocks,
  useAdminChapters,
  useUpdateProgram
} from "@/features/admin/use-admin-content";
import Link from "next/link";

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const { data: program, isLoading: isLoadingProgram } = useAdminProgramDetail(programId);
  const { data: allChapters = [], isLoading: isLoadingChapters } = useAdminChapters();

  const addChapterBlock = useAddChapterBlock(programId);
  const deleteChapterBlock = useDeleteChapterBlock(programId);
  const reorderBlocks = useReorderChapterBlocks(programId);
  const updateProgram = useUpdateProgram();

  const [addingChapterId, setAddingChapterId] = useState<string | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [movingBlockId, setMovingBlockId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleUpdateStatus = (newStatus: "PUBLISHED" | "DRAFT" | "ARCHIVED") => {
    if (!program) return;
    setIsUpdatingStatus(true);
    updateProgram.mutate({
      id: programId,
      payload: { title: program.title, code: program.code, description: program.description, status: newStatus }
    }, {
      onSuccess: () => {
        toast.success(`Đã cập nhật trạng thái thành ${newStatus}`);
        setIsUpdatingStatus(false);
      },
      onError: () => {
        toast.error("Cập nhật trạng thái thất bại");
        setIsUpdatingStatus(false);
      }
    });
  };

  const handleAddChapter = (chapterId: string, chapterTitle: string) => {
    setAddingChapterId(chapterId);
    addChapterBlock.mutate(
      { chapterId, title: chapterTitle, status: "PUBLISHED" },
      {
        onSuccess: () => {
          toast.success("Đã thêm chương vào lộ trình!");
          setAddingChapterId(null);
        },
        onError: () => {
          toast.error("Thêm chương thất bại.");
          setAddingChapterId(null);
        },
      }
    );
  };

  const handleRemoveBlock = (blockId: string) => {
    if (!window.confirm("Gỡ chương này khỏi chương trình học?")) return;
    setDeletingBlockId(blockId);
    deleteChapterBlock.mutate(blockId, {
      onSuccess: () => {
        toast.success("Đã gỡ chương!");
        setDeletingBlockId(null);
      },
      onError: () => {
        toast.error("Gỡ chương thất bại.");
        setDeletingBlockId(null);
      },
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!program || !program.chapterBlocks) return;
    const blocks = [...program.chapterBlocks];
    if (direction === 'up' && index > 0) {
      const temp = blocks[index];
      blocks[index] = blocks[index - 1];
      blocks[index - 1] = temp;
    } else if (direction === 'down' && index < blocks.length - 1) {
      const temp = blocks[index];
      blocks[index] = blocks[index + 1];
      blocks[index + 1] = temp;
    } else {
      return;
    }

    const payload = blocks.map((b, i) => ({ id: b.id, sortOrder: i }));
    setMovingBlockId(blocks[index].id);
    
    reorderBlocks.mutate(payload, {
      onSuccess: () => {
        setMovingBlockId(null);
      },
      onError: () => {
        toast.error("Đổi vị trí thất bại.");
        setMovingBlockId(null);
      }
    });
  };

  if (isLoadingProgram) {
    return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!program) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Không tìm thấy chương trình học</h2>
        <Button onClick={() => router.push("/admin/programs")}>Quay lại</Button>
      </div>
    );
  }

  const existingChapterIds = new Set(program.chapterBlocks?.map(b => b.chapterId) || []);
  const availableChapters = allChapters.filter(c => !existingChapterIds.has(c.id));
  const chapterBlocks = program.chapterBlocks || [];
  // sort blocks safely
  const sortedBlocks = [...chapterBlocks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="shrink-0 mt-1" asChild>
            <Link href="/admin/programs"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs border-primary text-primary bg-primary/5">
                {program.code}
              </Badge>
              <Badge variant={program.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">
                {program.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{program.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {program.description || "Chưa có mô tả"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {program.status === "DRAFT" && (
            <Button 
              size="sm" 
              variant="default" 
              className="gap-2" 
              disabled={isUpdatingStatus}
              onClick={() => handleUpdateStatus("PUBLISHED")}
            >
              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xuất bản"}
            </Button>
          )}
          {program.status === "PUBLISHED" && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 text-amber-600 hover:text-amber-700" 
              disabled={isUpdatingStatus}
              onClick={() => handleUpdateStatus("DRAFT")}
            >
              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Chuyển về Nháp"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chapter Bank */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Ngân hàng Chương học
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              <div className="divide-y">
                {isLoadingChapters ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : availableChapters.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Tất cả các chương đã được gắn vào chương trình, hoặc hệ thống chưa có chương nào.
                  </div>
                ) : (
                  availableChapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{chapter.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">ID: {chapter.id.split('-')[0]}...</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="shrink-0 h-8 gap-1.5"
                        disabled={addingChapterId === chapter.id}
                        onClick={() => handleAddChapter(chapter.id, chapter.title)}
                      >
                        {addingChapterId === chapter.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Thêm
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Program Routine (Chapter Blocks) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl shadow-sm border border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" /> Lộ trình Chương trình ({sortedBlocks.length} chương)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {sortedBlocks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Lộ trình trống.</p>
                  <p className="text-xs text-muted-foreground mt-1">Hãy bấm "Thêm" từ danh sách bên trái để thiết kế lộ trình.</p>
                </div>
              ) : (
                sortedBlocks.map((block, index) => (
                  <div 
                    key={block.id} 
                    className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col gap-1 items-center bg-muted rounded p-1">
                        <button 
                          disabled={index === 0 || movingBlockId !== null}
                          onClick={() => handleMove(index, 'up')}
                          className="hover:text-primary disabled:opacity-30 disabled:hover:text-current"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          disabled={index === sortedBlocks.length - 1 || movingBlockId !== null}
                          onClick={() => handleMove(index, 'down')}
                          className="hover:text-primary disabled:opacity-30 disabled:hover:text-current"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{block.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">Block ID: {block.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={deletingBlockId === block.id}
                        onClick={() => handleRemoveBlock(block.id)}
                      >
                        {deletingBlockId === block.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
