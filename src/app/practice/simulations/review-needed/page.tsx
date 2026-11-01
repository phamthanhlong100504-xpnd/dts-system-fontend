import { SimulationReviewNeededPage } from "@/features/simulations/components/simulation-review-needed-page";
import { parseReviewQuery } from "@/features/simulations/simulation-review-navigation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const criteria = parseReviewQuery(await searchParams);
  return <SimulationReviewNeededPage criteria={criteria} />;
}
