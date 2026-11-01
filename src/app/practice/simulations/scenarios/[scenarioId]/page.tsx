import { parseBookmarksReturnContext } from "@/features/simulations/simulation-bookmarks-navigation";
import { parseReviewReturnContext } from "@/features/simulations/simulation-review-navigation";
import { SimulationScenarioPage } from "@/features/simulations/components/simulation-learning-pages";
import type { ScenarioFilter } from "@/features/simulations/simulation-learning-types";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { scenarioId } = await params;
  const query = await searchParams;
  const filter: ScenarioFilter =
    typeof query.filter === "string" &&
    ["ALL", "UNPRACTICED", "PRACTICED", "BOOKMARKED"].includes(query.filter)
      ? (query.filter as ScenarioFilter)
      : "ALL";
  const page =
    typeof query.page === "string" && /^\d{1,6}$/.test(query.page)
      ? Number(query.page)
      : 0;
  return (
    <SimulationScenarioPage
      reviewContext={
        parseReviewReturnContext(query) ?? parseBookmarksReturnContext(query)
      }
      scenarioId={scenarioId}
      chapterId={typeof query.chapter === "string" ? query.chapter : undefined}
      filter={filter}
      page={page}
      attemptId={typeof query.attempt === "string" ? query.attempt : undefined}
    />
  );
}
