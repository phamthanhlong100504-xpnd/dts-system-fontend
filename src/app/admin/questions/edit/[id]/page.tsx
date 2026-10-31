"use client";
import { adminStatusLabel, adminQuestionTypeLabel } from "@/features/admin/foundation/admin-ui-labels";
import { useAdminUnsavedChanges } from "@/features/admin/foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "@/features/admin/foundation/components/admin-leave-dialog";
import { adminFailure } from "@/features/admin/foundation/admin-errors";

import { AdminPageState } from "@/features/admin/foundation/components/admin-page-state";


import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useUpdateQuestion } from "@/features/admin/use-admin-content";
import { fetchEditableAdminQuestion } from "@/features/admin/admin-content-service";
import { contentFingerprint, validateChoiceDraft } from "@/features/admin/theory/theory-contract";
import { useAuthStore } from "@/stores/auth-store";
import { uploadFileToMediaService, MediaProcessingPendingError } from "@/features/media/media-service";
import { validateMediaFile } from "@/features/media/media-upload-policy";
import { AdminMediaPicker } from "@/features/admin/media/components/admin-media-picker";
import { AdminMediaPending } from "@/features/admin/media/components/admin-media-pending";
import {LifecyclePanel} from "@/features/admin/workbench/components/lifecycle-panel";
import { QuestionDraftPreview } from "@/features/admin/theory/components/question-draft-preview";
import { MediaImage } from "@/components/ui/media-image";

interface OptionItem {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const updateMutation = useUpdateQuestion();
  const actorId = useAuthStore((state) => state.user?.id);

  const [loadedQuestionId, setLoadedQuestionId] = useState<string | null>(null);
  const loading = loadedQuestionId !== `${actorId}:${questionId}`;
  const [questionTitle, setQuestionTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [questionType, setQuestionType] = useState("SINGLE_CHOICE");
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingMediaId, setPendingMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createdBy, setCreatedBy] = useState<string | undefined>();
  const [expectedFingerprint, setExpectedFingerprint] = useState("");
  const [optionsEditable, setOptionsEditable] = useState(false);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const readOnlyQuestion = currentStatus !== "DRAFT" || !optionsEditable || createdBy !== actorId || !["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(questionType);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);
  const signature = JSON.stringify({ questionTitle, explanation, isCritical, questionType, mediaUrl, options });
  const leave = useAdminUnsavedChanges(!loading && savedSignature !== null && signature !== savedSignature, updateMutation.isPending || isUploading);


  // Loading được suy ra từ ID đã tải; không gọi setState đồng bộ trong effect.
  useEffect(() => {
    if (!questionId) return;
    let active = true;
    const controller = new AbortController();
    fetchEditableAdminQuestion(questionId, controller.signal)
      .then((q) => {
        if (!active) return;
        const loaded = {
          questionTitle: q.content || "",
          explanation: typeof q.explanations?.text === "string" ? q.explanations.text : "",
          isCritical: Boolean(q.metadata?.isCritical),
          questionType: q.type || "SINGLE_CHOICE",
          mediaUrl: q.mediaFileIds?.[0] || null,
          options: (Array.isArray(q.options) ? q.options : []).map((opt, idx) => ({
            id: opt.id || String(idx), label: LABELS[idx] || String(idx + 1), text: opt.content || "", isCorrect: Boolean(opt.isCorrect),
          })),
        };
        setQuestionTitle(loaded.questionTitle); setExplanation(loaded.explanation); setIsCritical(loaded.isCritical);
        setQuestionType(loaded.questionType); setCurrentStatus(q.status || ""); setMediaUrl(loaded.mediaUrl); setOptions(loaded.options);
        setSavedSignature(JSON.stringify(loaded)); setLoadError(null); setExpectedFingerprint(contentFingerprint(q)); setCreatedBy(q.createdBy); setOptionsEditable(Boolean(q.options?.every(o => o.status === "DRAFT"))); setSaveBlocked(false);
      })
      .catch((error: unknown) => { if (active) setLoadError(error); })
      .finally(() => {
        if (active) setLoadedQuestionId(`${actorId}:${questionId}`);
      });
    return () => { active = false; controller.abort(); };
  }, [questionId, reload, actorId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const invalid = validateMediaFile(file, "QUESTION");
    if (invalid) {
      toast.error(invalid);
      return;
    }

    try {
      setIsUploading(true);
      setPendingMediaId(null);
      const res = await uploadFileToMediaService(file, "QUESTION", "PUBLIC");
      setMediaUrl(res.mediaId);
      toast.success("Tải ảnh thành công!");
    } catch (error) {
      if (error instanceof MediaProcessingPendingError) { setPendingMediaId(error.mediaId); toast.info("tài nguyên đang chờ xác minh. Bạn có thể kiểm tra lại bên dưới."); }
      else toast.error(adminFailure(error, "Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.").message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addOption = () => {
    if (options.length >= 50 || (questionType === "TRUE_FALSE" && options.length >= 2)) { toast.error("Đã đạt giới hạn đáp án cho loại câu hỏi này"); return; }
    setOptions([...options, { id: Date.now().toString(), label: LABELS[options.length] || `${options.length + 1}`, text: "", isCorrect: false }]);
  };

  const removeOption = (id: string) => {
    setOptions(previous => previous.filter(option => option.id !== id).map((option, index) => ({ ...option, label: LABELS[index] || String(index + 1) })));
  };

  const setCorrect = (id: string) => {
    setOptions(previous => previous.map(option => ({ ...option, isCorrect: questionType === "MULTIPLE_CHOICE" ? (option.id === id ? !option.isCorrect : option.isCorrect) : option.id === id })));
  };

  const handleSave = (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    if (saveBlocked || updateMutation.isPending) return;
    if (status === "PUBLISHED") { toast.info("Công bố đang chờ quy trình phê duyệt/phát hành chính thức."); return; }
    if (status === "DRAFT") {
      if (readOnlyQuestion) { toast.error("Nội dung này chỉ được xem."); return; }
      const invalid = validateChoiceDraft(questionType, questionTitle, options.map(option => ({ content: option.text, isCorrect: option.isCorrect })));
      if (invalid) { toast.error(invalid); return; }
    }
    updateMutation.mutate(
      {
        id: questionId,
        expectedFingerprint,
        content: questionTitle,
        type: questionType,
        status,
        isCritical,
        explanation,
        mediaUrl: mediaUrl || undefined,
        options: options.map((o, idx) => ({ id: o.id, content: o.text, isCorrect: o.isCorrect, sortOrder: idx })),
      },
      {
        onSuccess: () => {
          setSavedSignature(signature);
          toast.success("Đã cập nhật câu hỏi thành công!");
          router.push("/admin/questions");
        },
        onError: (error) => {
          const httpStatus = error && typeof error === "object" && "status" in error ? error.status : undefined;
          if (httpStatus === 409 || (error && typeof error === "object" && "errorCode" in error && error.errorCode === "PARTIAL_QUESTION_SAVE")) setSaveBlocked(true);
          toast.error(adminFailure(error, "Cập nhật thất bại. Vui lòng thử lại.").message);
        },
      }
    );
  };

  if (loadError) {
    return <AdminPageState state={adminFailure(loadError).kind === "forbidden" ? "forbidden" : "error"} error={loadError} onRetry={() => { setLoadError(null); setLoadedQuestionId(null); setReload((value) => value + 1); }} />;
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-9 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto" inert={updateMutation.isPending || isUploading} aria-busy={updateMutation.isPending || isUploading}>
      <fieldset className="min-w-0 space-y-6" disabled={updateMutation.isPending || isUploading}>

        <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/questions">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa câu hỏi</h1>
            <p className="text-[14.5px]/5 text-muted-foreground font-mono">{questionId}</p>
          </div>
        </div>

        {readOnlyQuestion && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-md shadow-sm dark:bg-amber-950/40 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="h-5 w-5" />
              <span>Nội dung đang ở chế độ chỉ đọc</span>
            </div>
            <p className="text-[14.5px]/5 ml-7">
              Chỉ người tạo câu hỏi được sửa bản nháp. Câu hỏi đã công bố hoặc lưu trữ chỉ được xem.
            </p>
          </div>
        )}

        <p className="rounded-xl border bg-muted/20 p-4 text-[14px]/6 text-muted-foreground">Trạng thái: <strong>{adminStatusLabel(currentStatus)}</strong>. Vui lòng kiểm tra nội dung trước khi lưu.</p>
        {saveBlocked && <div role="alert" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px]/6 text-amber-900"><p>Bản trên hệ thống đã thay đổi hoặc một phần thao tác có thể đã được lưu. Nội dung đang nhập được giữ lại, không tự gửi lại các lệnh tạo đáp án.</p><Button type="button" variant="outline" onClick={() => { if (window.confirm("Tải bản trên hệ thống sẽ thay nội dung đang nhập. Hãy sao chép nội dung cần giữ trước khi tiếp tục.")) { setLoadedQuestionId(null); setLoadError(null); setReload((n) => n + 1); } }}>Tải lại bản trên hệ thống</Button></div>}
        <label className="flex flex-col gap-2 text-[15px] font-semibold">Loại câu hỏi<select className="h-10 rounded-lg border bg-background px-3" value={questionType} disabled={readOnlyQuestion} onChange={(e) => setQuestionType(e.target.value)}><option value="SINGLE_CHOICE">Một đáp án đúng</option><option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option><option value="TRUE_FALSE">Đúng / Sai</option>{!["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(questionType) && <option value={questionType}>{adminQuestionTypeLabel(questionType)} — chỉ xem</option>}</select></label>
        {/* Question Content */}
        <Card>
          <CardHeader><CardTitle className="text-base">Nội dung câu hỏi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              className="min-h-[100px] text-[14.5px]/5 resize-none"
              disabled={readOnlyQuestion}
            />
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12.5px]/4 font-medium text-muted-foreground">Câu hỏi điểm liệt</label>
                <button
                  type="button"
                  onClick={() => !readOnlyQuestion && setIsCritical(!isCritical)}
                  className={`flex items-center gap-2 h-9 w-full px-3 rounded-md border text-[14.5px]/5 transition-colors ${isCritical
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-input bg-background text-muted-foreground"
                    } ${readOnlyQuestion ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={readOnlyQuestion}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {isCritical ? "Điểm liệt — Bật" : "Điểm liệt — Tắt"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media File Upload Card */}
        <Card>
          <CardHeader><CardTitle className="text-base">Hình ảnh đính kèm (Sa hình / Biển báo)</CardTitle></CardHeader>
          <CardContent>
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={readOnlyQuestion}
            />
            {mediaUrl ? (
              <div className="relative border rounded-xl overflow-hidden group">
                <MediaImage src={mediaUrl} alt="Minh họa" className="mx-auto block h-auto max-h-[300px] max-w-full object-contain bg-muted/20" />
                {!readOnlyQuestion && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Đổi ảnh
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setMediaUrl(null)}>
                      Xóa
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors bg-muted/20 ${isUploading ? "opacity-50 pointer-events-none" : ""} ${readOnlyQuestion ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !readOnlyQuestion && fileInputRef.current?.click()}
              >
                <div className="h-10 w-10 text-muted-foreground flex items-center justify-center">
                  {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                </div>
                <p className="text-[14.5px]/5 font-semibold">{isUploading ? "Đang tải lên..." : "Tải lên hình ảnh minh họa"}</p>
                <p className="text-[12.5px]/4 text-muted-foreground">
                  Hỗ trợ PNG, JPG, GIF, WebP dung lượng tối đa 100 MiB
                </p>
              </div>
            )}
            <div className="mt-3"><AdminMediaPicker target="QUESTION" editableDraft={!readOnlyQuestion} disabled={updateMutation.isPending || isUploading} onSelect={(id) => { setMediaUrl(id); setPendingMediaId(null); }} /></div>
            {pendingMediaId && <AdminMediaPending mediaId={pendingMediaId} target="QUESTION" editableDraft={!readOnlyQuestion} onChoose={(id) => { setMediaUrl(id); setPendingMediaId(null); }} />}
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Đáp án ({options.length})</CardTitle>
            {!readOnlyQuestion && (
              <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Thêm đáp án
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {options.length === 0 && (
              <p className="text-[14.5px]/5 text-muted-foreground text-center py-4">Chưa có đáp án. Nhấn &quot;Thêm đáp án&quot; để bắt đầu.</p>
            )}
            {options.map((opt) => (
              <div
                key={opt.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${opt.isCorrect ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-border"
                  } ${readOnlyQuestion ? "opacity-75 bg-muted/30" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => !readOnlyQuestion && setCorrect(opt.id)}
                  className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground hover:border-emerald-400"
                    } ${readOnlyQuestion ? "cursor-not-allowed" : ""}`}
                  disabled={readOnlyQuestion}
                >
                  {opt.isCorrect && <CheckCircle className="h-3 w-3 text-white" />}
                </button>
                <span className="text-[14.5px]/5 font-bold text-muted-foreground w-5 shrink-0 mt-0.5">{opt.label}.</span>
                <Input
                  value={opt.text}
                  onChange={(e) => setOptions(options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                  className="h-8 text-[14.5px]/5 border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none disabled:opacity-100 disabled:cursor-not-allowed"
                  placeholder="Nhập nội dung đáp án..."
                  disabled={readOnlyQuestion}
                />
                {!readOnlyQuestion && (
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card>
          <CardHeader><CardTitle className="text-base">Giải thích đáp án</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Nhập giải thích cho đáp án đúng..."
              className="min-h-[80px] text-[14.5px]/5 resize-none disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={readOnlyQuestion}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Link href="/admin/questions">
            <Button variant="outline" disabled={updateMutation.isPending} onClick={() => leave.requestLeave(() => router.push("/admin/questions"))}>Hủy</Button>
          </Link>
          {!readOnlyQuestion ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave("DRAFT")}
                disabled={updateMutation.isPending || saveBlocked}
                className="gap-2"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu nháp
              </Button>
              <Button
                title="Chờ quy trình phê duyệt/phát hành"
                disabled
                className="gap-2"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Chờ công bố
              </Button>
            </>
          ) : currentStatus === "PUBLISHED" ? (
            <Button
              onClick={() => handleSave("ARCHIVED")}
              disabled={updateMutation.isPending || saveBlocked}
              variant="destructive"
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              Lưu trữ (Archive)
            </Button>
          ) : null}
        </div>
        <QuestionDraftPreview content={questionTitle} options={options} explanation={explanation} mediaId={mediaUrl} />
        <LifecyclePanel key={questionId} subject={{kind:"QUESTION",id:questionId}}/>
      </fieldset>
    </div>
  );
}
