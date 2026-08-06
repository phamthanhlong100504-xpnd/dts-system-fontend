"use client";

import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import {
  getQuestionsByChapter,
  type Question,
  type QuestionOption,
} from "@/features/practice/practice-service";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const labels = ["A", "B", "C", "D"];

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const chapter = Number(chapterId);

  const { data: questions, isLoading, isError } = useQuery({
    queryKey: ["practice", "chapter", chapter],
    queryFn: () => getQuestionsByChapter(chapter),
    staleTime: 5 * 60_000,
  });

  return (
    <RequireAuth>
      <div className="container space-y-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Chương {chapter}</h1>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Không tải được câu hỏi. Kiểm tra service dts-practice.
          </p>
        )}

        {questions && (
          <div className="space-y-4">
            {questions.map((q: Question, index: number) => (
              <Card key={q.id ?? index}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-start gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                    {q.isCritical && (
                      <Badge variant="destructive" className="ml-auto shrink-0">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Điểm liệt
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium leading-relaxed">{q.questionText}</p>
                  {q.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={q.imageUrl}
                      alt=""
                      className="mt-3 max-h-48 rounded-md border"
                    />
                  )}
                  <div className="mt-3 space-y-1.5">
                    {q.options?.map((opt: QuestionOption, i: number) => (
                      <div
                        key={opt.label ?? i}
                        className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-muted-foreground">
                          {opt.label ?? labels[i] ?? `${i + 1}.`}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
