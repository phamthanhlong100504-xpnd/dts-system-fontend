"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createExamStructureApi } from "@/features/admin/admin-examination-service";
import { ApiError } from "@/lib/api";

interface ChapterMatrix {
  id: number;
  title: string;
  description: string;
  count: number;
}

/** Tổng số câu chuẩn theo hạng (quy định sát hạch GPLX) */
const TARGET_TOTAL: Record<string, number> = {
  A1: 25,
  A2: 25,
  B1: 30,
  B2: 35,
  C: 40,
};

export default function ExamMatrixBuilderPage() {
  const router = useRouter();
  const [licenseType, setLicenseType] = useState("B2");
  const targetTotal = TARGET_TOTAL[licenseType] ?? 35;
  const [criticalCount, setCriticalCount] = useState(2);
  const [chapters, setChapters] = useState<ChapterMatrix[]>([
    { id: 1, title: "Chương 1: Quy tắc giao thông đường bộ", description: "Khái niệm và quy tắc giao thông", count: 10 },
    { id: 2, title: "Chương 2: Văn hóa & Đạo đức lái xe", description: "Nghiệp vụ vận tải và đạo đức người lái xe", count: 2 },
    { id: 3, title: "Chương 3: Kỹ thuật lái xe", description: "Văn hóa, đạo đức và kỹ thuật lái xe", count: 3 },
    { id: 4, title: "Chương 4: Cấu tạo & Sửa chữa xe", description: "Cấu tạo và sửa chữa xe cơ giới", count: 1 },
    { id: 5, title: "Chương 5: Hệ thống Biển báo đường bộ", description: "Hệ thống biển báo hiệu đường bộ", count: 10 },
    { id: 6, title: "Chương 6: Sa hình & Xử lý tình huống", description: "Giải thế sa hình và kỹ năng xử lý", count: 9 },
  ]);

  const [saving, setSaving] = useState(false);
  const currentTotal = chapters.reduce((sum, ch) => sum + ch.count, 0);
  const percentComplete = Math.min(100, Math.round((currentTotal / targetTotal) * 100));

  const handleCountChange = (id: number, val: number) => {
    setChapters(chapters.map((ch) => (ch.id === id ? { ...ch, count: Math.max(0, val) } : ch)));
  };

  const handleSave = async () => {
    if (currentTotal !== targetTotal) {
      toast.error(`Tổng số câu hỏi hiện tại (${currentTotal}) chưa đúng với quy định hạng ${licenseType} (${targetTotal} câu).`);
      return;
    }
    setSaving(true);
    try {
      await createExamStructureApi({
        title: `Ma trận đề thi hạng ${licenseType}`,
        sections: chapters
          .filter((ch) => ch.count > 0)
          .map((ch, i) => ({
            code: `CH${ch.id}`,
            title: ch.title,
            questionCount: ch.count,
            score: ch.count,
            order: i + 1,
          })),
        metadata: {
          licenseType,
          criticalCount,
          totalQuestions: targetTotal,
        },
      });
      toast.success("Đã lưu cấu hình ma trận đề thi thành công!");
      setTimeout(() => router.push("/admin/exams"), 800);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? `Lưu ma trận thất bại: ${err.message}`
          : "Lưu ma trận thất bại. Kiểm tra service dts-examination."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Cấu hình Ma trận Đề thi</h1>
              <Badge variant="outline" className="font-mono">
                {licenseType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Phân bổ số lượng câu hỏi theo từng chương và cấu hình câu điểm liệt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm font-bold focus:outline-none"
          >
            <option value="A1">Hạng A1 (25 câu)</option>
            <option value="A2">Hạng A2 (25 câu)</option>
            <option value="B1">Hạng B1 (30 câu)</option>
            <option value="B2">Hạng B2 (35 câu)</option>
            <option value="C">Hạng C (40 câu)</option>
          </select>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu ma trận"}
          </Button>
        </div>
      </div>

      {/* Progress Counter Card */}
      <Card className="rounded-2xl border bg-card">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Tổng số câu đã cấu hình</span>
            <span className={`text-2xl font-extrabold ${currentTotal === targetTotal ? "text-emerald-600" : "text-amber-500"}`}>
              {currentTotal} / {targetTotal} câu
            </span>
          </div>
          <Progress value={percentComplete} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {currentTotal === targetTotal
              ? "✓ Tổng số câu hỏi đã hợp lệ và đủ chỉ tiêu."
              : `⚠️ Bạn cần bổ sung hoặc giảm ${Math.abs(targetTotal - currentTotal)} câu để đạt đúng ${targetTotal} câu.`}
          </p>
        </CardContent>
      </Card>

      {/* Chapters Allocation Matrix */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Phân bổ số câu theo Chương học
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {chapters.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{ch.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Số câu:</span>
                <Input
                  type="number"
                  min={0}
                  max={35}
                  value={ch.count}
                  onChange={(e) => handleCountChange(ch.id, Number(e.target.value))}
                  className="w-20 h-9 font-bold text-center bg-background"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Critical Questions Config Card */}
      <Card className="rounded-2xl border border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-base text-destructive">Câu hỏi ĐIỂM LIỆT (Bắt buộc)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Số lượng câu hỏi tình huống mất an toàn giao thông nghiêm trọng trong mỗi đề thi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Số câu:</span>
            <Input
              type="number"
              min={1}
              max={5}
              value={criticalCount}
              onChange={(e) => setCriticalCount(Number(e.target.value))}
              className="w-20 h-9 font-bold text-center bg-background border-destructive text-destructive"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
