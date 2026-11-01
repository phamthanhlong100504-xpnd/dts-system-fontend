"use client";
import { Flag, Timer, TrendingUp, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavedSimulationResult } from "../simulation-learning-types";
import { learningStyles, mediaTime, reactionTime } from "./learning-ui";
type TimelineResult = Pick<
  SavedSimulationResult,
  "durationMs" | "firstResponseMs" | "scoringSegments"
>;
const segmentColors: Record<number, string> = {
  0: "#dfe3ed",
  1: "#e85965",
  2: "#f59e42",
  3: "#e6c94b",
  4: "#9bc851",
  5: "#20a885",
};
export function ScoringTimeline({ result }: { result: TimelineResult }) {
  const segments = result.scoringSegments;
  const hasResponse = result.firstResponseMs !== null;
  const windowStart = segments.length
    ? Math.min(...segments.map((s) => s.startMs))
    : 0;
  const windowEnd = segments.length
    ? Math.max(...segments.map((s) => s.endMs))
    : result.durationMs;
  return (
    <section
      className={cn(learningStyles.card, "mt-[1cm] p-5 sm:p-6")}
      aria-label="Phân tích thời điểm phản ứng"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold">
          <TrendingUp
            className="size-[18px] text-[#0758d9]"
            aria-hidden="true"
          />
          Nhận xét và hướng dẫn tình huống
        </h2>
        <span className={cn(learningStyles.badge, "text-[14.5px]")}>
          Thời lượng video: {mediaTime(result.durationMs)}
        </span>
      </div>
      <div className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-2 text-[15.5px] font-semibold text-[#172335]">
            <Timer
              className="size-4 shrink-0 text-[#0758d9]"
              aria-hidden="true"
            />
            Thang điểm phản ứng theo thời gian
          </h3>
          <span className="text-[14.5px] font-medium text-[#475467]">
            {hasResponse
              ? `Phản ứng: ${reactionTime(result.firstResponseMs!)}`
              : "Không ghi nhận phản ứng"}
          </span>
        </div>
        <TimelineBar result={result} start={0} end={result.durationMs} />
      </div>
      {segments.length > 0 && windowEnd > windowStart && (
        <div className="mt-7 rounded-[12px] bg-[#f8f9fd] p-4">
          <h3 className="mb-4 inline-flex items-center gap-2 text-[15.5px] font-semibold text-[#172335]">
            <ZoomIn
              className="size-4 shrink-0 text-[#0758d9]"
              aria-hidden="true"
            />
            Phóng to vùng chấm điểm
          </h3>
          <TimelineBar result={result} start={windowStart} end={windowEnd} />
        </div>
      )}
      <div className="mt-5 rounded-[9px] text-center bg-[#f0f4ff] px-3 py-2.5 text-[15.5px] font-medium leading-5 text-[#475467]">
        {hasResponse
          ? "Marker thể hiện phản ứng đầu tiên đã được ghi nhận trong lượt luyện này."
          : "Lượt luyện đã hoàn thành nhưng không có phản ứng được ghi nhận."}
      </div>
    </section>
  );
}
function TimelineBar({
  result,
  start,
  end,
}: {
  result: TimelineResult;
  start: number;
  end: number;
}) {
  const span = end - start;
  const response = result.firstResponseMs;
  const marker = response !== null && response >= start && response <= end;
  if (span <= 0) return null;
  return (
    <div>
      <div className="relative pt-8">
        <div
          aria-hidden="true"
          className="relative h-5 overflow-hidden rounded-full bg-[#dfe3ed]"
        >
          {result.scoringSegments.map((s, index) => {
            const from = Math.max(start, s.startMs),
              to = Math.min(end, s.endMs);
            if (to <= from) return null;
            return (
              <span
                key={index}
                className="absolute top-0 flex h-full items-center justify-center text-[12px] font-bold text-[#16202f]"
                style={{
                  left: `${((from - start) / span) * 100}%`,
                  width: `${((to - from) / span) * 100}%`,
                  backgroundColor: segmentColors[s.score] ?? "#dfe3ed",
                }}
              >
                {to - from > span * 0.07 ? `${s.score}đ` : ""}
              </span>
            );
          })}
        </div>
        {marker && (
          <div
            data-response-marker="true"
            className="absolute bottom-0 h-[44px] w-px bg-[#0758d9]"
            style={{ left: `${((response - start) / span) * 100}%` }}
          >
            <span
              style={{
                transform:
                  (response - start) / span < 0.15
                    ? "translateX(0)"
                    : (response - start) / span > 0.85
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
              }}
              className="absolute bottom-[22px] whitespace-nowrap rounded-full bg-[#0758d9] px-2 py-1 text-[12.5px] font-semibold text-white"
            >
              <Flag className="mr-1 inline size-3" aria-hidden="true" />
              {reactionTime(response)}
            </span>
            <span className="absolute -bottom-0.5 -left-1.5 size-3 rounded-full border-2 border-white bg-[#0758d9]" />
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between text-[14.5px] font-medium text-[#475467]">
        <span>{reactionTime(start)}</span>
        <span>{reactionTime(end)}</span>
      </div>
      <div className="mt-3 flex flex-nowrap items-center justify-between gap-x-2 overflow-x-auto pb-1 text-[13.5px] font-medium text-[#475467]">
        {result.scoringSegments.map((s, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: segmentColors[s.score] ?? "#dfe3ed" }}
            />
            {s.score} điểm ({reactionTime(s.startMs)} – {reactionTime(s.endMs)})
          </span>
        ))}
      </div>
    </div>
  );
}
