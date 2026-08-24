"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { uploadFileToMediaService } from "@/features/media/media-service";
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
  const [chapterId, setChapterId] = useState(1);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Bắt đầu với 2 đáp án trống A và B để người dùng tự nhập
  const [options, setOptions] = useState<OptionItem[]>([
    { id: "1", label: "A", text: "", isCorrect: false },
    { id: "2", label: "B", text: "", isCorrect: false },
  ]);

  const handleSave = (status: "DRAFT" | "PUBLISHED") => {
    if (!questionTitle.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    const filledOptions = options.filter((o) => o.text.trim().length > 0);

    if (status === "PUBLISHED") {
      if (filledOptions.length < 2) {
        toast.error("Vui lòng nhập ít nhất 2 đáp án trước khi xuất bản");
        return;
      }
      if (!filledOptions.some((o) => o.isCorrect)) {
        toast.error("Vui lòng chọn 1 đáp án đúng");
        return;
      }
    }

    createMutation.mutate(
      {
        content: questionTitle,
        status,
        isCritical,
        chapterId,
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
          toast.success(
            status === "PUBLISHED"
              ? "Đã xuất bản câu hỏi thành công!"
              : "Đã lưu câu hỏi nháp!"
          );
          router.push("/admin/questions");
        },
        onError: () => {
          toast.error("Có lỗi xảy ra khi lưu câu hỏi");
        },
      }
    );
  };

  const handleSelectCorrect = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      }))
    );
  };

  const handleTextChange = (id: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error("Tối đa 6 đáp án");
      return;
    }
    const nextLabel = String.fromCharCode(65 + options.length);
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
    if (options.length <= 2) {
      toast.error("Cần ít nhất 2 đáp án");
      return;
    }
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

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file không được vượt quá 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadFileToMediaService(file, "QUESTION", "PUBLIC");
      setMediaUrl(res.mediaId);
      toast.success("Tải ảnh thành công!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
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
                DRAFT
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Soạn thảo nội dung câu hỏi và cấu hình đáp án
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={createMutation.isPending}
          >
            Lưu nháp
          </Button>
          <Button
            className="gap-2"
            onClick={() => handleSave("PUBLISHED")}
            disabled={createMutation.isPending}
          >
            <CheckCircle className="h-4 w-4" />
            {createMutation.isPending ? "Đang xử lý..." : "Xuất bản"}
          </Button>
        </div>
      </div>

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
                className="text-sm resize-none focus-visible:ring-1"
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
                className="text-sm resize-none focus-visible:ring-1"
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
                accept="image/png, image/jpeg, image/gif"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              {mediaUrl ? (
                <div className="relative border rounded-xl overflow-hidden group">
                  <MediaImage src={mediaUrl} alt="Minh họa" className="w-full h-auto max-h-[300px] object-contain bg-muted/20" />
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
                  <p className="text-sm font-semibold">{isUploading ? "Đang tải lên..." : "Tải lên hình ảnh minh họa"}</p>
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ PNG, JPG, GIF dung lượng tối đa 5MB (Tích hợp Media Service)
                  </p>
                </div>
              )}
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
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Thuộc Chương
                </label>
                <select
                  value={chapterId}
                  onChange={(e) => setChapterId(Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={1}>Chương 1: Quy tắc giao thông đường bộ</option>
                  <option value={2}>Chương 2: Văn hóa & Đạo đức lái xe</option>
                  <option value={3}>Chương 3: Kỹ thuật lái xe</option>
                  <option value={4}>Chương 4: Cấu tạo & Sửa chữa</option>
                  <option value={5}>Chương 5: Hệ thống Biển báo đường bộ</option>
                  <option value={6}>Chương 6: Sa hình & Xử lý tình huống</option>
                </select>
              </div>

              {/* Critical Toggle Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      Câu hỏi ĐIỂM LIỆT
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Làm sai câu này sẽ trượt trực tiếp
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
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    opt.isCorrect
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
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      opt.isCorrect
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-muted-foreground hover:border-emerald-400"
                    }`}
                    title="Đánh dấu đáp án đúng"
                  >
                    {opt.isCorrect && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <span className="font-bold text-xs w-5 text-muted-foreground select-none">
                    {opt.label}.
                  </span>
                  <Input
                    value={opt.text}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleTextChange(opt.id, e.target.value)}
                    placeholder={`Nhập nội dung đáp án ${opt.label}...`}
                    className="h-9 text-sm flex-1 bg-transparent border-0 focus-visible:ring-0"
                  />
                  {options.length > 2 && (
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
    </div>
  );
}
