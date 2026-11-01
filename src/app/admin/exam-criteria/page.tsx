"use client";
import { contentFingerprint } from "@/features/admin/theory/theory-contract";
import { ConfigurationUsage } from "@/features/admin/examination/components/configuration-usage";
import { ConfigurationPreview } from "@/features/admin/examination/components/configuration-preview";
import { AdminPageState } from "@/features/admin/foundation/components/admin-page-state";
import { adminFailure } from "@/features/admin/foundation/admin-errors";
import { useAdminUnsavedChanges } from "@/features/admin/foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "@/features/admin/foundation/components/admin-leave-dialog";

import { AdminCan } from "@/features/admin/foundation/admin-access-provider";


import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  useAdminExamCriterias,
  useCreateExamCriteria,
  useUpdateExamCriteria,
  useDeleteExamCriteria
} from "@/features/admin/use-admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import type { ExamCriteriaPayload, MandatoryRule, SectionRule, Penalty, RoundingRule } from "@/features/admin/admin-examination-service";

const defaultCriteria: ExamCriteriaPayload = {
  title: "",
  criteria: {
    passScore: 50,
    totalScore: 100,
    gradingMethod: "SUM",
    rounding: {
      mode: "HALF_UP",
      precision: 0
    },
    mandatoryRules: [],
    sectionRules: [],
    penalties: [],
  },
  metadata: {}
};

export default function ExamCriteriaPage() {
  const { data: criterias = [], isLoading, isError, error, refetch } = useAdminExamCriterias();
  const createCriteria = useCreateExamCriteria();
  const updateCriteria = useUpdateExamCriteria();
  const deleteCriteria = useDeleteExamCriteria();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<ExamCriteriaPayload>(defaultCriteria);
  const [baseline, setBaseline] = useState(JSON.stringify(defaultCriteria));
  const busy = createCriteria.isPending || updateCriteria.isPending || deleteCriteria.isPending;
  const leave = useAdminUnsavedChanges(isCreating && JSON.stringify(form) !== baseline, busy);


  const resetForm = () => {
    setBaseline(JSON.stringify(defaultCriteria));
    setForm(defaultCriteria);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (value: ExamCriteriaPayload) => leave.requestLeave(() => {
    if (!value.id) return;
    const next = { ...defaultCriteria, ...structuredClone(value), expectedFingerprint: contentFingerprint(value) };
    setForm(next); setBaseline(JSON.stringify(next)); setEditingId(value.id); setIsCreating(true);
  });
  const handleCopy = (value: ExamCriteriaPayload) => leave.requestLeave(() => {
    setForm({ ...defaultCriteria, ...structuredClone(value), title: value.title + " (bản mới)", expectedFingerprint: undefined });
    setBaseline(JSON.stringify(defaultCriteria)); setEditingId(null); setIsCreating(true);
  });

  const updateField = <K extends keyof ExamCriteriaPayload>(field: K, value: ExamCriteriaPayload[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCriteriaField = <K extends keyof ExamCriteriaPayload["criteria"]>(
    field: K,
    value: ExamCriteriaPayload["criteria"][K]
  ) => {
    setForm(prev => ({
      ...prev,
      criteria: { ...prev.criteria, [field]: value }
    }));
  };

  const updateRoundingField = <K extends keyof RoundingRule>(field: K, value: RoundingRule[K]) => {
    setForm(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        rounding: { mode: "HALF_UP", precision: 0, ...prev.criteria.rounding, [field]: value }
      }
    }));
  };

  // --- Arrays Helpers ---
  const addMandatoryRule = () => {
    const newRule: MandatoryRule = { type: "MUST_CORRECT", questionIds: [] };
    updateCriteriaField("mandatoryRules", [...(form.criteria.mandatoryRules || []), newRule]);
  };
  const updateMandatoryRule = <K extends keyof MandatoryRule>(index: number, field: K, value: MandatoryRule[K]) => {
    const arr = [...(form.criteria.mandatoryRules || [])];
    arr[index] = { ...arr[index], [field]: value };
    updateCriteriaField("mandatoryRules", arr);
  };
  const removeMandatoryRule = (index: number) => {
    const arr = [...(form.criteria.mandatoryRules || [])];
    arr.splice(index, 1);
    updateCriteriaField("mandatoryRules", arr);
  };

  const addSectionRule = () => {
    const newRule: SectionRule = { sectionId: "", minScore: 0 };
    updateCriteriaField("sectionRules", [...(form.criteria.sectionRules || []), newRule]);
  };
  const updateSectionRule = <K extends keyof SectionRule>(index: number, field: K, value: SectionRule[K]) => {
    const arr = [...(form.criteria.sectionRules || [])];
    arr[index] = { ...arr[index], [field]: value };
    updateCriteriaField("sectionRules", arr);
  };
  const removeSectionRule = (index: number) => {
    const arr = [...(form.criteria.sectionRules || [])];
    arr.splice(index, 1);
    updateCriteriaField("sectionRules", arr);
  };

  const addPenalty = () => {
    const newPenalty: Penalty = { type: "WRONG_ANSWER", deduct: 0 };
    updateCriteriaField("penalties", [...(form.criteria.penalties || []), newPenalty]);
  };
  const updatePenalty = <K extends keyof Penalty>(index: number, field: K, value: Penalty[K]) => {
    const arr = [...(form.criteria.penalties || [])];
    arr[index] = { ...arr[index], [field]: value };
    updateCriteriaField("penalties", arr);
  };
  const removePenalty = (index: number) => {
    const arr = [...(form.criteria.penalties || [])];
    arr.splice(index, 1);
    updateCriteriaField("penalties", arr);
  };
  // ----------------------

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập Tên tiêu chí");
      return;
    }
    if (form.criteria.passScore < 0) {
      toast.error("Điểm đỗ phải lớn hơn hoặc bằng 0");
      return;
    }
    if (form.criteria.totalScore < form.criteria.passScore) {
      toast.error("Tổng điểm phải lớn hơn hoặc bằng Điểm đỗ");
      return;
    }

    if (editingId) {
      updateCriteria.mutate(
        { id: editingId, payload: form },
        {
          onSuccess: () => {
            toast.success("Cập nhật thành công");
            resetForm();
          },
          onError: (error) => toast.error(adminFailure(error, "Cập nhật thất bại, nội dung được giữ lại.").message),
        }
      );
    } else {
      createCriteria.mutate(form, {
        onSuccess: () => {
          toast.success("Tạo mới thành công");
          resetForm();
        },
        onError: () => toast.error("Tạo mới thất bại"),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa tiêu chí này?")) {
      deleteCriteria.mutate(id, {
        onSuccess: () => toast.success("Đã xóa"),
        onError: (error) => toast.error(adminFailure(error, "Không thể xóa cấu hình này.").message),
      });
    }
  };

  return (
    <div className="space-y-6" inert={busy} aria-busy={busy}>
      <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tiêu chí chấm thi</h1>
        {!isCreating && (
          <AdminCan resource="exam_criteria" action={"create"}><Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button></AdminCan>
        )}
      </div>

      <Card>
        {isCreating && (
          <div className="p-6 border-b bg-muted/10">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? "Cập nhật Tiêu chí" : "Tạo Tiêu chí mới"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Tên tiêu chí *</Label>
                  <Input
                    placeholder="VD: Tiêu chí đỗ B2 (32/35)"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                  <TabsTrigger value="rules">Quy tắc bắt buộc</TabsTrigger>
                  <TabsTrigger value="penalties">Phạt điểm</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label>Điểm đạt *</Label>
                      <Input type="number" min={0} value={form.criteria.passScore} onChange={(e) => updateCriteriaField("passScore", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tổng điểm *</Label>
                      <Input type="number" min={0} value={form.criteria.totalScore} onChange={(e) => updateCriteriaField("totalScore", parseInt(e.target.value) || 0)} />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Phương pháp chấm *</Label>
                      <select value={form.criteria.gradingMethod} onChange={(e) => updateCriteriaField("gradingMethod", e.target.value as ExamCriteriaPayload["criteria"]["gradingMethod"])} className="w-full h-9 rounded-md border px-3 text-[14.5px]/5">
                        <option value="SUM">Cộng điểm từng câu</option>
                        <option value="WEIGHTED">Tính theo trọng số</option>
                        <option value="PERCENTAGE">Tính theo tỷ lệ phần trăm</option>
                        <option value="BEST_OF">Lấy điểm cao nhất</option>
                        <option value="AVERAGE">Trung bình</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Cách làm tròn điểm</Label>
                      <select value={form.criteria.rounding?.mode} onChange={(e) => updateRoundingField("mode", e.target.value)} className="w-full h-9 rounded-md border px-3 text-[14.5px]/5">
                        <option value="HALF_UP">Làm tròn gần nhất</option>
                        <option value="UP">Làm tròn lên</option>
                        <option value="DOWN">Làm tròn xuống</option>
                        <option value="NONE">Không làm tròn</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Số chữ số thập phân</Label>
                      <Input type="number" min={0} value={form.criteria.rounding?.precision} onChange={(e) => updateRoundingField("precision", parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Quy tắc bắt buộc (Ví dụ: Câu điểm liệt)</Label>
                      <AdminCan resource="exam_criteria" action={editingId ? "update" : "create"}><Button size="sm" variant="outline" onClick={addMandatoryRule}>Thêm quy tắc</Button></AdminCan>
                    </div>

                    {form.criteria.mandatoryRules?.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 border rounded-md relative">
                        <div className="flex-1 space-y-3">
                          <div className="space-y-1.5">
                            <Label>Loại quy tắc</Label>
                            <select value={rule.type} onChange={(e) => updateMandatoryRule(idx, "type", e.target.value as MandatoryRule["type"])} className="w-full h-9 rounded-md border px-3 text-[14.5px]/5">
                              <option value="MUST_CORRECT">Bắt buộc trả lời đúng</option>
                              <option value="MUST_ATTEMPT">Bắt buộc trả lời</option>
                              <option value="AT_LEAST_ONE">Đúng ít nhất một câu</option>
                              <option value="MAX_WRONG">Giới hạn số câu sai</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Mã các câu hỏi áp dụng (cách nhau bằng dấu phẩy)</Label>
                            <Input
                              placeholder="Mã câu hỏi 1, Mã câu hỏi 2"
                              value={rule.questionIds.join(", ")}
                              onChange={(e) => updateMandatoryRule(idx, "questionIds", e.target.value.split(",").map(id => id.trim()).filter(Boolean))}
                            />
                          </div>
                        </div>
                        <AdminCan resource="exam_criteria" action={editingId ? "update" : "create"}><Button variant="ghost" size="icon" className="text-red-500 absolute top-2 right-2" onClick={() => removeMandatoryRule(idx)}>
                          <X className="h-4 w-4" />
                        </Button></AdminCan>
                      </div>
                    ))}
                    {form.criteria.mandatoryRules?.length === 0 && <p className="text-[14.5px]/5 text-muted-foreground text-center py-4">Chưa có quy tắc nào</p>}
                  </div>

                  <hr className="my-4" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Điều kiện đạt theo phần thi</Label>
                      <AdminCan resource="exam_criteria" action={editingId ? "update" : "create"}><Button size="sm" variant="outline" onClick={addSectionRule}>Thêm quy tắc phần thi</Button></AdminCan>
                    </div>
                    {form.criteria.sectionRules?.map((rule, idx) => (
                      <div key={idx} className="flex gap-4 items-end p-3 border rounded-md">
                        <div className="flex-1 space-y-1.5">
                          <Label>Mã phần thi</Label>
                          <Input value={rule.sectionId} onChange={(e) => updateSectionRule(idx, "sectionId", e.target.value)} />
                        </div>
                        <div className="w-32 space-y-1.5">
                          <Label>Điểm tối thiểu</Label>
                          <Input type="number" min={0} value={rule.minScore} onChange={(e) => updateSectionRule(idx, "minScore", parseInt(e.target.value) || 0)} />
                        </div>
                        <AdminCan resource="exam_criteria" action={editingId ? "update" : "create"}><Button variant="ghost" size="icon" className="text-red-500 mb-0.5" onClick={() => removeSectionRule(idx)}>
                          <X className="h-4 w-4" />
                        </Button></AdminCan>
                      </div>
                    ))}
                    {form.criteria.sectionRules?.length === 0 && <p className="text-[14.5px]/5 text-muted-foreground text-center py-4">Chưa có quy tắc nào</p>}
                  </div>
                </TabsContent>

                <TabsContent value="penalties" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Quy tắc trừ điểm</Label>
                      <AdminCan resource="exam_criteria" action={editingId ? "update" : "create"}><Button size="sm" variant="outline" onClick={addPenalty}>Thêm mức phạt</Button></AdminCan>
                    </div>

                    {form.criteria.penalties?.map((penalty, idx) => (
                      <div key={idx} className="flex gap-4 items-end p-3 border rounded-md">
                        <div className="flex-1 space-y-1.5">
                          <Label>Loại vi phạm</Label>
                          <select value={penalty.type} onChange={(e) => updatePenalty(idx, "type", e.target.value as Penalty["type"])} className="w-full h-9 rounded-md border px-3 text-[14.5px]/5">
                            <option value="WRONG_ANSWER">Trả lời sai (WRONG_ANSWER)</option>
                            <option value="UNANSWERED">Bỏ trống (UNANSWERED)</option>
                          </select>
                        </div>
                        <div className="w-32 space-y-1.5">
                          <Label>Điểm trừ</Label>
                          <Input type="number" min={0} value={penalty.deduct} onChange={(e) => updatePenalty(idx, "deduct", parseInt(e.target.value) || 0)} />
                        </div>
                        <AdminCan resource="exam_criteria" action={editingId ? "update" : "create"}><Button variant="ghost" size="icon" className="text-red-500 mb-0.5" onClick={() => removePenalty(idx)}>
                          <X className="h-4 w-4" />
                        </Button></AdminCan>
                      </div>
                    ))}
                    {form.criteria.penalties?.length === 0 && <p className="text-[14.5px]/5 text-muted-foreground text-center py-4">Chưa cấu hình phạt điểm</p>}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <ConfigurationPreview title={form.title} values={[["Điểm đạt", form.criteria.passScore], ["Tổng điểm", form.criteria.totalScore], ["Điều kiện bắt buộc", form.criteria.mandatoryRules?.length ?? 0], ["Điều kiện theo phần", form.criteria.sectionRules?.length ?? 0], ["Quy tắc trừ điểm", form.criteria.penalties?.length ?? 0]]} />
            <div className="dts-admin-actions pt-4 mt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => leave.requestLeave(resetForm)}>Hủy</Button>
              <AdminCan resource="exam_criteria" action={editingId ? "update" : "create"}><Button size="sm" onClick={handleSubmit} disabled={createCriteria.isPending || updateCriteria.isPending}>
                Lưu Tiêu chí
              </Button></AdminCan>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Tên tiêu chí</TableHead>
                <TableHead>Phương pháp chấm</TableHead>
                <TableHead>Điểm đỗ</TableHead>
                <TableHead>Quy tắc</TableHead>
                <TableHead className="w-28 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : isError ? (<TableRow><TableCell colSpan={5} className="p-6 text-center text-destructive">Không tải được danh sách. Vui lòng thử lại.</TableCell></TableRow>) : criterias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Chưa có dữ liệu</TableCell>
                </TableRow>
              ) : (
                criterias.map((criteria) => (
                  <TableRow key={criteria.id}>
                    <TableCell className="font-medium">{criteria.title}</TableCell>
                    <TableCell>{({ SUM: "Cộng điểm", WEIGHTED: "Theo trọng số", PERCENTAGE: "Theo tỷ lệ", BEST_OF: "Lấy kết quả cao nhất", AVERAGE: "Lấy điểm trung bình" } as Record<string, string>)[criteria.criteria?.gradingMethod] ?? "Chưa xác định"}</TableCell>
                    <TableCell>{criteria.criteria?.passScore} / {criteria.criteria?.totalScore}</TableCell>
                    <TableCell>
                      <span className="text-[12.5px]/4 text-muted-foreground">
                        {criteria.criteria?.mandatoryRules?.length || 0} QC bắt buộc, {criteria.criteria?.penalties?.length || 0} QC phạt
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="dts-admin-actions">
                        <ConfigurationUsage kind="criteria" id={criteria.id!} title={criteria.title} /><AdminCan resource="exam_criteria" action={"create"}><Button variant="outline" size="sm" onClick={() => handleCopy(criteria)}>Dùng làm mẫu</Button></AdminCan>
                        <AdminCan resource="exam_criteria" action={"update"}><Button variant="ghost" size="icon" onClick={() => handleEdit(criteria)}>
                          <Pencil className="h-4 w-4" />
                        </Button></AdminCan>
                        <AdminCan resource="exam_criteria" action={"delete"}><Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if (criteria.id) handleDelete(criteria.id); }} disabled={!criteria.id}>
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
