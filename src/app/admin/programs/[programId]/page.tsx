"use client";
import {LifecycleButton} from "@/features/admin/workbench/components/lifecycle-button";
import { adminStatusLabel } from "@/features/admin/foundation/admin-ui-labels";
import { AdminCan } from "@/features/admin/foundation/admin-access-provider";


import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, FolderTree, Plus, Trash2, Loader2, Sparkles, ArrowUp, ArrowDown, BookOpen, Edit2
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { useAuthStore } from "@/stores/auth-store";

import { contentFingerprint } from "@/features/admin/theory/theory-contract";

import { useAdminUnsavedChanges } from "@/features/admin/foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "@/features/admin/foundation/components/admin-leave-dialog";
import { adminFailure } from "@/features/admin/foundation/admin-errors";
import type { ChapterBlockItem } from "@/features/admin/admin-programs-service";

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const { data: program, isLoading: isLoadingProgram, isError, error, refetch } = useAdminProgramDetail(programId);
  const { data: allChapters = [], isLoading: isLoadingChapters, isError: chaptersError, refetch: reloadChapters } = useAdminChapters();

  const [editFingerprint, setEditFingerprint] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCode, setEditCode] = useState("");

  const updateProgramMutation = useUpdateProgram();

  const addChapterBlock = useAddChapterBlock(programId);
  const deleteChapterBlock = useDeleteChapterBlock(programId);
  const reorderBlocks = useReorderChapterBlocks(programId);


  const [addingChapterId, setAddingChapterId] = useState<string | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [, setMovingBlockId] = useState<string | null>(null);
  const actorId = useAuthStore(state => state.user?.id);
  const editable = program?.createdBy === actorId && program?.status === "DRAFT" && !isError;
  const busy = updateProgramMutation.isPending || addChapterBlock.isPending || deleteChapterBlock.isPending || reorderBlocks.isPending;
  const leave = useAdminUnsavedChanges(isEditingInfo && (editTitle !== program?.title || editCode !== program?.code || editDescription !== program?.description), busy);
  const handleAddChapter = (chapterId: string, chapterTitle: string) => {
    if (!editable || busy) return;
    setAddingChapterId(chapterId);
    addChapterBlock.mutate(
      { chapterId, title: chapterTitle, status: "DRAFT" },
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
    if (!editable || busy || !window.confirm("Gỡ chương này khỏi chương trình học?")) return;
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
    if (!editable || busy || !program || !program.chapterBlocks) return;
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

    reorderBlocks.mutate({ items: payload, expectedFingerprint: contentFingerprint(program) }, {
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

  if (isError) return <div role="alert" className="space-y-4 rounded-xl border p-6"><p>{adminFailure(error, "Không tải được chương trình học.").message}</p><Button variant="outline" onClick={() => void refetch()}>Thử lại</Button></div>;

  if (!program) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Không tìm thấy chương trình học</h2>
        <Button onClick={() => router.push("/admin/programs")}>Quay lại</Button>
      </div>
    );
  }

  const handleOpenEditInfo = () => {
    if (program && editable && !busy) {
      setEditFingerprint(contentFingerprint(program));
      setEditTitle(program.title);
      setEditDescription(program.description || "");
      setEditCode(program.code || "");
      setIsEditingInfo(true);
    }
  };

  const handleSaveEditInfo = () => {
    if (!editTitle.trim() || !editCode.trim()) {
      toast.error("Vui lòng nhập tên và mã chương trình học");
      return;
    }
    if (program && editable && !busy) {
      updateProgramMutation.mutate(
        { id: program.id, payload: { title: editTitle, code: editCode, description: editDescription, status: "DRAFT", expectedFingerprint: editFingerprint } },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật thông tin chương trình học");
            setIsEditingInfo(false);
          },
          onError: (error) => toast.error(adminFailure(error, "Cập nhật thất bại, nội dung được giữ lại.").message),
        }
      );
    }
  };

  const existingChapterIds = new Set(program.chapterBlocks?.map(b => b.chapterId) || []);
  const availableChapters = allChapters.filter(c => ["DRAFT", "PUBLISHED"].includes(c.status) && !existingChapterIds.has(c.id));
  const chapterBlocks = program.chapterBlocks || [];
  // sort blocks safely
  const sortedBlocks = [...chapterBlocks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="space-y-6 pb-20">
      <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
      <LifecycleButton key={programId} subject={{kind:"PROGRAM",id:programId}}/>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="shrink-0 mt-1" asChild>
            <Link href="/admin/programs"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[14px]/5 border-primary text-primary bg-primary/5">
                {program.code}
              </Badge>
              <Badge variant={program.status === "PUBLISHED" ? "default" : "secondary"} className="text-[14px]/5">
                {({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", ARCHIVED: "Đã lưu trữ", HIDDEN: "Đang ẩn" } as Record<string, string>)[program.status ?? ""] ?? program.status}
              </Badge>
            </div>

            {isEditingInfo ? (
              <div className="mt-4 p-4 rounded-xl border bg-muted/20 space-y-4 min-w-[300px]">
                <div className="space-y-1.5">
                  <label className="text-[14px]/5 font-semibold text-muted-foreground">Mã chương trình</label>
                  <Input disabled={busy} value={editCode} onChange={(e) => setEditCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[14px]/5 font-semibold text-muted-foreground">Tên chương trình</label>
                  <Input disabled={busy} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[14px]/5 font-semibold text-muted-foreground">Mô tả chương trình</label>
                  <Input disabled={busy} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => leave.requestLeave(() => setIsEditingInfo(false))}>Hủy</Button>
                  <AdminCan resource="learning-programs" action={"update"}><Button size="sm" onClick={handleSaveEditInfo} disabled={!editable || busy}>
                    {updateProgramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Lưu thay đổi
                  </Button></AdminCan>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  {program.title}
                  {editable && (
                    <AdminCan resource="learning-programs" action={"update"}><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleOpenEditInfo}>
                      <Edit2 className="h-4 w-4" />
                    </Button></AdminCan>
                  )}
                </h1>
                <p className="text-[15px]/6 text-muted-foreground mt-1">
                  {program.description || "Chưa có mô tả"}
                </p>
              </>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chapter Bank */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-[15px]/6 font-bold flex items-center gap-2">
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
                ) : chaptersError ? <p role="alert" className="p-4">Không tải được danh sách chương. <Button variant="outline" size="sm" onClick={() => void reloadChapters()}>Thử lại</Button></p> : availableChapters.length === 0 ? (
                  <div className="p-8 text-center text-[15px]/6 text-muted-foreground">
                    Tất cả các chương đã được gắn vào chương trình, hoặc hệ thống chưa có chương nào.
                  </div>
                ) : (
                  availableChapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="text-[15px]/6 font-medium">{chapter.title}</p>
                        <p className="text-[14px]/5 text-muted-foreground mt-0.5">ID: {chapter.id.split('-')[0]}...</p>
                      </div>
                      <AdminCan resource="learning-programs" action={"update"}><Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0 h-8 gap-1.5"
                        disabled={!editable || busy}
                        onClick={() => handleAddChapter(chapter.id, chapter.title)}
                      >
                        {addingChapterId === chapter.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Thêm
                      </Button></AdminCan>
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
              <CardTitle className="text-[15px]/6 font-bold flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" /> Lộ trình Chương trình ({sortedBlocks.length} chương)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {sortedBlocks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-[15px]/6 text-muted-foreground">Lộ trình trống.</p>
                  <p className="text-[14px]/5 text-muted-foreground mt-1">Hãy bấm &quot;Thêm&quot; từ danh sách bên trái để thiết kế lộ trình.</p>
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
                          disabled={!editable || busy || index === 0 || sortedBlocks.some(b => b.parentId || b.children?.length)}
                          onClick={() => handleMove(index, 'up')}
                          className="hover:text-primary disabled:opacity-30 disabled:hover:text-current"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={!editable || busy || index === sortedBlocks.length - 1 || sortedBlocks.some(b => b.parentId || b.children?.length)}
                          onClick={() => handleMove(index, 'down')}
                          className="hover:text-primary disabled:opacity-30 disabled:hover:text-current"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[14px]/5 font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px]/6 font-semibold truncate text-foreground">{block.title}</p>
                        <p className="text-[14px]/5 text-muted-foreground break-all">Mã chương: {block.chapterId || "Nhánh nội dung"}</p><ProgramTree blocks={block.children ?? []} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <AdminCan resource="learning-programs" action={"update"}><Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        disabled={!editable || busy || Boolean(block.children?.length)}
                        onClick={() => handleRemoveBlock(block.id)}
                      >
                        {deletingBlockId === block.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button></AdminCan>
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

function ProgramTree({ blocks }: { blocks: ChapterBlockItem[] }) {
  if (!blocks.length) return null;
  return <ul className="mt-3 space-y-3 border-l pl-4 text-[15px]/6">{[...blocks].sort((a, b) => a.sortOrder - b.sortOrder).map(b => <li key={b.id}><p className="font-medium">{b.title}</p><p className="break-all text-[14px]/5 text-muted-foreground">{adminStatusLabel(b.status)} · {b.chapterId || b.id}</p><ProgramTree blocks={b.children ?? []} /></li>)}</ul>;
}
