import { SimulationBookmarksPage } from "@/features/simulations/components/simulation-bookmarks-page";
import { parseBookmarksQuery } from "@/features/simulations/simulation-bookmarks-navigation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const criteria = parseBookmarksQuery(await searchParams);
  return <SimulationBookmarksPage criteria={criteria} />;
}
