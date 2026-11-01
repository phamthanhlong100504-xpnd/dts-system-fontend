"use client";
import { Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { learningStyles } from "./learning-ui";

/** Same saved explanation frame for practice results and exam review. */
export function SimulationHintCard({
  title,
  text,
  warning = false,
}: {
  title: string;
  text: string;
  warning?: boolean;
}) {
  const Icon = warning ? TriangleAlert : Lightbulb;
  return (
    <section className={cn(learningStyles.card, "p-5 sm:p-6")}>
      <h2 className="flex items-center gap-[1cm] text-[16px] font-semibold leading-7 text-[#172335] min-[400px]:text-[18px]">
        <span className="relative inline-flex size-5 shrink-0 items-center justify-center text-[#0758d9]">
          <span
            className="absolute -inset-2 rounded-[10px] bg-[#edf3ff]"
            aria-hidden="true"
          />
          <Icon className="relative size-5" aria-hidden="true" />
        </span>
        <span>{title}</span>
      </h2>
      <p className="mt-[1.5cm] whitespace-pre-line text-[15.5px] font-medium leading-6 text-[#475467]">
        {text}
      </p>
    </section>
  );
}
