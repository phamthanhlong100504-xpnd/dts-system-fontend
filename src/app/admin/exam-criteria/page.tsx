"use client";

import { useState } from "react";
import { Scale, Plus, Pencil, Trash2, X } from "lucide-react";
import { 
  useAdminExamCriterias, 
  useCreateExamCriteria, 
  useUpdateExamCriteria, 
  useDeleteExamCriteria 
} from "@/features/admin/use-admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ExamCriteriaPayload, MandatoryRule, SectionRule, Penalty } from "@/features/admin/admin-examination-service";

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
  const { data: criterias = [], isLoading } = useAdminExamCriterias();
  const createCriteria = useCreateExamCriteria();
  const updateCriteria = useUpdateExamCriteria();
  const deleteCriteria = useDeleteExamCriteria();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<ExamCriteriaPayload>(defaultCriteria);

  const resetForm = () => {
    setForm(defaultCriteria);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (criteria: any) => {
    setForm({
      title: criteria.title || "",
      criteria: {
        passScore: criteria.criteria?.passScore || 0,
        totalScore: criteria.criteria?.totalScore || 0,
        gradingMethod: criteria.criteria?.gradingMethod || "SUM",
        rounding: criteria.criteria?.rounding || { mode: "HALF_UP", precision: 0 },
        mandatoryRules: criteria.criteria?.mandatoryRules || [],
        sectionRules: criteria.criteria?.sectionRules || [],
        penalties: criteria.criteria?.penalties || [],
      },
      metadata: criteria.metadata || {}
    });
    setEditingId(criteria.id);
    setIsCreating(true);
  };

  const updateField = (field: keyof ExamCriteriaPayload, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCriteriaField = (field: keyof typeof defaultCriteria.criteria, value: any) => {
    setForm(prev => ({
      ...prev,
      criteria: { ...prev.criteria, [field]: value }
    }));
  };

  const updateRoundingField = (field: "mode" | "precision", value: any) => {
    setForm(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        rounding: { ...prev.criteria.rounding, [field]: value } as any
      }
    }));
  };

  // --- Arrays Helpers ---
  const addMandatoryRule = () => {
    const newRule: MandatoryRule = { type: "MUST_CORRECT", questionIds: [] };
    updateCriteriaField("mandatoryRules", [...(form.criteria.mandatoryRules || []), newRule]);
  };
  const updateMandatoryRule = (index: number, field: keyof MandatoryRule, value: any) => {
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
  const updateSectionRule = (index: number, field: keyof SectionRule, value: any) => {
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
  const updatePenalty = (index: number, field: keyof Penalty, value: any) => {
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
          onError: () => toast.error("Cập nhật thất bại"),
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
        onError: () => toast.error("Xóa thất bại"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tiêu chí chấm thi</h2>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button>
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
                      <Label>Điểm đỗ (Pass Score) *</Label>
                      <Input type="number" min={0} value={form.criteria.passScore} onChange={(e) => updateCriteriaField("passScore", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tổng điểm (Total Score) *</Label>
                      <Input type="number" min={0} value={form.criteria.totalScore} onChange={(e) => updateCriteriaField("totalScore", parseInt(e.target.value) || 0)} />
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Phương pháp chấm (Grading Method) *</Label>
                      <select value={form.criteria.gradingMethod} onChange={(e) => updateCriteriaField("gradingMethod", e.target.value)} className="w-full h-9 rounded-md border px-3 text-sm">
                        <option value="SUM">Tổng điểm (SUM)</option>
                        <option value="WEIGHTED">Có trọng số (WEIGHTED)</option>
                        <option value="PERCENTAGE">Phần trăm (PERCENTAGE)</option>
                        <option value="BEST_OF">Lấy điểm cao nhất (BEST_OF)</option>
                        <option value="AVERAGE">Trung bình (AVERAGE)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Chế độ làm tròn (Rounding Mode)</Label>
                      <select value={form.criteria.rounding?.mode} onChange={(e) => updateRoundingField("mode", e.target.value)} className="w-full h-9 rounded-md border px-3 text-sm">
                        <option value="HALF_UP">HALF_UP</option>
                        <option value="UP">UP</option>
                        <option value="DOWN">DOWN</option>
                        <option value="NONE">NONE</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Độ chính xác (Precision - số thập phân)</Label>
                      <Input type="number" min={0} value={form.criteria.rounding?.precision} onChange={(e) => updateRoundingField("precision", parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Quy tắc bắt buộc (Ví dụ: Câu điểm liệt)</Label>
                      <Button size="sm" variant="outline" onClick={addMandatoryRule}>Thêm quy tắc</Button>
                    </div>
                    
                    {form.criteria.mandatoryRules?.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 border rounded-md relative">
                        <div className="flex-1 space-y-3">
                          <div className="space-y-1.5">
                            <Label>Loại quy tắc</Label>
                            <select value={rule.type} onChange={(e) => updateMandatoryRule(idx, "type", e.target.value)} className="w-full h-9 rounded-md border px-3 text-sm">
                              <option value="MUST_CORRECT">Phải trả lời đúng (MUST_CORRECT)</option>
                              <option value="MUST_ATTEMPT">Phải trả lời (MUST_ATTEMPT)</option>
                              <option value="AT_LEAST_ONE">Đúng ít nhất 1 câu (AT_LEAST_ONE)</option>
                              <option value="MAX_WRONG">Sai tối đa (MAX_WRONG)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Danh sách ID câu hỏi (Ngăn cách bởi dấu phẩy)</Label>
                            <Input 
                              placeholder="ID_1, ID_2" 
                              value={rule.questionIds.join(", ")} 
                              onChange={(e) => updateMandatoryRule(idx, "questionIds", e.target.value.split(",").map(id => id.trim()).filter(Boolean))} 
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-500 absolute top-2 right-2" onClick={() => removeMandatoryRule(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {form.criteria.mandatoryRules?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có quy tắc nào</p>}
                  </div>

                  <hr className="my-4" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Quy tắc Phần thi (Section Rules)</Label>
                      <Button size="sm" variant="outline" onClick={addSectionRule}>Thêm quy tắc phần thi</Button>
                    </div>
                    {form.criteria.sectionRules?.map((rule, idx) => (
                      <div key={idx} className="flex gap-4 items-end p-3 border rounded-md">
                        <div className="flex-1 space-y-1.5">
                          <Label>Mã phần thi (Section ID)</Label>
                          <Input value={rule.sectionId} onChange={(e) => updateSectionRule(idx, "sectionId", e.target.value)} />
                        </div>
                        <div className="w-32 space-y-1.5">
                          <Label>Điểm tối thiểu</Label>
                          <Input type="number" min={0} value={rule.minScore} onChange={(e) => updateSectionRule(idx, "minScore", parseInt(e.target.value) || 0)} />
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-500 mb-0.5" onClick={() => removeSectionRule(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {form.criteria.sectionRules?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có quy tắc nào</p>}
                  </div>
                </TabsContent>

                <TabsContent value="penalties" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Quy tắc Phạt điểm</Label>
                      <Button size="sm" variant="outline" onClick={addPenalty}>Thêm mức phạt</Button>
                    </div>
                    
                    {form.criteria.penalties?.map((penalty, idx) => (
                      <div key={idx} className="flex gap-4 items-end p-3 border rounded-md">
                        <div className="flex-1 space-y-1.5">
                          <Label>Loại vi phạm</Label>
                          <select value={penalty.type} onChange={(e) => updatePenalty(idx, "type", e.target.value)} className="w-full h-9 rounded-md border px-3 text-sm">
                            <option value="WRONG_ANSWER">Trả lời sai (WRONG_ANSWER)</option>
                            <option value="UNANSWERED">Bỏ trống (UNANSWERED)</option>
                          </select>
                        </div>
                        <div className="w-32 space-y-1.5">
                          <Label>Điểm trừ</Label>
                          <Input type="number" min={0} value={penalty.deduct} onChange={(e) => updatePenalty(idx, "deduct", parseInt(e.target.value) || 0)} />
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-500 mb-0.5" onClick={() => removePenalty(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {form.criteria.penalties?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa cấu hình phạt điểm</p>}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" size="sm" onClick={resetForm}>Hủy</Button>
              <Button size="sm" onClick={handleSubmit} disabled={createCriteria.isPending || updateCriteria.isPending}>
                Lưu Tiêu chí
              </Button>
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
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : criterias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Chưa có dữ liệu</TableCell>
                </TableRow>
              ) : (
                criterias.map((criteria: any) => (
                  <TableRow key={criteria.id}>
                    <TableCell className="font-medium">{criteria.title}</TableCell>
                    <TableCell>{criteria.criteria?.gradingMethod}</TableCell>
                    <TableCell>{criteria.criteria?.passScore} / {criteria.criteria?.totalScore}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {criteria.criteria?.mandatoryRules?.length || 0} QC bắt buộc, {criteria.criteria?.penalties?.length || 0} QC phạt
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(criteria)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(criteria.id)}>
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
