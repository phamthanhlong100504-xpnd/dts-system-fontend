import { SimulationChapterPage } from "@/features/simulations/components/simulation-learning-pages";
import type { ScenarioFilter } from "@/features/simulations/simulation-learning-types";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { chapterId } = await params;
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
    <SimulationChapterPage
      chapterId={chapterId}
      initialFilter={filter}
      initialPage={page}
    />
  );
}
