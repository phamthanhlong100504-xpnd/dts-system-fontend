"use client";
import { contentFingerprint } from "@/features/admin/theory/theory-contract";
import { ConfigurationUsage } from "@/features/admin/examination/components/configuration-usage";
import { ConfigurationPreview } from "@/features/admin/examination/components/configuration-preview";
import { AdminPageState } from "@/features/admin/foundation/components/admin-page-state";
import { adminFailure } from "@/features/admin/foundation/admin-errors";
import { useAdminUnsavedChanges } from "@/features/admin/foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "@/features/admin/foundation/components/admin-leave-dialog";

import { AdminCan } from "@/features/admin/foundation/admin-access-provider";
import styles from "@/features/admin/examination/admin-exam-visual.module.css";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus, Pencil, Trash2, X, PlusCircle } from "lucide-react";
import { useAdminExamStructures, useCreateExamStructure, useUpdateExamStructure, useDeleteExamStructure } from "@/features/admin/use-admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import type { ExamStructureSection, ExamStructureItem } from "@/features/admin/admin-examination-service";

export default function ExamStructuresPage() {
  const router = useRouter();
  const { data: structures = [], isLoading, isError, error, refetch } = useAdminExamStructures();
  const createStructure = useCreateExamStructure();
  const updateStructure = useUpdateExamStructure();
  const deleteStructure = useDeleteExamStructure();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<ExamStructureSection[]>([]);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [expectedFingerprint, setExpectedFingerprint] = useState("");
  const signature = JSON.stringify({ title, sections, metadata });
  const [baseline, setBaseline] = useState(JSON.stringify({ title: "", sections: [], metadata: {} }));
  const busy = createStructure.isPending || updateStructure.isPending || deleteStructure.isPending;
  const leave = useAdminUnsavedChanges(Boolean(isCreating || editingId) && signature !== baseline, busy);


  const resetForm = () => {
    setMetadata({}); setExpectedFingerprint(""); setBaseline(JSON.stringify({ title: "", sections: [], metadata: {} }));
    setTitle("");
    setSections([]);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (structure: ExamStructureItem) => leave.requestLeave(() => {
    if (typeof structure.metadata?.licenseClass === "string" && structure.metadata.licenseClass) {
      router.push(`/admin/exams/structures/create?edit=${encodeURIComponent(structure.id)}`); return;
    }
    setTitle(structure.title); setSections(structuredClone(structure.sections)); setMetadata(structure.metadata ?? {});
    setExpectedFingerprint(contentFingerprint(structure)); setBaseline(JSON.stringify({ title: structure.title, sections: structure.sections, metadata: structure.metadata ?? {} }));
    setEditingId(structure.id); setIsCreating(false);
  });
  const handleCopy = (structure: ExamStructureItem) => leave.requestLeave(() => {
    if (typeof structure.metadata?.licenseClass === "string") { router.push(`/admin/exams/structures/create?licenseClass=${encodeURIComponent(structure.metadata.licenseClass)}`); return; }
    setTitle(structure.title + " (bản mới)"); setSections(structuredClone(structure.sections)); setMetadata(structure.metadata ?? {});
    setExpectedFingerprint(""); setBaseline(JSON.stringify({ title: "", sections: [], metadata: {} })); setEditingId(null); setIsCreating(true);
  });

  const handleAddSection = () => {
    setSections([
      ...sections,
      { title: "", code: "", questionCount: 1, score: 1, order: sections.length + 1 }
    ]);
  };

  const handleUpdateSection = <K extends keyof ExamStructureSection>(index: number, field: K, value: ExamStructureSection[K]) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleRemoveSection = (index: number) => {
    const updated = [...sections];
    updated.splice(index, 1);
    setSections(updated.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập Tên cấu trúc");
      return;
    }

    if (sections.length === 0) {
      toast.error("Vui lòng thêm ít nhất một phần thi");
      return;
    }

    for (const sec of sections) {
      if (!sec.title.trim() || !sec.code.trim()) {
        toast.error("Vui lòng nhập đủ Mã và Tên cho tất cả các phần thi");
        return;
      }
    }

    const payload = { title, sections, metadata, expectedFingerprint };

    if (editingId) {
      updateStructure.mutate(
        { id: editingId, payload },
        {
          onSuccess: () => {
            toast.success("Cập nhật thành công");
            resetForm();
          },
          onError: (error) => toast.error(adminFailure(error, "Cập nhật thất bại, nội dung được giữ lại.").message),
        }
      );
    } else {
      createStructure.mutate(payload, {
        onSuccess: () => {
          toast.success("Tạo mới thành công");
          resetForm();
        },
        onError: () => toast.error("Tạo mới thất bại"),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa cấu trúc đề thi này?")) {
      deleteStructure.mutate(id, {
        onSuccess: () => toast.success("Xóa thành công"),
        onError: (error) => toast.error(adminFailure(error, "Không thể xóa cấu hình này.").message),
      });
    }
  };

  return (
    <div className={styles.page} inert={busy} aria-busy={busy}>
      <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
      <div className="flex items-center justify-between">
        <div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          Quản lý cấu trúc đề thi
        </h1>
          <p className="mt-2 text-[14.5px]/6 text-muted-foreground">Sắp xếp phần thi và số lượng câu hỏi theo từng cấu trúc.</p></div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
          <CardTitle className="text-base font-semibold">
            Danh sách cấu trúc đề thi
          </CardTitle>
          <AdminCan resource="exam_structure" action={"create"}><Button size="sm" onClick={() => { resetForm(); setIsCreating(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button></AdminCan>
        </CardHeader>

        {(isCreating || editingId) && (
          <div className={styles.editorPane}>
            <div>
              <h3 className="font-semibold text-[14.5px]/5 text-primary mb-4">
                {editingId ? "Cập nhật cấu trúc đề thi" : "Tạo cấu trúc đề thi mới"}
              </h3>
              <div className="space-y-1.5 max-w-xl">
                <label className="text-[12.5px]/4 font-semibold text-muted-foreground">Tên cấu trúc đề thi *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Cấu trúc đề thi hạng B" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[14.5px]/5 font-semibold text-foreground">Phân bổ câu hỏi theo phần thi</h4>
                <AdminCan resource="exam_structure" action={editingId ? "update" : "create"}><Button size="sm" variant="outline" onClick={handleAddSection}>
                  <PlusCircle className="h-4 w-4 mr-1.5" /> Thêm phần thi
                </Button></AdminCan>
              </div>

              {sections.length === 0 ? (
                <div className="text-[14.5px]/5 text-muted-foreground text-center py-4 bg-muted/20 rounded-md border border-dashed">
                  Chưa có phần thi nào. Hãy bấm &quot;Thêm phần thi&quot;.
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-background border rounded-lg shadow-sm relative">
                      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[12.5px]/4 text-muted-foreground">Mã phần thi *</label>
                          <Input value={section.code} onChange={(e) => handleUpdateSection(idx, "code", e.target.value)} placeholder="VD: KHAI_NIEM" className="h-8 text-[14.5px]/5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[12.5px]/4 text-muted-foreground">Tên phần thi *</label>
                          <Input value={section.title} onChange={(e) => handleUpdateSection(idx, "title", e.target.value)} placeholder="VD: Khái niệm và quy tắc" className="h-8 text-[14.5px]/5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[12.5px]/4 text-muted-foreground">Số câu hỏi</label>
                          <Input type="number" min={1} value={section.questionCount} onChange={(e) => handleUpdateSection(idx, "questionCount", parseInt(e.target.value) || 0)} className="h-8 text-[14.5px]/5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[12.5px]/4 text-muted-foreground">Điểm mỗi câu</label>
                          <Input type="number" min={1} value={section.score} onChange={(e) => handleUpdateSection(idx, "score", parseInt(e.target.value) || 0)} className="h-8 text-[14.5px]/5" />
                        </div>
                      </div>
                      <AdminCan resource="exam_structure" action={editingId ? "update" : "create"}><Button variant="ghost" size="icon" className="text-red-500 h-8 w-8 shrink-0 mt-6" onClick={() => handleRemoveSection(idx)}>
                        <X className="h-4 w-4" />
                      </Button></AdminCan>
                    </div>
                  ))}
                  <div className="text-[14.5px]/5 font-medium text-right text-muted-foreground pr-10">
                    Tổng số câu: <span className="text-foreground">{sections.reduce((acc, s) => acc + (s.questionCount || 0), 0)}</span>
                    <span className="mx-3 text-muted-foreground/30">|</span>
                    Tổng điểm: <span className="text-foreground">{sections.reduce((acc, s) => acc + ((s.questionCount || 0) * (s.score || 0)), 0)}</span>
                  </div>
                </div>
              )}
            </div>

            <ConfigurationPreview title={title} values={[["Số phần thi", sections.length], ["Tổng số câu", sections.reduce((n, s) => n + s.questionCount, 0)], ["Tổng điểm", sections.reduce((n, s) => n + s.questionCount * s.score, 0)], ["Hạng GPLX", typeof metadata.licenseClass === "string" ? metadata.licenseClass : "Theo cấu hình đề thi"]]} />
            <div className="dts-admin-actions pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => leave.requestLeave(resetForm)}>Hủy</Button>
              <AdminCan resource="exam_structure" action={editingId ? "update" : "create"}><Button size="sm" onClick={handleSubmit} disabled={createStructure.isPending || updateStructure.isPending}>
                Lưu cấu trúc
              </Button></AdminCan>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Tên cấu trúc</TableHead>
                <TableHead>Số phần thi</TableHead>
                <TableHead>Tổng số câu</TableHead>
                <TableHead>Tổng điểm</TableHead>
                <TableHead className="w-28 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : isError ? (<TableRow><TableCell colSpan={5} className="p-6 text-center text-destructive">Không tải được danh sách. Vui lòng thử lại.</TableCell></TableRow>) : structures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Chưa có dữ liệu</TableCell>
                </TableRow>
              ) : (
                structures.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.title}</TableCell>
                    <TableCell>{structure.sections?.length || 0}</TableCell>
                    <TableCell>
                      {structure.sections?.reduce((acc, section) => acc + (section.questionCount || 0), 0) || 0}
                    </TableCell>
                    <TableCell>
                      {structure.sections?.reduce((acc, section) => acc + ((section.questionCount || 0) * (section.score || 0)), 0) || 0}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="dts-admin-actions">
                        <ConfigurationUsage kind="structure" id={structure.id} title={structure.title} /><AdminCan resource="exam_structure" action={"create"}><Button variant="outline" size="sm" onClick={() => handleCopy(structure)}>Dùng làm mẫu</Button></AdminCan>
                        <AdminCan resource="exam_structure" action={"update"}><Button variant="ghost" size="icon" onClick={() => handleEdit(structure)}>
                          <Pencil className="h-4 w-4" />
                        </Button></AdminCan>
                        <AdminCan resource="exam_structure" action={"delete"}><Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(structure.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button></AdminCan>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {isError && <AdminPageState state="error" error={error} onRetry={() => void refetch()} />}
      <p className="rounded-xl border bg-card p-4 text-[14px]/6 text-muted-foreground">Cấu hình đang dùng trong phiên bản đã công bố hoặc lưu trữ chỉ được xem. Để thay đổi, chọn Dùng làm mẫu và lưu thành cấu hình mới.</p>

    </div>
  );
}
