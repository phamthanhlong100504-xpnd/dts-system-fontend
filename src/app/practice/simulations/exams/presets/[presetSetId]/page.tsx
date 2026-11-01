import { SimulationPresetsPage } from "@/features/simulations/components/simulation-presets-page";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ presetSetId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { presetSetId } = await params,
    q = await searchParams;
  return (
    <SimulationPresetsPage
      presetSetId={presetSetId}
      expectedVersionId={typeof q.version === "string" ? q.version : undefined}
      retakeFromVersion={
        typeof q.retakeFromVersion === "string"
          ? q.retakeFromVersion
          : undefined
      }
    />
  );
}
