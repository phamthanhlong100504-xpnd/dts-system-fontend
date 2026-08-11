"use client";

import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { getQuestionsByChapter, type Question } from "@/features/practice/practice-service";
import { ChapterQuestionCard } from "@/features/practice/components/chapter-question-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

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
              <ChapterQuestionCard
                key={q.id ?? index}
                question={q}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
