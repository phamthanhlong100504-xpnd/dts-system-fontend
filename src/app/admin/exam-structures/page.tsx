"use client";

import { useState } from "react";
import { Layers, Plus, Pencil, Trash2, X, PlusCircle } from "lucide-react";
import { useAdminExamStructures, useCreateExamStructure, useUpdateExamStructure, useDeleteExamStructure } from "@/features/admin/use-admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { ExamStructureSection } from "@/features/admin/admin-examination-service";

export default function ExamStructuresPage() {
  const { data: structures = [], isLoading } = useAdminExamStructures();
  const createStructure = useCreateExamStructure();
  const updateStructure = useUpdateExamStructure();
  const deleteStructure = useDeleteExamStructure();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<ExamStructureSection[]>([]);

  const resetForm = () => {
    setTitle("");
    setSections([]);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (structure: any) => {
    setTitle(structure.title || "");
    setSections(structure.sections || []);
    setEditingId(structure.id);
    setIsCreating(false);
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      { title: "", code: "", questionCount: 1, score: 1, order: sections.length + 1 }
    ]);
  };

  const handleUpdateSection = (index: number, field: keyof ExamStructureSection, value: any) => {
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
      toast.error("Vui lòng thêm ít nhất 1 phần thi (section)");
      return;
    }

    for (const sec of sections) {
      if (!sec.title.trim() || !sec.code.trim()) {
        toast.error("Vui lòng nhập đủ Mã và Tên cho tất cả các phần thi");
        return;
      }
    }

    const payload = { title, sections, metadata: {} };

    if (editingId) {
      updateStructure.mutate(
        { id: editingId, payload },
        {
          onSuccess: () => {
            toast.success("Cập nhật thành công");
            resetForm();
          },
          onError: () => toast.error("Cập nhật thất bại"),
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
        onError: () => toast.error("Xóa thất bại"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          Quản lý Cấu trúc ma trận đề thi
        </h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
          <CardTitle className="text-base font-semibold">
            Danh sách Cấu trúc đề thi
          </CardTitle>
          <Button size="sm" onClick={() => { resetForm(); setIsCreating(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button>
        </CardHeader>

        {(isCreating || editingId) && (
          <div className="p-6 bg-primary/5 border-b space-y-6">
            <div>
              <h3 className="font-semibold text-sm text-primary mb-4">
                {editingId ? "Cập nhật Cấu trúc đề thi" : "Tạo Cấu trúc đề thi mới"}
              </h3>
              <div className="space-y-1.5 max-w-xl">
                <label className="text-xs font-semibold text-muted-foreground">Tên cấu trúc (Ma trận) *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Cấu trúc đề thi B2 (35 câu)" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Cấu hình các phần thi (Sections)</h4>
                <Button size="sm" variant="outline" onClick={handleAddSection}>
                  <PlusCircle className="h-4 w-4 mr-1.5" /> Thêm phần thi
                </Button>
              </div>
              
              {sections.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md border border-dashed">
                  Chưa có phần thi nào. Hãy bấm "Thêm phần thi".
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-background border rounded-lg shadow-sm relative">
                      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Mã phần thi *</label>
                          <Input value={section.code} onChange={(e) => handleUpdateSection(idx, "code", e.target.value)} placeholder="VD: KHAI_NIEM" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Tên phần thi *</label>
                          <Input value={section.title} onChange={(e) => handleUpdateSection(idx, "title", e.target.value)} placeholder="VD: Khái niệm và quy tắc" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Số câu hỏi</label>
                          <Input type="number" min={1} value={section.questionCount} onChange={(e) => handleUpdateSection(idx, "questionCount", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Điểm mỗi câu</label>
                          <Input type="number" min={1} value={section.score} onChange={(e) => handleUpdateSection(idx, "score", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8 shrink-0 mt-6" onClick={() => handleRemoveSection(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-sm font-medium text-right text-muted-foreground pr-10">
                    Tổng số câu: <span className="text-foreground">{sections.reduce((acc, s) => acc + (s.questionCount || 0), 0)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={resetForm}>Hủy</Button>
              <Button size="sm" onClick={handleSubmit} disabled={createStructure.isPending || updateStructure.isPending}>
                Lưu cấu trúc
              </Button>
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
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : structures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Chưa có dữ liệu</TableCell>
                </TableRow>
              ) : (
                structures.map((structure: any) => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.title}</TableCell>
                    <TableCell>{structure.sections?.length || 0}</TableCell>
                    <TableCell>
                      {structure.sections?.reduce((acc: number, s: any) => acc + (s.questionCount || 0), 0) || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(structure)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(structure.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
