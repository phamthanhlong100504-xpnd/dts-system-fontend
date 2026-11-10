"use client";

import { useLearningModule } from "@/features/simulation-performance/use-learning-module";
import { simulationLayout } from "./simulation-presentation";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { BookOpen, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  simulationRoutes,
  useSimulationNavigation,
} from "../simulation-navigation-store";

import type { LicenseOption } from "@/config/license";
import { cn } from "@/lib/utils";
import { simulationExamRoutes } from "../simulation-exam-source";
import { SimulationHubContainer } from "./simulation-hub-container";

type PracticeModule = "theory" | "simulation";

export function PracticeHubModules({
  license,
  children,
}: {
  license: LicenseOption;
  children: ReactNode;
}) {
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const router = useRouter();
  const setSelection = useSimulationNavigation((state) => state.select);
  const showModules = license.simulationEnabled === true;
  const activeModule = useLearningModule(license.code, showModules);

  function selectModule(module: PracticeModule) {
    setSelection(license.code, module);
  }

  function handleTabKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft")
      next = 1 - index;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    selectModule(next === 0 ? "theory" : "simulation");
    buttons.current[next]?.focus();
  }

  return (
    <div
      className={cn(
        "font-dts min-h-[calc(100vh-64px)] text-[#101828]",
        activeModule === "simulation"
          ? simulationLayout.background
          : "bg-[#f8f8fc]",
      )}
    >
      <main className="mx-auto w-full max-w-[1240px] px-6 pb-14 pt-8 lg:px-8">
        <section>
          <h1
            className={cn(
              "tracking-[-0.025em] text-[#101828]",
              "text-[30px] font-bold",
            )}
          >
            Ôn luyện
          </h1>
          {showModules ? (
            <div className="mt-1.5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
              <p className="text-[14.5px] font-medium text-[#344054]">
                Hạng {license.code} · Học theo cách phù hợp với bạn.
              </p>
              <div
                role="tablist"
                aria-label="Nội dung ôn luyện"
                className="inline-flex w-fit max-w-full shrink-0 items-center gap-1 rounded-[11px] border border-[#e1e5ed] bg-[#eef0f8] p-1"
              >
                {(
                  [
                    {
                      module: "theory",
                      label: "Lý thuyết sát hạch",
                      icon: BookOpen,
                    },
                    {
                      module: "simulation",
                      label: "Mô phỏng tình huống",
                      icon: Video,
                    },
                  ] as const
                ).map(({ module, label, icon: Icon }, index) => (
                  <button
                    key={module}
                    ref={(element) => {
                      buttons.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    id={`${id}-${module}-tab`}
                    aria-selected={activeModule === module}
                    aria-controls={`${id}-${module}-panel`}
                    tabIndex={activeModule === module ? 0 : -1}
                    onClick={() => selectModule(module)}
                    onKeyDown={(event) => handleTabKey(event, index)}
                    className={cn(
                      "inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9] focus-visible:ring-offset-2 min-[400px]:px-3 min-[400px]:text-[12px] lg:text-[12.5px]",
                      activeModule === module
                        ? "bg-[#0758d9] text-white shadow-[0_1px_3px_rgba(7,88,217,0.15)]"
                        : "text-[#475467] hover:bg-white hover:text-[#0758d9]",
                    )}
                  >
                    <Icon
                      className="hidden size-3.5 shrink-0 min-[400px]:block"
                      aria-hidden="true"
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-[14.5px] font-medium text-[#344054]">
              Hạng {license.code} · Học theo cách phù hợp với bạn.
            </p>
          )}
        </section>

        {showModules ? (
          <>
            <div
              id={`${id}-theory-panel`}
              role="tabpanel"
              aria-labelledby={`${id}-theory-tab`}
              hidden={activeModule !== "theory"}
            >
              {children}
            </div>
            <div
              id={`${id}-simulation-panel`}
              role="tabpanel"
              aria-labelledby={`${id}-simulation-tab`}
              hidden={activeModule !== "simulation"}
            >
              {activeModule === "simulation" && (
                <SimulationHubContainer
                  license={license}
                  actions={{
                    random: () => router.push(simulationExamRoutes.preparation),
                    presets: () => router.push(simulationExamRoutes.presets),
                    chapters: () => router.push(simulationRoutes.chapters),
                    review: () => router.push(simulationRoutes.reviewNeeded),
                    bookmarks: () => router.push(simulationRoutes.bookmarks),
                    guide: () => router.push(simulationRoutes.guide),
                  }}
                />
              )}
            </div>
          </>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
