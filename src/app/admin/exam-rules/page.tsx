"use client";

import { useState } from "react";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminExamRules, useCreateExamRule, useUpdateExamRule, useDeleteExamRule } from "@/features/admin/use-admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ExamRulePayload } from "@/features/admin/admin-examination-service";

const defaultRule: ExamRulePayload = {
  title: "",
  allowRetry: false,
  maxRetry: 0,
  retryIntervalSeconds: 0,
  durationSeconds: 1200,
  gracePeriodSeconds: 0,
  autoSubmit: true,
  navigationMode: "FREE",
  allowSkip: true,
  reviewMode: "ALL",
  allowPause: false,
  maxPauseCount: 0,
  maxPauseDurationSeconds: 0,
  allowResume: false,
  resumeTimeoutSeconds: 0,
  shuffleSections: false,
  shuffleQuestionsWithinSection: true,
  shuffleQuestionsAcrossSections: false,
  shuffleOptions: true,
  resultReleaseMode: "IMMEDIATE",
  showAnswerAfterSubmit: true,
  showExplanationAfterSubmit: false,
  showQuestionScoreAfterSubmit: false,
  requireFullscreen: false,
  preventTabSwitch: false,
  maxTabSwitchCount: 0,
  timeZone: "Asia/Ho_Chi_Minh",
  metadata: {}
};

export default function ExamRulesPage() {
  const { data: rules = [], isLoading } = useAdminExamRules();
  const createRule = useCreateExamRule();
  const updateRule = useUpdateExamRule();
  const deleteRule = useDeleteExamRule();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<ExamRulePayload>(defaultRule);

  const resetForm = () => {
    setForm(defaultRule);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (rule: any) => {
    // Map missing fields from rule to defaultRule just in case
    setForm({ ...defaultRule, ...rule });
    setEditingId(rule.id);
    setIsCreating(true);
  };

  const updateField = (field: keyof ExamRulePayload, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      
      // Cross-field logic fixes
      if (field === "allowRetry" && !value) {
        next.maxRetry = 0;
      }
      if (field === "allowPause" && value) {
        next.allowResume = true;
      }
      if (field === "shuffleQuestionsAcrossSections" && value) {
        next.shuffleQuestionsWithinSection = false;
        next.shuffleSections = false;
      }
      if (field === "preventTabSwitch" && !value) {
        next.maxTabSwitchCount = 0;
      }
      
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập Tên quy chế");
      return;
    }

    if (form.durationSeconds <= 0) {
      toast.error("Thời gian thi (durationSeconds) phải lớn hơn 0");
      return;
    }

    if (editingId) {
      updateRule.mutate(
        { id: editingId, payload: form },
        {
          onSuccess: () => {
            toast.success("Cập nhật thành công");
            resetForm();
          },
          onError: (err: any) => toast.error(err?.response?.data?.message || "Cập nhật thất bại"),
        }
      );
    } else {
      createRule.mutate(form, {
        onSuccess: () => {
          toast.success("Tạo mới thành công");
          resetForm();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Tạo mới thất bại"),
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

        {isCreating && (
          <div className="p-6 bg-primary/5 border-b space-y-6">
            <h3 className="font-semibold text-lg text-primary">
              {editingId ? "Cập nhật Quy chế thi" : "Tạo Quy chế thi mới"}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-semibold">Tên quy chế *</Label>
                  <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="VD: Quy chế thi sát hạch B2" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-semibold">Thời gian làm bài (giây) *</Label>
                  <Input type="number" value={form.durationSeconds} onChange={(e) => updateField("durationSeconds", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <Tabs defaultValue="general" className="w-full mt-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="general">Làm bài & Nộp bài</TabsTrigger>
                  <TabsTrigger value="display">Hiển thị & Đảo đề</TabsTrigger>
                  <TabsTrigger value="security">Bảo mật & Giám sát</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Cho phép nộp bài tự động (hết giờ)</Label>
                      <Switch checked={form.autoSubmit} onCheckedChange={(v) => updateField("autoSubmit", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Cho phép bỏ qua câu hỏi</Label>
                      <Switch checked={form.allowSkip} onCheckedChange={(v) => updateField("allowSkip", v)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Cho phép làm lại</Label>
                      <Switch checked={form.allowRetry} onCheckedChange={(v) => updateField("allowRetry", v)} />
                    </div>
                    <div className="space-y-2">
                      <Label className={!form.allowRetry ? "text-muted" : ""}>Số lần làm lại tối đa <span className="text-muted-foreground font-normal text-xs">(Nhập 0 để không giới hạn)</span></Label>
                      <Input type="number" disabled={!form.allowRetry} value={form.maxRetry} onChange={(e) => updateField("maxRetry", parseInt(e.target.value) || 0)} />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Chế độ điều hướng</Label>
                      <select value={form.navigationMode} onChange={(e) => updateField("navigationMode", e.target.value)} className="w-full h-9 rounded-md border px-3 text-sm">
                        <option value="FREE">Tự do (FREE)</option>
                        <option value="SEQUENTIAL">Tuần tự (SEQUENTIAL)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Cho phép tạm dừng</Label>
                      <Switch checked={form.allowPause} onCheckedChange={(v) => updateField("allowPause", v)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="display" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Đảo phần thi (Sections)</Label>
                      <Switch checked={form.shuffleSections} onCheckedChange={(v) => updateField("shuffleSections", v)} disabled={form.shuffleQuestionsAcrossSections} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Đảo câu hỏi trong phần thi</Label>
                      <Switch checked={form.shuffleQuestionsWithinSection} onCheckedChange={(v) => updateField("shuffleQuestionsWithinSection", v)} disabled={form.shuffleQuestionsAcrossSections} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Đảo câu hỏi xuyên suốt các phần</Label>
                      <Switch checked={form.shuffleQuestionsAcrossSections} onCheckedChange={(v) => updateField("shuffleQuestionsAcrossSections", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Đảo đáp án (Options)</Label>
                      <Switch checked={form.shuffleOptions} onCheckedChange={(v) => updateField("shuffleOptions", v)} />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Chế độ hiển thị kết quả (Result Release Mode)</Label>
                      <select value={form.resultReleaseMode} onChange={(e) => updateField("resultReleaseMode", e.target.value)} className="w-full h-9 rounded-md border px-3 text-sm">
                        <option value="IMMEDIATE">Ngay lập tức (IMMEDIATE)</option>
                        <option value="AFTER_SUBMIT">Sau khi nộp (AFTER_SUBMIT)</option>
                        <option value="AFTER_EXAM_END">Sau khi kỳ thi kết thúc (AFTER_EXAM_END)</option>
                        <option value="MANUAL">Thủ công (MANUAL)</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Yêu cầu toàn màn hình (Fullscreen)</Label>
                      <Switch checked={form.requireFullscreen} onCheckedChange={(v) => updateField("requireFullscreen", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Chống chuyển tab trình duyệt</Label>
                      <Switch checked={form.preventTabSwitch} onCheckedChange={(v) => updateField("preventTabSwitch", v)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={!form.preventTabSwitch ? "text-muted" : ""}>Số lần chuyển tab tối đa</Label>
                      <Input type="number" disabled={!form.preventTabSwitch} value={form.maxTabSwitchCount} onChange={(e) => updateField("maxTabSwitchCount", parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={resetForm}>Hủy</Button>
              <Button size="sm" onClick={handleSubmit} disabled={createRule.isPending || updateRule.isPending}>
                Lưu quy chế
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Tên quy chế</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Chế độ hiển thị</TableHead>
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
                    <TableCell className="font-medium">{rule.title}</TableCell>
                    <TableCell>{Math.floor(rule.durationSeconds / 60)} phút</TableCell>
                    <TableCell>{rule.resultReleaseMode}</TableCell>
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
