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
import type { ExamRulePayload } from "@/features/admin/admin-examination-service";

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
  const { data: rules = [], isLoading, isError, error, refetch } = useAdminExamRules();
  const createRule = useCreateExamRule();
  const updateRule = useUpdateExamRule();
  const deleteRule = useDeleteExamRule();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<ExamRulePayload>(defaultRule);
  const [baseline, setBaseline] = useState(JSON.stringify(defaultRule));
  const busy = createRule.isPending || updateRule.isPending || deleteRule.isPending;
  const leave = useAdminUnsavedChanges(isCreating && JSON.stringify(form) !== baseline, busy);


  const resetForm = () => {
    setBaseline(JSON.stringify(defaultRule));
    setForm(defaultRule);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (value: ExamRulePayload & { id: string }) => leave.requestLeave(() => {
    if (!value.id) return;
    const next = { ...defaultRule, ...structuredClone(value), expectedFingerprint: contentFingerprint(value) };
    setForm(next); setBaseline(JSON.stringify(next)); setEditingId(value.id); setIsCreating(true);
  });
  const handleCopy = (value: ExamRulePayload & { id: string }) => leave.requestLeave(() => {
    setForm({ ...defaultRule, ...structuredClone(value), title: value.title + " (bản mới)", expectedFingerprint: undefined });
    setBaseline(JSON.stringify(defaultRule)); setEditingId(null); setIsCreating(true);
  });

  const updateField = <K extends keyof ExamRulePayload>(field: K, value: ExamRulePayload[K]) => {
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
      toast.error("Thời gian thi phải lớn hơn 0");
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
          onError: (err: unknown) => toast.error(adminFailure(err, "Cập nhật thất bại, nội dung được giữ lại.").message),
        }
      );
    } else {
      createRule.mutate(form, {
        onSuccess: () => {
          toast.success("Tạo mới thành công");
          resetForm();
        },
        onError: (err: unknown) => toast.error(adminFailure(err, "Chưa xác nhận tạo quy chế mới.").message),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa quy chế thi này?")) {
      deleteRule.mutate(id, {
        onSuccess: () => toast.success("Xóa thành công"),
        onError: (error) => toast.error(adminFailure(error, "Không thể xóa cấu hình này.").message),
      });
    }
  };

  return (
    <div className="space-y-6" inert={busy} aria-busy={busy}>
      <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
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
          <AdminCan resource="exam_rule" action={"create"}><Button size="sm" onClick={() => { resetForm(); setIsCreating(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button></AdminCan>
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
                  <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Ví dụ: Quy chế thi chính thức hạng B" />
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
                      <Label className={!form.allowRetry ? "text-muted" : ""}>Số lần làm lại tối đa <span className="text-muted-foreground font-medium text-[12.5px]/4">(Nhập 0 để không giới hạn)</span></Label>
                      <Input type="number" disabled={!form.allowRetry} value={form.maxRetry} onChange={(e) => updateField("maxRetry", parseInt(e.target.value) || 0)} />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Chế độ điều hướng</Label>
                      <select value={form.navigationMode} onChange={(e) => updateField("navigationMode", e.target.value as ExamRulePayload["navigationMode"])} className="w-full h-9 rounded-md border px-3 text-[14.5px]/5">
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
                      <Label>Đảo thứ tự các phần thi</Label>
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
                      <Label>Đảo thứ tự đáp án</Label>
                      <Switch checked={form.shuffleOptions} onCheckedChange={(v) => updateField("shuffleOptions", v)} />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Thời điểm công bố kết quả</Label>
                      <select value={form.resultReleaseMode} onChange={(e) => updateField("resultReleaseMode", e.target.value as ExamRulePayload["resultReleaseMode"])} className="w-full h-9 rounded-md border px-3 text-[14.5px]/5">
                        <option value="IMMEDIATE">Ngay sau khi nộp bài</option>
                        <option value="AFTER_SUBMIT">Sau khi hoàn thành bài thi</option>
                        <option value="AFTER_EXAM_END">Sau khi kỳ thi kết thúc</option>
                        <option value="MANUAL">Do quản trị viên công bố</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 p-4 border rounded-md mt-2 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <Label>Yêu cầu làm bài toàn màn hình</Label>
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

            <ConfigurationPreview title={form.title} values={[["Thời gian làm bài", `${form.durationSeconds} giây`], ["Cho phép làm lại", form.allowRetry], ["Số lần làm lại", form.maxRetry], ["Cho phép tạm dừng", form.allowPause], ["Cho phép tiếp tục", form.allowResume], ["Chế độ công bố", ({ IMMEDIATE: "Ngay khi có kết quả", AFTER_SUBMIT: "Sau khi nộp bài", AFTER_EXAM_END: "Khi kỳ thi kết thúc", MANUAL: "Công bố thủ công" } as Record<string, string>)[form.resultReleaseMode]]]} />
            <div className="dts-admin-actions pt-2">
              <Button variant="outline" size="sm" onClick={() => leave.requestLeave(resetForm)}>Hủy</Button>
              <AdminCan resource="exam_rule" action={editingId ? "update" : "create"}><Button size="sm" onClick={handleSubmit} disabled={createRule.isPending || updateRule.isPending}>
                Lưu quy chế
              </Button></AdminCan>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Tên quy chế</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Công bố kết quả</TableHead>
                <TableHead className="w-28 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : isError ? (<TableRow><TableCell colSpan={4} className="p-6 text-center text-destructive">Không tải được danh sách. Vui lòng thử lại.</TableCell></TableRow>) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Chưa có dữ liệu</TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.title}</TableCell>
                    <TableCell>{Math.floor(rule.durationSeconds / 60)} phút</TableCell>
                    <TableCell>{({ IMMEDIATE: "Ngay sau khi nộp", AFTER_SUBMIT: "Sau khi nộp bài", AFTER_EXAM_END: "Khi kỳ thi kết thúc", MANUAL: "Công bố thủ công" } as Record<string, string>)[rule.resultReleaseMode] ?? rule.resultReleaseMode}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="dts-admin-actions">
                        <ConfigurationUsage kind="rule" id={rule.id} title={rule.title} /><AdminCan resource="exam_rule" action={"create"}><Button variant="outline" size="sm" onClick={() => handleCopy(rule)}>Dùng làm mẫu</Button></AdminCan>
                        <AdminCan resource="exam_rule" action={"update"}><Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                          <Pencil className="h-4 w-4" />
                        </Button></AdminCan>
                        <AdminCan resource="exam_rule" action={"delete"}><Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(rule.id)}>
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
