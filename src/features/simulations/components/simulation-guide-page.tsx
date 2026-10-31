"use client";
import { useRouter } from "next/navigation";
import { SimulationLearningBoundary } from "./simulation-learning-pages";
import { SimulationGuideView } from "./simulation-guide-view";
import { useSimulationGuide } from "../use-simulation-guide";
import {
  simulationRoutes,
  useSimulationNavigation,
} from "../simulation-navigation-store";
import type { SimulationScope } from "../simulation-learning-types";
export function SimulationGuidePage() {
  return (
    <SimulationLearningBoundary>
      {(scope) => (
        <BoundGuide
          key={`${scope.userId}:${scope.licenseClass}`}
          scope={scope}
        />
      )}
    </SimulationLearningBoundary>
  );
}
function BoundGuide({ scope }: { scope: SimulationScope }) {
  const router = useRouter(),
    select = useSimulationNavigation((s) => s.select);
  const { state, query } = useSimulationGuide(scope);
  return (
    <SimulationGuideView
      state={state}
      onRetry={() => void query.refetch()}
      onBack={() => {
        select(scope.licenseClass, "simulation");
        router.push("/practice");
      }}
      onStart={() => router.push(simulationRoutes.chapters)}
    />
  );
}
