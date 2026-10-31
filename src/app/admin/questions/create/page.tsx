"use client";
import { useAdminUnsavedChanges } from "@/features/admin/foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "@/features/admin/foundation/components/admin-leave-dialog";
import { adminFailure } from "@/features/admin/foundation/admin-errors";
import { validateChoiceDraft } from "@/features/admin/theory/theory-contract";


import Link from "next/link";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  Bold,
  Italic,
  List,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  AlertTriangle,
  UploadCloud,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateQuestion } from "@/features/admin/use-admin-content";
import { uploadFileToMediaService, MediaProcessingPendingError } from "@/features/media/media-service";
import { validateMediaFile } from "@/features/media/media-upload-policy";
import { AdminMediaPicker } from "@/features/admin/media/components/admin-media-picker";
import { AdminMediaPending } from "@/features/admin/media/components/admin-media-pending";
import { QuestionDraftPreview } from "@/features/admin/theory/components/question-draft-preview";
import { MediaImage } from "@/components/ui/media-image";

interface OptionItem {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export default function QuestionEditorPage() {
  const router = useRouter();
  const createMutation = useCreateQuestion();

  const [questionTitle, setQuestionTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [questionType, setQuestionType] = useState("SINGLE_CHOICE");
  const [creationUncertain, setCreationUncertain] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingMediaId, setPendingMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bắt đầu với 2 đáp án trống A và B để người dùng tự nhập
  const [options, setOptions] = useState<OptionItem[]>([
    { id: "1", label: "A", text: "", isCorrect: false },
    { id: "2", label: "B", text: "", isCorrect: false },
  ]);

  const signature = JSON.stringify({ questionTitle, explanation, isCritical, questionType, mediaUrl, options });
  const [savedSignature, setSavedSignature] = useState(signature);
  const leave = useAdminUnsavedChanges(signature !== savedSignature, createMutation.isPending || isUploading);

  const handleSave = (status: "DRAFT" | "PUBLISHED") => {
    if (status !== "DRAFT" || creationUncertain) { toast.info("Công bố đang chờ quy trình phê duyệt/phát hành chính thức."); return; }
    const filledOptions = options.filter((o) => o.text.trim().length > 0);
    const invalid = validateChoiceDraft(questionType, questionTitle, options.map((o) => ({ content: o.text, isCorrect: o.isCorrect })));
    if (invalid) { toast.error(invalid); return; }

    createMutation.mutate(
      {
        content: questionTitle,
        type: questionType,
        status: status,
        isCritical,
        explanation,
        mediaUrl: mediaUrl || undefined,
        options: filledOptions.map((o, idx) => ({
          content: o.text,
          isCorrect: o.isCorrect,
          sortOrder: idx + 1,
        })),
      },
      {
        onSuccess: () => {
          setSavedSignature(signature);
          toast.success("Đã lưu câu hỏi nháp!");
          router.push("/admin/questions");
        },
        onError: (error) => {
          const httpStatus = error && typeof error === "object" && "status" in error ? error.status : undefined;
          if (httpStatus === undefined || (typeof httpStatus === "number" && httpStatus >= 500)) setCreationUncertain(true);
          toast.error(adminFailure(error, "Có lỗi xảy ra khi lưu câu hỏi").message);
        },
      }
    );
  };

  const handleSelectCorrect = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        isCorrect: questionType === "MULTIPLE_CHOICE" ? (opt.id === id ? !opt.isCorrect : opt.isCorrect) : opt.id === id,
      }))
    );
  };

  const handleTextChange = (id: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const handleAddOption = () => {
    if (options.length >= 50 || (questionType === "TRUE_FALSE" && options.length >= 2)) {
      toast.error("Đã đạt giới hạn đáp án cho loại câu hỏi này");
      return;
    }
    const nextLabel = options.length < 26 ? String.fromCharCode(65 + options.length) : String(options.length + 1);
    setOptions((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        label: nextLabel,
        text: "",
        isCorrect: false,
      },
    ]);
  };

  const handleRemoveOption = (id: string) => {

    setOptions((prev) =>
      prev
        .filter((opt) => opt.id !== id)
        .map((opt, idx) => ({
          ...opt,
          label: String.fromCharCode(65 + idx),
        }))
    );
  };

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
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6" inert={createMutation.isPending || isUploading} aria-busy={createMutation.isPending || isUploading}>
      <fieldset className="min-w-0 space-y-6" disabled={createMutation.isPending || isUploading || creationUncertain}>
        <AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} />
        {/* Top Bar Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/questions">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  Tạo câu hỏi mới
                </h1>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Bản nháp
                </Badge>
              </div>
              <p className="text-[12.5px]/4 text-muted-foreground mt-0.5">
                Soạn thảo nội dung câu hỏi và cấu hình đáp án
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave("DRAFT")}
              disabled={createMutation.isPending || creationUncertain}
            >
              Lưu nháp
            </Button>
            <Button
              className="gap-2"
              title="Chờ quy trình phê duyệt/phát hành"
              disabled
            >
              <CheckCircle className="h-4 w-4" />
              Chờ công bố
            </Button>
          </div>
        </div>

        <p className="rounded-xl border bg-muted/20 p-4 text-[14px]/6 text-muted-foreground">Bản nháp chưa hiển thị cho học viên. Chức năng phê duyệt và công bố hiện chưa khả dụng.</p>
        {creationUncertain && <p role="alert" className="text-[15px]/6 text-destructive">Chưa xác định hệ thống đã tạo câu hỏi hay chưa. Nội dung đang nhập được giữ lại, kiểm tra danh sách nháp trước khi gửi lại lệnh tạo.</p>}
        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Question Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Question Text Card */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Nội dung câu hỏi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toolbar Header */}
                <div className="flex items-center gap-1 border-b pb-2 text-muted-foreground">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  placeholder="Nhập nội dung câu hỏi sát hạch hoặc bài tập..."
                  rows={5}
                  value={questionTitle}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestionTitle(e.target.value)}
                  className="text-[14.5px]/5 resize-none focus-visible:ring-1"
                />
              </CardContent>
            </Card>

            {/* Explanation & Tips Card */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  Lời giải thích & Mẹo nhớ nhanh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Nhập giải thích đáp án đúng hoặc mẹo ghi nhớ cho học viên..."
                  rows={4}
                  value={explanation}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExplanation(e.target.value)}
                  className="text-[14.5px]/5 resize-none focus-visible:ring-1"
                />
              </CardContent>
            </Card>

            {/* Media File Upload Card */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  Hình ảnh đính kèm (Sa hình / Biển báo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                {mediaUrl ? (
                  <div className="relative border rounded-xl overflow-hidden group">
                    <MediaImage src={mediaUrl} alt="Minh họa" className="mx-auto block h-auto max-h-[300px] max-w-full object-contain bg-muted/20" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Đổi ảnh
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setMediaUrl(null)}>
                        Xóa
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer bg-muted/20 ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className={`h-10 w-10 text-muted-foreground ${isUploading ? "animate-pulse" : ""}`} />
                    <p className="text-[14.5px]/5 font-semibold">{isUploading ? "Đang tải lên..." : "Tải lên hình ảnh minh họa"}</p>
                    <p className="text-[12.5px]/4 text-muted-foreground">
                      Hỗ trợ PNG, JPG, GIF, WebP dung lượng tối đa 100 MiB
                    </p>
                  </div>
                )}
                <div className="mt-3"><AdminMediaPicker target="QUESTION" editableDraft disabled={createMutation.isPending || isUploading} onSelect={(id) => { setMediaUrl(id); setPendingMediaId(null); }} /></div>
                {pendingMediaId && <AdminMediaPending mediaId={pendingMediaId} target="QUESTION" editableDraft onChoose={(id) => { setMediaUrl(id); setPendingMediaId(null); }} />}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Settings & Options */}
          <div className="lg:col-span-5 space-y-6">
            {/* Question Configuration Card */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Cấu hình câu hỏi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex flex-col gap-2 text-[15px] font-semibold">Loại câu hỏi<select className="h-10 rounded-lg border bg-background px-3" value={questionType} onChange={(e) => setQuestionType(e.target.value)}><option value="SINGLE_CHOICE">Một đáp án đúng</option><option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option><option value="TRUE_FALSE">Đúng / Sai</option></select></label>
                {/* Critical Toggle Card */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-[14.5px]/5 font-semibold text-destructive">
                        Câu hỏi ĐIỂM LIỆT
                      </p>
                      <p className="text-[12.5px]/4 text-muted-foreground">
                        Nội dung tự biên, không thay đổi câu điểm liệt ngân hàng chuẩn
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCritical}
                    onChange={(e) => setIsCritical(e.target.checked)}
                    className="h-5 w-5 rounded border-destructive text-destructive focus:ring-destructive cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Options Card */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  Danh sách Lựa chọn & Đáp án
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${opt.isCorrect
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    onClick={() => handleSelectCorrect(opt.id)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCorrect(opt.id);
                      }}
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${opt.isCorrect
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-muted-foreground hover:border-emerald-400"
                        }`}
                      title="Đánh dấu đáp án đúng"
                    >
                      {opt.isCorrect && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <span className="font-bold text-[12.5px]/4 w-5 text-muted-foreground select-none">
                      {opt.label}.
                    </span>
                    <Input
                      value={opt.text}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleTextChange(opt.id, e.target.value)}
                      placeholder={`Nhập nội dung đáp án ${opt.label}...`}
                      className="h-9 text-[14.5px]/5 flex-1 bg-transparent border-0 focus-visible:ring-0"
                    />
                    {options.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveOption(opt.id);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  type="button"
                  onClick={handleAddOption}
                  className="w-full mt-2 gap-1.5 border-dashed"
                >
                  <Plus className="h-4 w-4" /> Thêm lựa chọn mới
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <QuestionDraftPreview content={questionTitle} options={options} explanation={explanation} mediaId={mediaUrl} />
      </fieldset>
    </div>
  );
}
