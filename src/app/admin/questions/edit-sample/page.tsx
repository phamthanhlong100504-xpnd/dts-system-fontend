"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface OptionItem {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

// Câu hỏi mẫu để chỉnh sửa
const SAMPLE_QUESTION = {
  id: "#Q-2037",
  title: "Biển nào sau đây cấm xe cơ giới đi vào trừ xe gắn máy và xe ưu tiên?",
  explanation: "Biển P.106a cấm tất cả xe cơ giới trừ xe gắn máy (dưới 50cc) và xe ưu tiên theo quy định.",
  isCritical: true,
  chapterId: 5,
  options: [
    { id: "1", label: "A", text: "Biển P.102 — Cấm đi ngược chiều", isCorrect: false },
    { id: "2", label: "B", text: "Biển P.106a — Cấm xe cơ giới", isCorrect: true },
    { id: "3", label: "C", text: "Biển P.124a — Đường dành cho xe thô sơ", isCorrect: false },
    { id: "4", label: "D", text: "Biển P.131a — Cấm rẽ trái", isCorrect: false },
  ],
};

export default function EditSampleQuestionPage() {
  const router = useRouter();
  const [questionTitle, setQuestionTitle] = useState(SAMPLE_QUESTION.title);
  const [explanation, setExplanation] = useState(SAMPLE_QUESTION.explanation);
  const [isCritical, setIsCritical] = useState(SAMPLE_QUESTION.isCritical);
  const [chapterId, setChapterId] = useState(SAMPLE_QUESTION.chapterId);
  const [options, setOptions] = useState<OptionItem[]>(SAMPLE_QUESTION.options);

  const addOption = () => {
    const labels = ["A", "B", "C", "D", "E", "F"];
    const newLabel = labels[options.length] || `${options.length + 1}`;
    setOptions([...options, { id: Date.now().toString(), label: newLabel, text: "", isCorrect: false }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) { toast.error("Cần ít nhất 2 đáp án"); return; }
    setOptions(options.filter((o) => o.id !== id));
  };

  const setCorrect = (id: string) => {
    setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id })));
  };

  const handleSave = (status: "DRAFT" | "PUBLISHED") => {
    if (!questionTitle.trim()) { toast.error("Vui lòng nhập nội dung câu hỏi"); return; }
    // Trong thực tế sẽ gọi PUT API để cập nhật
    toast.success(`Đã lưu câu hỏi ${SAMPLE_QUESTION.id} với trạng thái ${status === "PUBLISHED" ? "Xuất bản" : "Nháp"}`);
    setTimeout(() => router.push("/admin/questions"), 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/questions">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa câu hỏi</h1>
          <p className="text-sm text-muted-foreground">
            {SAMPLE_QUESTION.id} · Cập nhật nội dung và đáp án
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">Mẫu</Badge>
      </div>

      {/* Question Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nội dung câu hỏi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={questionTitle}
            onChange={(e) => setQuestionTitle(e.target.value)}
            placeholder="Nhập nội dung câu hỏi..."
            className="min-h-[100px] text-sm resize-none"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Chương</label>
              <Input
                type="number"
                min={1}
                max={6}
                value={chapterId}
                onChange={(e) => setChapterId(Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Câu hỏi điểm liệt</label>
              <button
                type="button"
                onClick={() => setIsCritical(!isCritical)}
                className={`flex items-center gap-2 h-9 w-full px-3 rounded-md border text-sm transition-colors ${
                  isCritical
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-input bg-background text-muted-foreground"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {isCritical ? "Điểm liệt — Bật" : "Điểm liệt — Tắt"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Đáp án</CardTitle>
          <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Thêm đáp án
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {options.map((opt) => (
            <div
              key={opt.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                opt.isCorrect ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => setCorrect(opt.id)}
                className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"
                }`}
              >
                {opt.isCorrect && <CheckCircle className="h-3 w-3 text-white" />}
              </button>
              <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{opt.label}.</span>
              <Input
                value={opt.text}
                onChange={(e) => setOptions(options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
                placeholder="Nhập nội dung đáp án..."
              />
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
            className="min-h-[80px] text-sm resize-none"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <Link href="/admin/questions">
          <Button variant="outline">Hủy</Button>
        </Link>
        <Button variant="outline" onClick={() => handleSave("DRAFT")} className="gap-2">
          <Save className="h-4 w-4" />
          Lưu nháp
        </Button>
        <Button onClick={() => handleSave("PUBLISHED")} className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Xuất bản
        </Button>
      </div>
    </div>
  );
}
