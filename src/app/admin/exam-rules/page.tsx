"use client";

import { useState } from "react";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminExamRules, useCreateExamRule, useUpdateExamRule, useDeleteExamRule } from "@/features/admin/use-admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function ExamRulesPage() {
  const { data: rules = [], isLoading } = useAdminExamRules();
  const createRule = useCreateExamRule();
  const updateRule = useUpdateExamRule();
  const deleteRule = useDeleteExamRule();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const resetForm = () => {
    setTitle("");
    setCode("");
    setDescription("");
    setStatus("ACTIVE");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (rule: any) => {
    setTitle(rule.title || "");
    setCode(rule.code || "");
    setDescription(rule.description || "");
    setStatus(rule.status || "ACTIVE");
    setEditingId(rule.id);
    setIsCreating(false);
  };

  const handleSubmit = () => {
    if (!title.trim() || !code.trim()) {
      toast.error("Vui lòng nhập Tên và Mã quy chế");
      return;
    }

    const payload = { title, code, description, status };

    if (editingId) {
      updateRule.mutate(
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
      createRule.mutate(payload, {
        onSuccess: () => {
          toast.success("Tạo mới thành công");
          resetForm();
        },
        onError: () => toast.error("Tạo mới thất bại"),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa quy chế thi này?")) {
      deleteRule.mutate(id, {
        onSuccess: () => toast.success("Xóa thành công"),
        onError: () => toast.error("Xóa thất bại"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Quản lý Quy chế thi
        </h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
          <CardTitle className="text-base font-semibold">
            Danh sách Quy chế thi
          </CardTitle>
          <Button size="sm" onClick={() => { resetForm(); setIsCreating(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button>
        </CardHeader>

        {(isCreating || editingId) && (
          <div className="p-6 bg-primary/5 border-b space-y-4">
            <h3 className="font-semibold text-sm text-primary">
              {editingId ? "Cập nhật Quy chế thi" : "Tạo Quy chế thi mới"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tên quy chế *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Quy chế thi sát hạch B2" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mã quy chế *</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: QC-B2" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Mô tả chi tiết</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập nội dung quy chế..." className="min-h-[80px]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="INACTIVE">Không hoạt động (INACTIVE)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={resetForm}>Hủy</Button>
              <Button size="sm" onClick={handleSubmit} disabled={createRule.isPending || updateRule.isPending}>
                Lưu
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[150px]">Mã quy chế</TableHead>
                <TableHead>Tên quy chế</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Chưa có dữ liệu</TableCell>
                </TableRow>
              ) : (
                rules.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.code}</TableCell>
                    <TableCell>{rule.title}</TableCell>
                    <TableCell>
                      <Badge variant={rule.status === "ACTIVE" ? "default" : "secondary"}>{rule.status || "ACTIVE"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(rule.id)}>
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
