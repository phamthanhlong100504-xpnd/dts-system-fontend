"use client";

import { useAvailableExams } from "@/features/examination/use-examination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Clock, Award } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/ui/media-image";
import { RequireAuth } from "@/components/require-auth";

export default function ExaminationListPage() {
  const { data: response, isLoading } = useAvailableExams();

  const exams = response?.content || [];

  return (
    <RequireAuth>
      <div className="container mx-auto max-w-7xl space-y-6 py-8 px-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kỳ thi Chính thức</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách các kỳ thi sát hạch đang mở. Vui lòng tuân thủ nghiêm ngặt quy chế phòng thi.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-10">Đang tải danh sách kỳ thi...</div>
        ) : exams.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">Hiện tại không có kỳ thi nào đang mở.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam: any) => {
              const thumbnailId = exam.metadata?.thumbnailId || exam.thumbnailId;
              return (
                <Card key={exam.id} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                  {thumbnailId ? (
                    <div className="h-48 w-full relative shrink-0">
                      <MediaImage src={thumbnailId} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 w-full shrink-0 bg-gradient-to-tr from-muted to-muted/50 flex items-center justify-center">
                      <div className="flex flex-col items-center opacity-50">
                        <FileText className="h-10 w-10 mb-2" />
                        <span className="text-sm font-medium">Chưa có ảnh bìa</span>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-lg text-foreground leading-snug line-clamp-2">
                            {exam.title}
                          </h3>
                          <Badge className="bg-primary/10 text-primary font-bold shrink-0">
                            {exam.status === "PUBLISHED" ? "ĐANG MỞ" : exam.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.metadata?.durationMinutes || 20} phút</span>
                          <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Bắt buộc</span>
                        </p>
                      </div>
                    </div>

                    <div className="block pt-2">
                      <Link href={`/examination/${exam.id}`}>
                        <Button className="w-full gap-2 font-bold h-11">
                          Vào phòng chờ
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
